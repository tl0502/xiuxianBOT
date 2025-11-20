import { Context } from 'koishi'

/**
 * 初始灵根统计数据
 */
export interface InitialRootStats {
  id: number
  rootType: string      // 灵根类型
  count: number         // 分配数量
  lastUpdated: Date     // 最后更新时间
}

// 扩展数据库类型
declare module 'koishi' {
  interface Tables {
    xiuxian_initial_root_stats: InitialRootStats
  }
}

/**
 * 初始化初始灵根统计表
 */
export function initInitialRootStatsModel(ctx: Context) {
  ctx.model.extend('xiuxian_initial_root_stats', {
    id: 'unsigned',
    rootType: 'string',
    count: { type: 'unsigned', initial: 0 },
    lastUpdated: 'timestamp',
  }, {
    primary: 'id',
    autoInc: true,
    unique: ['rootType'],
  })
}
