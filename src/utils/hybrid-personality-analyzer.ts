/**
 * 混合性格分析器
 *
 * 结合选择题规则评分和AI开放题评分
 * v0.6.0 新增
 */

import { Context } from 'koishi'
import { PersonalityScore, analyzePersonality } from './personality-analyzer'
import { AIOpenQuestionScorer, AIOpenQuestionScore } from './ai-open-question-scorer'
import { Question } from '../types/path-package'
import { AIConfig } from '../config/constants'

/**
 * 混合分析结果
 */
export interface HybridAnalysisResult {
  finalScore: PersonalityScore        // 最终综合分数
  choiceScore: PersonalityScore       // 选择题贡献的分数
  aiScores?: AIOpenQuestionScore[]    // AI评估每个开放题的分数
  aiReasoning?: string                 // AI评分理由（合并）
  usedAI: boolean                      // 是否使用了AI
  openQuestionIndices?: number[]       // 哪些题是开放题
  // v1.3.1 新增：降级时反作弊检测结果
  exploitDetected?: {
    isExploit: boolean
    reason: string
    severity: 'low' | 'high'
  }
}

/**
 * 混合分析选项
 */
export interface HybridAnalysisOptions {
  requiresAI?: boolean                 // 是否需要AI评分开放题
  enableFallback?: boolean             // AI失败时是否降级
  maxScorePerDimension?: number        // AI单维度最多给多少分
  minScorePerDimension?: number        // AI单维度最少给多少分
  openQuestionIndices?: number[]       // 明确指定哪些题是开放题（可选）
}

/**
 * 混合性格分析器
 */
export class HybridPersonalityAnalyzer {
  private aiScorer: AIOpenQuestionScorer

  constructor(private ctx: Context) {
    this.aiScorer = new AIOpenQuestionScorer(ctx)
  }

  /**
   * 混合分析：选择题规则 + AI评估开放题
   */
  async analyze(
    answers: string[],
    questions: Question[],
    options?: HybridAnalysisOptions,
    weights?: { choiceWeight: number; openWeight: number }
  ): Promise<HybridAnalysisResult> {
    // 1. 先用规则分析选择题
    const choiceScore = this.analyzeChoiceQuestions(answers, questions)

    // 2. 识别开放题
    const openQuestionIndices = options?.openQuestionIndices ??
      questions.map((q, i) => q.type === 'text' ? i : -1).filter(i => i !== -1)

    if (openQuestionIndices.length === 0) {
      // 没有开放题，直接返回选择题分数
      return {
        finalScore: choiceScore,
        choiceScore: choiceScore,
        usedAI: false
      }
    }

    if (!options?.requiresAI) {
      // 不需要AI，检查是否允许使用规则评分
      if (!options?.enableFallback) {
        this.ctx.logger('xiuxian').error('AI评分已禁用，且未启用规则评分降级')
        throw new Error('AI评分已禁用，且未启用降级模式。请联系管理员启用AI评分或开启降级模式。')
      }
      // v1.3.1：降级时进行反作弊检测
      for (const index of openQuestionIndices) {
        const answer = answers[index]
        if (answer && answer.trim().length > 0) {
          const detect = this.detectExploitation(answer)
          if (detect.isExploit) {
            this.ctx.logger('xiuxian').warn(`[降级反作弊] 检测到作弊: ${detect.reason}`)
            return {
              finalScore: choiceScore,
              choiceScore: choiceScore,
              usedAI: false,
              exploitDetected: detect
            }
          }
        }
      }
      // 允许降级，使用选择题分数
      return {
        finalScore: choiceScore,
        choiceScore: choiceScore,
        usedAI: false
      }
    }

    // 3. 使用AI评估所有开放题
    const aiScores: AIOpenQuestionScore[] = []
    let usedAI = false

    try {
      // 获取前面的选择题答案（用于一致性检查）
      const firstOpenQuestionIndex = Math.min(...openQuestionIndices)
      const previousAnswers = answers.slice(0, firstOpenQuestionIndex)

      // 评估每个开放题
      for (const index of openQuestionIndices) {
        const question = questions[index]
        const answer = answers[index]

        if (!answer || answer.trim().length === 0) {
          // 空答案，跳过
          continue
        }

        const aiResult = await this.aiScorer.scoreOpenQuestion(
          question.question,
          answer,
          {
            aiHint: question.aiHint,
            previousAnswers,
            enableFallback: options.enableFallback,
            maxScore: options.maxScorePerDimension ?? AIConfig.MAX_SCORE_PER_DIMENSION,
            minScore: options.minScorePerDimension ?? AIConfig.MIN_SCORE_PER_DIMENSION
          }
        )

        aiScores.push(aiResult)
        usedAI = true
      }

    } catch (error) {
      this.ctx.logger('xiuxian').error('AI评分失败:', error)

      if (!options?.enableFallback) {
        throw error  // 不允许降级，抛出错误
      }

      // v1.3.1：降级时进行反作弊检测
      for (const index of openQuestionIndices) {
        const answer = answers[index]
        if (answer && answer.trim().length > 0) {
          const detect = this.detectExploitation(answer)
          if (detect.isExploit) {
            this.ctx.logger('xiuxian').warn(`[降级反作弊] 检测到作弊: ${detect.reason}`)
            return {
              finalScore: choiceScore,
              choiceScore: choiceScore,
              usedAI: false,
              exploitDetected: detect
            }
          }
        }
      }

      // 允许降级，只使用选择题分数
      return {
        finalScore: choiceScore,
        choiceScore: choiceScore,
        usedAI: false
      }
    }

    // 4. 合并分数（传递权重）
    const finalScore = this.mergeScores(choiceScore, aiScores.map(s => s.personality), weights)

    // 5. 合并AI评分理由
    const aiReasoning = aiScores
      .map(s => s.reasoning)
      .filter(r => r)
      .join('；')

    return {
      finalScore,
      choiceScore,
      aiScores,
      aiReasoning: aiReasoning || undefined,
      usedAI,
      openQuestionIndices
    }
  }

