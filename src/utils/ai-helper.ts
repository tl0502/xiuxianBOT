import { Context } from 'koishi'
import { InitiationAIResponse, TrialAIResponse } from '../types/ai-response'
import { Player } from '../types/player'
import { SpiritualRootType, SPIRITUAL_ROOTS } from '../config/spiritual-roots'
import { FateCalculator } from './fate-calculator'
import { analyzePersonality, getPersonalityDescription } from './personality-analyzer'
import { isUsingV2, getPersonalitySystemConfig } from '../config/personality-system-config'
import { AIPersonalityAnalyzer } from '../experimental/ai-personality-analyzer'
import { ExtendedFateCalculator } from '../experimental/extended-fate-calculator'
import { getRandomInitiationPath } from '../experimental/path-packages'

/**
 * AI 辅助工具类
 */
export class AIHelper {
  private pluginConfig: any

  constructor(private ctx: Context, pluginConfig?: any) {
    this.pluginConfig = pluginConfig || {}
  }

  /**
   * 调用 ChatLuna 生成步入仙途评估（分配道号和灵根）
   *
   * 核心流程：
   * 1. 代码量化分析性格
   * 2. 代码根据公平性算法确定灵根（天命系统）
   * 3. AI 只负责生成道号和性格评语
   *
   * 支持 v1.0 和 v2.0 两个版本：
   * - v1.0: 9维性格系统 + 固定选项加分
   * - v2.0: 22维性格系统 + AI智能解析
   */
  async generateInitiationResponse(
    _pathName: string,
    _pathDescription: string,
    _questions: string[],
    answers: string[]
  ): Promise<InitiationAIResponse> {
    try {
      // 检查使用哪个版本的性格系统
      if (isUsingV2()) {
        this.ctx.logger('xiuxian').info('使用 v2.0 性格量化系统')
        return await this.generateInitiationResponseV2(answers)
      } else {
        this.ctx.logger('xiuxian').info('使用 v1.0 性格量化系统')
        return await this.generateInitiationResponseV1(answers)
      }
    } catch (error) {
      this.ctx.logger('xiuxian').error('AI 评估失败:', error)

      // ✨ v0.9.2 检查是否允许降级（使用正确的配置源）
      const enableFallback = this.pluginConfig?.enableInitiationAIResponseFallback ?? false
      if (!enableFallback) {
        // 不允许降级，重新抛出错误
        this.ctx.logger('xiuxian').error('AI生成道号/评语失败，且未启用降级模式')
        throw new Error('AI服务不可用，且未启用降级模式。请联系管理员配置AI服务或开启降级模式。')
      }

      // 允许降级，返回默认响应
      this.ctx.logger('xiuxian').warn('使用默认响应作为降级方案')
      return this.getDefaultInitiationResponse()
    }
  }

  /**
   * v1.0 版本：9维性格系统 + 固定选项加分
   */
  private async generateInitiationResponseV1(answers: string[]): Promise<InitiationAIResponse> {
    this.ctx.logger('xiuxian').info('调用 AI 评估步入仙途...')
    this.ctx.logger('xiuxian').info('=== 公平性系统：代码控制灵根分配（v1.0）===')

    // 【第1步】量化分析性格（9维）
    const personality = analyzePersonality(answers)
    const personalityDesc = getPersonalityDescription(personality)
    this.ctx.logger('xiuxian').info(`性格分析完成：${personalityDesc}`)

    // 【第2步】使用天命计算器确定灵根（公平性保证）
    const fateCalculator = new FateCalculator(this.ctx)
    const selectedRoot = await fateCalculator.selectSpiritualRoot(personality)
    const rootInfo = SPIRITUAL_ROOTS[selectedRoot]
    this.ctx.logger('xiuxian').info(`代码已确定灵根：${selectedRoot}（${rootInfo.name}）`)

    // ✨ v0.8.2 检查是否启用AI生成道号和评语
    const enableAIResponse = this.pluginConfig?.enableInitiationAIResponse ?? true
    const enableFallback = this.pluginConfig?.enableInitiationAIResponseFallback ?? false

    if (!enableAIResponse) {
      if (!enableFallback) {
        this.ctx.logger('xiuxian').error('AI生成道号/评语功能已禁用，且未启用降级')
        throw new Error('AI生成道号/评语功能已禁用，且未启用降级模式。请联系管理员启用AI功能或开启降级模式。')
      }
      this.ctx.logger('xiuxian').info('AI生成道号/评语功能已禁用，使用默认响应')
      return {
        daoName: `修士${Math.floor(Math.random() * 1000)}`,
        spiritualRoot: selectedRoot,
        personality: personalityDesc,
        reason: `你的性格：${personalityDesc}\n天道已定：${rootInfo.name}\n踏入仙途，愿你勇猛精进`
      }
    }

    // 【第3步】调用 AI 生成道号和评语（AI 不选择灵根）
    const response = await this.callChatLunaForInitiation(answers, selectedRoot, personalityDesc)

    // 【第4步】解析 AI 响应并强制使用代码确定的灵根
    const result = this.parseInitiationResponse(response, selectedRoot)

    return result
  }

