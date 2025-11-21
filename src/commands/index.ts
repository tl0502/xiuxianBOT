import { Context } from 'koishi'
import { KoishiAppContext } from '../adapters/koishi'
import { PlayerService } from '../services/player.service'
import { QuestioningService } from '../services/questioning.service'
import { registerPlayerCommands } from './player'
import { registerCultivationCommands } from './cultivation'
import { registerQuestioningCommands } from './questioning'
import { registerPackageTestCommands } from './package-test'

/**
 * 注册所有命令
 */
export function registerCommands(ctx: Context) {
  // 创建 Adapter 上下文
  const appContext = KoishiAppContext.from(ctx)

  // 创建服务实例（使用 Adapter 上下文）
  const playerService = new PlayerService(appContext)
  const questioningService = new QuestioningService(ctx)  // TODO: 待重构

  // 注册各模块命令
  registerPlayerCommands(ctx, playerService, questioningService)
  registerCultivationCommands(ctx, playerService)
  registerQuestioningCommands(ctx, playerService, questioningService)
  registerPackageTestCommands(ctx, playerService, questioningService)
}
