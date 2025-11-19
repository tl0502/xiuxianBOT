import { Context } from 'koishi'
import * as fs from 'fs'
import * as path from 'path'
import { ALL_PATHS, QuestioningPath, PathPackageType, getRandomPath } from '../config/questioning'
import { QuestioningSession, ServiceResult, QuestioningResult } from '../types/questioning'
import { Player } from '../types/player'
import { AIHelper } from '../utils/ai-helper'
import { getRealmName } from '../utils/calculator'
import { PlayerService } from './player.service'
import { SpiritualRootType } from '../config/spiritual-roots'

/**
 * 问心服务类
 */
export class QuestioningService {
  private sessions: Map<string, QuestioningSession> = new Map()
  private aiHelper: AIHelper
  private playerService: PlayerService

  constructor(private ctx: Context) {
    this.aiHelper = new AIHelper(ctx)
    this.playerService = new PlayerService(ctx)
  }

  // 获取默认超时（秒），从仓库根目录 src/config/timeout.json 读取；读取失败返回 60
  private getDefaultTimeoutSeconds(): number {
    try {
      const cfgPath = path.join(process.cwd(), 'src', 'config', 'timeout.json')
      if (fs.existsSync(cfgPath)) {
        const raw = fs.readFileSync(cfgPath, 'utf-8')
        const cfg = JSON.parse(raw)
        if (typeof cfg.defaultTimeoutSeconds === 'number' && cfg.defaultTimeoutSeconds > 0) {
          return Math.floor(cfg.defaultTimeoutSeconds)
        }
      }
    } catch (e) {
      this.ctx.logger('xiuxian').warn('读取 src/config/timeout.json 失败，使用默认超时 60s')
    }
    return 60
  }

