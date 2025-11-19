import { Context, h } from 'koishi'
import { QuestioningService } from '../services/questioning.service'
import { PlayerService } from '../services/player.service'
import { atMessage } from '../utils/formatter'
import { getRealmName } from '../utils/calculator'

/**
 * 注册问心相关命令
 */
export function registerQuestioningCommands(
  ctx: Context,
  playerService: PlayerService,
  questioningService: QuestioningService
) {

  /**
   * 问心列表
   */
  ctx.command('问心列表', '查看可用的问心路径')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      try {
        // 获取玩家信息
        const player = await playerService.getPlayer(session.userId)
        if (!player) {
          return h('', [
            atMessage(session.userId, ' 你尚未踏入仙途，使用 步入仙途 开启修仙之路吧！')
          ])
        }

        // 获取可用路径
        const paths = questioningService.getAvailablePaths(player)

        if (paths.length === 0) {
          return h('', [
            atMessage(session.userId, ' 当前没有可用的问心路径')
          ])
        }

        let message = '\n\n━━━━ 问心路径 ━━━━\n\n'

        for (const path of paths) {
          message += `📖 ${path.name}\n`
          message += `   ${path.description}\n`

          if (path.minRealm !== undefined) {
            message += `   最低要求：${getRealmName(path.minRealm, 0)}\n`
          }

          if (path.cooldown) {
            message += `   冷却时间：${path.cooldown}小时\n`
          }

          message += `   使用命令：问心 ${path.id}\n\n`

          // 检查冷却
          const cooldownResult = await questioningService.checkCooldown(session.userId, path.id)
          if (!cooldownResult.success) {
            message += `   ⏰ ${cooldownResult.message}\n\n`
          }
        }

        message += '━━━━━━━━━━━━━━'

        return h('', [
          h('at', { id: session.userId }),
          h('text', { content: message })
        ])

      } catch (error) {
        ctx.logger('xiuxian').error('查询问心列表失败:', error)
        return h('', [
          atMessage(session.userId, ' 查询问心列表时遇到了问题')
        ])
      }
    })

  /**
   * 开始问心
   */
  ctx.command('问心 <pathId:string>', '开始问心')
    .action(async ({ session }, pathId) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'
      if (!pathId) {
        return h('', [
          atMessage(session.userId, ' 请指定问心路径，使用 问心列表 查看可用路径')
        ])
      }

      try {
        // 获取玩家信息
        const player = await playerService.getPlayer(session.userId)
        if (!player) {
          return h('', [
            atMessage(session.userId, ' 你尚未踏入仙途，使用 步入仙途 开启修仙之路吧！')
          ])
        }

        // 开始问心
        const result = await questioningService.startQuestioning(session.userId, pathId, player)

        if (!result.success) {
          return h('', [
            atMessage(session.userId, ' ' + result.message)
          ])
        }

        const path = questioningService.getPathById(pathId)
        let message = `\n\n━━━━ ${path?.name} ━━━━\n\n`
        message += `${path?.description}\n\n`
        message += `📝 问题 1/3：\n${result.data?.question}\n\n`

        if (result.data?.options) {
          result.data.options.forEach(opt => {
            message += `${opt}\n`
          })
          message += `\n请回复选项字母（如：A）`
        } else {
          message += `请自由回答`
        }

        return h('', [
          h('at', { id: session.userId }),
          h('text', { content: message })
        ])

      } catch (error) {
        ctx.logger('xiuxian').error('开始问心失败:', error)
        return h('', [
          atMessage(session.userId, ' 开始问心时遇到了问题')
        ])
      }
    })

  /**
   * 取消问心
   */
  ctx.command('取消问心', '取消当前的问心')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      const result = questioningService.cancelQuestioning(session.userId)
      return h('', [
        atMessage(session.userId, ' ' + result.message)
      ])
    })

  /**
   * 问心历史
   */
  ctx.command('问心历史', '查看问心历史记录')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      try {
        const result = await questioningService.getHistory(session.userId)

        if (!result.success || !result.data || result.data.length === 0) {
          return h('', [
            atMessage(session.userId, ' 暂无问心记录')
          ])
        }

        let message = '\n\n━━━━ 问心历史 ━━━━\n\n'

        result.data.forEach((record: any, idx: number) => {
          const date = new Date(record.createTime).toLocaleDateString()
          message += `${idx + 1}. ${record.pathName}\n`
          message += `   时间：${date}\n`
          message += `   倾向：${record.tendency}\n`
          message += `   奖励：${record.rewardType} +${record.rewardValue}\n\n`
        })

        message += '━━━━━━━━━━━━━━'

        return h('', [
          h('at', { id: session.userId }),
          h('text', { content: message })
        ])

      } catch (error) {
        ctx.logger('xiuxian').error('查询问心历史失败:', error)
        return h('', [
          atMessage(session.userId, ' 查询问心历史时遇到了问题')
        ])
      }
    })

  /**
   * 中间件：拦截问心中的其他命令
   */
  ctx.middleware(async (session, next) => {
    if (!session?.userId) return next()

    // 检查是否在问心中
    if (!questioningService.isInQuestioning(session.userId)) {
      return next()
    }

    // 获取会话信息
    const questioningSession = questioningService.getSession(session.userId)
    if (!questioningSession) return next()

    // 允许的命令
    const allowedCommands = ['取消问心']
    const command = session.content?.trim() || ''

    if (allowedCommands.includes(command)) {
      return next()
    }

    // 其他输入视为答案
    const answer = session.content?.trim()
    if (!answer) return

    try {
      const result = await questioningService.submitAnswer(session.userId, answer)

      if (!result.success) {
        return h('', [
          atMessage(session.userId, ' ' + result.message)
        ])
      }

      // 如果还有下一题
      if (result.data && !result.data.success) {
        let message = `\n\n📝 问题 ${result.data.step}/3：\n`
        message += `${result.data.question}\n\n`

        if (result.data.options) {
          result.data.options.forEach((opt: string) => {
            message += `${opt}\n`
          })
          message += `\n请回复选项字母（如：A）`
        } else {
          message += `请自由回答`
        }

        return h('', [
          h('at', { id: session.userId }),
          h('text', { content: message })
        ])
      }

      // 问心完成
      if (result.data?.success && result.data.data) {
        const data = result.data.data
        let message = '\n\n━━━━ 问心完成 ━━━━\n\n'
        message += `✨ ${data.personality}\n\n`
        message += `🎭 问心倾向：${data.tendency}\n\n`
        message += `🎁 获得奖励：${data.reward.description}\n`
        message += `💭 ${data.reason}\n\n`
        message += `━━━━━━━━━━━━━━`

        return h('', [
          h('at', { id: session.userId }),
          h('text', { content: message })
        ])
      }

      return h('', [
        atMessage(session.userId, ' 答案已记录')
      ])

    } catch (error) {
      ctx.logger('xiuxian').error('提交答案失败:', error)
      return h('', [
        atMessage(session.userId, ' 提交答案时遇到了问题')
      ])
    }
  })
}