  /**
   * 分析选择题（使用现有规则）
   */
  private analyzeChoiceQuestions(
    answers: string[],
    questions: Question[]
  ): PersonalityScore {
    const score: PersonalityScore = {
      determination: 0,
      courage: 0,
      stability: 0,
      focus: 0,
      honesty: 0,
      kindness: 0,
      greed: 0,
      impatience: 0,
      manipulation: 0
    }

    // 遍历每个问题
    for (let i = 0; i < questions.length && i < answers.length; i++) {
      const question = questions[i]

      // 只处理选择题
      if (question.type !== 'choice' || !question.options) {
        continue
      }

      const answer = answers[i]?.trim().toUpperCase()
      if (!answer) continue

      // 根据问题ID和答案应用规则
      // 这里使用简化的规则，实际可以根据question.id定制
      this.applyChoiceRules(score, i, answer, question)
    }

    return score
  }

  /**
   * 应用选择题规则
   * v1.3.0 重构：从question.options[x].value对象中读取分数
   */
  private applyChoiceRules(
    score: PersonalityScore,
    questionIndex: number,
    answer: string,
    question: Question
  ): void {
    // v1.3.0: 直接从选项的value对象读取分数
    if (!question.options || question.options.length === 0) {
      return
    }

    // 计算选项索引（A=0, B=1, C=2, D=3...）
    const optionIndex = answer.charCodeAt(0) - 65
    if (optionIndex < 0 || optionIndex >= question.options.length) {
      this.ctx.logger('xiuxian').warn(`无效的选项索引: ${answer} (问题${questionIndex + 1})`)
      return
    }

    const selectedOption = question.options[optionIndex]
    if (!selectedOption || !selectedOption.value) {
      this.ctx.logger('xiuxian').warn(`选项${answer}没有value配置 (问题${questionIndex + 1})`)
      return
    }

    // 应用value对象中的分数到总分
    for (const dimension in selectedOption.value) {
      const key = dimension as keyof PersonalityScore
      const value = selectedOption.value[key]
      if (typeof value === 'number') {
        score[key] += value
      }
    }

    this.ctx.logger('xiuxian').debug(`问题${questionIndex + 1}选项${answer}: ${JSON.stringify(selectedOption.value)}`)
  }

