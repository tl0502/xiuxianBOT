/**
 * 天命基础概率配置
 *
 * 这是天道的"基础倾向"，AI 必须严格遵守此比例
 * 总概率必须相加为 100%
 */

import { SpiritualRootType } from './spiritual-roots'

/**
 * 灵根等级定义
 */
export enum RootGrade {
  PSEUDO = 'pseudo',           // 伪灵根
  FIVE_SINGLE = 'five_single', // 五行单灵根
  TRUE = 'true',               // 真灵根（杂灵根）
  FIVE_DOUBLE = 'five_double', // 五行双灵根
  HEAVENLY = 'heavenly',       // 天灵根
  FIVE_TRIPLE = 'five_triple', // 五行三灵根
}

/**
 * 灵根等级配置
 */
export interface RootGradeConfig {
  grade: RootGrade             // 等级标识
  name: string                 // 等级名称
  baseChance: number           // 基础概率（0-1）
  roots: SpiritualRootType[]   // 该等级包含的灵根类型
  enabled: boolean             // 是否启用（未实现的等级为 false）
  description: string          // 描述
}

/**
 * 天命基础概率分布
 *
 * 注意：
 * 1. baseChance 总和必须为 1.0 (100%)
 * 2. 未实现的等级设置 enabled: false，其概率会被已启用的等级按比例分配
 * 3. 可以随时调整概率，系统会自动归一化
 */
export const FATE_DISTRIBUTION: RootGradeConfig[] = [
  {
    grade: RootGrade.PSEUDO,
    name: '伪灵根',
    baseChance: 0.20,  // 20%
    roots: [SpiritualRootType.PSEUDO],
    enabled: true,
    description: '驽钝之资，修炼艰难'
  },
  {
    grade: RootGrade.FIVE_SINGLE,
    name: '五行单灵根',
    baseChance: 0.30,  // 30%
    roots: [
      SpiritualRootType.METAL,
      SpiritualRootType.WOOD,
      SpiritualRootType.WATER,
      SpiritualRootType.FIRE,
      SpiritualRootType.EARTH
    ],
    enabled: true,
    description: '金木水火土五行之一，修炼速度中等'
  },
  {
    grade: RootGrade.TRUE,
    name: '真灵根（杂灵根）',
    baseChance: 0.30,  // 30%
    roots: [SpiritualRootType.QI],
    enabled: true,
    description: '天地元气凝聚而成，修炼速度较快'
  },
  {
    grade: RootGrade.FIVE_DOUBLE,
    name: '五行双灵根',
    baseChance: 0.10,  // 10%
    roots: [],  // 未来实现：需要扩展数据结构支持多灵根
    enabled: false,  // ❌ 暂未实现
    description: '同时拥有两种五行灵根，潜力巨大'
  },
  {
    grade: RootGrade.HEAVENLY,
    name: '天灵根',
    baseChance: 0.05,  // 5%
    roots: [
      SpiritualRootType.LIGHT,
      SpiritualRootType.DARK
    ],
    enabled: true,
    description: '天地间最稀有的灵根，万中无一'
  },
  {
    grade: RootGrade.FIVE_TRIPLE,
    name: '五行三灵根',
    baseChance: 0.05,  // 5%
    roots: [],  // 未来实现
    enabled: false,  // ❌ 暂未实现
    description: '同时拥有三种五行灵根，极为罕见'
  }
]

/**
 * 验证概率配置是否合法
 */
export function validateFateDistribution(): void {
  // 1. 检查总概率是否为 100%
  const total = FATE_DISTRIBUTION.reduce((sum, config) => sum + config.baseChance, 0)
  const diff = Math.abs(total - 1.0)

  if (diff > 0.001) {  // 允许 0.1% 的浮点误差
    throw new Error(`天命基础概率总和不为100%！当前: ${(total * 100).toFixed(2)}%`)
  }

  // 2. 检查是否至少有一个启用的等级
  const enabledCount = FATE_DISTRIBUTION.filter(c => c.enabled).length
  if (enabledCount === 0) {
    throw new Error('至少需要启用一个灵根等级！')
  }

  // 3. 检查已启用的等级是否有灵根
  for (const config of FATE_DISTRIBUTION) {
    if (config.enabled && config.roots.length === 0) {
      throw new Error(`等级 ${config.name} 已启用但未配置灵根！`)
    }
  }
}

/**
 * 获取已启用的等级配置（归一化后）
 */
export function getEnabledGrades(): RootGradeConfig[] {
  const enabled = FATE_DISTRIBUTION.filter(c => c.enabled)

  // 计算已启用等级的概率总和
  const total = enabled.reduce((sum, config) => sum + config.baseChance, 0)

  // 归一化：将概率调整为总和 100%
  return enabled.map(config => ({
    ...config,
    baseChance: config.baseChance / total
  }))
}

/**
 * 性格调整范围常量
 */
export const PERSONALITY_ADJUSTMENT = {
  MAX_INCREASE: 0.08,  // 最多上调 +8%
  MAX_DECREASE: 0.10,  // 最多下调 -10%
}

/**
 * 统计平衡阈值
 * 只有当玩家总数达到此阈值时，才启用统计平衡算法
 */
export const STATISTICAL_BALANCE_THRESHOLD = 100

// 初始化时验证配置
validateFateDistribution()
