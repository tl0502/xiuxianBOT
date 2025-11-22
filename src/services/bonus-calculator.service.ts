/**
 * 加成计算服务
 *
 * v1.0.0 新增
 * 负责计算最终的倍率（整合永久加成、灵根加成、临时buff加成）
 */

import { Player } from '../types/player'
import { BuffType } from '../types/buff'
import { BuffService } from './buff.service'
import {
  getSpiritualRootCultivationBonus,
  getSpiritualRootBreakthroughBonus,
  getNextRealmMaxCultivation
} from '../utils/calculator'

/**
 * 加成计算服务类
 *
 * 核心职责：
 * - 计算修炼速度倍率（考虑永久+灵根+临时buff）
 * - 计算突破成功率（考虑永久+灵根+临时buff）
 * - 计算修为需求倍率（考虑永久+临时buff）
 */
export class BonusCalculatorService {
  constructor(private buffService: BuffService) {}

  /**
   * 计算最终修炼速度倍率
   *
   * 公式：(全局基础 + 永久加成) × 灵根倍率 × (1 + 限时倍率)
   *
   * @param player 玩家数据
   * @returns 最终倍率
   *
   * @example
   * 玩家: 光灵根(1.5倍), 永久加成(+0.1), 服用修炼丹(+0.3,2小时)
   * 计算: (1.0 + 0.1) × 1.5 × (1 + 0.3) = 2.145
   * 修炼速度: 10 × 2.145 = 21.45/小时
   */
  async calculateCultivationMultiplier(player: Player): Promise<number> {
    // 1. 永久基础 = 全局基础(1.0) + 玩家永久加成
    const permanentBase = 1.0 + (player.permanentCultivationBonus || 0)

    // 2. 灵根倍率
    const rootMultiplier = getSpiritualRootCultivationBonus(player.spiritualRoot)

    // 3. 临时buff加成
    const buffBonus = await this.buffService.calculateBuffBonus(
      player.userId,
      BuffType.CULTIVATION_SPEED
    )

    // 4. 组合公式
    // 最终倍率 = (永久基础) × 灵根倍率 × (1 + buff倍率) + buff固定值
    const multiplier = permanentBase * rootMultiplier * (1 + buffBonus.multiplier) + buffBonus.additive

    return Math.max(0, multiplier)  // 确保不为负
  }

  /**
   * 计算最终突破成功率
   *
   * 公式：(全局基础 + 永久加成 + 灵根加成) + 限时加成
   *
   * @param player 玩家数据
   * @returns 最终突破率（0-1之间）
   *
   * @example
   * 玩家: 光灵根(+0.1), 永久加成(+0.05), 服用破境丹(+0.15)
   * 计算: (0.5 + 0.05 + 0.1) + 0.15 = 0.8 (80%)
   */
  async calculateBreakthroughRate(player: Player): Promise<number> {
    const baseRate = 0.5  // 全局基础突破率 50%

    // 1. 永久加成
    const permanentBonus = player.permanentBreakthroughBonus || 0

    // 2. 灵根加成
    const rootBonus = getSpiritualRootBreakthroughBonus(player.spiritualRoot)

    // 3. 临时buff加成
    const buffBonus = await this.buffService.calculateBuffBonus(
      player.userId,
      BuffType.BREAKTHROUGH_RATE
    )

    // 4. 组合公式
    // 最终突破率 = (基础 + 永久 + 灵根) + buff固定值 + buff倍率
    const rate = (baseRate + permanentBonus + rootBonus) + buffBonus.additive + buffBonus.multiplier

    // 5. 限制在0-1之间
    return Math.min(1, Math.max(0, rate))
  }

