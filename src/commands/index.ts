import { Context } from 'koishi'
import { KoishiAppContext } from '../adapters/koishi'
import { PlayerService } from '../services/player.service'
import { QuestioningService } from '../services/questioning.service'
import { registerPlayerCommands } from './player'
import { registerCultivationCommands } from './cultivation'
import { registerQuestioningCommands } from './questioning'
import { registerDevTestCommands } from './dev-test'
import { registerDevBuffCommands } from './dev-buff'
import { registerDevPackageCommands } from './dev-package'
import { Config } from '../index'

/**
 * 注册所有命令
 * @param ctx Koishi Context
 * @param config 插件配置（从 apply 函数传入）
 */
export function registerCommands(ctx: Context, config: Config) {
  // 创建 Adapter 上下文（传入插件配置）
  const appContext = KoishiAppContext.from(ctx, 'xiuxian', config)

  // 创建服务实例（使用 Adapter 上下文）
  const playerService = new PlayerService(appContext)
  const questioningService = new QuestioningService(ctx, config)

  // 定义父命令（统一入口）
  ctx.command('修仙', '修仙系统')
    .action(() => '输入 help 修仙 查看所有子命令')

  // 注册各模块命令
  registerPlayerCommands(ctx, playerService, questioningService)
  registerCultivationCommands(ctx, playerService)
  registerQuestioningCommands(ctx, playerService, questioningService)

  // 开发者命令（根据配置启用）
  if (config?.enableDevTools) {
    registerDevTestCommands(ctx)
    registerDevBuffCommands(ctx, config)
    registerDevPackageCommands(ctx, playerService, questioningService)
    ctx.logger('xiuxian').info('开发者命令已启用（测试、Buff管理、问道包）')
  }
}
