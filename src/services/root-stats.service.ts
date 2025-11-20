import { Context } from 'koishi'
import { FATE_DISTRIBUTION } from '../config/fate-distribution'
import { SpiritualRootType } from '../config/spiritual-roots'

/**
 * 初始灵根统计服务
 */
export class RootStatsService {
  constructor(private ctx: Context) {}

  /**
   * 初始化统计表（如果不存在）
   */
  async initializeStats(): Promise<void> {
    // 为所有可能的灵根类型创建统计记录
    const allRoots = new Set<SpiritualRootType>()

    for (const config of FATE_DISTRIBUTION) {
      if (config.enabled) {
        for (const root of config.roots) {
          allRoots.add(root)
        }
      }
    }

    for (const rootType of allRoots) {
      const existing = await this.ctx.database.get('xiuxian_initial_root_stats', {
        rootType
      })

      if (existing.length === 0) {
        await this.ctx.database.create('xiuxian_initial_root_stats', {
          rootType,
          count: 0,
          lastUpdated: new Date()
        })
      }
    }
  }

  /**
   * 增加灵根分配计数
   */
  async incrementRootCount(rootType: SpiritualRootType): Promise<void> {
    const stats = await this.ctx.database.get('xiuxian_initial_root_stats', {
      rootType
    })

    if (stats.length === 0) {
      // 不存在，创建新记录
      await this.ctx.database.create('xiuxian_initial_root_stats', {
        rootType,
        count: 1,
        lastUpdated: new Date()
      })
    } else {
      // 存在，增加计数
      await this.ctx.database.set('xiuxian_initial_root_stats', {
        rootType
      }, {
        count: stats[0].count + 1,
        lastUpdated: new Date()
      })
    }
  }

  /**
   * 获取所有灵根的统计信息
   */
  async getAllStats(): Promise<Map<SpiritualRootType, number>> {
    const stats = await this.ctx.database.get('xiuxian_initial_root_stats', {})

    const result = new Map<SpiritualRootType, number>()
    for (const stat of stats) {
      result.set(stat.rootType as SpiritualRootType, stat.count)
    }

    return result
  }

  /**
   * 获取总玩家数量
   */
  async getTotalPlayerCount(): Promise<number> {
    const players = await this.ctx.database.get('xiuxian_player_v3', {})
    return players.length
  }

  /**
   * 获取当前各灵根的实际分布（百分比）
   */
  async getCurrentDistribution(): Promise<Map<SpiritualRootType, number>> {
    const stats = await this.getAllStats()
    const total = await this.getTotalPlayerCount()

    const distribution = new Map<SpiritualRootType, number>()

    if (total === 0) {
      return distribution
    }

    for (const [rootType, count] of stats) {
      distribution.set(rootType, count / total)
    }

    return distribution
  }
}