  /**
   * v2.0 版本：22维性格系统 + AI智能解析
   */
  private async generateInitiationResponseV2(answers: string[]): Promise<InitiationAIResponse> {
    const config = getPersonalitySystemConfig()

    this.ctx.logger('xiuxian').info('调用 AI 评估步入仙途...')
    this.ctx.logger('xiuxian').info('=== 公平性系统：代码控制灵根分配（v2.0）===')

    try {
      // 【第1步】选择问道包（如果启用多问道包）
      const pathPackage = config.v2Config?.enableMultiplePaths
        ? getRandomInitiationPath()
        : null

      if (pathPackage) {
        this.ctx.logger('xiuxian').info(`选择问道包：${pathPackage.name}`)
      }

      // 【第2步】AI 性格解析（22维）
      const analyzer = new AIPersonalityAnalyzer(this.ctx)
      const questions = ['问题1', '问题2', '问题3']  // 实际问题会由 QuestioningService 提供
      const personality = await analyzer.analyzePersonality(questions, answers)

      // 【第3步】天命计算器确定灵根（使用 22 维系统）
      const fateCalculator = new ExtendedFateCalculator(this.ctx)
      const selectedRoot = await fateCalculator.selectSpiritualRoot(personality, pathPackage || undefined)
      const rootInfo = SPIRITUAL_ROOTS[selectedRoot]
      this.ctx.logger('xiuxian').info(`代码已确定灵根：${selectedRoot}（${rootInfo.name}）`)

      // 【第4步】AI 生成道号
      const response = await this.callChatLunaForDaoName(answers, selectedRoot, personality)

      // 【第5步】解析 AI 响应并强制使用代码确定的灵根
      const result = this.parseInitiationResponse(response, selectedRoot)

      return result

    } catch (error) {
      this.ctx.logger('xiuxian').error('v2.0 性格解析失败:', error)

      // 检查是否允许降级到 v1.0
      if (config.v2Config?.fallbackToV1) {
        this.ctx.logger('xiuxian').warn('降级到 v1.0 系统处理')
        return await this.generateInitiationResponseV1(answers)
      }

      throw error
    }
  }

  /**
   * 调用 ChatLuna 生成试炼问心评估（奖励评估）
   */
  async generateQuestioningResponse(
    _pathName: string,
    _pathDescription: string,
    _questions: string[],
    _answers: string[],
    _player: Player
  ): Promise<TrialAIResponse> {
    try {
      // 构建 prompt（TODO: 当 ChatLuna 集成完成后使用）
      // const prompt = TRIAL_AI_PROMPT...

      this.ctx.logger('xiuxian').info('调用 AI 评估问心结果...')

      // 调用 ChatLuna（当前使用模拟响应）
      const response = await this.callChatLunaForTrial()

      // 解析 JSON 响应
      const result = this.parseTrialResponse(response)

      return result
    } catch (error) {
      this.ctx.logger('xiuxian').error('AI 评估失败:', error)

      // ✨ v0.9.2 检查是否允许降级
      const enableFallback = this.pluginConfig?.enableAIEvaluationFallback ?? true
      if (!enableFallback) {
        // 不允许降级，重新抛出错误
        this.ctx.logger('xiuxian').error('试炼问心AI评估失败，且未启用降级模式')
        throw new Error('AI服务不可用，且未启用降级模式')
      }

      // 允许降级，返回默认奖励
      this.ctx.logger('xiuxian').warn('使用默认响应作为降级方案')
      return this.getDefaultTrialResponse()
    }
  }

