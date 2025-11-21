import { Context } from 'koishi'
import { PlayerService } from '../services'
import { Messages } from '../config/messages'
import { atMessage } from '../utils/formatter'

/**
 * 注册修炼相关命令
 */
export function registerCultivationCommands(ctx: Context, playerService: PlayerService) {
  /**
   * 命令：打坐
   * 功能：开始修炼，提升修为
   */
  ctx.command('修仙.打坐 [hours:number]', '开始修炼，提升修为')
    .usage('打坐 [小时数] - 默认1小时')
    .example('打坐 2  // 修炼2小时')
    .action(async ({ session }, hours = 1) => {
      if (!session?.userId) return Messages.NO_SESSION

      const userId = session.userId

      try {
        // 验证时长
        if (hours < 1 || hours > 24) {
          return atMessage(userId, ' 修炼时长必须在 1-24 小时之间')
        }

        // 检查��家是否存在
        const player = await playerService.getPlayer(userId)
        if (!player) {
          return atMessage(userId, Messages.NOT_REGISTERED)
        }

        // 如果已在修炼中，结算之前的修炼
        if (player.status === 'cultivating') {
          const settleResult = await playerService.settleCultivation(userId)
          if (settleResult.success && settleResult.data) {
            const msg = Messages.CULTIVATION_COMPLETE(
              settleResult.data.gained,
              settleResult.data.current,
              settleResult.data.max
            )
            // 先发送结算消息，然后开始新的修炼
            await session.send(atMessage(userId, msg))
          }
        }

        // 开始新的修炼
        const result = await playerService.startCultivation(userId, hours)

        if (!result.success || !result.data) {
          return atMessage(userId, Messages.CULTIVATION_ERROR)
        }

        return atMessage(
          userId,
          Messages.START_CULTIVATION(hours, result.data.speed)
        )

      } catch (error) {
        ctx.logger('xiuxian').error('修炼失败:', error)
        return atMessage(userId, Messages.CULTIVATION_ERROR)
      }
    })

  /**
   * 命令：突破
   * 功能：尝试突破境界
   */
  ctx.command('修仙.突破', '尝试突破到更高境界')
    .action(async ({ session }) => {
      if (!session?.userId) return Messages.NO_SESSION

      const userId = session.userId

      try {
        // 检查玩家是否存在
        const player = await playerService.getPlayer(userId)
        if (!player) {
          return atMessage(userId, Messages.NOT_REGISTERED)
        }

        // 如果在修炼中，先结算
        if (player.status === 'cultivating') {
          await playerService.settleCultivation(userId)
          // 重新获取玩家信息
          const updatedPlayer = await playerService.getPlayer(userId)
          if (!updatedPlayer) {
            return atMessage(userId, Messages.BREAKTHROUGH_ERROR)
          }
          player.cultivation = updatedPlayer.cultivation
        }

        // 检查是否可以突破
        if (player.cultivation < player.cultivationMax) {
          return atMessage(
            userId,
            Messages.CANNOT_BREAKTHROUGH(player.cultivation, player.cultivationMax)
          )
        }

        // 尝试突破
        const result = await playerService.breakthrough(userId)

        if (!result.success) {
          return atMessage(userId, result.message)
        }

        if (!result.data) {
          return atMessage(userId, Messages.BREAKTHROUGH_ERROR)
        }

        // 返回结果
        if (result.data.success && result.data.newRealm) {
          return atMessage(userId, Messages.BREAKTHROUGH_SUCCESS(result.data.newRealm))
        } else {
          return atMessage(userId, Messages.BREAKTHROUGH_FAIL(result.data.rate))
        }

      } catch (error) {
        ctx.logger('xiuxian').error('突破失败:', error)
        return atMessage(userId, Messages.BREAKTHROUGH_ERROR)
      }
    })
}
