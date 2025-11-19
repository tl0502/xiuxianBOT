import { Player } from '../types/player'
import { REALMS, REALM_LEVELS, GameConfig } from '../config/constants'

/**
 * 计算修炼速度（每小时获得的修为）
 */
export function calculateCultivationSpeed(player: Player): number {
  const baseSpeed = GameConfig.CULTIVATION_BASE_SPEED
  const spiritualRootBonus = player.spiritualRoot * GameConfig.CULTIVATION_SPIRITUAL_ROOT_MULTIPLIER
  return Math.floor(baseSpeed + spiritualRootBonus)
}

/**
 * 计算修炼收益
 */
export function calculateCultivationGain(player: Player, hours: number): number {
  const speed = calculateCultivationSpeed(player)
  return speed * hours
}

/**
 * 计算突破成功率
 */
export function calculateBreakthroughRate(player: Player): number {
  const baseRate = GameConfig.BREAKTHROUGH_BASE_RATE
  const spiritualRootBonus = player.spiritualRoot * GameConfig.BREAKTHROUGH_SPIRITUAL_ROOT_BONUS
  const rate = baseRate + spiritualRootBonus

  // 确保在 0-1 之间
  return Math.min(1, Math.max(0, rate))
}

/**
 * 计算战力
 */
export function calculateCombatPower(player: Player): number {
  // 基础战力 = 境界 * 1000 + 境界等级 * 200
  const basePower = player.realm * 1000 + player.realmLevel * 200
  // 灵根加成
  const spiritualRootBonus = player.spiritualRoot * 10
  // 总战力
  return basePower + spiritualRootBonus
}

/**
 * 获取境界名称
 */
export function getRealmName(realm: number, realmLevel: number): string {
  const realmName = REALMS[realm]?.name || '未知'
  const levelName = REALM_LEVELS[realmLevel]?.name || ''
  return `${realmName}期${levelName}`
}

/**
 * 获取下一境界所需修为
 */
export function getNextRealmMaxCultivation(realm: number, realmLevel: number): number {
  // 如果是大圆满，返回大境界的最大修为
  if (realmLevel === 3) {
    return REALMS[realm]?.maxCultivation || 999999999
  }

  // 否则，按比例分配小境界的修为需求
  const currentRealmMax = REALMS[realm]?.maxCultivation || 1000
  const previousRealmMax = realm > 0 ? (REALMS[realm - 1]?.maxCultivation || 0) : 0
  const difference = currentRealmMax - previousRealmMax

  // 每个小境界占总差值的 25%
  return Math.floor(previousRealmMax + difference * (realmLevel + 1) / 4)
}