  /**
   * 调用 ChatLuna - 步入仙途模式
   *
   * AI 职责：只生成道号和性格评语
   * 灵根选择：由外部代码的公平性系统决定
   */
  private async callChatLunaForInitiation(
    answers: string[],
    selectedRoot: SpiritualRootType,
    personalityDesc: string
  ): Promise<string> {
    // 反作弊检测：检查用户是否试图操纵 AI
    this.detectCheating(answers)

    // 检查 xiuxianAI 服务是否可用
    const aiService = this.ctx.xiuxianAI
    if (!aiService || !aiService.isAvailable()) {
      // ✨ v0.9.2 检查是否允许降级
      const enableFallback = this.pluginConfig?.enableInitiationAIResponseFallback ?? false
      if (!enableFallback) {
        this.ctx.logger('xiuxian').error('AI 服务不可用，且未启用降级模式')
        throw new Error('AI服务不可用，且未启用降级模式。请联系管理员配置AI服务或开启降级模式。')
      }
      this.ctx.logger('xiuxian').warn('AI 服务未初始化，使用模拟响应')
      return this.getMockInitiationResponse(answers, selectedRoot)
    }

    try {
      this.ctx.logger('xiuxian').info('通过 ChatLuna 调用 AI（步入仙途 v1.0）')

      // 获取灵根信息
      const rootInfo = SPIRITUAL_ROOTS[selectedRoot]

      // 构建简化版 prompt - AI 只负责道号和评语
      const prompt =  `你是修仙世界的"天道判官",负责根据新入门修士的性格与灵根赐予【道号】与【评价】。
【修士回答】
第1题答案:${answers[0]}
第2题答案:${answers[1]}
第3题答案(开放题):${answers[2]}（开放性回答更能体现修士的内心）

【性格】
系统已量化分析修士性格：${personalityDesc}

【已分配灵根】
天道已定：${rootInfo.name}(${selectedRoot})
灵根特征：${rootInfo.description}

【你的任务】
1. **道号(daoName)**:
   - 2-4个汉字
   - 结合修士的回答和已分配的灵根
   - 避免使用常见俗套的名字

2. **性格评语(personality)**:
   - 50字以内,深入评价修士的性格和修仙潜力
   - 结合三个问题的回答，全面分析

3.生成“天道反馈(reason)”，必须严格按以下结构输出：

 1. 开头固定句式：
   经天鉴，该修士……
   - 接一段正面或中性的古风描述（必写）
   - 内容基于：性格 + 修士回答 + 灵根
   - 不得写负面，不得口语

 2. “但……”句（可省略）
   - 仅当第3题回答敷衍或有作弊倾向时加入
   - 只写一句轻微提醒，不得严厉
   - 若未触发条件，整句完全省略

 3. 道号宣告（必写）：
   赐予道号『{{daoName}}』！

 4. 祝福语（必写）：
   句式：愿道友……
   - 内容结合性格与灵根写一句积极、古风的祝福

整体要求：
- 古风、庄重、像天道宣旨
- 不可口语、可幽默、不可写表情

【额外规则 · 必须遵守】
- 不得修改灵根，不得提出灵根建议
- 所有输出必须由修士的回答推导
- 内容必须符合修仙世界观
- 必须返回 **纯 JSON**，不得多字

【返回格式】
{"daoName":"道号","personality":"性格评语","reason":"天道反馈"}`

      // 调用 AI 服务
      const response = await aiService.generate(prompt)
      if (response) {
        this.ctx.logger('xiuxian').info('AI 响应成功')
        return response
      }
    } catch (error) {
      this.ctx.logger('xiuxian').error('调用 ChatLuna 失败:', error)
    }

    // AI 调用失败，检查是否允许降级
    const enableFallback = this.pluginConfig?.enableInitiationAIResponseFallback ?? false
    if (!enableFallback) {
      this.ctx.logger('xiuxian').error('AI 调用失败，且未启用降级模式')
      throw new Error('AI调用失败，且未启用降级模式。请稍后重试或联系管理员开启降级模式。')
    }

    // 回退到模拟响应
    this.ctx.logger('xiuxian').warn('AI 调用失败，降级使用模拟响应')
    return this.getMockInitiationResponse(answers, selectedRoot)
  }

