import { Context } from 'koishi'

/**
 * 灵根统计数据
 *
 * v0.9.2 重构：
 * - 区分 initialCount（初始灵根分配数）和 currentCount（当前拥有数）
 * - 支持玩家灵根后天改变的统计
 * - 从灵根注册表自动同步新增灵根
 */
export interface RootStats {
  id: number
  rootType: string         // 灵根类型
  initialCount: number     // 初始分配数量（玩家创建时的灵根）
  currentCount: number     // 当前拥有数量（玩家当前的灵根）
  lastUpdated: Date        // 最后更新时间
}

// 向后兼容的别名
export type InitialRootStats = RootStats

// 扩展数据库类型
declare module 'koishi' {
  interface Tables {
    xiuxian_initial_root_stats: RootStats
  }
}

/**
 * 初始化灵根统计表
 */
export function initInitialRootStatsModel(ctx: Context) {
  ctx.model.extend('xiuxian_initial_root_stats', {
    id: 'unsigned',
    rootType: 'string',
    initialCount: { type: 'unsigned', initial: 0 },
    currentCount: { type: 'unsigned', initial: 0 },
    lastUpdated: 'timestamp',
  }, {
    primary: 'id',
    autoInc: true,
    unique: ['rootType'],
  })
}
