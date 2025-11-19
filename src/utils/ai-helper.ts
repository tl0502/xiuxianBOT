import { Context } from 'koishi'
import { InitiationAIResponse, TrialAIResponse } from '../config/questioning'
import { Player } from '../types/player'
import { SpiritualRootType } from '../config/spiritual-roots'

/**
 * AI 辅助工具类
 */
export class AIHelper {
  constructor(private ctx: Context) {}

  /**
   * 调用 ChatLuna 生成步入仙途评估（分配道号和灵根）
   */
  async generateInitiationResponse(
    _pathName: string,
    _pathDescription: string,
    _questions: string[],
    answers: string[]
  ): Promise<InitiationAIResponse> {
    try {
      this.ctx.logger('xiuxian').info('调用 AI 评估步入仙途...')

      // 调用 ChatLuna（当前使用智能模拟响应）
      const response = await this.callChatLunaForInitiation(answers)

      // 解析 JSON 响应
      const result = this.parseInitiationResponse(response)

      return result
    } catch (error) {
      this.ctx.logger('xiuxian').error('AI 评估失败:', error)

      // 检查是否允许降级
      const aiService = this.ctx.xiuxianAI
      if (!aiService?.isFallbackEnabled()) {
        // 不允许降级，重新抛出错误
        throw error
      }

      // 允许降级，返回默认响应
      this.ctx.logger('xiuxian').warn('使用默认响应作为降级方案')
      return this.getDefaultInitiationResponse()
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

      // 检查是否允许降级
      const aiService = this.ctx.xiuxianAI
      if (!aiService?.isFallbackEnabled()) {
        // 不允许降级，重新抛出错误
        throw error
      }

      // 允许降级，返回默认奖励
      this.ctx.logger('xiuxian').warn('使用默认响应作为降级方案')
      return this.getDefaultTrialResponse()
    }
  }