  /**
   * 获取所有可用的问心路径
   */
  getAvailablePaths(player: Player): QuestioningPath[] {
    return ALL_PATHS.filter(path => {
      // 过滤掉步入仙途路径（那是创角专用的）
      if (path.packageType === PathPackageType.INITIATION) {
        return false
      }
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
    return ALL_PATHS.find(p => p.id === pathId) || null
  }

  /**
   * 检查冷却时间
   */
  async checkCooldown(userId: string, pathId: string): Promise<ServiceResult<{ canStart: boolean; remainingHours?: number }>> {
    const path = this.getPathById(pathId)
    if (!path || !path.cooldown) {
      return { success: true, message: '无冷却限制', data: { canStart: true } }
    }

    // 查询最近一次该路径的问心记录
    const records = await this.ctx.database.get('xiuxian_questioning_v3', {
      userId,
      pathId
    }, {
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
   * 开始问心
   */
  async startQuestioning(userId: string, pathId: string, player: Player): Promise<ServiceResult<{ question: string; options?: string[]; timeoutSeconds?: number; timeoutMessage?: string }>> {
    // 检查路径是否存在
    const path = this.getPathById(pathId)
    if (!path) {
      return { success: false, message: '问心路径不存在' }
    }

    // 检查境界要求
    if (path.minRealm !== undefined && player.realm < path.minRealm) {
      return {
        success: false,
        message: `需要达到 ${getRealmName(path.minRealm, 0)} 才能进行此问心`
      }
    }

    // 检查冷却
    const cooldownResult = await this.checkCooldown(userId, pathId)
    if (!cooldownResult.success) {
      return cooldownResult as any
    }

    // 检查是否已有进行中的问心
    if (this.sessions.has(userId)) {
      return { success: false, message: '你正在进行问心，请先完成或取消' }
    }

    // 创建会话（会话级超时来自 src/config/timeout.json 或使用默认 60s）
    const session: QuestioningSession = {
      userId,
      pathId,
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
      message: '问心开始',
      data: {
        question: firstQuestion.question,
        options: firstQuestion.options?.map(o => o.text),
        timeoutSeconds: session.timeoutSeconds,
        timeoutMessage: `本题限时 ${session.timeoutSeconds} 秒，请及时回复。`
      }
    }
  }

  /**
   * 提交答案
   */
  async submitAnswer(userId: string, answer: string): Promise<ServiceResult<any>> {
    const session = this.sessions.get(userId)
    if (!session) {
      return { success: false, message: '未找到问心会话，请先开始问心' }
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
          await this.ctx.database.create('xiuxian_questioning_v3', {
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
      // 完成问心，根据路径类型选择不同的处理方式
      if (path.packageType === PathPackageType.INITIATION) {
        return await this.completeInitiationQuestioning(userId, session, path)
      } else {
        return await this.completeQuestioning(userId, session, path)
      }
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
   * 完成问心并进行 AI 评估
   */
  private async completeQuestioning(
    userId: string,
    session: QuestioningSession,
    path: QuestioningPath
  ): Promise<ServiceResult<QuestioningResult>> {
    try {
      // 获取玩家信息
      const [player] = await this.ctx.database.get('xiuxian_player_v3', { userId })
      if (!player) {
        this.sessions.delete(userId)
        return { success: false, message: '玩家信息不存在' }
      }

      // 调用 AI 评估（传递完整的答案文本）
      const questions = path.questions.map(q => q.question)
      const answersText = session.answers.map(a => (typeof a === 'string' ? a : a.text))
      const aiResponse = await this.aiHelper.generateQuestioningResponse(
        path.name,
        path.description,
        questions,
        answersText,
        player
      )

      // 保存记录到数据库
      await this.ctx.database.create('xiuxian_questioning_v3', {
        userId,
        pathId: path.id,
        pathName: path.name,
        answer1: answersText[0] || '',
        answer2: answersText[1] || '',
        answer3: answersText[2] || '',
        aiResponse: JSON.stringify(aiResponse),
        personality: aiResponse.personality,
        tendency: aiResponse.tendency,
        rewardType: aiResponse.reward.type,
        rewardValue: aiResponse.reward.value,
        rewardReason: aiResponse.reason,
        createTime: new Date()
      })

      // 应用奖励
      await this.applyReward(userId, aiResponse.reward.type, aiResponse.reward.value)

      // 清除会话
      this.sessions.delete(userId)

      // 返回结果
      return {
        success: true,
        message: '问心完成',
        data: {
          success: true,
          data: {
            personality: aiResponse.personality,
            tendency: aiResponse.tendency,
            reward: {
              type: aiResponse.reward.type,
              value: aiResponse.reward.value,
              description: this.getRewardDescription(aiResponse.reward.type, aiResponse.reward.value)
            },
            reason: aiResponse.reason
          }
        }
      }
    } catch (error) {
      this.ctx.logger('xiuxian').error('问心完成流程错误:', error)
      this.sessions.delete(userId)
      return { success: false, message: '问心评估失败，请稍后重试' }
    }
  }

  /**
   * 应用奖励
   */
  private async applyReward(userId: string, type: string, value: number): Promise<void> {
    const [player] = await this.ctx.database.get('xiuxian_player_v3', { userId })
    if (!player) return

    switch (type) {
      case 'cultivation':
        // 增减修为，范围 [0, 上限]
        const newCultivation = Math.max(0, Math.min(player.cultivation + value, player.cultivationMax))
        await this.ctx.database.set('xiuxian_player_v3', { userId }, {
          cultivation: newCultivation
        })
        break

      case 'spiritStone':
        // 增减灵石（下限 0）
        const newStone = Math.max(0, player.spiritStone + value)
        await this.ctx.database.set('xiuxian_player_v3', { userId }, { spiritStone: newStone })
        break

      case 'breakthrough':
        // breakthrough 类型的奖励是临时的成功率加成，这里可以存储到玩家的某个字段
        // 暂时不处理，或者可以添加一个 breakthroughBonus 字段
        this.ctx.logger('xiuxian').info(`${userId} 获得突破成功率加成: ${value}`)
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
  async startInitiationQuestioning(userId: string): Promise<ServiceResult<{ pathName: string; pathDescription: string; question: string; options?: string[]; timeoutSeconds?: number; timeoutMessage?: string }>> {
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
  async startRandomTrialQuestioning(userId: string, player: Player): Promise<ServiceResult<{ pathName: string; pathDescription: string; question: string; options?: string[]; timeoutSeconds?: number; timeoutMessage?: string }>> {
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
   */
  private async completeInitiationQuestioning(
    userId: string,
    session: QuestioningSession,
    path: QuestioningPath
  ): Promise<ServiceResult<any>> {
    try {
      // 调用 AI 评估（步入仙途模式）
      const questions = path.questions.map(q => q.question)
      const answersText = session.answers.map(a => (typeof a === 'string' ? a : a.text))
      const aiResponse = await this.aiHelper.generateInitiationResponse(
        path.name,
        path.description,
        questions,
        answersText
      )

      // 使用 AI 分配的道号和灵根创建玩家
      const createResult = await this.playerService.create({
        userId,
        username: aiResponse.daoName,
        spiritualRoot: aiResponse.spiritualRoot as SpiritualRootType
      })

      if (!createResult.success || !createResult.data) {
        this.sessions.delete(userId)
        return createResult
      }

      // 保存问心记录到数据库
      await this.ctx.database.create('xiuxian_questioning_v3', {
        userId,
        pathId: path.id,
        pathName: path.name,
        answer1: answersText[0] || '',
        answer2: answersText[1] || '',
        answer3: answersText[2] || '',
        aiResponse: JSON.stringify(aiResponse),
        personality: aiResponse.personality,
        tendency: '',
        rewardType: 'initiation',
        rewardValue: 0,
        rewardReason: aiResponse.reason,
        createTime: new Date()
      })

      // 清除会话
      this.sessions.delete(userId)

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
      this.ctx.logger('xiuxian').error('步入仙途问心完成流程错误:', error)
      this.sessions.delete(userId)
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
  async getHistory(userId: string, limit: number = 5): Promise<ServiceResult> {
    try {
      const records = await this.ctx.database.get('xiuxian_questioning_v3', {
        userId
      }, {
        sort: { createTime: 'desc' },
        limit
      })

      return {
        success: true,
        message: '查询成功',
        data: records
      }
    } catch (error) {
      this.ctx.logger('xiuxian').error('查询问心历史失败:', error)
      return { success: false, message: '查询失败' }
    }
  }
}
