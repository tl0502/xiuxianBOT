/**
 * 问道包模板与Tag系统类型定义
 */

import { PersonalityScore } from '../utils/personality-analyzer'
import { SpiritualRootType } from '../config/spiritual-roots'

/**
 * 问题选项
 */
export interface QuestionOption {
  text: string
  value: string
}

/**
 * 问题定义
 */
export interface Question {
  id: string
  type: 'choice' | 'text'
  question: string
  options?: QuestionOption[]  // 选择题的选项（数量可变，支持2-10个选项）
  aiHint?: string  // AI评分提示（仅用于开放题）
}

/**
 * 预定义的问道包Tag
 */
export type PathPackageTag =
  | 'initiation'     // 步入仙途专用
  | 'opportunity'    // 机缘考验
  | 'enlightenment'  // 感悟包
  | 'demon'          // 魔道包
  | 'exploration'    // 遗迹探索
  | 'trial'          // 试炼问心
  | 'bond'           // 情义抉择
  | 'desire'         // 欲望试炼
  | string           // 支持自定义tag

/**
 * 奖励类型
 */
export type RewardType = 'spirit_stone' | 'cultivation' | 'item' | 'special'

/**
 * 奖励等级
 */
export type RewardTier = 'perfect' | 'good' | 'normal'

/**
 * 触发条件配置
 * v1.1.0 大幅扩展：支持精准匹配、灵根检查、资源检查等
 */
export interface TriggerConditions {
  // ========== 境界检查（支持范围匹配和精准匹配） ==========

  /**
   * 最低境界要求（0-8）
   * - number: 要求玩家境界 >= minRealm
   * - false: 跳过最低境界检查
   */
  minRealm?: number | false

  /**
   * 最高境界限制（0-8）
   * - number: 要求玩家境界 <= maxRealm
   * - false: 跳过最高境界检查
   */
  maxRealm?: number | false

  /**
   * 精准匹配境界（0-8）
   * - number: 要求玩家境界必须等于 exactRealm（与 min/maxRealmLevel 组合使用可精准匹配小境界）
   * - false: 不使用精准匹配，使用范围匹配
   *
   * 示例：
   * - exactRealm: 2, minRealmLevel: 1, maxRealmLevel: 1 表示必须是筑基期中期
   * - exactRealm: 2 表示必须是筑基期（任意小境界）
   */
  exactRealm?: number | false

  // ========== 小境界检查（与 exactRealm 组合使用） ==========

  /**
   * 最低小境界要求（0-3：初期/中期/后期/大圆满）
   * - number: 要求玩家小境界 >= minRealmLevel
   * - false: 跳过最低小境界检查
   */
  minRealmLevel?: number | false

  /**
   * 最高小境界限制（0-3）
   * - number: 要求玩家小境界 <= maxRealmLevel
   * - false: 跳过最高小境界检查
   */
  maxRealmLevel?: number | false

  // ========== 灵根检查 ==========

  /**
   * 需要的灵根
   * - SpiritualRootType[]: 满足其一即可（白名单）
   * - SpiritualRootType: 必须是该灵根
   * - false: 跳过灵根检查
   *
   * 示例：
   * - [SpiritualRootType.LIGHT, SpiritualRootType.DARK] 表示光灵根或暗灵根都可触发
   * - SpiritualRootType.HA 表示必须是哈根才能触发
   */
  requiredSpiritualRoots?: SpiritualRootType[] | SpiritualRootType | false

  /**
   * 禁止的灵根（黑名单）
   * 示例：[SpiritualRootType.PSEUDO] 表示伪灵根无法触发
   */
  forbiddenSpiritualRoots?: SpiritualRootType[]

  // ========== 资源检查 ==========

  /**
   * 最低灵石要求
   * - number: 要求玩家灵石 >= minSpiritStone
   * - false: 跳过灵石检查
   */
  minSpiritStone?: number | false

  // ========== 战绩检查 ==========

  /**
   * 最低击杀数要求
   * - number: 要求玩家总击杀数 >= minKillCount
   * - false: 跳过击杀数检查
   */
  minKillCount?: number | false

  // ========== 其他条件 ==========

  /**
   * 需要的道具
   */
  requiredItems?: string[]

  /**
   * 需要完成的前置任务
   */
  requiredQuests?: string[]

  // ========== 已废弃字段（保留向后兼容） ==========

  /**
   * @deprecated v1.1.0 已废弃：单个包的冷却时间，改用全局冷却机制
   * 请在 constants.ts 的 PathPackageConfig.GLOBAL_COOLDOWN_HOURS 中配置
   */
  cooldownHours?: number

  /**
   * @deprecated v1.1.0 已废弃：触发概率已移到 PathPackageTemplate 外层
   * 请使用 PathPackageTemplate.triggerChance 字段
   */
  triggerChance?: number
}

/**
 * 单个奖励配置
 */
