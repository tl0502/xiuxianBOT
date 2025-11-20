/**
 * 天命计算器 - 灵根概率计算和抽取系统
 *
 * 核心流程：
 * 1. 基础概率（天命）
 * 2. 性格匹配加权（±8%/10%）
 * 3. 统计平衡调整（趋近基础概率）
 * 4. 归一化到100%
 * 5. 天命抽取
 */

import { Context } from 'koishi'
import { SpiritualRootType } from '../config/spiritual-roots'
import {
  RootGradeConfig,
  PERSONALITY_ADJUSTMENT,
  STATISTICAL_BALANCE_THRESHOLD,
  getEnabledGrades
} from '../config/fate-distribution'
import { PersonalityScore } from './personality-analyzer'
import { RootStatsService } from '../services/root-stats.service'

/**
 * 概率分布类型（灵根 -> 概率）
 */
type ProbabilityDistribution = Map<SpiritualRootType, number>

/**
 * 天命计算器
 */
export class FateCalculator {
  private rootStatsService: RootStatsService

  constructor(private ctx: Context) {
    this.rootStatsService = new RootStatsService(ctx)
  }

  /**
   * 主流程：计算最终概率并抽取灵根
   *
   * @param personality 性格评分
   * @returns 抽取的灵根类型
   */
  async selectSpiritualRoot(personality: PersonalityScore): Promise<SpiritualRootType> {
    this.ctx.logger('xiuxian').info('=== 天命计算开始 ===')

    // 第1步：获取基础概率（已启用的等级，归一化后）
    const enabledGrades = getEnabledGrades()
    this.ctx.logger('xiuxian').info('基础概率（天命）：')
    for (const config of enabledGrades) {
      this.ctx.logger('xiuxian').info(`  ${config.name}: ${(config.baseChance * 100).toFixed(2)}%`)
    }

    // 第2步：展开等级到具体灵根，得到基础概率分布
    let distribution = this.expandGradesToRoots(enabledGrades)
    this.logDistribution('展开后的基础分布', distribution)

    // 第3步：应用性格匹配加权
    distribution = this.applyPersonalityWeight(distribution, personality)
    this.logDistribution('性格加权后', distribution)

    // 第4步：应用统计平衡（如果达到阈值）
    const totalPlayers = await this.rootStatsService.getTotalPlayerCount()
    if (totalPlayers >= STATISTICAL_BALANCE_THRESHOLD) {
      this.ctx.logger('xiuxian').info(`总玩家数 ${totalPlayers} >= ${STATISTICAL_BALANCE_THRESHOLD}，启用统计平衡`)
      distribution = await this.applyStatisticalBalance(distribution)
      this.logDistribution('统计平衡后', distribution)
    } else {
      this.ctx.logger('xiuxian').info(`总玩家数 ${totalPlayers} < ${STATISTICAL_BALANCE_THRESHOLD}，跳过统计平衡`)
    }

    // 第5步：归一化到 100%
    distribution = this.normalize(distribution)
    this.logDistribution('最终概率（归一化）', distribution)

    // 第6步：天命抽取
    const selectedRoot = this.draw(distribution)
    this.ctx.logger('xiuxian').info(`=== 天命抽中: ${selectedRoot} ===`)

    return selectedRoot
  }

  /**
   * 将等级配置展开为具体灵根的概率分布
   */
  private expandGradesToRoots(grades: RootGradeConfig[]): ProbabilityDistribution {
    const distribution = new Map<SpiritualRootType, number>()

    for (const grade of grades) {
      if (grade.roots.length === 0) continue

      // 每个灵根平分该等级的概率
      const probPerRoot = grade.baseChance / grade.roots.length

      for (const root of grade.roots) {
        const current = distribution.get(root) || 0
        distribution.set(root, current + probPerRoot)
      }
    }

    return distribution
  }

