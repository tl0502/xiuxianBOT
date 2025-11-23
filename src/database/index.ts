import { Context } from 'koishi'
import { initPlayerModel } from './models/player'
import { initQuestioningModel } from './models/questioning'
import { initInitialRootStatsModel } from './models/initial-root-stats'
import { initBuffModel } from './models/buff'
import { initPathPackageModel } from './models/path-package'  // v1.1.0 新增
import { initCooldownModel } from './models/cooldown'  // v1.2.0 新增

/**
 * 初始化所有数据库表
 */
export function initDatabase(ctx: Context) {
  initPlayerModel(ctx)
  initQuestioningModel(ctx)
  initInitialRootStatsModel(ctx)
  initBuffModel(ctx)  // v1.0.0 新增：Buff系统
  initPathPackageModel(ctx)  // v1.1.0 新增：问道包管理表
  initCooldownModel(ctx)  // v1.2.0 新增：通用冷却系统
  // 未来在这里添加其他表的初始化
  // initItemModel(ctx)
  // initSectModel(ctx)
  // ...
}
