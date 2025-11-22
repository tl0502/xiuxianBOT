/**
 * Buff管理服务
 *
 * v1.0.0 新增
 * 负责buff的增删改查、叠加控制、过期清理等核心功能
 */

import { IAppContext } from '../adapters/interfaces'
import { Buff, BuffType, BuffSource, CreateBuffInput, BuffBonus, BuffQueryOptions, BuffServiceResult } from '../types/buff'

/**
 * Buff管理服务类
 */
export class BuffService {
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(private context: IAppContext) {}

  /**
   * 添加buff
   *
   * @param buff Buff数据（不含id和createTime）
   * @returns 创建的Buff对象
   */
  async addBuff(buff: CreateBuffInput): Promise<BuffServiceResult<Buff>> {
    try {
      // 检查是否可叠加
      if (!buff.stackable) {
        // 不可叠加：移除同类型、同来源的旧buff
        await this.removeBuffByTypeAndSource(buff.userId, buff.buffType, buff.buffSource)
      } else if (buff.maxStacks) {
        // 可叠加但有上限：限制叠加层数
        await this.limitStacks(buff.userId, buff.buffType, buff.buffSource, buff.maxStacks)
      }

      // 创建新buff
      const created = await this.context.database.create('xiuxian_buff_v3', {
        ...buff,
        createTime: new Date()
      } as Buff)

      this.context.logger.debug(`Buff已添加: ${buff.buffType} for ${buff.userId}`)

      return {
        success: true,
        message: 'Buff添加成功',
        data: created
      }
    } catch (error) {
      this.context.logger.error('添加Buff失败:', error)
      return {
        success: false,
        message: '添加Buff失败'
      }
    }
  }

  /**
   * 获取玩家所有有效buff
   *
   * @param userId 玩家ID
   * @returns 有效的Buff列表
   */
  async getActiveBuffs(userId: string): Promise<Buff[]> {
    const now = new Date()

    // 查询所有属于该玩家且已生效的buff
    const buffs = await this.context.database.get('xiuxian_buff_v3', {
      userId,
      startTime: { $lte: now }
    } as any)

    // 过滤出未过期的buff
    return buffs.filter(b => !b.endTime || b.endTime > now)
  }

  /**
   * 查询buff（支持多种条件）
   *
   * @param userId 玩家ID
   * @param options 查询选项
   * @returns Buff列表
   */
  async queryBuffs(userId: string, options?: BuffQueryOptions): Promise<Buff[]> {
    let buffs: Buff[]

    if (options?.activeOnly) {
      buffs = await this.getActiveBuffs(userId)
    } else {
      buffs = await this.context.database.get('xiuxian_buff_v3', { userId } as any)
    }

    // 类型过滤
    if (options?.buffType) {
      buffs = buffs.filter(b => b.buffType === options.buffType)
    }

    // 来源过滤
    if (options?.buffSource) {
      buffs = buffs.filter(b => b.buffSource === options.buffSource)
    }

    // 排序
    if (options?.sortBy) {
      const sortKey = options.sortBy
      const order = options.sortOrder === 'desc' ? -1 : 1

      buffs.sort((a, b) => {
        const aValue = a[sortKey]
        const bValue = b[sortKey]

        if (aValue instanceof Date && bValue instanceof Date) {
          return order * (aValue.getTime() - bValue.getTime())
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return order * (aValue - bValue)
        }

        return 0
      })
    }

    return buffs
  }

  /**
   * 计算某类型buff的总加成
   *
   * @param userId 玩家ID
   * @param buffType Buff类型
   * @returns 加成值（倍率和固定值分开）
   */
  async calculateBuffBonus(userId: string, buffType: BuffType): Promise<BuffBonus> {
    const buffs = await this.getActiveBuffs(userId)
    const typeBuffs = buffs.filter(b => b.buffType === buffType)

    let multiplier = 0
    let additive = 0

    for (const buff of typeBuffs) {
      if (buff.isMultiplier) {
        multiplier += buff.value
      } else {
        additive += buff.value
      }
    }

    return { multiplier, additive }
  }