  /**
   * 调用 ChatLuna - 步入仙途 v2.0 模式（生成道号）
   *
   * v2.0 特点：基于 22 维性格评分生成道号
   */
  private async callChatLunaForDaoName(
    answers: string[],
    selectedRoot: SpiritualRootType,
    personality: any
  ): Promise<string> {
    // 反作弊检测
    this.detectCheating(answers)

    // 检查 AI 服务
    const aiService = this.ctx.xiuxianAI
    if (!aiService || !aiService.isAvailable()) {
      // ✨ v0.9.2 检查是否允许降级
      const enableFallback = this.pluginConfig?.enableInitiationAIResponseFallback ?? false
      if (!enableFallback) {
        this.ctx.logger('xiuxian').error('AI 服务不可用，且未启用降级模式')
        throw new Error('AI服务不可用，且未启用降级模式')
      }
      this.ctx.logger('xiuxian').warn('AI 服务未初始化，使用模拟响应')
      return this.getMockInitiationResponse(answers, selectedRoot)
    }

    try {
      this.ctx.logger('xiuxian').info('通过 ChatLuna 调用 AI（步入仙途 v2.0）')

      const rootInfo = SPIRITUAL_ROOTS[selectedRoot]

      // 生成性格描述（基于22维）
      const personalityDesc = this.generateV2PersonalityDesc(personality)

      const prompt = `你是修仙世界的天道判官，负责为新入门修士赐予道号。

【修士回答】
第1题：${answers[0]}
第2题：${answers[1]}
第3题：${answers[2]}

【性格分析（22维系统）】
${personalityDesc}

【已分配灵根】
天道已定：${rootInfo.name}（${selectedRoot}）
灵根特征：${rootInfo.description}

【你的任务】
生成一个深刻体现修士性格的道号（2-4个汉字），并提供评语和理由。

仅返回 JSON：
{"daoName":"道号","personality":"性格评语","reason":"分配理由"}`

      const response = await aiService.generate(prompt)
      if (response) {
        this.ctx.logger('xiuxian').info('AI 响应成功（v2.0）')
        return response
      }
    } catch (error) {
      this.ctx.logger('xiuxian').error('调用 ChatLuna 失败（v2.0）:', error)
    }

    // 降级
    const enableFallback = this.pluginConfig?.enableInitiationAIResponseFallback ?? false
    if (!enableFallback) {
      this.ctx.logger('xiuxian').error('AI 调用失败，且未启用降级模式')
      throw new Error('AI调用失败，且未启用降级模式')
    }

    this.ctx.logger('xiuxian').warn('降级使用模拟响应')
    return this.getMockInitiationResponse(answers, selectedRoot)
  }

  /**
   * 生成 v2.0 性格描述（基于 22 维）
   */
  private generateV2PersonalityDesc(personality: any): string {
    const traits: string[] = []

    // 核心特质
    if (personality.determination >= 7) traits.push('决断力强')
    if (personality.courage >= 7) traits.push('勇敢无畏')
    if (personality.patience >= 7) traits.push('耐心持久')
    if (personality.wisdom >= 7) traits.push('睿智通达')
    if (personality.compassion >= 7) traits.push('仁慈善良')

    // 道德倾向
    if (personality.righteousness >= 7) traits.push('正义凛然')
    if (personality.selflessness >= 7) traits.push('无私奉献')
    if (personality.greed >= 5) traits.push('欲望强烈')
    if (personality.ruthlessness >= 5) traits.push('行事冷酷')

    // 修炼风格
    if (personality.combat_oriented >= 7) traits.push('战斗型')
    if (personality.cultivation_focused >= 7) traits.push('修炼型')
    if (personality.knowledge_seeking >= 7) traits.push('求知型')

    return traits.length > 0 ? traits.join('、') : '性格平凡'
  }

