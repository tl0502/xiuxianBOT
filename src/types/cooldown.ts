/**
 * 冷却系统类型定义
 * v1.2.0 新增
 */

/**
 * 冷却类型
 */
export type CooldownType = 'command' | 'skill' | 'item' | 'event' | 'package'

/**
 * 冷却记录数据库模型
 */
export interface CooldownRecord {
  id: number                    // 主键
  userId: string                // 用户ID（全局事件可以用 'global'）
  cooldownType: CooldownType    // 冷却类型
  cooldownKey: string           // 冷却标识：命令名/技能ID/物品ID等
  lastTriggerTime: Date         // 最后触发时间
  expiresAt: Date               // 过期时间（预计算，便于查询和清理）
  metadata?: string             // JSON，存储额外信息
}

/**
 * 冷却检查结果
 */
export interface CooldownCheckResult {
  canUse: boolean               // 是否可以使用
  remainingHours?: number       // 剩余冷却时间（小时）
  remainingMinutes?: number     // 剩余冷却时间（分钟）
  lastTriggerTime?: Date        // 最后触发时间
}

/**
 * 冷却元数据（可选，用于记录额外信息）
 */
export interface CooldownMetadata {
  packageId?: string            // 问道包ID
  triggerCount?: number         // 触发次数
  [key: string]: any            // 扩展字段
}
