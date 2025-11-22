import { Context } from 'koishi'
import { IAppContext } from '../adapters/interfaces'
import { KoishiAppContext } from '../adapters/koishi'
import { QuestioningPath, PathPackageType, getRandomPath, getPathById as getPathByIdFromConfig, getPathsByPackageType } from '../config/questioning'
import {
  QuestioningSession,
  ServiceResult,
  InitiationStartData,
  AnswerSubmitData,
  InitiationCompleteData,
  CooldownCheckData,
  QuestioningRecord
} from '../types/questioning'
import { Player } from '../types/player'
import { AIHelper } from '../utils/ai-helper'
import { getRealmName } from '../utils/calculator'
import { PlayerService } from './player.service'
import { RootStatsService } from './root-stats.service'
import { SpiritualRootType } from '../config/spiritual-roots'
import { PathPackageService } from './path-package.service'
import { PathPackageTemplate, PathPackageTag, PackageExecutionResult, MatchResult } from '../types/path-package'
import { calculateMatchResult, generateSimilarityAnalysis } from '../utils/score-matcher'
import { ALL_PATH_PACKAGES } from '../config/path-packages/index'
import { PathPackageConfig } from '../config/constants'
import { HybridPersonalityAnalyzer } from '../utils/hybrid-personality-analyzer'
import { AIConfig } from '../config/constants'
import { BuffType, BuffSource } from '../types/buff'  // v1.0.0 新增：Buff系统

/**
 * 问心服务类
 *
 * 注意：此服务部分解耦 Koishi 框架
 * - 数据库、日志、配置访问通过 IAppContext
 * - AIHelper、HybridAnalyzer 暂时保留 Context 依赖（待后续解耦）
 */
export class QuestioningService {
  private sessions: Map<string, QuestioningSession> = new Map()
  private context: IAppContext
  private aiHelper: AIHelper
  private playerService: PlayerService
  private rootStatsService: RootStatsService
  private pathPackageService: PathPackageService
  private hybridAnalyzer: HybridPersonalityAnalyzer
  private cleanupInterval: NodeJS.Timeout