  /**
   * 调用 ChatLuna - 步入仙途模式
   */
  private async callChatLunaForInitiation(answers: string[]): Promise<string> {
    // 检查 xiuxianAI 服务是否可用
    const aiService = this.ctx.xiuxianAI
    if (!aiService || !aiService.isAvailable()) {
      // 检查是否允许降级
      if (!aiService?.isFallbackEnabled()) {
        this.ctx.logger('xiuxian').error('AI 服务不可用，且未启用模拟降级')
        throw new Error('AI 服务不可用，请联系管理员配置 ChatLuna 或启用模拟降级')
      }
      this.ctx.logger('xiuxian').warn('AI 服务未初始化，使用模拟响应')
      return this.getMockInitiationResponse(answers)
    }

    try {
      this.ctx.logger('xiuxian').info('通过 ChatLuna 调用 AI（步入仙途）')

      // 构建 prompt
      const prompt = `你是一个修仙世界的天道判官，负责为新入门的修士分配道号和灵根。

请根据以下回答生成 JSON 响应：
第1题答案：${answers[0]}
第2题答案：${answers[1]}
第3题答案（开放题）：${answers[2]}

要求：
1. daoName（道号）：2-4个汉字，要体现修士的性格特点
2. spiritualRoot（灵根类型）：从以下选择一个：light, dark, metal, wood, water, fire, earth, qi, pseudo, ha
3. personality（性格评语）：50字以内，评价修士的性格和潜力
4. reason（分配理由）：50字以内，说明为什么分配这个道号和灵根

仅返回 JSON 对象，不要添加任何其他说明。格式：
{"daoName":"道号","spiritualRoot":"灵根类型","personality":"性格评语","reason":"分配理由"}`

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
    if (!aiService.isFallbackEnabled()) {
      this.ctx.logger('xiuxian').error('AI 调用失败，且未启用模拟降级')
      throw new Error('AI 调用失败，请稍后重试或联系管理员')
    }

    // 回退到模拟响应
    this.ctx.logger('xiuxian').warn('AI 调用失败，降级使用模拟响应')
    return this.getMockInitiationResponse(answers)
  }

  /**
   * 调用 ChatLuna - 试炼问心模式
   */
  private async callChatLunaForTrial(): Promise<string> {
    const aiService = this.ctx.xiuxianAI
    if (!aiService || !aiService.isAvailable()) {
      // 检查是否允许降级
      if (!aiService?.isFallbackEnabled()) {
        this.ctx.logger('xiuxian').error('AI 服务不可用，且未启用模拟降级')
        throw new Error('AI 服务不可用，请联系管理员配置 ChatLuna 或启用模拟降级')
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
    if (!aiService.isFallbackEnabled()) {
      this.ctx.logger('xiuxian').error('AI 调用失败，且未启用模拟降级')
      throw new Error('AI 调用失败，请稍后重试或联系管理员')
    }

    // 回退到模拟响应
    this.ctx.logger('xiuxian').warn('AI 调用失败，降级使用模拟响应')
    return this.getMockTrialResponse()
  }

  /**
   * 获取智能模拟步入仙途响应（根据回答生成）
   */
  private getMockInitiationResponse(answers: string[]): string {
    // 分析答案倾向
    const answer1 = (answers[0] || '').toUpperCase()
    const answer2 = (answers[1] || '').toUpperCase()
    const answer3 = answers[2] || ''

    // 根据第一个问题（对待垂危修士）判断性格
    let personality = ''
    let rootType: SpiritualRootType
    let daoNamePrefix = ''
    let reason = ''

    if (answer1 === 'A') {
      // 全力救治 - 善良仁慈
      personality = '你心怀慈悲，见不得他人受苦，这份善念难能可贵。'
      rootType = SpiritualRootType.WOOD // 木灵根 - 生机、仁慈
      daoNamePrefix = '慈'
      reason = '你的回答体现出慈悲为怀的本性，木灵根最为契合。道号取"慈"字，彰显你的仁心。'
    } else if (answer1 === 'B') {
      // 希望回报 - 务实
      personality = '你懂得付出与回报的平衡，既有善心又不失分寸。'
      rootType = SpiritualRootType.WATER // 水灵根 - 灵活、智慧
      daoNamePrefix = '明'
      reason = '你懂得权衡利弊，如水般圆融智慧。水灵根最适合你，道号取"明"字，寓意明智通达。'
    } else if (answer1 === 'C') {
      // 权衡利弊 - 谨慎
      personality = '你善于思考，不轻易做出决定，这是智者的表现。'
      rootType = SpiritualRootType.EARTH // 土灵根 - 沉稳、厚重
      daoNamePrefix = '玄'
      reason = '你行事稳重，深谋远虑，土灵根的厚重最契合你的性格。道号取"玄"字，寓意玄机深藏。'
    } else {
      // 夺宝而去 - 果决
      personality = '你深谙修仙界弱肉强食的法则，果敢决绝。'
      rootType = SpiritualRootType.METAL // 金灵根 - 果断、锐利
      daoNamePrefix = '锋'
      reason = '你性格果决，如金铁般坚韧锐利。金灵根最适合你，道号取"锋"字，寓意锋芒毕露。'
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

    return JSON.stringify({
      daoName: daoName,
      spiritualRoot: rootType,
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
   */
  private parseInitiationResponse(response: string): InitiationAIResponse {
    try {
      // 提取 JSON 部分（可能有前后文字）
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('未找到 JSON 格式响应')
      }

      const parsed = JSON.parse(jsonMatch[0])

      // 验证必需字段
      if (!parsed.daoName || !parsed.spiritualRoot || !parsed.personality || !parsed.reason) {
        throw new Error('AI 响应缺少必需字段')
      }

      // 验证灵根是否有效
      const validRoots = ['light', 'dark', 'metal', 'wood', 'water', 'fire', 'earth', 'qi', 'pseudo', 'ha']
      if (!validRoots.includes(parsed.spiritualRoot)) {
        this.ctx.logger('xiuxian').warn(`AI 返回了无效的灵根: ${parsed.spiritualRoot}，使用默认值 pseudo`)
        parsed.spiritualRoot = SpiritualRootType.PSEUDO
      }

      return {
        daoName: parsed.daoName,
        spiritualRoot: parsed.spiritualRoot,
        personality: parsed.personality,
        reason: parsed.reason
      }
    } catch (error) {
      this.ctx.logger('xiuxian').error('解析步入仙途 AI 响应失败:', error)
      return this.getDefaultInitiationResponse()
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
   */
  private getDefaultInitiationResponse(): InitiationAIResponse {
    const randomRoots: SpiritualRootType[] = [
      SpiritualRootType.METAL,
      SpiritualRootType.WOOD,
      SpiritualRootType.WATER,
      SpiritualRootType.FIRE,
      SpiritualRootType.EARTH
    ]
    const randomRoot = randomRoots[Math.floor(Math.random() * randomRoots.length)]

    const defaultNames = ['青云', '玄月', '寒冰', '烈焰', '碧海']
    const randomName = defaultNames[Math.floor(Math.random() * defaultNames.length)]

    return {
      daoName: randomName,
      spiritualRoot: randomRoot,
      personality: '你踏入仙途，天道感知你的初心，为你指引前路。',
      reason: '根据你的回答，天道为你安排了合适的灵根'
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
}
