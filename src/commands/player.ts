import { Context } from 'koishi'
import { PlayerService } from '../services'
import { Messages } from '../config/messages'
import { atMessage } from '../utils/formatter'

/**
 * 注册玩家相关命令
 */
export function registerPlayerCommands(ctx: Context, playerService: PlayerService) {
  /**
   * 命令：步入仙途
   * 功能：创建角色，角色名为玩家的QQ昵称
   */
  ctx.command('步入仙途', '踏入修仙世界，开启仙途之旅')
    .action(async ({ session }) => {
      if (!session?.userId) return Messages.NO_SESSION

      const userId = session.userId
      const username = session.username || session.author?.nick || session.author?.username || '无名修士'

      try {
        // 检查是否已存在
        const existing = await playerService.getPlayer(userId)
        if (existing) {
          return atMessage(userId, Messages.ALREADY_REGISTERED(existing.username))
        }

        // 创建角色
        const result = await playerService.create({ userId, username })

        if (!result.success || !result.data) {
          return atMessage(userId, Messages.CREATE_ERROR)
        }

        return atMessage(userId, Messages.WELCOME(username, result.data.spiritualRoot))

      } catch (error) {
        ctx.logger('xiuxian').error('创建角色失败:', error)
        return atMessage(userId, Messages.CREATE_ERROR)
      }
    })

  /**
   * 命令：天道记录
   * 功能：查看玩家个人信息
   */
  ctx.command('天道记录', '查看你的修仙信息')
    .action(async ({ session }) => {
      if (!session?.userId) return Messages.NO_SESSION

      const userId = session.userId

      try {
        // 查询玩家信息
        const result = await playerService.getDisplayInfo(userId)

        if (!result.success || !result.data) {
          return atMessage(userId, Messages.NOT_REGISTERED)
        }

        return atMessage(userId, Messages.PLAYER_INFO(result.data))

      } catch (error) {
        ctx.logger('xiuxian').error('查询玩家信息失败:', error)
        return atMessage(userId, Messages.QUERY_ERROR)
      }
    })
}