  /**
   * 计算最终修为需求
   *
   * 公式：设定值 × (1 + 永久加成 + 限时加成)
   *
   * @param player 玩家数据
   * @param baseRequirement 基础需求（从境界配置获取）
   * @returns 最终修为需求
   *
   * @example
   * 境界: 练气中期, 设定值=500, 装备"逆天戒"(-0.1), 事件"天劫"(+0.2)
   * 计算: 500 × (1 - 0.1 + 0.2) = 550
   */
  async calculateCultivationRequirement(
    player: Player,
    baseRequirement?: number
  ): Promise<number> {
    // 如果未提供基础需求，从玩家当前境界计算
    const requirement = baseRequirement ??
      getNextRealmMaxCultivation(player.realm, player.realmLevel)

    // 1. 永久加成
    const permanentBonus = player.permanentCultivationRequirement || 0

    // 2. 临时buff加成
    const buffBonus = await this.buffService.calculateBuffBonus(
      player.userId,
      BuffType.CULTIVATION_REQUIREMENT
    )

    // 3. 组合公式
    // 最终需求 = 设定值 × (1 + 永久加成 + buff固定值 + buff倍率)
    const multiplier = 1 + permanentBonus + buffBonus.additive + buffBonus.multiplier

    // 4. 确保不为负且为整数
    return Math.max(1, Math.floor(requirement * multiplier))
  }

  /**
   * 计算战力倍率（预留接口，未来实现）
   *
   * @param player 玩家数据
   * @returns 战力倍率
   */
  async calculateCombatPowerMultiplier(player: Player): Promise<number> {
    const permanentBase = 1.0 + (player.permanentCombatPowerBonus || 0)

    const buffBonus = await this.buffService.calculateBuffBonus(
      player.userId,
      BuffType.COMBAT_POWER
    )

    const multiplier = permanentBase * (1 + buffBonus.multiplier) + buffBonus.additive

    return Math.max(0, multiplier)
  }

  /**
   * 计算灵石收益倍率（预留接口，未来实现）
   *
   * @param player 玩家数据
   * @returns 灵石收益倍率
   */
  async calculateSpiritStoneGainMultiplier(player: Player): Promise<number> {
    const permanentBase = 1.0 + (player.permanentSpiritStoneGainBonus || 0)

    const buffBonus = await this.buffService.calculateBuffBonus(
      player.userId,
      BuffType.SPIRIT_STONE_GAIN
    )

    const multiplier = permanentBase * (1 + buffBonus.multiplier) + buffBonus.additive

    return Math.max(0, multiplier)
  }

  /**
   * 获取玩家所有加成的详细信息（用于显示）
   *
   * @param player 玩家数据
   * @returns 加成详情对象
   */
  async getBonusDetails(player: Player): Promise<{
    cultivation: { permanent: number; temp: number; total: number }
    breakthrough: { permanent: number; temp: number; total: number }
    requirement: { permanent: number; temp: number; total: number }
  }> {
    // 修炼速度
    const cultivationPermanent = player.permanentCultivationBonus || 0
    const cultivationTempBuff = await this.buffService.calculateBuffBonus(
      player.userId,
      BuffType.CULTIVATION_SPEED
    )
    const cultivationTemp = cultivationTempBuff.multiplier + cultivationTempBuff.additive
    const cultivationTotal = await this.calculateCultivationMultiplier(player)

    // 突破率
    const breakthroughPermanent = player.permanentBreakthroughBonus || 0
    const breakthroughTempBuff = await this.buffService.calculateBuffBonus(
      player.userId,
      BuffType.BREAKTHROUGH_RATE
    )
    const breakthroughTemp = breakthroughTempBuff.multiplier + breakthroughTempBuff.additive
    const breakthroughTotal = await this.calculateBreakthroughRate(player)

    // 修为需求
    const requirementPermanent = player.permanentCultivationRequirement || 0
    const requirementTempBuff = await this.buffService.calculateBuffBonus(
      player.userId,
      BuffType.CULTIVATION_REQUIREMENT
    )
    const requirementTemp = requirementTempBuff.multiplier + requirementTempBuff.additive
    const requirementTotal = 1 + requirementPermanent + requirementTemp

    return {
      cultivation: {
        permanent: cultivationPermanent,
        temp: cultivationTemp,
        total: cultivationTotal
      },
      breakthrough: {
        permanent: breakthroughPermanent,
        temp: breakthroughTemp,
        total: breakthroughTotal
      },
      requirement: {
        permanent: requirementPermanent,
        temp: requirementTemp,
        total: requirementTotal
      }
    }
  }
}
