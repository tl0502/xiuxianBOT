/**
 * 灵根注册表
 *
 * v0.9.0 重构：统一管理灵根的所有配置
 * - 单灵根基础概率（取代等级展开逻辑）
 * - 性格匹配权重（取代硬编码的switch-case）
 * - 可获得性控制
 * - 属性加成
 * - 隐藏包亲和（可选）
 */

import { SpiritualRootType, SpiritualRootCategory } from './spiritual-roots'
import { PathPackageConfig } from './constants'

/**
 * 9维性格评分类型
 * 与 personality-analyzer.ts 中的 PersonalityScore 保持一致
 */
export interface PersonalityWeights {
  determination?: number  // 决断
  courage?: number        // 勇气
  stability?: number      // 稳重
  focus?: number          // 专注
  honesty?: number        // 诚信
  kindness?: number       // 善良
  greed?: number          // 贪婪（通常为负权重）
  impatience?: number     // 急躁（通常为负权重）
  manipulation?: number   // 操控（通常为负权重）
}

/**
 * 属性加成配置
 */
export interface RootBonuses {
  cultivation?: number      // 修炼速度倍率（如 1.5 = 150%）
  breakthrough?: number     // 突破成功率加成（如 0.1 = +10%）
  combatPower?: number      // 战力倍率
  spiritStoneGain?: number  // 灵石收益倍率
  comprehension?: number    // 悟性加成
}

/**
 * 隐藏包亲和配置
 */
export interface PackageAffinity {
  packageId: string     // 问道包ID
  bonusChance: number   // 额外触发概率（如 0.3 = +30%）
}

/**
 * 灵根注册表条目
 */
export interface SpiritualRootEntry {
  // 基础信息
  type: SpiritualRootType
  category: SpiritualRootCategory
  name: string
  description: string
  rarity: number  // 1-5，5最稀有

  // 核心：单灵根基础概率（已归一化，总和100%）
  baseChance: number

  // 核心：步入仙途时是否可获得
  initialObtainable: boolean

  // 核心：性格匹配权重
  // 正值表示正相关，负值表示负相关
  // 最终匹配分数 = Σ(personality[trait] × weight)
  personalityWeights: PersonalityWeights

  // 属性加成
  bonuses: RootBonuses

  // 性格特征描述（用于AI prompt）
  personalityTraits: string[]

  // 可选：隐藏包亲和
  packageAffinities?: PackageAffinity[]
}

/**
 * 灵根注册表
 *
 * 概率说明（基于现有配置归一化）：
 * - 伪灵根: 23.5%
 * - 五行各: 7% × 5 = 35%
 * - 气灵根: 35.5%
 * - 光暗各: 3% × 2 = 6%
 * 总计: 100%
 */