  /**
   * 移除指定buff
   *
   * @param buffId Buff ID
   */
  async removeBuff(buffId: number): Promise<BuffServiceResult> {
    try {
      await this.context.database.remove('xiuxian_buff_v3', buffId)
      this.context.logger.debug(`Buff已移除: ID=${buffId}`)

      return {
        success: true,
        message: 'Buff移除成功'
      }
    } catch (error) {
      this.context.logger.error('移除Buff失败:', error)
      return {
        success: false,
        message: '移除Buff失败'
      }
    }
  }

  /**
   * 移除玩家的所有buff（用于特殊情况，如GM清理）
   *
   * @param userId 玩家ID
   */
  async removeAllBuffs(userId: string): Promise<BuffServiceResult<number>> {
    try {
      const buffs = await this.context.database.get('xiuxian_buff_v3', { userId } as any)

      for (const buff of buffs) {
        await this.context.database.remove('xiuxian_buff_v3', buff.id)
      }

      this.context.logger.info(`已清除${userId}的所有buff，共${buffs.length}个`)

      return {
        success: true,
        message: `已清除${buffs.length}个buff`,
        data: buffs.length
      }
    } catch (error) {
      this.context.logger.error('清除所有Buff失败:', error)
      return {
        success: false,
        message: '清除Buff失败'
      }
    }
  }

  /**
   * 清理过期buff（定时任务调用）
   *
   * @returns 清理的buff数量
   */
  async cleanExpiredBuffs(): Promise<number> {
    try {
      const now = new Date()

      // 查找所有过期的buff（endTime不为null且小于当前时间）
      const expired = await this.context.database.get('xiuxian_buff_v3', {
        endTime: { $lt: now, $ne: null }
      } as any)

      // 删除过期buff
      for (const buff of expired) {
        await this.context.database.remove('xiuxian_buff_v3', buff.id)
      }

      if (expired.length > 0) {
        this.context.logger.info(`已清理${expired.length}个过期buff`)
      }

      return expired.length
    } catch (error) {
      this.context.logger.error('清理过期Buff失败:', error)
      return 0
    }
  }

  /**
   * 启动定时清理任务（每小时执行一次）
   */
  startCleanupTask(): void {
    if (this.cleanupInterval) {
      this.context.logger.warn('Buff清理任务已在运行')
      return
    }

    // 立即执行一次
    this.cleanExpiredBuffs()

    // 每小时执行一次
    this.cleanupInterval = setInterval(() => {
      this.cleanExpiredBuffs()
    }, 60 * 60 * 1000)

    this.context.logger.info('Buff定时清理任务已启动（每小时执行一次）')
  }

  /**
   * 停止定时清理任务（插件卸载时调用）
   */
  stopCleanupTask(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
      this.context.logger.info('Buff定时清理任务已停止')
    }
  }

  /**
   * 移除指定类型和来源的buff（私有方法）
   *
   * @param userId 玩家ID
   * @param buffType Buff类型
   * @param buffSource Buff来源
   */
  private async removeBuffByTypeAndSource(
    userId: string,
    buffType: BuffType,
    buffSource: BuffSource
  ): Promise<void> {
    const buffs = await this.context.database.get('xiuxian_buff_v3', {
      userId,
      buffType,
      buffSource
    } as any)

    for (const buff of buffs) {
      await this.context.database.remove('xiuxian_buff_v3', buff.id)
    }

    if (buffs.length > 0) {
      this.context.logger.debug(`已移除${buffs.length}个旧buff: ${buffType} from ${buffSource}`)
    }
  }

  /**
   * 限制叠加层数（私有方法）
   *
   * @param userId 玩家ID
   * @param buffType Buff类型
   * @param buffSource Buff来源
   * @param maxStacks 最大层数
   */
  private async limitStacks(
    userId: string,
    buffType: BuffType,
    buffSource: BuffSource,
    maxStacks: number
  ): Promise<void> {
    const buffs = await this.context.database.get('xiuxian_buff_v3', {
      userId,
      buffType,
      buffSource
    } as any, {
      sort: { createTime: 'desc' } // 按创建时间倒序（新的在前）
    })

    // 移除超出层数的旧buff（保留最新的maxStacks-1个，为新buff留位置）
    for (let i = maxStacks - 1; i < buffs.length; i++) {
      await this.context.database.remove('xiuxian_buff_v3', buffs[i].id)
      this.context.logger.debug(`移除超出层数的旧buff: ${buffType}`)
    }
  }
}