  /**
   * 调用 ChatLuna - 试炼问心模式
   */
  private async callChatLunaForTrial(): Promise<string> {
    const aiService = this.ctx.xiuxianAI
    if (!aiService || !aiService.isAvailable()) {
      // ✨ v0.9.2 检查是否允许降级
      const enableFallback = this.pluginConfig?.enableAIEvaluationFallback ?? true
      if (!enableFallback) {
        this.ctx.logger('xiuxian').error('AI 服务不可用，且未启用降级模式')
        throw new Error('AI服务不可用，且未启用降级模式')
      }
      this.ctx.logger('xiuxian').warn('AI 服务未初始化，使用模拟响应')
      return this.getMockTrialResponse()
    }

    try {
      this.ctx.logger('xiuxian').info('通过 ChatLuna 调用 AI（试炼问心）')

      const prompt = `你是一个修仙世界的天道判官，负责评估修士的问心试炼。

请生成 JSON 响应：
1. personality（性格评语）：评价修士在试炼中展现的性格
2. tendency（问心倾向）：修士的修行倾向，如"智慧型"、"战斗型"等
3. reward（奖励）：包含 type（"cultivation"或"spiritStone"）和 value（数值，200-500）
4. reason（奖励原因）：说明为什么给予这个奖励

仅返回 JSON 对象。格式：
{"personality":"性格评语","tendency":"问心倾向","reward":{"type":"cultivation","value":300},"reason":"奖励原因"}`

      const response = await aiService.generate(prompt)
      if (response) {
        this.ctx.logger('xiuxian').info('AI 响应成功')
        return response
      }
    } catch (error) {
      this.ctx.logger('xiuxian').error('调用 ChatLuna 失败:', error)
    }

    // AI 调用失败，检查是否允许降级
    const enableFallback = this.pluginConfig?.enableAIEvaluationFallback ?? true
    if (!enableFallback) {
      this.ctx.logger('xiuxian').error('AI 调用失败，且未启用降级模式')
      throw new Error('AI调用失败，且未启用降级模式')
    }

    // 回退到模拟响应
    this.ctx.logger('xiuxian').warn('AI 调用失败，降级使用模拟响应')
    return this.getMockTrialResponse()
  }

  /**
   * 获取智能模拟步入仙途响应（根据回答生成）
   *
   * 注意：灵根由外部代码确定，这里只生成道号和评语
   */
  private getMockInitiationResponse(answers: string[], selectedRoot: SpiritualRootType): string {
    // 分析答案倾向
    const answer1 = (answers[0] || '').toUpperCase()
    const answer2 = (answers[1] || '').toUpperCase()
    const answer3 = answers[2] || ''

    // 获取灵根信息
    const rootInfo = SPIRITUAL_ROOTS[selectedRoot]

    // 根据第一个问题（对待垂危修士）判断性格
    let personality = ''
    let daoNamePrefix = ''
    let reason = ''

    if (answer1 === 'A') {
      // 全力救治 - 善良仁慈
      personality = '你心怀慈悲，见不得他人受苦，这份善念难能可贵。'
      daoNamePrefix = '慈'
      reason = `你的回答体现出慈悲为怀的本性，天道为你定下${rootInfo.name}。道号取"慈"字，彰显你的仁心。`
    } else if (answer1 === 'B') {
      // 希望回报 - 务实
      personality = '你懂得付出与回报的平衡，既有善心又不失分寸。'
      daoNamePrefix = '明'
      reason = `你懂得权衡利弊，如水般圆融智慧。天道为你定下${rootInfo.name}，道号取"明"字，寓意明智通达。`
    } else if (answer1 === 'C') {
      // 权衡利弊 - 谨慎
      personality = '你善于思考，不轻易做出决定，这是智者的表现。'
      daoNamePrefix = '玄'
      reason = `你行事稳重，深谋远虑。天道为你定下${rootInfo.name}，道号取"玄"字，寓意玄机深藏。`
    } else {
      // 夺宝而去 - 果决
      personality = '你深谙修仙界弱肉强食的法则，果敢决绝。'
      daoNamePrefix = '锋'
      reason = `你性格果决，如金铁般坚韧锐利。天道为你定下${rootInfo.name}，道号取"锋"字，寓意锋芒毕露。`
    }

    // 根据第二个问题（面对强敌）补充性格
    let daoNameSuffix = ''
    if (answer2 === 'A') {
      daoNameSuffix = '剑'
      personality += '面对强敌，你选择正面迎战，虽千万人吾往矣！'
    } else if (answer2 === 'B') {
      daoNameSuffix = '谋'
      personality += '你善用智谋，懂得借势借力，这是大智慧。'
    } else if (answer2 === 'C') {
      daoNameSuffix = '隐'
      personality += '你懂得隐忍蓄势，等待时机，终成大器。'
    } else {
      daoNameSuffix = '影'
      personality += '你懂得审时度势，能屈能伸，是为智者。'
    }

    // 生成道号（融合两个问题的倾向）
    const daoName = `${daoNamePrefix}${daoNameSuffix}`

    // 如果用户在第三题有特殊输入，可以进一步调整
    if (answer3.length > 5) {
      personality += ` 你的志向是"${answer3.substring(0, 20)}"，天道已知晓你的道心。`
    }

    // 注意：不返回 spiritualRoot，因为它由外部代码确定
    return JSON.stringify({
      daoName: daoName,
      personality: personality,
      reason: reason
    })
  }