export const SPIRITUAL_ROOT_REGISTRY: Record<SpiritualRootType, SpiritualRootEntry> = {
  // ==================== 天灵根 ====================
  [SpiritualRootType.LIGHT]: {
    type: SpiritualRootType.LIGHT,
    category: SpiritualRootCategory.HEAVENLY,
    name: '光灵根',
    description: '天生亲和光明之力，修炼光系功法事半功倍',
    rarity: 5,
    baseChance: 0.03,  // 3%
    initialObtainable: true,
    personalityWeights: {
      kindness: 0.5,       // 善良 +0.5
      courage: 0.3,        // 勇气 +0.3
      honesty: 0.2,        // 诚信 +0.2
      greed: -0.5,         // 贪婪 -0.5
      manipulation: -0.5   // 操控 -0.5
    },
    bonuses: {
      cultivation: 1.5,
      breakthrough: 0.1
    },
    personalityTraits: ['正义', '善良', '光明磊落', '守护', '无私', '仁德']
  },

  [SpiritualRootType.DARK]: {
    type: SpiritualRootType.DARK,
    category: SpiritualRootCategory.HEAVENLY,
    name: '暗灵根',
    description: '天生亲和黑暗之力，修炼暗系功法威力倍增',
    rarity: 5,
    baseChance: 0.03,  // 3%
    initialObtainable: true,
    personalityWeights: {
      focus: 0.4,          // 专注 +0.4
      stability: 0.4,      // 稳重 +0.4
      determination: 0.2,  // 决断 +0.2
      impatience: -0.3     // 急躁 -0.3
    },
    bonuses: {
      cultivation: 1.5,
      combatPower: 1.2
    },
    personalityTraits: ['冷静', '独立', '深沉', '果决', '神秘', '理智']
  },

  // ==================== 五行灵根 ====================
  [SpiritualRootType.METAL]: {
    type: SpiritualRootType.METAL,
    category: SpiritualRootCategory.FIVE_ELEMENT,
    name: '金灵根',
    description: '金之力凝聚，攻击锋利如刃',
    rarity: 3,
    baseChance: 0.07,  // 7%
    initialObtainable: true,
    personalityWeights: {
      determination: 0.5,  // 决断 +0.5
      courage: 0.3,        // 勇气 +0.3
      focus: 0.2,          // 专注 +0.2
      stability: -0.1      // 稳重 -0.1（过于稳重不适合金）
    },
    bonuses: {
      combatPower: 1.15
    },
    personalityTraits: ['果断', '锐利', '进取', '坚毅', '勇武', '刚强']
  },

  [SpiritualRootType.WOOD]: {
    type: SpiritualRootType.WOOD,
    category: SpiritualRootCategory.FIVE_ELEMENT,
    name: '木灵根',
    description: '木之力生生不息，恢复能力极强',
    rarity: 3,
    baseChance: 0.07,  // 7%
    initialObtainable: true,
    personalityWeights: {
      kindness: 0.6,       // 善良 +0.6
      honesty: 0.3,        // 诚信 +0.3
      stability: 0.1,      // 稳重 +0.1
      greed: -0.4,         // 贪婪 -0.4
      impatience: -0.3     // 急躁 -0.3
    },
    bonuses: {
      cultivation: 1.2
    },
    personalityTraits: ['仁慈', '温和', '包容', '生机', '慈悲', '宽厚']
  },

  [SpiritualRootType.WATER]: {
    type: SpiritualRootType.WATER,
    category: SpiritualRootCategory.FIVE_ELEMENT,
    name: '水灵根',
    description: '水之力柔韧变化，适应性强',
    rarity: 3,
    baseChance: 0.07,  // 7%
    initialObtainable: true,
    personalityWeights: {
      focus: 0.5,          // 专注 +0.5
      stability: 0.3,      // 稳重 +0.3
      determination: 0.2,  // 决断 +0.2
      impatience: -0.3     // 急躁 -0.3
    },
    bonuses: {
      cultivation: 1.15,
      breakthrough: 0.05
    },
    personalityTraits: ['灵活', '智慧', '适应', '圆融', '变通', '睿智']
  },

  [SpiritualRootType.FIRE]: {
    type: SpiritualRootType.FIRE,
    category: SpiritualRootCategory.FIVE_ELEMENT,
    name: '火灵根',
    description: '火之力狂暴炽热，攻击力强大',
    rarity: 3,
    baseChance: 0.07,  // 7%
    initialObtainable: true,
    personalityWeights: {
      courage: 0.5,        // 勇气 +0.5
      determination: 0.3,  // 决断 +0.3
      impatience: 0.1,     // 急躁 +0.1（急躁反而适合火）
      stability: -0.2      // 稳重 -0.2（过于稳重不适合火）
    },
    bonuses: {
      combatPower: 1.2
    },
    personalityTraits: ['热情', '激情', '冲动', '勇敢', '直率', '豪爽']
  },

  [SpiritualRootType.EARTH]: {
    type: SpiritualRootType.EARTH,
    category: SpiritualRootCategory.FIVE_ELEMENT,
    name: '土灵根',
    description: '土之力厚重稳固，防御力超群',
    rarity: 3,
    baseChance: 0.07,  // 7%
    initialObtainable: true,
    personalityWeights: {
      stability: 0.6,      // 稳重 +0.6
      honesty: 0.3,        // 诚信 +0.3
      focus: 0.1,          // 专注 +0.1
      impatience: -0.4     // 急躁 -0.4
    },
    bonuses: {
      breakthrough: 0.08
    },
    personalityTraits: ['稳重', '踏实', '坚韧', '沉着', '可靠', '厚重']
  },

  // ==================== 真灵根 ====================
  [SpiritualRootType.QI]: {
    type: SpiritualRootType.QI,
    category: SpiritualRootCategory.TRUE,
    name: '气灵根',
    description: '天地元气凝聚而成，修炼速度极快',
    rarity: 4,
    baseChance: 0.355,  // 35.5%
    initialObtainable: true,
    personalityWeights: {
      focus: 0.4,          // 专注 +0.4
      honesty: 0.3,        // 诚信 +0.3
      stability: 0.3,      // 稳重 +0.3
      greed: -0.3,         // 贪婪 -0.3
      manipulation: -0.4   // 操控 -0.4
    },
    bonuses: {
      cultivation: 1.8,
      breakthrough: 0.15
    },
    personalityTraits: ['超然', '悟性', '灵性', '天赋', '平衡', '通透']
  },

  // ==================== 伪灵根 ====================
  [SpiritualRootType.PSEUDO]: {
    type: SpiritualRootType.PSEUDO,
    category: SpiritualRootCategory.PSEUDO,
    name: '伪灵根',
    description: '驽钝之资，修炼艰难',
    rarity: 1,
    baseChance: 0.235,  // 23.5%
    initialObtainable: true,
    personalityWeights: {
      // 贪婪、操控、急躁会增加伪灵根概率
      greed: 0.4,          // 贪婪 +0.4
      manipulation: 0.5,   // 操控 +0.5
      impatience: 0.3,     // 急躁 +0.3
      // 优秀品质会降低伪灵根概率
      kindness: -0.2,      // 善良 -0.2
      courage: -0.2,       // 勇气 -0.2
      honesty: -0.2        // 诚信 -0.2
    },
    bonuses: {
      cultivation: 0.8
    },
    personalityTraits: ['平凡', '坚持', '意志', '不屈', '努力', '普通']
  },

  // ==================== 隐藏灵根 ====================
  [SpiritualRootType.HA]: {
    type: SpiritualRootType.HA,
    category: SpiritualRootCategory.HIDDEN,
    name: '哈根',
    description: '???神秘莫测的特殊灵根',
    rarity: 5,
    baseChance: 0.005,  // 0.5%（极稀有，但不参与初始分配）
    initialObtainable: false,  // 不可初始获得
    personalityWeights: {
      // 隐藏灵根的匹配规则可以很特殊
      focus: 0.3,
      determination: 0.3,
      stability: 0.2,
      manipulation: 0.2    // 甚至操控可以是正面的
    },
    bonuses: {
      cultivation: 2.0,
      breakthrough: 0.2,
      combatPower: 1.5
    },
    personalityTraits: ['神秘', '未知', '特殊'],
    // 隐藏包亲和示例
    packageAffinities: [
      // { packageId: 'hidden_chaos_trial', bonusChance: 0.5 }
    ]
  }
}

