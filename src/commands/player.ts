import { Context, h } from 'koishi'
import { PlayerService, QuestioningService } from '../services'
import { Messages } from '../config/messages'
import { atMessage } from '../utils/formatter'
import { getSpiritualRootInfo } from '../utils/calculator'

/**
 * 注册玩家相关命令
 */
export function registerPlayerCommands(
  ctx: Context,
  playerService: PlayerService,
  questioningService: QuestioningService
) {
  /**
   * 命令：步入仙途
   * 功能：触发问心流程，由 AI 分配道号和灵根
   */
  ctx.command('修仙.步入仙途', '踏入修仙世界，开启仙途之旅')
    .action(async ({ session }) => {
      if (!session?.userId) return Messages.NO_SESSION

      const userId = session.userId

      try {
        // 检查是否已经创建角色
        const player = await playerService.getPlayer(userId)
        if (player) {
          const spiritualRootInfo = getSpiritualRootInfo(player.spiritualRoot)
          return h('', [
            atMessage(userId, ` 你已踏入仙途\n\n道号：${player.username}\n灵根：${spiritualRootInfo.name}\n\n使用 天道记录 查看详细信息`)
          ])
        }

        // 触发问心流程（使用 INITIATION 路径包）
        const result = await questioningService.startInitiationQuestioning(userId)

        if (!result.success || !result.data) {
          return h('', [atMessage(userId, ' ' + result.message)])
        }

        // 返回第一个问题
        const message = `\n\n━━━━ ${result.data.pathName} ━━━━\n\n` +
          `${result.data.pathDescription}\n\n` +
          `📝 问题 1/3：\n${result.data.question}\n\n` +
          (result.data.options
            ? result.data.options.map((opt: string, i: number) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n') + '\n\n请回复选项字母（如：A）'
            : '请直接回复你的答案') +
          (result.data.timeoutMessage ? `\n\n${result.data.timeoutMessage}` : '')

        return h('', [
          h('at', { id: userId }),
          h('text', { content: message })
        ])
      } catch (error) {
        ctx.logger('xiuxian').error('步入仙途失败:', error)
        return atMessage(userId, Messages.CREATE_ERROR)
      }
    })

  /**
   * 命令：天道记录
   * 功能：查看玩家个人信息
   * v1.0.0 更新：显示buff加成信息
   */
  ctx.command('修仙.天道记录', '查看你的修仙信息')
    .action(async ({ session }) => {
      if (!session?.userId) return Messages.NO_SESSION

      const userId = session.userId

      try {
        // 查询玩家信息
        const result = await playerService.getDisplayInfo(userId)

        if (!result.success || !result.data) {
          return atMessage(userId, Messages.NOT_REGISTERED)
        }

        const data = result.data

        // ✨ v1.0.0: 获取玩家和buff信息
        const player = await playerService.getPlayer(userId)
        if (!player) {
          return atMessage(userId, Messages.NOT_REGISTERED)
        }

        const buffService = playerService.getBuffService()
        const bonusCalculator = playerService.getBonusCalculator()

        // 获取活跃buff
        const activeBuffs = await buffService.getActiveBuffs(userId)

        // 获取加成详情
        const bonusDetails = await bonusCalculator.getBonusDetails(player)

        // 基础信息
        let infoMessage = `\n\n━━━━ 天道记录 ━━━━\n\n` +
          `👤 道号：${data.name}\n` +
          `⭐ 境界：${data.realm}\n` +
          `📊 修为：${data.cultivation}/${data.cultivationMax}\n` +
          `💎 灵石：${data.spiritStone}\n` +
          `🌟 灵根：${data.spiritualRoot}\n` +
          `   ${data.spiritualRootDesc}\n` +
          `⚔️ 战力：${data.combatPower}\n` +
          `📅 入门时间：${data.createDate}\n`

        // ✨ v1.0.0: 添加加成信息
        if (bonusDetails.cultivation.permanent > 0 || bonusDetails.cultivation.temp > 0 ||
            bonusDetails.breakthrough.permanent > 0 || bonusDetails.breakthrough.temp > 0) {
          infoMessage += `\n━━━━ 当前加成 ━━━━\n\n`

          // 修炼速度加成
          if (bonusDetails.cultivation.total > 1 || bonusDetails.cultivation.permanent > 0 || bonusDetails.cultivation.temp > 0) {
            infoMessage += `📈 修炼速度: ${bonusDetails.cultivation.total.toFixed(2)}倍\n`
            if (bonusDetails.cultivation.permanent > 0) {
              infoMessage += `   永久: +${(bonusDetails.cultivation.permanent * 100).toFixed(0)}%\n`
            }
            if (bonusDetails.cultivation.temp > 0) {
              infoMessage += `   临时: +${(bonusDetails.cultivation.temp * 100).toFixed(0)}%\n`
            }
          }

          // 突破成功率加成
          if (bonusDetails.breakthrough.permanent > 0 || bonusDetails.breakthrough.temp > 0) {
            infoMessage += `🎯 突破成功率: ${(bonusDetails.breakthrough.total * 100).toFixed(0)}%\n`
            if (bonusDetails.breakthrough.permanent > 0) {
              infoMessage += `   永久: +${(bonusDetails.breakthrough.permanent * 100).toFixed(0)}%\n`
            }
            if (bonusDetails.breakthrough.temp > 0) {
              infoMessage += `   临时: +${(bonusDetails.breakthrough.temp * 100).toFixed(0)}%\n`
            }
          }

          // 修为需求倍率
          if (bonusDetails.requirement.total !== 1) {
            const reqPercent = ((bonusDetails.requirement.total - 1) * 100).toFixed(0)
            const sign = bonusDetails.requirement.total > 1 ? '+' : ''
            infoMessage += `📚 修为需求: ${sign}${reqPercent}%\n`
          }
        }

        // ✨ v1.0.0: 添加活跃buff列表
        if (activeBuffs.length > 0) {
          infoMessage += `\n━━━━ 生效Buff ━━━━\n\n`
          for (const buff of activeBuffs.slice(0, 5)) {  // 最多显示5个
            const remainingTime = buff.endTime
              ? `${Math.ceil((new Date(buff.endTime).getTime() - Date.now()) / (60 * 60 * 1000))}h`
              : '永久'
            infoMessage += `${buff.description} (${remainingTime})\n`
          }
          if (activeBuffs.length > 5) {
            infoMessage += `...还有 ${activeBuffs.length - 5} 个buff\n`
          }
        }

        infoMessage += `\n━━━━━━━━━━━━━━`

        return atMessage(userId, infoMessage)

      } catch (error) {
        ctx.logger('xiuxian').error('查询玩家信息失败:', error)
        return atMessage(userId, Messages.QUERY_ERROR)
      }
    })
}
