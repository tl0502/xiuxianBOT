/**
 * 混合性格分析器
 *
 * 结合选择题规则评分和AI开放题评分
 * v0.6.0 新增
 */

import { Context } from 'koishi'
import { PersonalityScore } from './personality-analyzer'
import { AIOpenQuestionScorer, AIOpenQuestionScore } from './ai-open-question-scorer'
import { Question } from '../config/questioning'

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
    options?: HybridAnalysisOptions
  ): Promise<HybridAnalysisResult> {
    // 1. 先用规则分析选择题
    const choiceScore = this.analyzeChoiceQuestions(answers, questions)

    // 2. 识别开放题
    const openQuestionIndices = options?.openQuestionIndices ??
      questions.map((q, i) => q.type === 'text' ? i : -1).filter(i => i !== -1)

    if (openQuestionIndices.length === 0 || !options?.requiresAI) {
      // 没有开放题，或不需要AI，直接返回
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
            maxScore: options.maxScorePerDimension ?? 8,
            minScore: options.minScorePerDimension ?? -3
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

      // 允许降级，只使用选择题分数
      return {
        finalScore: choiceScore,
        choiceScore: choiceScore,
        usedAI: false
      }
    }

    // 4. 合并分数
    const finalScore = this.mergeScores(choiceScore, aiScores.map(s => s.personality))

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
   */
  private applyChoiceRules(
    score: PersonalityScore,
    questionIndex: number,
    answer: string,
    _question: Question
  ): void {
    // 通用规则：根据问题索引和答案字母
    // 这是简化版本，实际使用时可以根据_question.id定制规则

    if (questionIndex === 0) {
      // 第1题规则（假设是道德选择题）
      switch (answer) {
        case 'A':  // 通常是最善良的选项
          score.kindness += 4
          score.courage += 2
          score.honesty += 2
          break
        case 'B':  // 中庸选项
          score.stability += 2
          score.focus += 1
          score.greed += 1
          break
        case 'C':  // 谨慎选项
          score.focus += 3
          score.stability += 3
          score.determination += 1
          break
        case 'D':  // 自私选项
          score.determination += 3
          score.greed += 5
          score.impatience += 2
          break
      }
    } else if (questionIndex === 1) {
      // 第2题规则（假设是应对方式题）
      switch (answer) {
        case 'A':  // 勇猛
          score.courage += 5
          score.determination += 2
          break
        case 'B':  // 智谋
          score.focus += 4
          score.stability += 2
          break
        case 'C':  // 隐忍
          score.stability += 5
          score.focus += 2
          break
        case 'D':  // 灵活
          score.determination += 3
          score.focus += 2
          break
      }
    } else {
      // 第3+题的通用规则
      switch (answer) {
        case 'A':
          score.courage += 2
          score.determination += 1
          break
        case 'B':
          score.focus += 2
          score.stability += 1
          break
        case 'C':
          score.stability += 2
          score.focus += 1
          break
        case 'D':
          score.determination += 2
          break
      }
    }
  }

  /**
   * 合并选择题分数和AI开放题分数
   */
  private mergeScores(
    choiceScore: PersonalityScore,
    aiScores: PersonalityScore[]
  ): PersonalityScore {
    const merged: PersonalityScore = { ...choiceScore }

    // 累加所有AI评分
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
}