  /**
   * 合并选择题分数和AI开放题分数（使用加权平均）
   *
   * v0.8.2 改进：从简单加法改为加权平均算法
   * - 选择题权重默认30%
   * - 开放题权重默认70%
   * - 权重可通过包模板自定义配置
   */
  private mergeScores(
    choiceScore: PersonalityScore,
    aiScores: PersonalityScore[],
    weights?: { choiceWeight: number; openWeight: number }
  ): PersonalityScore {
    // 默认权重（优先使用自定义权重，其次使用全局配置）
    const choiceWeight = weights?.choiceWeight ?? AIConfig.CHOICE_QUESTION_WEIGHT
    const openWeight = weights?.openWeight ?? AIConfig.OPEN_QUESTION_WEIGHT

    // 计算AI平均分（多个开放题的平均值）
    const avgAI = this.averageScores(aiScores)

    // 加权平均（替代原来的简单加法）
    const merged: PersonalityScore = {
      determination: 0,
      courage: 0,
      stability: 0,
      focus: 0,
      honesty: 0,
      kindness: 0,
      greed: 0,
      impatience: 0,
      manipulation: 0
    }

    for (const key in choiceScore) {
      const k = key as keyof PersonalityScore
      merged[k] = choiceScore[k] * choiceWeight + avgAI[k] * openWeight
      // 限制在0-10范围
      merged[k] = Math.max(0, Math.min(10, merged[k]))
    }

    return merged
  }

  /**
   * 计算多个AI分数的平均值
   */
  private averageScores(scores: PersonalityScore[]): PersonalityScore {
    if (scores.length === 0) {
      return {
        determination: 0,
        courage: 0,
        stability: 0,
        focus: 0,
        honesty: 0,
        kindness: 0,
        greed: 0,
        impatience: 0,
        manipulation: 0
      }
    }

    const avg: PersonalityScore = {
      determination: 0,
      courage: 0,
      stability: 0,
      focus: 0,
      honesty: 0,
      kindness: 0,
      greed: 0,
      impatience: 0,
      manipulation: 0
    }

    for (const score of scores) {
      for (const key in score) {
        const k = key as keyof PersonalityScore
        avg[k] = (avg[k] || 0) + (score[k] || 0)
      }
    }

    // 计算平均值
    for (const key in avg) {
      const k = key as keyof PersonalityScore
      avg[k] /= scores.length
    }

    return avg
  }

  /**
   * 简单加法合并分数（向后兼容，用于步入仙途INITIATION）
   *
   * ⚠️ 重要：此方法保持原有的简单加法逻辑，不使用加权平均
   * 原因：灵根分配系统的公平性算法依赖于特定的分数分布
   * 如果改变评分算法，会破坏灵根概率的统计平衡
   *
   * 仅用于 analyzeInitiation()，普通问道包使用 mergeScores()
   */
  private mergeScoresSimple(
    choiceScore: PersonalityScore,
    aiScores: PersonalityScore[]
  ): PersonalityScore {
    const merged: PersonalityScore = { ...choiceScore }

    // 累加所有AI评分（原有逻辑）
    for (const aiScore of aiScores) {
      for (const key in aiScore) {
        const k = key as keyof PersonalityScore
        merged[k] = (merged[k] || 0) + (aiScore[k] || 0)
      }
    }

    // 归一化到0-10
    for (const key in merged) {
      const k = key as keyof PersonalityScore
      merged[k] = Math.max(0, Math.min(10, merged[k]))
    }

    return merged
  }

  /**
   * 简化版：仅分析前2题选择题 + 第3题开放题（向后兼容）
   */
  async analyzeThreeQuestions(
    answers: [string, string, string],
    questions: [Question, Question, Question],
    options?: HybridAnalysisOptions
  ): Promise<HybridAnalysisResult> {
    return this.analyze(answers, questions, {
      ...options,
      openQuestionIndices: questions[2].type === 'text' ? [2] : []
    })
  }

  /**
   * 获取性格描述
   */
  getPersonalityDescription(score: PersonalityScore): string {
    const traits: string[] = []

    // 正面特征（>=5 才显著）
    if (score.courage >= 5) traits.push('勇敢')
    if (score.kindness >= 5) traits.push('善良')
    if (score.determination >= 5) traits.push('果决')
    if (score.stability >= 5) traits.push('稳重')
    if (score.focus >= 5) traits.push('专注')
    if (score.honesty >= 5) traits.push('诚实')

    // 负面特征（>=3 就显著）
    if (score.greed >= 3) traits.push('贪婪')
    if (score.impatience >= 3) traits.push('急躁')
    if (score.manipulation >= 3) traits.push('狡诈')

    return traits.length > 0 ? traits.join('、') : '平凡'
  }