  /**
   * 获取模拟试炼问心响应（用于测试）
   */
  private getMockTrialResponse(): string {
    return JSON.stringify({
      personality: '你的回答体现出对修仙本质的深刻理解，道心坚定，不为外物所动。',
      tendency: '智慧型修仙者',
      reward: {
        type: 'cultivation',
        value: 300
      },
      reason: '问心诚恳，天道有感，赐予修为奖励'
    })
  }

  /**
   * 解析步入仙途 AI 响应
   *
   * 注意：灵根由外部代码确定，AI 只负责道号和评语
   * 即使 AI 返回了灵根，也会被强制覆盖为代码确定的值
   */
  private parseInitiationResponse(response: string, selectedRoot: SpiritualRootType): InitiationAIResponse {
    try {
      // 提取 JSON 部分（可能有前后文字）
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('未找到 JSON 格式响应')
      }

      const parsed = JSON.parse(jsonMatch[0])

      // 验证必需字段（不再要求 spiritualRoot）
      if (!parsed.daoName || !parsed.personality || !parsed.reason) {
        throw new Error('AI 响应缺少必需字段')
      }

      // 强制使用代码确定的灵根
      this.ctx.logger('xiuxian').info(`✓ 灵根由代码控制：${selectedRoot}`)

      return {
        daoName: parsed.daoName,
        spiritualRoot: selectedRoot,  // 强制使用代码确定的灵根
        personality: parsed.personality,
        reason: parsed.reason
      }
    } catch (error) {
      this.ctx.logger('xiuxian').error('解析步入仙途 AI 响应失败:', error)
      return this.getDefaultInitiationResponse(selectedRoot)
    }
  }

  /**
   * 解析试炼问心 AI 响应
   */
  private parseTrialResponse(response: string): TrialAIResponse {
    try {
      // 提取 JSON 部分（可能有前后文字）
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('未找到 JSON 格式响应')
      }

      const parsed = JSON.parse(jsonMatch[0])

      // 验证必需字段
      if (!parsed.personality || !parsed.tendency || !parsed.reward || !parsed.reason) {
        throw new Error('AI 响应缺少必需字段')
      }

      return {
        personality: parsed.personality,
        tendency: parsed.tendency,
        reward: {
          type: parsed.reward.type,
          value: Number(parsed.reward.value)
        },
        reason: parsed.reason
      }
    } catch (error) {
      this.ctx.logger('xiuxian').error('解析试炼问心 AI 响应失败:', error)
      return this.getDefaultTrialResponse()
    }
  }

  /**
   * 获取默认步入仙途响应（发生错误时）
   *
   * 如果没有提供 selectedRoot，则使用公平性系统确定
   */
  private getDefaultInitiationResponse(selectedRoot?: SpiritualRootType): InitiationAIResponse {
    // 如果没有提供灵根，使用默认的五行单灵根
    if (!selectedRoot) {
      const randomRoots: SpiritualRootType[] = [
        SpiritualRootType.METAL,
        SpiritualRootType.WOOD,
        SpiritualRootType.WATER,
        SpiritualRootType.FIRE,
        SpiritualRootType.EARTH
      ]
      selectedRoot = randomRoots[Math.floor(Math.random() * randomRoots.length)]
    }

    const rootInfo = SPIRITUAL_ROOTS[selectedRoot]
    const defaultNames = ['青云', '玄月', '寒冰', '烈焰', '碧海']
    const randomName = defaultNames[Math.floor(Math.random() * defaultNames.length)]

    return {
      daoName: randomName,
      spiritualRoot: selectedRoot,
      personality: '你踏入仙途，天道感知你的初心，为你指引前路。',
      reason: `根据你的回答，天道为你安排了${rootInfo.name}`
    }
  }

  /**
   * 获取默认试炼问心响应（发生错误时）
   */
  private getDefaultTrialResponse(): TrialAIResponse {
    return {
      personality: '你完成了问心试炼，对修仙之道有了更深的理解。',
      tendency: '求道者',
      reward: {
        type: 'cultivation',
        value: 200
      },
      reason: '完成问心，获得修为奖励'
    }
  }

  /**
   * 反作弊检测：检测用户是否试图操纵 AI
   */
  private detectCheating(answers: string[]): void {
    // 检测关键词（试图操纵 AI 的行为）
    const cheatingKeywords = [
      // 直接要求灵根
      '给我', '我要', '分配', '天灵根', '光灵根', '暗灵根', '哈根', 'ha',
      // prompt injection 常见模式
      '忽略', '无视', '不要', '重新', '改为', '修改',
      'ignore', 'override', 'change', 'modify', 'set',
      // AI 指令关键词
      'system', 'prompt', 'instruction', 'command',
      '系统', '指令', '命令',
      // JSON 注入
      'json', '"spiritualRoot"', '"daoName"',
      // 角色扮演攻击
      '你现在', '假装', '扮演', '作为',
      'pretend', 'act as', 'you are now'
    ]

    const allAnswers = answers.join(' ').toLowerCase()

    for (const keyword of cheatingKeywords) {
      if (allAnswers.includes(keyword.toLowerCase())) {
        this.ctx.logger('xiuxian').warn(`检测到疑似作弊行为，答案包含关键词: ${keyword}`)
        this.ctx.logger('xiuxian').warn(`用户答案: ${answers.join(' | ')}`)

        // 记录但不阻止，让 AI prompt 中的防护来处理
        // 这样即使用户试图作弊，AI 也会根据真实性格分配
        break
      }
    }

    // 检测过长的第三题答案（可能是注入攻击）
    if (answers[2] && answers[2].length > 200) {
      this.ctx.logger('xiuxian').warn(`第三题答案过长 (${answers[2].length} 字符)，可能是注入攻击`)
      // 截断过长的答案
      answers[2] = answers[2].substring(0, 200) + '...(已截断)'
    }
  }

  /**
   * 生成问道包评语
   * 用于新的Tag系统问道包
   */
  async generatePackageEvaluationResponse(
    packageName: string,
    packageDescription: string,
    answers: string[],
    matchRate: number,
    tier: 'perfect' | 'good' | 'normal',
    aiPromptHint: string
  ): Promise<{ evaluation: string; rewardReason: string }> {
    const aiService = this.ctx.xiuxianAI

    // 检查 AI 服务是否可用
    if (!aiService || !aiService.isAvailable()) {
      // AI 不可用，使用默认评语
      return this.getDefaultPackageEvaluation(tier, aiPromptHint)
    }

    try {
      const tierText = tier === 'perfect' ? '完美契合' : tier === 'good' ? '良好匹配' : '普通匹配'

      const prompt = `你是修仙世界的天道评判者，需要根据修士在"${packageName}"中的表现给出评语。

【问道包描述】
${packageDescription}

【修士回答】
${answers.map((a, i) => `第${i + 1}题：${a || '未回答'}`).join('\n')}

【匹配结果】
匹配度：${matchRate.toFixed(1)}%
等级：${tierText}
评语提示：${aiPromptHint}

【你的任务】
生成两段评语：
1. evaluation: 对修士此次问道表现的评价（50字以内，要有修仙风格）
2. rewardReason: 解释为何获得此等奖励（30字以内）

仅返回JSON格式：
{"evaluation":"评语内容","rewardReason":"奖励原因"}`

      const response = await aiService.generate(prompt)

      // 检查响应是否为空
      if (!response) {
        this.ctx.logger('xiuxian').warn('AI返回空响应，使用默认评语')
        return this.getDefaultPackageEvaluation(tier, aiPromptHint)
      }

      // 解析响应
      const parsed = JSON.parse(response) as { evaluation?: string; rewardReason?: string }
      return {
        evaluation: parsed.evaluation || '问道完成',
        rewardReason: parsed.rewardReason || '完成问道'
      }
    } catch (error) {
      this.ctx.logger('xiuxian').warn('问道包AI评语生成失败，使用默认评语')
      return this.getDefaultPackageEvaluation(tier, aiPromptHint)
    }
  }

  /**
   * 获取默认问道包评语
   */
  private getDefaultPackageEvaluation(
    tier: 'perfect' | 'good' | 'normal',
    aiPromptHint: string
  ): { evaluation: string; rewardReason: string } {
    const evaluations = {
      perfect: '你的心性与此机缘完美契合，天道为之侧目！',
      good: '你的表现尚可，虽有不足，但已有所得。',
      normal: '此次机缘与你尚有距离，需继续修行。'
    }

    return {
      evaluation: evaluations[tier],
      rewardReason: aiPromptHint || '完成问道'
    }
  }
}
