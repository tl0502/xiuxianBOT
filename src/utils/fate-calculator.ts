/**
 * 天命计算器 - 灵根概率计算和抽取系统
 *
 * v0.9.0 重构：接入灵根注册表系统
 *
 * 核心流程：
 * 1. 基础概率（天命）- 从灵根注册表获取单灵根概率
 * 2. 性格匹配加权（±8%/10%）- 使用灵根内置的匹配规则
 * 3. 统计平衡调整（趋近基础概率）
 * 4. 归一化到100%
 * 5. 天命抽取
 */

import { Context } from 'koishi'
import { KoishiAppContext } from '../adapters/koishi'
import { SpiritualRootType } from '../config/spiritual-roots'
import {
  getBaseChanceDistribution,
  calculatePersonalityMatch
} from '../config/spiritual-root-registry'
import { SpiritualRootConfig } from '../config/constants'
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
    const appContext = KoishiAppContext.from(ctx)
    this.rootStatsService = new RootStatsService(appContext)
  }

  /**
   * 主流程：计算最终概率并抽取灵根
   *
   * @param personality 性格评分
   * @returns 抽取的灵根类型
   */
  async selectSpiritualRoot(personality: PersonalityScore): Promise<SpiritualRootType> {
    this.ctx.logger('xiuxian').info('=== 天命计算开始 ===')

    // 第1步：从灵根注册表获取基础概率（单灵根，已归一化）
    let distribution = getBaseChanceDistribution()
    this.logDistribution('基础概率（天命）', distribution)

    // 第2步：应用性格匹配加权
    distribution = this.applyPersonalityWeight(distribution, personality)
    this.logDistribution('性格加权后', distribution)

    // 第3步：应用统计平衡（如果达到阈值）
    const totalPlayers = await this.rootStatsService.getTotalPlayerCount()
    if (totalPlayers >= SpiritualRootConfig.STATISTICAL_BALANCE_THRESHOLD) {
      this.ctx.logger('xiuxian').info(`总玩家数 ${totalPlayers} >= ${SpiritualRootConfig.STATISTICAL_BALANCE_THRESHOLD}，启用统计平衡`)
      distribution = await this.applyStatisticalBalance(distribution)
      this.logDistribution('统计平衡后', distribution)
    } else {
      this.ctx.logger('xiuxian').info(`总玩家数 ${totalPlayers} < ${SpiritualRootConfig.STATISTICAL_BALANCE_THRESHOLD}，跳过统计平衡`)
    }

    // 第4步：归一化到 100%
    distribution = this.normalize(distribution)
    this.logDistribution('最终概率（归一化）', distribution)

    // 第5步：天命抽取
    const selectedRoot = this.draw(distribution)
    this.ctx.logger('xiuxian').info(`=== 天命抽中: ${selectedRoot} ===`)

    return selectedRoot
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
        adjustment = (matchScore / 10) * SpiritualRootConfig.MAX_PERSONALITY_INCREASE
      } else if (matchScore < 0) {
        // 负面匹配，下调（0-10%）
        adjustment = (matchScore / 10) * SpiritualRootConfig.MAX_PERSONALITY_DECREASE
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
   * v0.9.0 重构：使用灵根注册表的内置匹配规则
   * @returns -10 到 +10 的分数，正数表示匹配，负数表示不匹配
   */
  private calculateMatchScore(
    rootType: SpiritualRootType,
    personality: PersonalityScore
  ): number {
    return calculatePersonalityMatch(rootType, personality as unknown as Record<string, number>)
  }

  /**
   * 应用统计平衡
   *
   * v0.9.0 重构：使用灵根注册表作为目标分布
   * 目标：使当前分布趋近于基础概率
   * 方法：如果某个灵根分配过多，降低其概率；分配过少，提高其概率
   */
  private async applyStatisticalBalance(
    distribution: ProbabilityDistribution
  ): Promise<ProbabilityDistribution> {
    // 1. 获取当前实际分布
    const currentDistribution = await this.rootStatsService.getCurrentDistribution()

    // 2. 获取目标分布（从灵根注册表，已归一化）
    const targetDistribution = getBaseChanceDistribution()

    // 3. 计算偏离度并调整
    const balanced = new Map<SpiritualRootType, number>()

    for (const [rootType, currentProb] of distribution) {
      const actualRate = currentDistribution.get(rootType) || 0
      const targetRate = targetDistribution.get(rootType) || 0

      // 偏离度：实际 - 目标（正数表示过多，负数表示过少）
      const deviation = actualRate - targetRate

      // 调整系数：偏离越大，调整越多（但有上限）
      // 如果分配过多（deviation > 0），降低概率
      // 如果分配过少（deviation < 0），提高概率
      const adjustmentFactor = -deviation * 0.5  // 系数 0.5 控制调整力度

      // 限制调整范围（-5% 到 +5%）
      const adjustment = Math.max(
        -SpiritualRootConfig.STATISTICAL_BALANCE_MAX_ADJUSTMENT,
        Math.min(SpiritualRootConfig.STATISTICAL_BALANCE_MAX_ADJUSTMENT, adjustmentFactor)
      )

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