  /**
   * ✨ v0.7.0 新增：INITIATION 专用分析
   * ✨ v1.3.1 更新：使用配置化评分方法
   *
   * 与问道包AI评分的关键区别：
   * 1. 选择题使用配置化的value对象评分（v1.3.1起）
   * 2. 开放题使用客观、无偏向的AI评分
   * 3. 总是允许降级（不能阻止创角流程）
   *
   * @param answers 用户的3个回答 [A, B, "开放文本"]
   * @param questions 问道包的问题配置（用于读取value对象）
   * @param enableAI 是否启用AI评分开放题
   * @param enableFallback AI失败时是否降级（建议true）
   * @returns 混合分析结果
   */
  async analyzeInitiation(
    answers: string[],
    questions: Question[],
    enableAI: boolean = true,
    enableFallback: boolean = true
  ): Promise<HybridAnalysisResult> {
    this.ctx.logger('xiuxian').info('=== INITIATION 混合分析开始 ===')
    this.ctx.logger('xiuxian').info(`AI评分: ${enableAI ? '启用' : '禁用'}, 降级: ${enableFallback ? '允许' : '禁止'}`)

    try {
      // 1. 使用 personality-analyzer.ts 分析所有3题（包含关键词评分开放题）
      const baselineScore = analyzePersonality(answers)
      this.ctx.logger('xiuxian').debug('基准分数（规则+关键词）:', JSON.stringify(baselineScore))

      // 2. 如果不启用AI，检查是否允许使用关键词评分
      if (!enableAI) {
        if (!enableFallback) {
          this.ctx.logger('xiuxian').error('AI评分已禁用，且未启用关键词评分降级')
          throw new Error('AI评分已禁用，且未启用降级模式。请联系管理员启用AI评分或开启降级模式。')
        }
        // v1.3.1：降级时进行反作弊检测
        const openQuestionAnswer = answers[2]
        if (openQuestionAnswer && openQuestionAnswer.trim().length > 0) {
          const detect = this.detectExploitation(openQuestionAnswer)
          if (detect.isExploit) {
            this.ctx.logger('xiuxian').warn(`[INITIATION降级反作弊] 检测到作弊: ${detect.reason}`)
            return {
              finalScore: baselineScore,
              choiceScore: baselineScore,
              usedAI: false,
              exploitDetected: detect
            }
          }
        }
        this.ctx.logger('xiuxian').info('AI评分未启用，使用关键词评分')
        return {
          finalScore: baselineScore,
          choiceScore: baselineScore,
          usedAI: false
        }
      }

      // 3. AI评分开放题（第3题）
      const openQuestionAnswer = answers[2]
      if (!openQuestionAnswer || openQuestionAnswer.trim().length === 0) {
        this.ctx.logger('xiuxian').warn('第3题答案为空，使用关键词评分')
        return {
          finalScore: baselineScore,
          choiceScore: baselineScore,
          usedAI: false
        }
      }

      // 4. 调用AI评分（使用INITIATION专用Prompt）
      this.ctx.logger('xiuxian').info('调用AI客观评分第3题...')
      const aiResult = await this.aiScorer.scoreInitiationOpenQuestion(
        openQuestionAnswer,
        answers.slice(0, 2),  // 前2题答案（用于一致性检查）
        {
          enableFallback,
          maxScore: 5,    // INITIATION 评分范围更保守
          minScore: -3
        }
      )

      // 5. 重新计算最终分数：选择题（第1-2题配置化评分）+ AI开放题评分
      // 注意：baselineScore 包含了关键词评分的第3题，需要分离
      const choiceOnlyScore = this.extractChoiceScore(answers, questions)

      // ⚠️ INITIATION 使用简单加法保持向后兼容（灵根分配公平性依赖）
      // 不使用加权平均，因为会改变分数分布，影响灵根概率
      const finalScore = this.mergeScoresSimple(choiceOnlyScore, [aiResult.personality])

      this.ctx.logger('xiuxian').info('AI评分成功')
      this.ctx.logger('xiuxian').debug('选择题分数:', JSON.stringify(choiceOnlyScore))
      this.ctx.logger('xiuxian').debug('AI开放题分数:', JSON.stringify(aiResult.personality))
      this.ctx.logger('xiuxian').debug('最终分数:', JSON.stringify(finalScore))

      return {
        finalScore,
        choiceScore: choiceOnlyScore,
        aiScores: [aiResult],
        aiReasoning: aiResult.reasoning,
        usedAI: true,
        openQuestionIndices: [2]
      }

    } catch (error) {
      this.ctx.logger('xiuxian').error('INITIATION AI评分失败:', error)

      // 检查是否允许降级
      if (!enableFallback) {
        this.ctx.logger('xiuxian').error('不允许降级，抛出错误')
        throw error
      }

      // v1.3.1：降级时进行反作弊检测
      const openAnswer = answers[2]
      if (openAnswer && openAnswer.trim().length > 0) {
        const detect = this.detectExploitation(openAnswer)
        if (detect.isExploit) {
          this.ctx.logger('xiuxian').warn(`[INITIATION降级反作弊] 检测到作弊: ${detect.reason}`)
          const fallbackScore = analyzePersonality(answers)
          return {
            finalScore: fallbackScore,
            choiceScore: fallbackScore,
            usedAI: false,
            exploitDetected: detect
          }
        }
      }

      // 降级到关键词评分
      this.ctx.logger('xiuxian').warn('降级使用关键词评分')
      const fallbackScore = analyzePersonality(answers)

      return {
        finalScore: fallbackScore,
        choiceScore: fallbackScore,
        usedAI: false
      }
    }
  }

