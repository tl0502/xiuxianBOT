import { IAppContext } from '../adapters/interfaces'
import { SpiritualRootType } from '../config/spiritual-roots'
import { SPIRITUAL_ROOT_REGISTRY } from '../config/spiritual-root-registry'

/**
 * 灵根统计服务
 *
 * v0.9.2 重构：
 * - 从灵根注册表自动同步新增灵根
 * - 区分 initialCount 和 currentCount
 * - 支持手动重建统计数据
 *
 * 注意：此服务已解耦 Koishi 框架，依赖 IAppContext 接口
 */
export class RootStatsService {
  constructor(private context: IAppContext) {}

  /**
   * 初始化统计表（插件启动时调用）
   *
   * 功能：
   * 1. 从灵根注册表同步所有灵根类型
   * 2. 为不存在的灵根创建统计记录（count=0）
   */
  async initializeStats(): Promise<void> {
    await this.syncFromRegistry()
  }

  /**
   * 从灵根注册表同步灵根列表
   *
   * - 遍历注册表中的所有灵根类型
   * - 为不存在的灵根创建统计记录
   * - 保留已存在的记录（不覆盖）
   */
  async syncFromRegistry(): Promise<void> {
    // 获取注册表中的所有灵根类型
    const allRootTypes = Object.keys(SPIRITUAL_ROOT_REGISTRY) as SpiritualRootType[]

    for (const rootType of allRootTypes) {
      const existing = await this.context.database.get('xiuxian_initial_root_stats', {
        rootType
      })

      if (existing.length === 0) {
        // 不存在，创建新记录
        await this.context.database.create('xiuxian_initial_root_stats', {
          rootType,
          initialCount: 0,
          currentCount: 0,
          lastUpdated: new Date()
        })
        this.context.logger.info(`[灵根统计] 创建新灵根记录: ${rootType}`)
      }
    }
  }

  /**
   * 重建统计数据（管理员命令调用）
   *
   * 功能：
   * 1. 先同步灵根注册表
   * 2. 重新统计所有玩家的 initialSpiritualRoot 和 spiritualRoot
   * 3. 更新统计表
   */
  async rebuildStats(): Promise<void> {
    this.context.logger.info('[灵根统计] 开始重建统计数据...')

    // 第1步：同步注册表
    await this.syncFromRegistry()

    // 第2步：清空所有统计
    const allStats = await this.context.database.get('xiuxian_initial_root_stats', {})
    for (const stat of allStats) {
      await this.context.database.set('xiuxian_initial_root_stats',
        { rootType: stat.rootType } as any,
        {
          initialCount: 0,
          currentCount: 0,
          lastUpdated: new Date()
        } as any
      )
    }

    // 第3步：统计所有玩家
    const players = await this.context.database.get('xiuxian_player_v3', {})

    // 统计 initialSpiritualRoot
    const initialCounts: Record<string, number> = {}
    const currentCounts: Record<string, number> = {}

    for (const player of players) {
      // 统计初始灵根
      const initialRoot = player.initialSpiritualRoot as string
      initialCounts[initialRoot] = (initialCounts[initialRoot] || 0) + 1

      // 统计当前灵根
      const currentRoot = player.spiritualRoot as string
      currentCounts[currentRoot] = (currentCounts[currentRoot] || 0) + 1
    }

    // 第4步：更新统计表
    for (const stat of allStats) {
      const rootType = stat.rootType
      await this.context.database.set('xiuxian_initial_root_stats',
        { rootType } as any,
        {
          initialCount: initialCounts[rootType] || 0,
          currentCount: currentCounts[rootType] || 0,
          lastUpdated: new Date()
        } as any
      )
    }

    this.context.logger.info(`[灵根统计] 重建完成，共统计 ${players.length} 个玩家`)
  }

  /**
   * 增加灵根分配计数（玩家注册时调用）
   *
   * @param rootType 灵根类型
   */
  async incrementRootCount(rootType: SpiritualRootType): Promise<void> {
    const stats = await this.context.database.get<any>('xiuxian_initial_root_stats', {
      rootType
    })

    if (stats.length === 0) {
      // 不存在，创建新记录（理论上不应该发生，因为初始化时已同步）
      await this.context.database.create('xiuxian_initial_root_stats', {
        rootType,
        initialCount: 1,
        currentCount: 1,
        lastUpdated: new Date()
      })
    } else {
      // 存在，增加计数
      await this.context.database.set<any>('xiuxian_initial_root_stats', {
        rootType
      } as any, {
        initialCount: stats[0].initialCount + 1,
        currentCount: stats[0].currentCount + 1,
        lastUpdated: new Date()
      } as any)
    }
  }

  /**
   * 更新灵根计数（玩家灵根改变时调用）
   *
   * @param oldRoot 旧灵根
   * @param newRoot 新灵根
   */
  async updateCounts(oldRoot: SpiritualRootType, newRoot: SpiritualRootType): Promise<void> {
    // 旧灵根 currentCount -1
    const oldStats = await this.context.database.get<any>('xiuxian_initial_root_stats', {
      rootType: oldRoot
    })
    if (oldStats.length > 0) {
      await this.context.database.set<any>('xiuxian_initial_root_stats', {
        rootType: oldRoot
      } as any, {
        currentCount: Math.max(0, oldStats[0].currentCount - 1),
        lastUpdated: new Date()
      } as any)
    }

    // 新灵根 currentCount +1
    const newStats = await this.context.database.get<any>('xiuxian_initial_root_stats', {
      rootType: newRoot
    })
    if (newStats.length === 0) {
      // 不存在，创建新记录
      await this.context.database.create('xiuxian_initial_root_stats', {
        rootType: newRoot,
        initialCount: 0,
        currentCount: 1,
        lastUpdated: new Date()
      })
    } else {
      await this.context.database.set<any>('xiuxian_initial_root_stats', {
        rootType: newRoot
      } as any, {
        currentCount: newStats[0].currentCount + 1,
        lastUpdated: new Date()
      } as any)
    }
  }

  /**
   * 获取所有灵根的统计信息
   *
   * @returns Map<灵根类型, { initialCount, currentCount }>
   */
  async getAllStats(): Promise<Map<SpiritualRootType, { initialCount: number, currentCount: number }>> {
    const stats = await this.context.database.get('xiuxian_initial_root_stats', {})

    const result = new Map<SpiritualRootType, { initialCount: number, currentCount: number }>()
    for (const stat of stats) {
      result.set(stat.rootType as SpiritualRootType, {
        initialCount: stat.initialCount,
        currentCount: stat.currentCount
      })
    }

    return result
  }

  /**
   * 获取总玩家数量
   */
  async getTotalPlayerCount(): Promise<number> {
    const players = await this.context.database.get('xiuxian_player_v3', {})
    return players.length
  }

  /**
   * 获取当前各灵根的实际分布（百分比）
   *
   * @param useInitial 是否使用初始灵根（true）还是当前灵根（false）
   */
  async getCurrentDistribution(useInitial: boolean = true): Promise<Map<SpiritualRootType, number>> {
    const stats = await this.getAllStats()
    const total = await this.getTotalPlayerCount()

    const distribution = new Map<SpiritualRootType, number>()

    if (total === 0) {
      return distribution
    }

    for (const [rootType, counts] of stats) {
      const count = useInitial ? counts.initialCount : counts.currentCount
      distribution.set(rootType, count / total)
    }

    return distribution
  }
}
