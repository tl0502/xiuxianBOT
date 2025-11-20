import { Context } from 'koishi'
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
  // 创建服务实例
  const playerService = new PlayerService(ctx)
  const questioningService = new QuestioningService(ctx)

  // 注册各模块命令
  registerPlayerCommands(ctx, playerService, questioningService)
  registerCultivationCommands(ctx, playerService)
  registerQuestioningCommands(ctx, playerService, questioningService)
  registerPackageTestCommands(ctx, playerService, questioningService)
}
