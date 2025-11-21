import { Context } from 'koishi'
import { KoishiAppContext } from '../adapters/koishi'
import { PlayerService } from '../services/player.service'
import { QuestioningService } from '../services/questioning.service'
import { registerPlayerCommands } from './player'
import { registerCultivationCommands } from './cultivation'
import { registerQuestioningCommands } from './questioning'
import { registerPackageTestCommands } from './package-test'
import { registerDevTestCommands } from './dev-test'

/**
 * 注册所有命令
 */
export function registerCommands(ctx: Context) {
  // 创建 Adapter 上下文
  const appContext = KoishiAppContext.from(ctx)

  // 创建服务实例（使用 Adapter 上下文）
  const playerService = new PlayerService(appContext)
  const questioningService = new QuestioningService(ctx)  // TODO: 待重构

  // 定义父命令（统一入口）
  ctx.command('修仙', '修仙系统')
    .action(() => '输入 help 修仙 查看所有子命令')

  // 注册各模块命令
  registerPlayerCommands(ctx, playerService, questioningService)
  registerCultivationCommands(ctx, playerService)
  registerQuestioningCommands(ctx, playerService, questioningService)
  registerPackageTestCommands(ctx, playerService, questioningService)

  // 开发者测试命令（根据配置启用）
  const config = (ctx as any).config
  if (config?.enableDevTools) {
    registerDevTestCommands(ctx)
    ctx.logger('xiuxian').info('开发者测试命令已启用')
  }
}
