/**
 * 分数匹配器 - 计算玩家性格分数与问道包最佳分数的匹配度
 */

import { PersonalityScore } from './personality-analyzer'
import { MatchResult, RewardTier, OptimalScoreConfig } from '../types/path-package'

/**
 * 9维性格维度列表
 */
export const PERSONALITY_DIMENSIONS: (keyof PersonalityScore)[] = [
  'determination',
  'courage',
  'stability',
  'focus',
  'honesty',
  'kindness',
  'greed',
  'impatience',
  'manipulation'
]

/**
 * 维度中文名称映射
 */
export const DIMENSION_NAMES: Record<keyof PersonalityScore, string> = {
  determination: '决断力',
  courage: '勇气',
  stability: '稳定性',
  focus: '专注力',
  honesty: '诚实',
  kindness: '善良',
  greed: '贪念',
  impatience: '急躁',
  manipulation: '操控'
}

/**
 * 计算两个性格分数的匹配度
 * 使用9维欧氏距离，归一化到0-100%
 *
 * @param playerScore 玩家性格分数
 * @param targetScore 目标最佳分数
 * @returns 匹配度百分比 (0-100)
 */
export function calculateMatchRate(
  playerScore: PersonalityScore,
  targetScore: PersonalityScore
): number {
  let sumSquaredDiff = 0

  for (const dimension of PERSONALITY_DIMENSIONS) {
    const diff = playerScore[dimension] - targetScore[dimension]
    sumSquaredDiff += diff * diff
  }

  // 欧氏距离
  const distance = Math.sqrt(sumSquaredDiff)

  // 最大可能距离：9个维度，每个维度最大差异为10（0到10的范围）
  const maxDistance = Math.sqrt(9 * 10 * 10) // = 30

  // 归一化到0-100%（距离越小，匹配度越高）
  const matchRate = (1 - distance / maxDistance) * 100

  // 确保结果在0-100范围内
  return Math.max(0, Math.min(100, matchRate))
}

/**
 * 根据匹配度确定奖励等级
 *
 * @param matchRate 匹配度百分比
 * @returns 奖励等级
 */
export function getRewardTier(matchRate: number): RewardTier {
  if (matchRate >= 90) return 'perfect'
  if (matchRate >= 60) return 'good'
  return 'normal'
}

/**
 * 获取奖励等级的中文名称
 */
export function getRewardTierName(tier: RewardTier): string {
  const names: Record<RewardTier, string> = {
    perfect: '完美契合',
    good: '良好匹配',
    normal: '普通匹配'
  }
  return names[tier]
}

/**
 * 计算完整的匹配结果
 *
 * @param playerScore 玩家性格分数
 * @param optimalConfig 最佳分数配置
 * @returns 匹配结果
 */
export function calculateMatchResult(
  playerScore: PersonalityScore,
  optimalConfig: OptimalScoreConfig
): MatchResult {
  const matchRate = calculateMatchRate(playerScore, optimalConfig.target)
  const tier = getRewardTier(matchRate)

  // 获取对应等级的奖励
  const reward = optimalConfig.rewards[tier]

  // 计算各维度得分详情
  const dimensionScores = PERSONALITY_DIMENSIONS.map(dimension => ({
    dimension: DIMENSION_NAMES[dimension],
    playerScore: playerScore[dimension],
    targetScore: optimalConfig.target[dimension],
    difference: Math.abs(playerScore[dimension] - optimalConfig.target[dimension])
  }))

  return {
    matchRate,
    tier,
    reward,
    dimensionScores
  }
}

/**
 * 生成匹配结果的文字描述
 *
 * @param result 匹配结果
 * @returns 描述文本
 */
export function generateMatchDescription(result: MatchResult): string {
  const tierName = getRewardTierName(result.tier)
  const matchPercentage = result.matchRate.toFixed(1)

  // 找出最匹配和最不匹配的维度
  const sortedDimensions = [...result.dimensionScores]
    .sort((a, b) => a.difference - b.difference)

  const bestMatch = sortedDimensions[0]
  const worstMatch = sortedDimensions[sortedDimensions.length - 1]

  let description = `【${tierName}】匹配度：${matchPercentage}%\n`

  if (result.tier === 'perfect') {
    description += `你的心性与此机缘完美契合！`
  } else if (result.tier === 'good') {
    description += `你的${bestMatch.dimension}与机缘相合，但${worstMatch.dimension}尚有偏差。`
  } else {
    description += `此次机缘与你心性相距甚远，${worstMatch.dimension}差异尤为明显。`
  }

  return description
}

/**
 * 创建默认的PersonalityScore（用于初始化）
 */
export function createDefaultPersonalityScore(): PersonalityScore {
  return {
    determination: 5,
    courage: 5,
    stability: 5,
    focus: 5,
    honesty: 5,
    kindness: 5,
    greed: 5,
    impatience: 5,
    manipulation: 5
  }
}

/**
 * 验证PersonalityScore的有效性
 */
export function validatePersonalityScore(score: PersonalityScore): boolean {
  for (const dimension of PERSONALITY_DIMENSIONS) {
    const value = score[dimension]
    if (typeof value !== 'number' || value < 0 || value > 10) {
      return false
    }
  }
  return true
}

/**
 * 计算两个分数的相似度描述
 * 用于AI生成评语时的参考
 */
export function generateSimilarityAnalysis(
  playerScore: PersonalityScore,
  targetScore: PersonalityScore
): string {
  const analysis: string[] = []

  // 分类维度
  const highMatch: string[] = []
  const mediumMatch: string[] = []
  const lowMatch: string[] = []

  for (const dimension of PERSONALITY_DIMENSIONS) {
    const diff = Math.abs(playerScore[dimension] - targetScore[dimension])
    const name = DIMENSION_NAMES[dimension]

    if (diff <= 2) {
      highMatch.push(name)
    } else if (diff <= 5) {
      mediumMatch.push(name)
    } else {
      lowMatch.push(name)
    }
  }

  if (highMatch.length > 0) {
    analysis.push(`高度契合维度：${highMatch.join('、')}`)
  }
  if (mediumMatch.length > 0) {
    analysis.push(`中等契合维度：${mediumMatch.join('、')}`)
  }
  if (lowMatch.length > 0) {
    analysis.push(`偏离维度：${lowMatch.join('、')}`)
  }

  return analysis.join('\n')
}