  constructor(private ctx: Context, pluginConfig?: any) {
    // 创建 Adapter 上下文（传入插件配置）
    this.context = KoishiAppContext.from(ctx, 'xiuxian', pluginConfig)

    this.aiHelper = new AIHelper(ctx, pluginConfig)
    this.playerService = new PlayerService(this.context)
    this.rootStatsService = new RootStatsService(this.context)
    this.pathPackageService = new PathPackageService(this.context)
    this.hybridAnalyzer = new HybridPersonalityAnalyzer(ctx)

    // 注册所有问道包
    this.pathPackageService.registerAll(ALL_PATH_PACKAGES)
    this.context.logger.info(`已注册 ${ALL_PATH_PACKAGES.length} 个问道包`)

    // 启动定期清理任务（每5分钟清理一次过期session）
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions()
    }, 5 * 60 * 1000)

    this.context.logger.info('问心服务已启动，session自动清理已启用')
  }

  /**
   * 清理过期的 session
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now()
    let cleanedCount = 0

    for (const [userId, session] of this.sessions) {
      const lastTime = session.lastQuestionTime?.getTime() || session.startTime.getTime()
      const timeout = (session.timeoutSeconds || this.getDefaultTimeoutSeconds()) * 1000

      // 如果超时时间已过，清理该 session
      if (now - lastTime > timeout) {
        this.sessions.delete(userId)
        cleanedCount++
        this.context.logger.debug(`清理过期session: ${userId}`)
      }
    }

    if (cleanedCount > 0) {
      this.context.logger.info(`已清理 ${cleanedCount} 个过期session，当前活跃session数: ${this.sessions.size}`)
    }
  }

  /**
   * 释放资源（插件卸载时调用）
   */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.context.logger.info('问心服务已停止，session清理任务已取消')
    }
    this.sessions.clear()
  }

  // 获取默认超时（秒），从常量中读取
  private getDefaultTimeoutSeconds(): number {
    return PathPackageConfig.SESSION_TIMEOUT_SECONDS
  }

  /**
   * 获取所有可用的问心路径
   */
  getAvailablePaths(player: Player): QuestioningPath[] {
    const trialPaths = getPathsByPackageType(PathPackageType.TRIAL)
    return trialPaths.filter(path => {
      // 检查境界要求
      if (path.minRealm !== undefined && player.realm < path.minRealm) {
        return false
      }
      return true
    })
  }

  /**
   * 根据 ID 获取路径
   */
  getPathById(pathId: string): QuestioningPath | null {
    return getPathByIdFromConfig(pathId)
  }

  /**
   * 检查冷却时间
   */
  async checkCooldown(userId: string, pathId: string): Promise<ServiceResult<CooldownCheckData>> {
    const path = this.getPathById(pathId)
    if (!path || !path.cooldown) {
      return { success: true, message: '无冷却限制', data: { canStart: true } }
    }

    // 查询最近一次该路径的问心记录
    const records = await this.context.database.get<any>('xiuxian_questioning_v3', {
      userId,
      pathId
    } as any, {
      sort: { createTime: 'desc' },
      limit: 1
    })

    if (records.length === 0) {
      return { success: true, message: '首次问心', data: { canStart: true } }
    }

    const lastTime = new Date(records[0].createTime).getTime()
    const now = Date.now()
    const cooldownMs = path.cooldown * 60 * 60 * 1000
    const elapsed = now - lastTime

    if (elapsed < cooldownMs) {
      const remainingHours = Math.ceil((cooldownMs - elapsed) / (60 * 60 * 1000))
      return {
        success: false,
        message: `冷却中，还需 ${remainingHours} 小时`,
        data: { canStart: false, remainingHours }
      }
    }

    return { success: true, message: '冷却完成', data: { canStart: true } }
  }

  /**
   * 提交答案（传统问心逻辑，现仅用于步入仙途注册流程）
   */
  async submitAnswer(userId: string, answer: string): Promise<ServiceResult<AnswerSubmitData>> {
    const session = this.sessions.get(userId)
    if (!session) {
      return { success: false, message: '未找到问心会话，请先开始问心' }
    }

    // 检查是否正在完成中（防止并发重复完成）
    if (session.isCompleting) {
      return { success: false, message: '问心正在评估中，请稍候...' }
    }

    // 检查每题限时（会话级 timeoutSeconds 优先，未设置则读取默认 60 秒）
    try {
      const lastTime = session.lastQuestionTime ? new Date(session.lastQuestionTime).getTime() : session.startTime.getTime()
      const now = Date.now()
      const timeout = session.timeoutSeconds ?? this.getDefaultTimeoutSeconds()
      if (now - lastTime > timeout * 1000) {
        this.sessions.delete(userId)
        return { success: false, message: `回答超时：每题限时 ${timeout} 秒，问心已中断` }
      }
    } catch (e) {
      // 如有异常则不阻塞流程
    }

    const path = this.getPathById(session.pathId)
    if (!path) {
      this.sessions.delete(userId)
      return { success: false, message: '问心路径异常' }
    }

    // 将已有答案标准化为文本数组（用于存储/记录）
    const existingAnswersText = session.answers.map(a => (typeof a === 'string' ? a : a.text))

    // 当前问题
    const currentIndex = session.currentStep - 1
    const currentQuestion = path.questions[currentIndex]

    // 选项题校验（严格：仅接受单个大写字母 A/B/C/D...）
    if (currentQuestion?.options && currentQuestion.options.length > 0) {
      const raw = (answer || '').trim()
      const validLetters = Array.from({ length: currentQuestion.options.length }, (_, i) => String.fromCharCode(65 + i))

      // 要求严格：仅接受单个大写 ASCII 字母（不接受全角、标点、多个字符或小写）
      if (raw.length !== 1 || !/^[A-Z]$/.test(raw)) {
        return { success: false, message: `请输入严格的大写选项字母（例如：${validLetters[0]}），有效选项：${validLetters.join('/')}。` }
      }

      const letter = raw
      if (!validLetters.includes(letter)) {
        return { success: false, message: `请输入有效选项（${validLetters.join('/') }）` }
      }

      // 存储选项对象（字母 + 文本）
      const optionText = currentQuestion.options![letter.charCodeAt(0) - 65].text
      session.answers.push({ letter, text: optionText })
    } else {
      // 开放题：进行反作弊检测
      const detect = this.detectExploitation(answer || '')
      if (detect.isExploit) {
        // 步入仙途：直接失败
        if ((path as any).packageType === PathPackageType.INITIATION) {
          this.sessions.delete(userId)
          return { success: false, message: `问心失败：检测到异常回答（${detect.reason}）。请以正常语句作答。` }
        }

        // 试炼问心：惩罚（例如扣除灵石）并记录
        const penalty = detect.severity === 'high' ? -200 : -100
        try {
          await this.context.database.create('xiuxian_questioning_v3', {
            userId,
            pathId: path.id,
            pathName: path.name,
            answer1: existingAnswersText[0] || '',
            answer2: existingAnswersText[1] || '',
            answer3: answer,
            aiResponse: JSON.stringify({ personality: '反作弊触发', tendency: '违规', reward: { type: 'spiritStone', value: penalty }, reason: detect.reason }),
            personality: '你的回答被判定为异常，影响天道评估。',
            tendency: '违规',
            rewardType: 'spiritStone',
            rewardValue: Math.abs(penalty),
            rewardReason: `违规惩罚：${detect.reason}`,
            createTime: new Date()
          })
        } catch {}

        await this.applyReward(userId, 'spiritStone', penalty)
        this.sessions.delete(userId)
        return { success: true, message: '问心结束', data: { tendency: '违规', reward: { type: 'spiritStone', value: penalty, description: this.getRewardDescription('spiritStone', penalty) }, reason: detect.reason, personality: '回答异常，已处罚。' } }
      }

      // 正常记录答案
      session.answers.push(answer)
    }

    // 检查是否完成所有问题
    if (session.currentStep >= 3) {
      // 设置完成标志，防止并发重复完成
      session.isCompleting = true
      this.sessions.set(userId, session)

      // ✨ submitAnswer现在仅用于步入仙途注册流程
      // 如果pathId不是INITIATION类型，说明路由错误
      if (path.packageType !== PathPackageType.INITIATION) {
        this.context.logger.error(`路由错误：非INITIATION包${path.id}错误进入submitAnswer，应走submitPackageAnswer`)
        this.sessions.delete(userId)
        return { success: false, message: '系统错误：路径类型不匹配' }
      }

      // 完成步入仙途注册流程
      return await this.completeInitiationQuestioning(userId, session, path)
    }

    // 进入下一题
    session.currentStep++
    const nextQuestion = path.questions[session.currentStep - 1]
    // 重置本题出题时间
    session.lastQuestionTime = new Date()

    const timeoutForNext = session.timeoutSeconds ?? this.getDefaultTimeoutSeconds()
    return {
      success: true,
      message: '答案已记录',
      data: {
        step: session.currentStep,
        question: nextQuestion.question,
        options: nextQuestion.options?.map(o => o.text),
        isLastQuestion: session.currentStep === 3,
        timeoutSeconds: timeoutForNext,
        timeoutMessage: `本题限时 ${timeoutForNext} 秒，请及时回复。`
      }
    }
  }

  /**
   * 应用奖励
   * v1.0.0 更新：支持buff奖励类型
   */
  private async applyReward(userId: string, type: string, value: number, duration?: number): Promise<void> {
    const [player] = await this.context.database.get<any>('xiuxian_player_v3', { userId } as any)
    if (!player) return

    switch (type) {
      case 'cultivation':
        // 增减修为，范围 [0, 上限]
        const newCultivation = Math.max(0, Math.min(player.cultivation + value, player.cultivationMax))
        await this.context.database.set<any>('xiuxian_player_v3', { userId } as any, {
          cultivation: newCultivation
        } as any)
        break

      case 'spiritStone':
        // 增减灵石（下限 0）
        const newStone = Math.max(0, player.spiritStone + value)
        await this.context.database.set<any>('xiuxian_player_v3', { userId } as any, { spiritStone: newStone } as any)
        break

      case 'breakthrough':
        // ✨ v1.0.0：创建突破率buff（临时加成）
        if (!duration) {
          this.context.logger.warn('突破率奖励缺少duration参数，默认7天')
          duration = 7 * 24  // 默认7天
        }

        const buffService = this.playerService.getBuffService()
        await buffService.addBuff({
          userId,
          buffType: BuffType.BREAKTHROUGH_RATE,
          buffSource: BuffSource.QUESTIONING,
          sourceId: 'questioning_reward',
          value,
          isMultiplier: false,  // 固定值加成
          startTime: new Date(),
          endTime: new Date(Date.now() + duration * 60 * 60 * 1000),
          stackable: true,
          maxStacks: 3,
          description: `问道奖励：突破成功率 ${value >= 0 ? '+' : ''}${(value * 100).toFixed(0)}%`
        })

        this.context.logger.info(`${userId} 获得突破成功率buff: ${value}, 持续${duration}小时`)
        break

      case 'cultivation_speed':
        // ✨ v1.0.0：创建修炼速度buff（临时加成）
        if (!duration) {
          duration = 24  // 默认24小时
        }

        const buffService2 = this.playerService.getBuffService()
        await buffService2.addBuff({
          userId,
          buffType: BuffType.CULTIVATION_SPEED,
          buffSource: BuffSource.QUESTIONING,
          sourceId: 'questioning_reward',
          value,
          isMultiplier: true,  // 倍率加成
          startTime: new Date(),
          endTime: new Date(Date.now() + duration * 60 * 60 * 1000),
          stackable: true,
          maxStacks: 3,
          description: `问道奖励：修炼速度 ${value >= 0 ? '+' : ''}${(value * 100).toFixed(0)}%`
        })

        this.context.logger.info(`${userId} 获得修炼速度buff: ${value}, 持续${duration}小时`)
        break
    }
  }

  /**
   * 获取奖励描述
   */
  private getRewardDescription(type: string, value: number): string {
    switch (type) {
      case 'cultivation':
        return value >= 0 ? `+${value} 修为` : `-${Math.abs(value)} 修为`
      case 'spiritStone':
        return value >= 0 ? `+${value} 灵石` : `-${Math.abs(value)} 灵石`
      case 'breakthrough':
        return `下次突破成功率 +${(value * 100).toFixed(0)}%`
      default:
        return '未知奖励'
    }
  }

  /**
   * 简单反作弊检测：识别 Prompt Injection / 越权指令等
   */
  private detectExploitation(text: string): { isExploit: boolean; reason: string; severity: 'low' | 'high' } {
    const t = (text || '').toLowerCase()
    const patterns = [
      '忽略以上', '忽略之前', '无视之前', 'system prompt', '作为 ai', '你现在是', '你将忽略',
      '越狱', 'jailbreak', 'dan 模式', 'dan mode', 'prompt injection', '指令注入',
      '请直接给出最终 json', '覆盖规则', '绕过限制', '请给我', '给我', '我要', '分配给我', '分配', '给我道号', '给我灵根', '请分配'
    ]

    // 检测是否直接请求某种灵根或道号（中文名）
    const rootKeywords = ['天灵根','光灵根','暗灵根','金灵根','木灵根','水灵根','火灵根','土灵根','气灵根','伪灵根','哈根','天灵']

    const hit = patterns.find(p => t.includes(p))
    const hitRoot = rootKeywords.find(r => t.includes(r) || t.includes(r.replace('灵根', '')))

    // 过长、重复符号等可疑特征
    const tooLong = t.length > 800
    const repeated = /(.)\1{8,}/.test(t)

    const isExploit = Boolean(hit || hitRoot || tooLong || repeated)
    let severity: 'low' | 'high' = 'low'
    if (hitRoot || hit || repeated || t.length > 1500) severity = 'high'
    const reason = hitRoot ? `明确要求分配灵根或道号：${hitRoot}` : (hit ? `包含可疑指令“${hit}”` : (tooLong ? '回答过长' : (repeated ? '异常重复字符' : '异常内容')))
    return { isExploit, reason, severity }
  }

  /**
   * 开始步入仙途问心（随机选择一条 INITIATION 路径）
   */
  async startInitiationQuestioning(userId: string): Promise<ServiceResult<InitiationStartData>> {
    // 检查是否已有进行中的问心
    if (this.sessions.has(userId)) {
      return { success: false, message: '你正在进行问心，请先完成或取消' }
    }

    // 随机选择一条步入仙途路径
    const path = getRandomPath(PathPackageType.INITIATION)
    if (!path) {
      return { success: false, message: '未找到步入仙途路径' }
    }

    // 创建会话（会话级超时来自 src/config/timeout.json 或使用默认 60s）
    const session: QuestioningSession = {
      userId,
      pathId: path.id,
      currentStep: 1,
      answers: [],
      startTime: new Date(),
      lastQuestionTime: new Date(),
      timeoutSeconds: this.getDefaultTimeoutSeconds()
    }
    this.sessions.set(userId, session)

    // 返回第一题
    const firstQuestion = path.questions[0]
    return {
      success: true,
      message: '步入仙途问心开始',
      data: {
        pathName: path.name,
        pathDescription: path.description,
        question: firstQuestion.question,
        options: firstQuestion.options?.map(o => o.text),
        timeoutSeconds: session.timeoutSeconds,
        timeoutMessage: `本题限时 ${session.timeoutSeconds} 秒，请及时回复。`
      }
    }
  }

  /**
   * 开始试炼问心（随机选择一条 TRIAL 路径）
   */
  async startRandomTrialQuestioning(userId: string, player: Player): Promise<ServiceResult<InitiationStartData>> {
    // 检查是否已有进行中的问心
    if (this.sessions.has(userId)) {
      return { success: false, message: '你正在进行问心，请先完成或取消' }
    }

    // 随机选择一条试炼路径
    const path = getRandomPath(PathPackageType.TRIAL)
    if (!path) {
      return { success: false, message: '未找到试炼路径' }
    }

    // 检查境界要求
    if (path.minRealm !== undefined && player.realm < path.minRealm) {
      return {
        success: false,
        message: `需要达到 ${getRealmName(path.minRealm, 0)} 才能进行此问心`
      }
    }

    // 检查冷却
    const cooldownResult = await this.checkCooldown(userId, path.id)
    if (!cooldownResult.success) {
      return cooldownResult as any
    }

    // 创建会话（会话级超时来自 src/config/timeout.json 或使用默认 60s）
    const session: QuestioningSession = {
      userId,
      pathId: path.id,
      currentStep: 1,
      answers: [],
      startTime: new Date(),
      lastQuestionTime: new Date(),
      timeoutSeconds: this.getDefaultTimeoutSeconds()
    }
    this.sessions.set(userId, session)

    // 返回第一题
    const firstQuestion = path.questions[0]
    return {
      success: true,
      message: '试炼问心开始',
      data: {
        pathName: path.name,
        pathDescription: path.description,
        question: firstQuestion.question,
        options: firstQuestion.options?.map(o => o.text),
        timeoutSeconds: session.timeoutSeconds,
        timeoutMessage: `本题限时 ${session.timeoutSeconds} 秒，请及时回复。`
      }
    }
  }

  /**
   * 完成步入仙途问心（AI 分配道号和灵根，然后创建玩家）
   * v0.7.0 更新：集成混合分析器，使用AI评分开放题
   */
  private async completeInitiationQuestioning(
    userId: string,
    session: QuestioningSession,
    path: QuestioningPath
  ): Promise<ServiceResult<InitiationCompleteData>> {
    try {
      this.context.logger.info('=== 步入仙途完成流程开始 ===')

      // 提取答案（选择题用字母，开放题用文本）
      const answersText = session.answers.map(a => (typeof a === 'string' ? a : a.letter))
      this.context.logger.debug('用户答案:', answersText)

      // ✨ v0.7.0: 读取配置项
      const config = this.context.config as any
      const enableAI = config?.enableInitiationAIScoring ?? true
      const enableFallback = config?.enableInitiationAIScoringFallback ?? true

      this.context.logger.info(`INITIATION AI评分配置: enableAI=${enableAI}, enableFallback=${enableFallback}`)

      // ✨ v0.7.0: 使用混合分析器分析性格
      const analysisResult = await this.hybridAnalyzer.analyzeInitiation(
        answersText,
        enableAI,
        enableFallback
      )

      const personalityScore = analysisResult.finalScore
      this.context.logger.info(`性格分析完成，使用${analysisResult.usedAI ? 'AI' : '关键词'}评分`)
      this.context.logger.debug('性格分数:', JSON.stringify(personalityScore))

      // 调用 AI Helper 生成初始响应（包含灵根分配和道号生成）
      // 注意：generateInitiationResponse 内部会再次调用 analyzePersonality，
      // 但由于公平性系统需要独立的 FateCalculator 流程，我们保持原有架构
      const questions = path.questions.map(q => q.question)
      const aiResponse = await this.aiHelper.generateInitiationResponse(
        path.name,
        path.description,
        questions,
        answersText
      )

      // 使用 AI 分配的道号和代码确定的灵根创建玩家
      const createResult = await this.playerService.create({
        userId,
        username: aiResponse.daoName,
        spiritualRoot: aiResponse.spiritualRoot as SpiritualRootType
      })

      if (!createResult.success || !createResult.data) {
        this.sessions.delete(userId)
        return { success: false, message: createResult.message || '创建角色失败' }
      }

      // 【重要】增加初始灵根统计计数（公平性系统）
      try {
        await this.rootStatsService.incrementRootCount(aiResponse.spiritualRoot as SpiritualRootType)
        this.context.logger.info(`统计已更新：${aiResponse.spiritualRoot} 数量 +1`)
      } catch (error) {
        this.context.logger.error('更新初始灵根统计失败:', error)
        // 不影响主流程，继续
      }

      // 保存问心记录到数据库（包含混合分析结果）
      await this.context.database.create('xiuxian_questioning_v3', {
        userId,
        pathId: path.id,
        pathName: path.name,
        answer1: answersText[0] || '',
        answer2: answersText[1] || '',
        answer3: answersText[2] || '',
        aiResponse: JSON.stringify({
          ...aiResponse,
          // ✨ v0.7.0: 保存混合分析详情
          hybridAnalysis: {
            usedAI: analysisResult.usedAI,
            finalScore: analysisResult.finalScore,
            choiceScore: analysisResult.choiceScore,
            aiScores: analysisResult.aiScores,
            aiReasoning: analysisResult.aiReasoning
          }
        }),
        personality: aiResponse.personality,
        tendency: '',
        rewardType: 'initiation',
        rewardValue: 0,
        rewardReason: aiResponse.reason,
        createTime: new Date()
      })

      // 清除会话
      this.sessions.delete(userId)

      this.context.logger.info('=== 步入仙途完成流程结束 ===')

      // 返回结果
      return {
        success: true,
        message: '步入仙途成功',
        data: {
          player: createResult.data.player,
          daoName: aiResponse.daoName,
          spiritualRoot: aiResponse.spiritualRoot,
          personality: aiResponse.personality,
          reason: aiResponse.reason
        }
      }
    } catch (error) {
      this.context.logger.error('步入仙途问心完成流程错误:', error)
      this.sessions.delete(userId)

      // ✨ 如果是AI相关错误，给出更明确的提示
      const errorMessage = (error as Error).message || ''
      if (errorMessage.includes('AI服务不可用')) {
        return { success: false, message: 'AI服务不可用，且未启用降级模式。请联系管理员配置AI服务或开启降级模式。' }
      }
      if (errorMessage.includes('AI评分失败') || errorMessage.includes('AI返回空响应')) {
        return { success: false, message: 'AI评分失败，且未启用降级模式。请稍后重试或联系管理员开启降级模式。' }
      }

      return { success: false, message: '问心评估失败，请稍后重试' }
    }
  }

  /**
   * 取消问心
   */
  cancelQuestioning(userId: string): ServiceResult {
    if (!this.sessions.has(userId)) {
      return { success: false, message: '没有进行中的问心' }
    }

    this.sessions.delete(userId)
    return { success: true, message: '已取消问心' }
  }

  /**
   * 检查玩家是否在问心中
   */
  isInQuestioning(userId: string): boolean {
    return this.sessions.has(userId)
  }

  /**
   * 获取问心会话
   */
  getSession(userId: string): QuestioningSession | undefined {
    return this.sessions.get(userId)
  }

  /**
   * 获取问心历史
   */
  async getHistory(userId: string, limit: number = 5): Promise<ServiceResult<QuestioningRecord[]>> {
    try {
      const records = await this.context.database.get<any>('xiuxian_questioning_v3', {
        userId
      } as any, {
        sort: { createTime: 'desc' },
        limit
      })

      return {
        success: true,
        message: '查询成功',
        data: records as QuestioningRecord[]
      }
    } catch (error) {
      this.context.logger.error('查询问心历史失败:', error)
      return { success: false, message: '查询失败' }
    }
  }

  // ==================== Tag系统新方法 ====================

  /**
   * 通过Tag启动问道包
   */
  async startPackageByTag(
    userId: string,
    tag: PathPackageTag,
    player: Player
  ): Promise<ServiceResult<{
    packageId: string
    packageName: string
    description: string
    question: string
    options?: string[]
    timeoutSeconds?: number
    timeoutMessage?: string
  }>> {
    // 检查是否已有进行中的问心
    if (this.sessions.has(userId)) {
      return { success: false, message: '你正在进行问心，请先完成或取消' }
    }

    // 随机获取该tag下的问道包
    const pkg = this.pathPackageService.getRandomByTag(tag, player.realm)
    if (!pkg) {
      return { success: false, message: `未找到可用的${tag}问道包` }
    }

    // 检查冷却时间
    const cooldownCheck = await this.pathPackageService.checkCooldown(userId, pkg.id)
    if (!cooldownCheck.canUse) {
      return {
        success: false,
        message: `冷却中，还需 ${cooldownCheck.remainingHours} 小时`
      }
    }

    // 创建会话
    const session: QuestioningSession = {
      userId,
      pathId: pkg.id,
      currentStep: 1,
      answers: [],
      startTime: new Date(),
      lastQuestionTime: new Date(),
      timeoutSeconds: this.getDefaultTimeoutSeconds()
    }
    this.sessions.set(userId, session)

    // 返回第一题
    const firstQuestion = pkg.questions[0]
    return {
      success: true,
      message: '问道开始',
      data: {
        packageId: pkg.id,
        packageName: pkg.name,
        description: pkg.description,
        question: firstQuestion.question,
        options: firstQuestion.options?.map(o => o.text),
        timeoutSeconds: session.timeoutSeconds,
        timeoutMessage: `本题限时 ${session.timeoutSeconds} 秒，请及时回复。`
      }
    }
  }

  /**
   * 通过Tag启动问道包（测试用，不检查境界和冷却）
   */
  async startPackageByTagTest(
    userId: string,
    tag: PathPackageTag
  ): Promise<ServiceResult<{
    packageId: string
    packageName: string
    description: string
    question: string
    options?: string[]
    timeoutSeconds?: number
    timeoutMessage?: string
  }>> {
    // 检查是否已有进行中的问心
    if (this.sessions.has(userId)) {
      return { success: false, message: '你正在进行问心，请先完成或取消' }
    }

    // 随机获取该tag下的问道包（不检查条件）
    const pkg = this.pathPackageService.getRandomByTagNoCheck(tag)
    if (!pkg) {
      return { success: false, message: `未找到${tag}问道包` }
    }

    // 创建会话
    const session: QuestioningSession = {
      userId,
      pathId: pkg.id,
      currentStep: 1,
      answers: [],
      startTime: new Date(),
      lastQuestionTime: new Date(),
      timeoutSeconds: this.getDefaultTimeoutSeconds()
    }
    this.sessions.set(userId, session)

    // 返回第一题
    const firstQuestion = pkg.questions[0]
    return {
      success: true,
      message: '问道开始',
      data: {
        packageId: pkg.id,
        packageName: pkg.name,
        description: pkg.description,
        question: firstQuestion.question,
        options: firstQuestion.options?.map(o => o.text),
        timeoutSeconds: session.timeoutSeconds,
        timeoutMessage: `本题限时 ${session.timeoutSeconds} 秒，请及时回复。`
      }
    }
  }

  /**
   * 完成问道包并计算分数匹配
   */
  async completePackageQuestioning(
    userId: string,
    session: QuestioningSession,
    pkg: PathPackageTemplate
  ): Promise<ServiceResult<PackageExecutionResult>> {
    try {
      // 获取玩家信息
      const [player] = await this.context.database.get<any>('xiuxian_player_v3', { userId } as any)
      if (!player) {
        this.sessions.delete(userId)
        return { success: false, message: '玩家信息不存在' }
      }

      // 提取答案（选择题用字母，开放题用文本）
      const answersText = session.answers.map(a => (typeof a === 'string' ? a : a.letter))

      // ✨ v0.8.2 使用优先级控制逻辑
      const enableAIScoring = this.shouldEnableAIScoring(pkg)
      const enableAIScoringFallback = this.getAIScoringFallbackEnabled()
      const enableAIEvaluation = this.shouldEnableAIEvaluation(pkg)

      // ✨ v0.6.0 使用混合分析器（选择题规则 + AI评估开放题）
      const analysisResult = await this.hybridAnalyzer.analyze(
        answersText,
        pkg.questions,
        {
          requiresAI: enableAIScoring,  // ✨ 使用优先级控制结果
          enableFallback: enableAIScoringFallback,
          maxScorePerDimension: pkg.aiScoringConfig?.maxScorePerDimension,
          minScorePerDimension: pkg.aiScoringConfig?.minScorePerDimension,
          openQuestionIndices: pkg.aiScoringConfig?.openQuestionIndices
        },
        pkg.scoringWeights  // ✨ v0.8.2 传递权重配置
      )

      const personalityScore = analysisResult.finalScore

      // 计算匹配结果（如果问道包有最佳分数配置）
      let matchResult: MatchResult | undefined
      let reward = { type: 'spirit_stone' as const, value: 50, description: '+50 灵石' }

      if (pkg.optimalScore) {
        matchResult = calculateMatchResult(personalityScore, pkg.optimalScore)
        reward = {
          type: matchResult.reward.type as any,
          value: matchResult.reward.value,
          description: this.getRewardDescription(matchResult.reward.type, matchResult.reward.value)
        }
      }

      // ✨ v0.8.2 生成AI评语（独立控制）
      let aiEvaluation: { evaluation: string; rewardReason: string }
      if (enableAIEvaluation) {
        aiEvaluation = await this.generatePackageEvaluation(
          pkg,
          answersText,
          personalityScore,
          matchResult,
          analysisResult.aiReasoning
        )
      } else {
        // AI评语被禁用，检查是否允许使用降级评语
        const enableAIEvaluationFallback = this.getAIEvaluationFallbackEnabled()
        if (!enableAIEvaluationFallback) {
          this.context.logger.error('AI评语被禁用，且未启用降级评语')
          throw new Error('AI评语被禁用，且未启用降级模式。请联系管理员启用AI评语或开启降级模式。')
        }
        this.context.logger.info('AI评语被禁用，使用降级评语')
        aiEvaluation = this.getFallbackEvaluation(pkg, matchResult)
      }

      // 应用奖励
      await this.applyReward(userId, reward.type, reward.value)

      // 保存记录到数据库
      await this.context.database.create('xiuxian_questioning_v3', {
        userId,
        pathId: pkg.id,
        pathName: pkg.name,
        answer1: answersText[0] || '',
        answer2: answersText[1] || '',
        answer3: answersText[2] || '',
        aiResponse: JSON.stringify({
          personalityScore,
          choiceScore: analysisResult.choiceScore,
          aiScores: analysisResult.aiScores,
          usedAI: analysisResult.usedAI,
          matchResult,
          evaluation: aiEvaluation
        }),
        personality: aiEvaluation.evaluation,
        tendency: matchResult ? matchResult.tier : 'normal',
        rewardType: reward.type,
        rewardValue: reward.value,
        rewardReason: aiEvaluation.rewardReason,
        createTime: new Date()
      })

      // 清除会话
      this.sessions.delete(userId)

      // 返回结果
      const result: PackageExecutionResult = {
        success: true,
        packageId: pkg.id,
        packageName: pkg.name,
        personalityScore,
        matchResult,
        aiResponse: aiEvaluation,
        rewards: [{
          type: reward.type,
          value: reward.value,
          description: reward.description
        }],
        message: '问道完成'
      }

      return {
        success: true,
        message: '问道完成',
        data: result
      }
    } catch (error) {
      this.context.logger.error('完成问道包流程错误:', error)
      this.sessions.delete(userId)

      // ✨ 如果是AI相关错误，给出更明确的提示
      const errorMessage = (error as Error).message || ''
      if (errorMessage.includes('AI服务不可用') || errorMessage.includes('AI评分失败')) {
        return { success: false, message: 'AI服务不可用，请联系管理员配置或稍后重试' }
      }

      return { success: false, message: '问道评估失败，请稍后重试' }
    }
  }

  /**
   * 获取AI评分降级配置
   */
  private getAIScoringFallbackEnabled(): boolean {
    const config = this.context.config as any
    return config?.enableAIScoringFallback ?? false
  }

  /**
   * 判断是否启用AI打分（全局配置 > 包内配置）
   * v0.8.2 新增：实现配置优先级控制
   *
   * 优先级：
   * 1. 全局强制禁用（enableAIScoring = 'off'）→ false
   * 2. 全局强制启用（enableAIScoring = 'on'）→ true
   * 3. 全局默认（enableAIScoring = 'auto' 或 undefined）→ 使用包内配置
   */
  private shouldEnableAIScoring(pkg: PathPackageTemplate): boolean {
    const config = this.context.config as any

    // 全局强制禁用
    if (config?.enableAIScoring === 'off') {
      this.context.logger.debug(`AI打分：全局强制禁用（包${pkg.id}）`)
      return false
    }

    // 全局强制启用
    if (config?.enableAIScoring === 'on') {
      this.context.logger.debug(`AI打分：全局强制启用（包${pkg.id}）`)
      return true
    }

    // 全局默认（'auto' 或 undefined），使用包内配置
    if (pkg.aiFeatures) {
      this.context.logger.debug(`AI打分：使用包内配置 enableScoring=${pkg.aiFeatures.enableScoring}（包${pkg.id}）`)
      return pkg.aiFeatures.enableScoring
    }

    // 向后兼容：使用旧的 requiresAI
    const result = pkg.requiresAI ?? false
    this.context.logger.debug(`AI打分：使用旧配置 requiresAI=${result}（包${pkg.id}）`)
    return result
  }

  /**
   * 判断是否启用AI评语（全局配置 > 包内配置）
   * v0.8.2 新增：独立控制AI评语开关
   *
   * 优先级：
   * 1. 全局强制禁用（enableAIEvaluation = 'off'）→ false
   * 2. 全局强制启用（enableAIEvaluation = 'on'）→ true
   * 3. 全局默认（enableAIEvaluation = 'auto' 或 undefined）→ 使用包内配置
   */
  private shouldEnableAIEvaluation(pkg: PathPackageTemplate): boolean {
    const config = this.context.config as any

    // 全局强制禁用
    if (config?.enableAIEvaluation === 'off') {
      this.context.logger.debug(`AI评语：全局强制禁用（包${pkg.id}）`)
      return false
    }

    // 全局强制启用
    if (config?.enableAIEvaluation === 'on') {
      this.context.logger.debug(`AI评语：全局强制启用（包${pkg.id}）`)
      return true
    }

    // 全局默认（'auto' 或 undefined），使用包内配置
    if (pkg.aiFeatures) {
      this.context.logger.debug(`AI评语：使用包内配置 enableEvaluation=${pkg.aiFeatures.enableEvaluation}（包${pkg.id}）`)
      return pkg.aiFeatures.enableEvaluation
    }

    // 向后兼容：使用旧的 requiresAI
    const result = pkg.requiresAI ?? false
    this.context.logger.debug(`AI评语：使用旧配置 requiresAI=${result}（包${pkg.id}）`)
    return result
  }

  /**
   * 获取AI评语降级配置
   * v0.8.2 新增：独立的评语降级开关
   */
  private getAIEvaluationFallbackEnabled(): boolean {
    const config = this.context.config as any
    return config?.enableAIEvaluationFallback ?? true
  }

  /**
   * 获取降级评语（当AI评语被禁用或失败时）
   * v0.8.2 新增：模板评语降级方案
   */
  private getFallbackEvaluation(
    pkg: PathPackageTemplate,
    matchResult?: MatchResult
  ): { evaluation: string; rewardReason: string } {
    const tier = matchResult?.tier ?? 'normal'

    // 根据匹配度等级生成评语
    let evaluation = ''
    if (tier === 'perfect') {
      evaluation = `你完美地完成了${pkg.name}的考验，展现出卓越的智慧与品德。`
    } else if (tier === 'good') {
      evaluation = `你成功通过了${pkg.name}的考验，表现良好，仍有进步空间。`
    } else {
      evaluation = `你经历了${pkg.name}的考验，虽未达最佳，但也有所收获。`
    }

    // 使用奖励配置中的提示作为原因
    const rewardReason = matchResult?.reward.aiPromptHint ?? '历练有所收获，继续努力修行。'

    return {
      evaluation,
      rewardReason
    }
  }

  /**
   * 生成问道包的AI评语
   * v0.8.2 更新：支持降级配置控制
   */
  private async generatePackageEvaluation(
    pkg: PathPackageTemplate,
    answers: string[],
    personalityScore: any,
    matchResult?: MatchResult,
    aiReasoning?: string
  ): Promise<{ evaluation: string; rewardReason: string }> {
    const enableFallback = this.getAIEvaluationFallbackEnabled()

    // 检查AI服务是否可用
    const aiService = this.ctx.xiuxianAI
    if (!aiService || !aiService.isAvailable()) {
      if (enableFallback) {
        this.context.logger.warn('AI服务不可用，使用降级评语')
        return this.getFallbackEvaluation(pkg, matchResult)
      } else {
        throw new Error('AI服务不可用，且未启用降级')
      }
    }

    // 调用AI生成评语
    try {
      const prompt = this.buildPackageEvaluationPrompt(pkg, answers, personalityScore, matchResult, aiReasoning)

      // ✨ 调试：记录prompt长度
      this.context.logger.debug(`AI评语prompt长度: ${prompt.length} 字符`)
      this.context.logger.debug(`AI评语prompt前100字: ${prompt.substring(0, 100)}...`)

      const response = await aiService.generate(prompt, AIConfig.PACKAGE_EVALUATION_TIMEOUT)

      // 检查响应是否为 null
      if (response) {
        // ✨ 调试：记录原始响应
        this.context.logger.debug(`AI评语原始响应: ${response}`)

        // ✨ 增强JSON提取：容忍AI在JSON前后添加说明文字
        let jsonText = response.trim()

        // 尝试提取JSON（查找第一个{到最后一个}）
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          jsonText = jsonMatch[0]
          this.context.logger.debug(`提取的JSON: ${jsonText}`)
        }

        // 解析响应
        const parsed = JSON.parse(jsonText)
        return {
          evaluation: parsed.evaluation || '问道完成',
          rewardReason: parsed.rewardReason || '完成问道'
        }
      } else {
        this.context.logger.warn('AI评语响应为null')
        // 作为错误处理，会在下面的catch中处理降级
        throw new Error('AI响应为空')
      }
    } catch (error) {
      this.context.logger.warn('AI评语生成失败:', error)

      if (enableFallback) {
        this.context.logger.info('使用降级评语')
        return this.getFallbackEvaluation(pkg, matchResult)
      } else {
        throw error
      }
    }
  }

  /**
   * 构建问道包评语的AI提示词
   */
  private buildPackageEvaluationPrompt(
    pkg: PathPackageTemplate,
    answers: string[],
    personalityScore: any,
    matchResult?: MatchResult,
    aiReasoning?: string
  ): string {
    let prompt = `你是修仙世界的天道评判者，需要根据修士在"${pkg.name}"中的表现给出评语。

【问道包描述】
${pkg.description}

【修士回答】
第1题：${answers[0] || '未回答'}
第2题：${answers[1] || '未回答'}
第3题：${answers[2] || '未回答'}

【性格分析】
${generateSimilarityAnalysis(personalityScore, pkg.optimalScore?.target || personalityScore)}
`

    if (aiReasoning) {
      prompt += `
【AI开放题评分理由】
${aiReasoning}
`
    }

    if (matchResult) {
      prompt += `
【匹配结果】
匹配度：${matchResult.matchRate.toFixed(1)}%
等级：${matchResult.tier === 'perfect' ? '完美契合' : matchResult.tier === 'good' ? '良好匹配' : '普通匹配'}
评语提示：${matchResult.reward.aiPromptHint}
`
    }

    prompt += `
【你的任务】
生成两段评语：
1. evaluation: 对修士此次问道表现的评价（50字以内，要有修仙风格）
2. rewardReason: 解释为何获得此等奖励（30字以内）

仅返回JSON格式：
{"evaluation":"评语内容","rewardReason":"奖励原因"}`

    return prompt
  }

  /**
   * 获取指定Tag的所有问道包
   */
  getPackagesByTag(tag: PathPackageTag): PathPackageTemplate[] {
    return this.pathPackageService.getByTag(tag)
  }

  /**
   * 获取问道包服务统计
   */
  getPackageStats(): {
    totalPackages: number
    enabledPackages: number
    tagCounts: Record<string, number>
  } {
    return this.pathPackageService.getStats()
  }

  /**
   * 获取问道包服务实例
   */
  getPathPackageService(): PathPackageService {
    return this.pathPackageService
  }

  /**
   * 检查答案并处理问道包（扩展submitAnswer以支持问道包）
   */
  async submitPackageAnswer(userId: string, answer: string): Promise<ServiceResult<AnswerSubmitData | PackageExecutionResult>> {
    const session = this.sessions.get(userId)
    if (!session) {
      return { success: false, message: '未找到问心会话，请先开始问心' }
    }

    // 检查是否是问道包（通过pathId前缀判断）
    const pkg = this.pathPackageService.getById(session.pathId)
    if (pkg) {
      // 使用问道包处理逻辑
      return await this.handlePackageAnswer(userId, answer, session, pkg)
    }

    // 使用原有的处理逻辑
    return await this.submitAnswer(userId, answer)
  }

  /**
   * 处理问道包答案
   */
  private async handlePackageAnswer(
    userId: string,
    answer: string,
    session: QuestioningSession,
    pkg: PathPackageTemplate
  ): Promise<ServiceResult<AnswerSubmitData | PackageExecutionResult>> {
    // 检查是否正在完成中（防止并发重复完成）
    if (session.isCompleting) {
      return { success: false, message: '问道正在评估中，请稍候...' }
    }

    // 检查超时
    const lastTime = session.lastQuestionTime ? new Date(session.lastQuestionTime).getTime() : session.startTime.getTime()
    const now = Date.now()
    const timeout = session.timeoutSeconds ?? this.getDefaultTimeoutSeconds()
    if (now - lastTime > timeout * 1000) {
      this.sessions.delete(userId)
      return { success: false, message: `回答超时：每题限时 ${timeout} 秒，问心已中断` }
    }

    // 当前问题
    const currentIndex = session.currentStep - 1
    const currentQuestion = pkg.questions[currentIndex]

    // 选项题校验
    if (currentQuestion?.options && currentQuestion.options.length > 0) {
      const raw = (answer || '').trim()
      const validLetters = Array.from({ length: currentQuestion.options.length }, (_, i) => String.fromCharCode(65 + i))

      if (raw.length !== 1 || !/^[A-Z]$/.test(raw)) {
        return { success: false, message: `请输入严格的大写选项字母（例如：${validLetters[0]}），有效选项：${validLetters.join('/')}。` }
      }

      if (!validLetters.includes(raw)) {
        return { success: false, message: `请输入有效选项（${validLetters.join('/')}）` }
      }

      const optionText = currentQuestion.options![raw.charCodeAt(0) - 65].text
      session.answers.push({ letter: raw, text: optionText })
    } else {
      // 开放题反作弊检测
      const detect = this.detectExploitation(answer || '')
      if (detect.isExploit) {
        const penalty = detect.severity === 'high' ? -200 : -100
        await this.applyReward(userId, 'spiritStone', penalty)
        this.sessions.delete(userId)
        return {
          success: true,
          message: '问道结束',
          data: {
            tendency: '违规',
            reward: {
              type: 'spiritStone',
              value: penalty,
              description: this.getRewardDescription('spiritStone', penalty)
            },
            reason: detect.reason,
            personality: '回答异常，已处罚。'
          }
        }
      }
      session.answers.push(answer)
    }

    // 检查是否完成所有问题
    if (session.currentStep >= 3) {
      // 设置完成标志，防止并发重复完成
      session.isCompleting = true
      this.sessions.set(userId, session)

      return await this.completePackageQuestioning(userId, session, pkg)
    }

    // 进入下一题
    session.currentStep++
    const nextQuestion = pkg.questions[session.currentStep - 1]
    session.lastQuestionTime = new Date()

    const timeoutForNext = session.timeoutSeconds ?? this.getDefaultTimeoutSeconds()
    return {
      success: true,
      message: '答案已记录',
      data: {
        step: session.currentStep,
        question: nextQuestion.question,
        options: nextQuestion.options?.map(o => o.text),
        isLastQuestion: session.currentStep === 3,
        timeoutSeconds: timeoutForNext,
        timeoutMessage: `本题限时 ${timeoutForNext} 秒，请及时回复。`
      }
    }
  }
}
