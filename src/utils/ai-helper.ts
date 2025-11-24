import { Context } from 'koishi'
import { InitiationAIResponse } from '../types/ai-response'
import { SpiritualRootType, SPIRITUAL_ROOTS } from '../config/spiritual-roots'
import { FateCalculator } from './fate-calculator'
import { getPersonalityDescription, PersonalityScore } from './personality-analyzer'
import { AIConfig } from '../config/constants'

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
   * v1.3.1 更新：必须接收外部传入的性格分数（配置化评分）
   */
  async generateInitiationResponse(
    _pathName: string,
    _pathDescription: string,
    _questions: string[],
    answers: string[],
    personalityScore: PersonalityScore  // v1.3.1: 必须传入性格分数
  ): Promise<InitiationAIResponse> {
    try {
      // v1.3.1: 使用外部传入的配置化性格分数
      this.ctx.logger('xiuxian').info('使用 9维性格量化系统（配置化评分）')
      return await this.generateInitiationResponseV1(answers, personalityScore)
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
   * v1.3.1 更新：必须接收外部传入的性格分数（配置化评分）
   */
  private async generateInitiationResponseV1(
    answers: string[],
    personalityScore: PersonalityScore  // v1.3.1: 必须传入性格分数
  ): Promise<InitiationAIResponse> {
    this.ctx.logger('xiuxian').info('调用 AI 评估步入仙途...')
    this.ctx.logger('xiuxian').info('=== 公平性系统：代码控制灵根分配（v1.3.1）===')

    // 【第1步】使用外部传入的配置化评分结果
    const personality = personalityScore
    const personalityDesc = getPersonalityDescription(personality)
    this.ctx.logger('xiuxian').info(`性格分析完成（配置化评分）：${personalityDesc}`)

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

      // v1.3.0: 动态生成修士回答部分
      const answersSection = answers
        .map((a, i) => {
          const isLast = i === answers.length - 1
          return isLast
            ? `第${i + 1}题答案(开放题):${a}（开放性回答更能体现修士的内心）`
            : `第${i + 1}题答案:${a}`
        })
        .join('\n')

      // 构建简化版 prompt - AI 只负责道号和评语
      const prompt =  `你是修仙世界的天道判官，负责根据修士三题回答与已分配灵根生成【道号】、【性格评语】和【天道反馈】。输出必须严格遵循 JSON。

【输入】
修士回答：
${answersSection}

量化性格：
${personalityDesc}

已分配灵根：
${rootInfo.name}(${selectedRoot})
特征：${rootInfo.description}

【评分规则】
1. 内容分析
- 严格基于回答和性格分，不允许脑补、夸大或补全未出现动机
- 对低俗、脏话或无意义回答直接标记为“异常/敷衍”
- 对敷衍/异常回答，道号可使用中性占位名（例子:『草木』『未知』等中性道号。），天道反馈给出警示性提示

2. 道号 (daoName)
- 2~4个汉字
- 与回答及灵根特征紧密关联
- 不使用俗套、重复、无意义词
- 异常回答使用安全中性道号

3. 性格评语 (personality)
- ≤50字
- 严格基于回答和性格分
- 可正面或中性，不夸奖潜力、不幽默、不口语
- 异常回答可提示谨慎或待端正

4. 天道反馈 (reason)
- 开头：经天鉴，该修士……
- 分析回答及性格特征
- 异常回答可加入轻微提醒，如“言辞不当，修炼之志尚待端正”
- 宣告道号：赐予道号『(daoName)』！
- 祝福语：愿道友……（可中性或温和，不强制积极，结合灵根特征或性格）
- 输出古风，无表情，无口语

【输出格式】
{
  "daoName": "道号",
  "personality": "性格评语（≤50字，基于回答）",
  "reason": "经天鉴，该修士……[正面或中性描述][(可选)提醒][赐予道号『daoName』][祝福语]"
}`

      // 调用 AI 服务
      const response = await aiService.generate(prompt, AIConfig.INITIATION_AI_TIMEOUT)
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
}