  /**
   * 应用性格匹配加权
   *
   * 规则：
   * - 与性格匹配的灵根，概率上调（最多 +8%）
   * - 与性格不匹配的灵根，概率下调（最多 -10%）
   * - 保持总和为 100%
   */
  private applyPersonalityWeight(
    distribution: ProbabilityDistribution,
    personality: PersonalityScore
  ): ProbabilityDistribution {
    const adjusted = new Map<SpiritualRootType, number>()

    // 计算每个灵根与性格的匹配度
    for (const [rootType, baseProb] of distribution) {
      const matchScore = this.calculateMatchScore(rootType, personality)

      // 根据匹配度调整概率
      let adjustment = 0

      if (matchScore > 0) {
        // 正面匹配，上调（0-8%）
        adjustment = (matchScore / 10) * PERSONALITY_ADJUSTMENT.MAX_INCREASE
      } else if (matchScore < 0) {
        // 负面匹配，下调（0-10%）
        adjustment = (matchScore / 10) * PERSONALITY_ADJUSTMENT.MAX_DECREASE
      }

      const newProb = Math.max(0, baseProb + adjustment)
      adjusted.set(rootType, newProb)

      if (Math.abs(adjustment) > 0.001) {
        this.ctx.logger('xiuxian').debug(
          `  ${rootType} 匹配度: ${matchScore.toFixed(1)}, 调整: ${(adjustment * 100).toFixed(2)}%`
        )
      }
    }

    return adjusted
  }

  /**
   * 计算灵根与性格的匹配度
   *
   * @returns -10 到 +10 的分数，正数表示匹配，负数表示不匹配
   */
  private calculateMatchScore(
    rootType: SpiritualRootType,
    personality: PersonalityScore
  ): number {
    let score = 0

    switch (rootType) {
      case SpiritualRootType.LIGHT:  // 光灵根：正义、善良、勇气
        score += personality.kindness * 0.5
        score += personality.courage * 0.3
        score += personality.honesty * 0.2
        score -= personality.greed * 0.5
        score -= personality.manipulation * 0.5
        break

      case SpiritualRootType.DARK:  // 暗灵根：冷静、独立、深沉
        score += personality.focus * 0.4
        score += personality.stability * 0.4
        score += personality.determination * 0.2
        score -= personality.impatience * 0.3
        break

      case SpiritualRootType.METAL:  // 金灵根：果断、锐利、进取
        score += personality.determination * 0.5
        score += personality.courage * 0.3
        score += personality.focus * 0.2
        score -= personality.stability * 0.1  // 过于稳重不适合金
        break

      case SpiritualRootType.WOOD:  // 木灵根：仁慈、温和、包容
        score += personality.kindness * 0.6
        score += personality.honesty * 0.3
        score += personality.stability * 0.1
        score -= personality.greed * 0.4
        score -= personality.impatience * 0.3
        break

      case SpiritualRootType.WATER:  // 水灵根：灵活、智慧、适应
        score += personality.focus * 0.5
        score += personality.stability * 0.3
        score += personality.determination * 0.2
        score -= personality.impatience * 0.3
        break

      case SpiritualRootType.FIRE:  // 火灵根：热情、激情、冲动
        score += personality.courage * 0.5
        score += personality.determination * 0.3
        score += personality.impatience * 0.1  // 急躁反而适合火
        score -= personality.stability * 0.2  // 过于稳重不适合火
        break

      case SpiritualRootType.EARTH:  // 土灵根：稳重、踏实、坚韧
        score += personality.stability * 0.6
        score += personality.honesty * 0.3
        score += personality.focus * 0.1
        score -= personality.impatience * 0.4
        break

      case SpiritualRootType.QI:  // 气灵根：超然、悟性、平衡
        score += personality.focus * 0.4
        score += personality.honesty * 0.3
        score += personality.stability * 0.3
        score -= personality.greed * 0.3
        score -= personality.manipulation * 0.4
        break

      case SpiritualRootType.PSEUDO:  // 伪灵根：平凡或有负面特征
        // 贪婪、操控、急躁会增加伪灵根概率
        score += personality.greed * 0.4
        score += personality.manipulation * 0.5
        score += personality.impatience * 0.3
        // 优秀品质会降低伪灵根概率
        score -= (personality.kindness + personality.courage + personality.honesty) * 0.2
        break
    }

    // 限制在 -10 到 +10 范围
    return Math.max(-10, Math.min(10, score))
  }

