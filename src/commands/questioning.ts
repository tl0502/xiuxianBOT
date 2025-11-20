import { Context, h } from 'koishi'
import { QuestioningService } from '../services/questioning.service'
import { PlayerService } from '../services/player.service'
import { atMessage } from '../utils/formatter'
import { getRealmName, getSpiritualRootInfo } from '../utils/calculator'
import { AnswerSubmitData } from '../types/questioning'

/**
 * 注册问心相关命令
 */
export function registerQuestioningCommands(
  ctx: Context,
  playerService: PlayerService,
  questioningService: QuestioningService
) {

  /**
   * 问心列表（仅显示信息，实际使用时会随机选择）
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
        message += '💫 使用 问心 命令将随机进入以下路径之一：\n\n'

        for (const path of paths) {
          message += `📖 ${path.name}\n`
          message += `   ${path.description}\n`

          if (path.minRealm !== undefined) {
            message += `   最低要求：${getRealmName(path.minRealm, 0)}\n`
          }

          if (path.cooldown) {
            message += `   冷却时间：${path.cooldown}小时\n`
          }

          message += '\n'
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
   * 开始问心（随机选择路径）
   */
  ctx.command('问心', '进行问心试炼（随机路径）')
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

        // 随机选择一条试炼路径
        const result = await questioningService.startRandomTrialQuestioning(session.userId, player)

        if (!result.success || !result.data) {
          return h('', [
            atMessage(session.userId, ' ' + result.message)
          ])
        }

        let message = `\n\n━━━━ ${result.data.pathName} ━━━━\n\n`
        message += `${result.data.pathDescription}\n\n`
        message += `📝 问题 1/3：\n${result.data.question}\n\n`

        if (result.data.options) {
          result.data.options.forEach((opt, i) => {
            message += `${String.fromCharCode(65 + i)}. ${opt}\n`
          })
          message += `\n请回复选项字母（如：A）`
        } else {
          message += `请自由回答`
        }

        // 若服务端返回限时提示，则在题目后追加显式提示
        if (result.data.timeoutMessage) {
          message += `\n\n${result.data.timeoutMessage}`
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
      // 获取会话信息，判断是否是问道包
      const questionSession = questioningService.getSession(session.userId)
      let result

      if (questionSession) {
        // 检查是否是问道包（通过pathId判断）
        const pathPackageService = questioningService.getPathPackageService()
        const pkg = pathPackageService.getById(questionSession.pathId)

        if (pkg) {
          // 使用问道包处理逻辑
          result = await questioningService.submitPackageAnswer(session.userId, answer)
        } else {
          // 使用传统问心逻辑
          result = await questioningService.submitAnswer(session.userId, answer)
        }
      } else {
        // 没有会话，使用传统逻辑
        result = await questioningService.submitAnswer(session.userId, answer)
      }

      if (!result.success) {
        return h('', [
          atMessage(session.userId, ' ' + result.message)
        ])
      }

      // 如果还有下一题（检查是否有 step 字段）
      if (result.data && 'step' in result.data) {
        const data = result.data as AnswerSubmitData
        let message = `\n\n📝 问题 ${data.step}/3：\n`
        message += `${data.question}\n\n`

        if (data.options) {
          data.options.forEach((opt, i) => {
            message += `${String.fromCharCode(65 + i)}. ${opt}\n`
          })
          message += `\n请回复选项字母（如：A）`
        } else {
          message += `请自由回答`
        }

        // 附加倒计时提示（如果存在）
        if (data.timeoutMessage) {
          message += `\n\n${data.timeoutMessage}`
        }

        return h('', [
          h('at', { id: session.userId }),
          h('text', { content: message })
        ])
      }

      // 问道包完成（新增）
      if (result.data && 'packageId' in result.data) {
        const data = result.data as any
        let message = '\n\n━━━━ 问道完成 ━━━━\n\n'
        message += `📦 ${data.packageName}\n\n`

        // 显示匹配结果
        if (data.matchResult) {
          const mr = data.matchResult
          const tierName = mr.tier === 'perfect' ? '完美契合' : mr.tier === 'good' ? '良好匹配' : '普通匹配'
          message += `🎯 匹配度：${mr.matchRate.toFixed(1)}%\n`
          message += `✨ 等级：${tierName}\n\n`
        }

        // AI评语
        if (data.aiResponse) {
          message += `💬 天道评语：\n${data.aiResponse.evaluation}\n\n`
        }

        // 奖励
        if (data.rewards && data.rewards.length > 0) {
          message += `🎁 获得奖励：\n`
          data.rewards.forEach((r: any) => {
            message += `   ${r.description}\n`
          })
          message += '\n'
        }

        // 奖励原因
        if (data.aiResponse?.rewardReason) {
          message += `💭 ${data.aiResponse.rewardReason}\n\n`
        }

        message += `━━━━━━━━━━━━━━`

        return h('', [
          h('at', { id: session.userId }),
          h('text', { content: message })
        ])
      }

      // 问心完成 - 检查是否有完成数据
      if (result.data && 'player' in result.data) {
        // 步入仙途完成
        const data = result.data as any
        const spiritualRootInfo = getSpiritualRootInfo(data.player.spiritualRoot)

        let message = '\n\n━━━━ 踏入仙途 ━━━━\n\n'
        message += `✨ 恭喜你踏入修仙世界！\n\n`
        message += `🎭 天道评语：\n${data.personality}\n\n`
        message += `📜 分配依据：\n${data.reason}\n\n`
        message += `━━━━ 你的信息 ━━━━\n\n`
        message += `👤 道号：${data.daoName}\n`
        message += `🌟 灵根：${spiritualRootInfo.name}\n`
        message += `   ${spiritualRootInfo.description}\n\n`
        message += `愿你在这修仙世界中破开虚妄，证得大道！\n\n`
        message += `💡 使用 天道记录 查看完整信息\n\n`
        message += `━━━━━━━━━━━━━━`

        return h('', [
          h('at', { id: session.userId }),
          h('text', { content: message })
        ])
      }

      // 试炼问心完成
      if (result.data && 'tendency' in result.data && 'reward' in result.data) {
        const data = result.data as any
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
