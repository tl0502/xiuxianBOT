/**
 * Buff系统类型定义
 *
 * v1.0.0 新增
 * 支持多来源、多类型的加成系统（永久/限时、叠加/不叠加）
 */

/**
 * Buff类型（加成维度）
 */
export enum BuffType {
  /** 修炼速度倍率 */
  CULTIVATION_SPEED = 'cultivation_speed',

  /** 突破成功率 */
  BREAKTHROUGH_RATE = 'breakthrough_rate',

  /** 修为需求倍率（正值增加难度，负值降低需求） */
  CULTIVATION_REQUIREMENT = 'cultivation_requirement',

  /** 战力倍率 */
  COMBAT_POWER = 'combat_power',

  /** 灵石收益倍率 */
  SPIRIT_STONE_GAIN = 'spirit_stone_gain'
}

/**
 * Buff来源（加成来源系统）
 */
export enum BuffSource {
  /** 物品（丹药、法宝等消耗品） */
  ITEM = 'item',

  /** 装备（穿戴式装备） */
  EQUIPMENT = 'equipment',

  /** 事件（随机事件、任务奖励等） */
  EVENT = 'event',

  /** 问心/问道奖励 */
  QUESTIONING = 'questioning',

  /** 宗门加成 */
  SECT = 'sect',

  /** 特殊加成（GM赋予、系统活动等） */
  SPECIAL = 'special'
}

/**
 * Buff数据模型
 *
 * 存储在 xiuxian_buff_v3 表中
 */
export interface Buff {
  /** 自增主键 */
  id: number

  /** 玩家ID */
  userId: string

  /** 加成类型 */
  buffType: BuffType

  /** 加成来源 */
  buffSource: BuffSource

  /** 来源ID（可选，如物品ID、装备ID、事件ID） */
  sourceId?: string

  // ========== 加成数值 ==========

  /** 加成数值（可正可负） */
  value: number

  /**
   * 是否为倍率（乘法项）
   * - true: 倍率加成（如 0.3 表示 +30%）
   * - false: 固定值加成（如 0.15 表示 +0.15）
   */
  isMultiplier: boolean

  // ========== 时效性 ==========

  /** 生效时间 */
  startTime: Date

  /**
   * 过期时间
   * - null: 永久（不推荐，应使用Player表的永久字段）
   * - Date: 限时buff
   */
  endTime: Date | null

  // ========== 叠加规则 ==========

  /**
   * 是否可叠加
   * - true: 可与同类型、同来源的buff叠加
   * - false: 新buff会覆盖旧buff
   */
  stackable: boolean

  /** 最大叠加层数（仅当stackable=true时有效） */
  maxStacks?: number

  // ========== 描述信息 ==========

  /** 描述文本（显示给玩家） */
  description: string

  /** 创建时间 */
  createTime: Date
}

/**
 * 创建Buff的输入参数（省略自动生成的字段）
 */
export type CreateBuffInput = Omit<Buff, 'id' | 'createTime'>

/**
 * Buff加成计算结果
 */
export interface BuffBonus {
  /** 倍率加成总和（乘法项，如 0.5 表示 +50%） */
  multiplier: number

  /** 固定值加成总和（加法项） */
  additive: number
}

/**
 * Buff查询选项
 */
export interface BuffQueryOptions {
  /** 仅查询指定类型 */
  buffType?: BuffType

  /** 仅查询指定来源 */
  buffSource?: BuffSource

  /** 仅查询有效的buff（当前时间在生效期内） */
  activeOnly?: boolean

  /** 排序方式 */
  sortBy?: 'createTime' | 'endTime' | 'value'

  /** 排序方向 */
  sortOrder?: 'asc' | 'desc'
}

/**
 * Buff服务返回结果
 */
export interface BuffServiceResult<T = any> {
  success: boolean
  message?: string
  data?: T
}