// ==================== 注册表服务函数 ====================

/**
 * 获取灵根条目
 */
export function getRootEntry(type: SpiritualRootType): SpiritualRootEntry {
  return SPIRITUAL_ROOT_REGISTRY[type]
}

/**
 * 获取所有可初始分配的灵根
 */
export function getInitialObtainableRoots(): SpiritualRootType[] {
  return Object.values(SPIRITUAL_ROOT_REGISTRY)
    .filter(entry => entry.initialObtainable)
    .map(entry => entry.type)
}

/**
 * 获取初始分配的基础概率分布（已归一化）
 *
 * @returns Map<灵根类型, 概率>，总和为1.0
 */
export function getBaseChanceDistribution(): Map<SpiritualRootType, number> {
  const obtainable = Object.values(SPIRITUAL_ROOT_REGISTRY)
    .filter(entry => entry.initialObtainable)

  // 计算可分配灵根的概率总和
  const total = obtainable.reduce((sum, entry) => sum + entry.baseChance, 0)

  // 归一化
  const distribution = new Map<SpiritualRootType, number>()
  for (const entry of obtainable) {
    distribution.set(entry.type, entry.baseChance / total)
  }

  return distribution
}

/**
 * 计算灵根与性格的匹配分数
 *
 * 使用灵根模板内置的 personalityWeights 进行计算
 * @param rootType 灵根类型
 * @param personality 9维性格评分（0-10）
 * @returns 匹配分数（-10 到 +10）
 */
export function calculatePersonalityMatch(
  rootType: SpiritualRootType,
  personality: Record<string, number>
): number {
  const entry = SPIRITUAL_ROOT_REGISTRY[rootType]
  if (!entry) return 0

  let score = 0

  // 遍历灵根的性格权重配置
  for (const [trait, weight] of Object.entries(entry.personalityWeights)) {
    const personalityValue = personality[trait] ?? 0
    score += personalityValue * (weight ?? 0)
  }

  // 限制在 MATCH_SCORE_MIN 到 MATCH_SCORE_MAX 范围
  return Math.max(PathPackageConfig.MATCH_SCORE_MIN, Math.min(PathPackageConfig.MATCH_SCORE_MAX, score))
}

/**
 * 获取注册表统计信息
 */
export function getRegistryStats(): {
  total: number
  initialObtainable: number
  hidden: number
  totalBaseChance: number
} {
  const entries = Object.values(SPIRITUAL_ROOT_REGISTRY)
  const obtainable = entries.filter(e => e.initialObtainable)
  const hidden = entries.filter(e => !e.initialObtainable)

  return {
    total: entries.length,
    initialObtainable: obtainable.length,
    hidden: hidden.length,
    totalBaseChance: obtainable.reduce((sum, e) => sum + e.baseChance, 0)
  }
}

/**
 * 验证注册表配置
 */
export function validateRegistry(): void {
  const obtainable = Object.values(SPIRITUAL_ROOT_REGISTRY)
    .filter(e => e.initialObtainable)

  const total = obtainable.reduce((sum, e) => sum + e.baseChance, 0)

  // 允许小误差（因为会归一化）
  if (total < 0.5) {
    throw new Error(`可初始分配灵根的概率总和过低: ${(total * 100).toFixed(2)}%`)
  }

  // 检查每个灵根是否有有效配置
  for (const entry of Object.values(SPIRITUAL_ROOT_REGISTRY)) {
    if (!entry.name || !entry.description) {
      throw new Error(`灵根 ${entry.type} 缺少名称或描述`)
    }
    if (entry.baseChance < 0) {
      throw new Error(`灵根 ${entry.type} 的基础概率不能为负`)
    }
  }
}

// 初始化时验证
validateRegistry()