  /**
   * 应用统计平衡
   *
   * 目标：使当前分布趋近于基础概率
   * 方法：如果某个灵根分配过多，降低其概率；分配过少，提高其概率
   */
  private async applyStatisticalBalance(
    distribution: ProbabilityDistribution
  ): Promise<ProbabilityDistribution> {
    // 1. 获取当前实际分布
    const currentDistribution = await this.rootStatsService.getCurrentDistribution()

    // 2. 获取目标分布（基础概率）
    const enabledGrades = getEnabledGrades()
    const targetDistribution = this.expandGradesToRoots(enabledGrades)
    const normalizedTarget = this.normalize(targetDistribution)

    // 3. 计算偏离度并调整
    const balanced = new Map<SpiritualRootType, number>()

    for (const [rootType, currentProb] of distribution) {
      const actualRate = currentDistribution.get(rootType) || 0
      const targetRate = normalizedTarget.get(rootType) || 0

      // 偏离度：实际 - 目标（正数表示过多，负数表示过少）
      const deviation = actualRate - targetRate

      // 调整系数：偏离越大，调整越多（但有上限）
      // 如果分配过多（deviation > 0），降低概率
      // 如果分配过少（deviation < 0），提高概率
      const adjustmentFactor = -deviation * 0.5  // 系数 0.5 控制调整力度

      // 限制调整范围（-5% 到 +5%）
      const adjustment = Math.max(-0.05, Math.min(0.05, adjustmentFactor))

      const newProb = Math.max(0, currentProb + adjustment)
      balanced.set(rootType, newProb)

      if (Math.abs(adjustment) > 0.001) {
        this.ctx.logger('xiuxian').debug(
          `  ${rootType} 实际: ${(actualRate * 100).toFixed(2)}%, ` +
          `目标: ${(targetRate * 100).toFixed(2)}%, ` +
          `偏离: ${(deviation * 100).toFixed(2)}%, ` +
          `调整: ${(adjustment * 100).toFixed(2)}%`
        )
      }
    }

    return balanced
  }

  /**
   * 归一化：确保所有概率总和为 1.0 (100%)
   */
  private normalize(distribution: ProbabilityDistribution): ProbabilityDistribution {
    const total = Array.from(distribution.values()).reduce((sum, prob) => sum + prob, 0)

    if (total === 0) {
      throw new Error('概率分布总和为0，无法归一化')
    }

    const normalized = new Map<SpiritualRootType, number>()
    for (const [rootType, prob] of distribution) {
      normalized.set(rootType, prob / total)
    }

    return normalized
  }

  /**
   * 天命抽取：根据概率分布随机选择灵根
   */
  private draw(distribution: ProbabilityDistribution): SpiritualRootType {
    const random = Math.random()
    let cumulative = 0

    // 按概率累加，当随机值落在某个区间时，返回对应的灵根
    for (const [rootType, prob] of distribution) {
      cumulative += prob
      if (random <= cumulative) {
        return rootType
      }
    }

    // 保底（理论上不应该到这里）
    this.ctx.logger('xiuxian').warn('天命抽取失败，使用保底伪灵根')
    return SpiritualRootType.PSEUDO
  }

  /**
   * 记录概率分布到日志
   */
  private logDistribution(label: string, distribution: ProbabilityDistribution): void {
    this.ctx.logger('xiuxian').info(`${label}:`)
    for (const [rootType, prob] of distribution) {
      this.ctx.logger('xiuxian').info(`  ${rootType}: ${(prob * 100).toFixed(2)}%`)
    }
  }
}