export interface RewardConfig {
  type: RewardType            // 奖励类型
  value: number               // 奖励数值
  itemId?: string             // 道具ID（当type为item时）
  aiPromptHint: string        // 给AI的评语提示词
}

/**
 * 奖励层级配置
 */
export interface RewardTiers {
  perfect: RewardConfig       // 匹配度>90%
  good: RewardConfig          // 匹配度60-90%
  normal: RewardConfig        // 匹配度<60%
}

/**
 * 最佳分数配置
 */
export interface OptimalScoreConfig {
  target: PersonalityScore    // 9维理想分数
  rewards: RewardTiers        // 三级奖励配置
}

/**
 * AI评分配置（v0.6.0 新增）
 */
export interface AIScoringConfig {
  openQuestionIndices?: number[]  // 哪些题是开放题（索引，从0开始）
  maxScorePerDimension?: number   // AI单维度最多给多少分（默认8）
  minScorePerDimension?: number   // AI单维度最少给多少分（默认-3）
  fallbackScore?: PersonalityScore  // 降级时使用的默认分数
}

/**
 * 评分权重配置（v0.8.2 新增）
 */
export interface ScoringWeights {
  choiceWeight: number    // 选择题权重（0-1，默认0.3）
  openWeight: number      // 开放题权重（0-1，默认0.7）
}

/**
 * AI功能开关配置（v0.8.2 新增）
 */
export interface AIFeatures {
  enableScoring: boolean      // 是否启用AI打分
  enableEvaluation: boolean   // 是否启用AI评语
}

/**
 * 问道包模板（核心接口）
 * v1.1.0 更新：triggerChance 移到外层
 */
export interface PathPackageTemplate {
  id: string                              // 唯一标识符
  name: string                            // 问道包名称
  description: string                     // 问道包描述
  tags: PathPackageTag[]                  // Tag数组，支持多标签

  // ✨ v1.1.0 新增：触发概率（从 triggerConditions 中移出）
  triggerChance: number                   // 基础触发概率（0-1），用于包抽取时的加权随机

  // 触发条件
  triggerConditions: TriggerConditions

  // ✨ v0.6.0 更新：问题列表（支持可变数量，1-10题）
  questions: Question[]

  // 最佳分数配置（用于奖励计算，可选）
  optimalScore?: OptimalScoreConfig

  // ✨ v0.6.0 新增：AI评分配置
  requiresAI?: boolean                    // 是否需要AI评分开放题（默认false，向后兼容，等价于两个新开关都设为true）
  aiScoringConfig?: AIScoringConfig       // AI评分详细配置

  // ✨ v0.8.2 新增：评分权重配置
  scoringWeights?: ScoringWeights         // 选择题和开放题的权重（默认0.3/0.7）

  // ✨ v0.8.2 新增：AI功能开关（独立控制）
  aiFeatures?: AIFeatures                 // AI功能开关（打分和评语独立控制）

  // 元信息
  version?: string                        // 版本号
  author?: string                         // 作者
  createdAt?: string                      // 创建日期
  enabled?: boolean                       // 是否启用（默认true）
}

/**
 * 分数匹配结果
 */
export interface MatchResult {
  matchRate: number           // 匹配度百分比 (0-100)
  tier: RewardTier            // 奖励等级
  reward: RewardConfig        // 获得的奖励配置
  dimensionScores: {          // 各维度得分详情
    dimension: string
    playerScore: number
    targetScore: number
    difference: number
  }[]
}

/**
 * 问道包执行结果
 */
export interface PackageExecutionResult {
  success: boolean
  packageId: string
  packageName: string

  // 性格评分
  personalityScore: PersonalityScore

  // 匹配结果（如果有最佳分数配置）
  matchResult?: MatchResult

  // AI生成的内容
  aiResponse?: {
    evaluation: string        // 评价语句
    rewardReason: string      // 奖励原因
  }

  // 发放的奖励
  rewards?: {
    type: RewardType
    value: number
    description: string
  }[]

  message: string
}

/**
 * 问道包注册信息
 */
export interface PackageRegistryEntry {
  package: PathPackageTemplate
  registeredAt: Date
  enabled: boolean
}

/**
 * Tag查询选项
 */
export interface TagQueryOptions {
  tags: PathPackageTag[]      // 要查询的tag列表
  matchAll?: boolean          // 是否需要匹配所有tag（默认false，匹配任一即可）
  checkConditions?: boolean   // 是否检查触发条件（默认true）
  playerRealm?: number        // 玩家境界（用于条件检查）
  playerId?: string           // 玩家ID（用于冷却检查）
}

/**
 * 向后兼容：旧的PathPackageType映射到tag
 */
export const LEGACY_TYPE_TO_TAG: Record<string, PathPackageTag> = {
  'initiation': 'initiation',
  'trial': 'trial',
  'enlightenment': 'enlightenment',
  'custom': 'exploration'
}