  /**
   * 提取选择题分数（仅第1-2题，不含第3题开放题）
   * v1.3.1 重构：使用配置化评分方法而非硬编码规则
   */
  private extractChoiceScore(answers: string[], questions: Question[]): PersonalityScore {
    const score: PersonalityScore = {
      determination: 0,
      courage: 0,
      stability: 0,
      focus: 0,
      honesty: 0,
      kindness: 0,
      greed: 0,
      impatience: 0,
      manipulation: 0
    }

    // 只处理前2题（选择题）
    for (let i = 0; i < 2 && i < questions.length && i < answers.length; i++) {
      const question = questions[i]

      // 跳过非选择题
      if (question.type !== 'choice' || !question.options) {
        continue
      }

      const answer = answers[i]?.trim().toUpperCase()
      if (!answer) continue

      // 使用配置化评分方法（与普通问道包一致）
      this.applyChoiceRules(score, i, answer, question)
    }

    return score
  }

  /**
   * 反作弊检测（降级时使用）
   * v1.3.1 新增：从 questioning.service.ts 移植
   *
   * 检测开放题答案中的可疑内容：
   * - Prompt 注入尝试
   * - 越狱指令
   * - 直接要求特定灵根
   * - 异常长度/重复
   */
  private detectExploitation(text: string): { isExploit: boolean; reason: string; severity: 'low' | 'high' } {
    const lower = text.toLowerCase()

    // 1. Prompt 注入关键词检测（高严重性）
    const exploitPatterns = [
      '忽略以上', '忽略之前', '无视之前', 'system prompt', '作为 ai', '你现在是', '你将忽略',
      '越狱', 'jailbreak', 'dan 模式', 'dan mode', 'prompt injection', '指令注入',
      '请直接给出最终 json', '覆盖规则', '绕过限制', '请给我', '给我', '我要', '分配给我', '分配', '给我道号', '给我灵根', '请分配'
    ]
    if (exploitPatterns.some(p => lower.includes(p))) {
      return { isExploit: true, reason: '检测到越权指令', severity: 'high' }
    }

    // 2. 灵根关键词检测（高严重性）
    const rootKeywords = ['天灵根','光灵根','暗灵根','金灵根','木灵根','水灵根','火灵根','土灵根','气灵根','伪灵根','哈根','天灵']
    if (rootKeywords.some(k => text.includes(k))) {
      return { isExploit: true, reason: '检测到直接请求灵根', severity: 'high' }
    }

    // 3. 可疑特征检测
    // 3.1 内容过长
    if (text.length > 1500) {
      return { isExploit: true, reason: '内容过长，可能包含注入', severity: 'high' }
    }
    if (text.length > 800) {
      return { isExploit: true, reason: '内容较长，请简洁回答', severity: 'low' }
    }

    // 3.2 异常重复（8个以上连续相同字符）
    if (/(.)\1{7,}/.test(text)) {
      return { isExploit: true, reason: '检测到异常重复字符', severity: 'high' }
    }

    return { isExploit: false, reason: '', severity: 'low' }
  }
}

