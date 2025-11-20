/**
 * 问道包模板与Tag系统类型定义
 */

import { PersonalityScore } from '../utils/personality-analyzer'
import { Question } from '../config/questioning'

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
 */
export interface TriggerConditions {
  minRealm?: number           // 最低境界要求
  maxRealm?: number           // 最高境界限制
  cooldownHours?: number      // 冷却时间（小时）
  triggerChance?: number      // 随机触发概率 (0-1)
  requiredItems?: string[]    // 需要的道具
  requiredQuests?: string[]   // 需要完成的前置任务
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
 * 问道包模板（核心接口）
 */
export interface PathPackageTemplate {
  id: string                              // 唯一标识符
  name: string                            // 问道包名称
  description: string                     // 问道包描述
  tags: PathPackageTag[]                  // Tag数组，支持多标签

  // 触发条件
  triggerConditions: TriggerConditions

  // ✨ v0.6.0 更新：问题列表（支持可变数量，1-10题）
  questions: Question[]

  // 最佳分数配置（用于奖励计算，可选）
  optimalScore?: OptimalScoreConfig

  // ✨ v0.6.0 新增：AI评分配置
  requiresAI?: boolean                    // 是否需要AI评分开放题（默认false）
  aiScoringConfig?: AIScoringConfig       // AI评分详细配置

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
