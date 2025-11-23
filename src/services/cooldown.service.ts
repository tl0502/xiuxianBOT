import { Context } from 'koishi'
import { CooldownType, CooldownCheckResult, CooldownMetadata } from '../types/cooldown'

/**
 * 通用冷却服务
 * v1.2.0 新增
 *
 * 支持多种冷却类型：command, skill, item, event, package
 */
export class CooldownService {
  constructor(private context: Context) {}

  /**
   * 检查冷却
   * @param userId 用户ID
   * @param cooldownType 冷却类型
   * @param cooldownKey 冷却标识（命令名/技能ID等）
   * @returns 冷却检查结果
   */
  async checkCooldown(
    userId: string,
    cooldownType: CooldownType,
    cooldownKey: string
  ): Promise<CooldownCheckResult> {
    try {
      // 查询冷却记录
      const [record] = await this.context.database.get('xiuxian_cooldown_v3', {
        userId,
        cooldownType,
        cooldownKey
      } as any)

      // 没有记录，可以使用
      if (!record) {
        return { canUse: true }
      }

      // 检查是否过期
      const now = Date.now()
      const expiresAt = new Date(record.expiresAt).getTime()

      if (now >= expiresAt) {
        // 已过期，可以使用
        return { canUse: true }
      }

      // 计算剩余时间
      const remainingMs = expiresAt - now
      const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000))
      const remainingMinutes = Math.ceil(remainingMs / (60 * 1000))

      return {
        canUse: false,
        remainingHours,
        remainingMinutes,
        lastTriggerTime: new Date(record.lastTriggerTime)
      }
    } catch (error) {
      this.context.logger.error(`检查冷却失败:`, error)
      // 出错时允许使用，避免阻塞
      return { canUse: true }
    }
  }

  /**
   * 设置冷却（成功完成时调用）
   * @param userId 用户ID
   * @param cooldownType 冷却类型
   * @param cooldownKey 冷却标识
   * @param durationHours 冷却时长（小时）
   * @param metadata 额外元数据（可选）
   */
  async setCooldown(
    userId: string,
    cooldownType: CooldownType,
    cooldownKey: string,
    durationHours: number,
    metadata?: CooldownMetadata
  ): Promise<void> {
    try {
      const now = new Date()
      const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000)

      // 查询是否已存在记录
      const [existing] = await this.context.database.get('xiuxian_cooldown_v3', {
        userId,
        cooldownType,
        cooldownKey
      } as any)

      if (existing) {
        // 更新现有记录
        await this.context.database.set('xiuxian_cooldown_v3', {
          userId,
          cooldownType,
          cooldownKey
        } as any, {
          lastTriggerTime: now,
          expiresAt,
          metadata: metadata ? JSON.stringify(metadata) : '{}'
        } as any)
      } else {
        // 创建新记录
        await this.context.database.create('xiuxian_cooldown_v3', {
          userId,
          cooldownType,
          cooldownKey,
          lastTriggerTime: now,
          expiresAt,
          metadata: metadata ? JSON.stringify(metadata) : '{}'
        } as any)
      }

      this.context.logger.debug(`[冷却设置] ${userId}/${cooldownType}/${cooldownKey} = ${durationHours}小时`)
    } catch (error) {
      this.context.logger.error(`设置冷却失败:`, error)
    }
  }

  /**
   * 清除冷却
   * @param userId 用户ID
   * @param cooldownType 冷却类型
   * @param cooldownKey 冷却标识
   */
  async clearCooldown(
    userId: string,
    cooldownType: CooldownType,
    cooldownKey: string
  ): Promise<void> {
    try {
      await this.context.database.remove('xiuxian_cooldown_v3', {
        userId,
        cooldownType,
        cooldownKey
      } as any)

      this.context.logger.debug(`[冷却清除] ${userId}/${cooldownType}/${cooldownKey}`)
    } catch (error) {
      this.context.logger.error(`清除冷却失败:`, error)
    }
  }

  /**
   * 批量清理过期记录
   * @returns 清理的记录数
   */
  async cleanupExpired(): Promise<number> {
    try {
      const now = new Date()

      // 查询所有过期记录
      const expiredRecords = await this.context.database.get('xiuxian_cooldown_v3', {
        expiresAt: { $lt: now }
      } as any)

      if (expiredRecords.length === 0) {
        return 0
      }

      // 删除过期记录
      await this.context.database.remove('xiuxian_cooldown_v3', {
        expiresAt: { $lt: now }
      } as any)

      this.context.logger.info(`[冷却清理] 清理了 ${expiredRecords.length} 条过期记录`)
      return expiredRecords.length
    } catch (error) {
      this.context.logger.error(`清理过期冷却失败:`, error)
      return 0
    }
  }

  /**
   * 获取用户的所有冷却记录
   * @param userId 用户ID
   * @returns 冷却记录列表
   */
  async getUserCooldowns(userId: string): Promise<any[]> {
    try {
      return await this.context.database.get('xiuxian_cooldown_v3', {
        userId
      } as any)
    } catch (error) {
      this.context.logger.error(`获取用户冷却失败:`, error)
      return []
    }
  }
}
