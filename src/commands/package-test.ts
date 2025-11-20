import { Context, h } from 'koishi'
import { QuestioningService } from '../services/questioning.service'
import { PlayerService } from '../services/player.service'
import { atMessage } from '../utils/formatter'

/**
 * 注册问道包测试命令
 */
export function registerPackageTestCommands(
  ctx: Context,
  playerService: PlayerService,
  questioningService: QuestioningService
) {

  /**
   * 问道包统计
   */
  ctx.command('修仙.问道包统计', '查看问道包系统统计信息')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      try {
        const stats = questioningService.getPackageStats()

        let message = '\n\n━━━━ 问道包系统统计 ━━━━\n\n'
        message += `📦 总问道包数：${stats.totalPackages}\n`
        message += `✅ 已启用：${stats.enabledPackages}\n\n`
        message += `📊 按Tag分类：\n`

        for (const [tag, count] of Object.entries(stats.tagCounts)) {
          const emoji = {
            'opportunity': '💰',
            'enlightenment': '✨',
            'demon': '😈',
            'exploration': '🗺️',
            'trial': '⚔️',
            'bond': '❤️'
          }[tag] || '📌'
          message += `   ${emoji} ${tag}: ${count}个\n`
        }

        message += '\n━━━━━━━━━━━━━━'

        return h('', [
          h('at', { id: session.userId }),
          h('text', { content: message })
        ])

      } catch (error) {
        ctx.logger('xiuxian').error('查询问道包统计失败:', error)
        return atMessage(session.userId, ' 查询统计时遇到了问题')
      }
    })

  /**
   * 机缘包测试
   */
  ctx.command('修仙.机缘', '触发机缘包（测试）')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      try {
        // 获取玩家信息（仅用于验证是否创建了角色）
        const player = await playerService.getPlayer(session.userId)
        if (!player) {
          return atMessage(session.userId, ' 你尚未踏入仙途，使用 修仙.步入仙途 开启修仙之路吧！')
        }

        // 检查是否在问心中
        if (questioningService.isInQuestioning(session.userId)) {
          return atMessage(session.userId, ' 你正在进行问心，请先完成当前问心')
        }

        // 启动机缘包（测试模式，不检查境界和冷却）
        const result = await questioningService.startPackageByTagTest(
          session.userId,
          'opportunity'
        )

        if (!result.success) {
          return atMessage(session.userId, ` ${result.message}`)
        }

        const data = result.data!

        let message = '\n\n━━━━━━━━━━━━━━\n'
        message += `💰 ${data.packageName}\n\n`
        message += `${data.description}\n\n`
        message += '━━━━━━━━━━━━━━\n\n'
        message += `【第1题】\n${data.question}\n\n`

        if (data.options) {
          data.options.forEach(opt => {
            message += `${opt}\n`
          })
          message += '\n请输入选项字母（A/B/C/D）'
        } else {
          message += '请输入你的答案'
        }

        if (data.timeoutMessage) {
          message += `\n\n⏱️ ${data.timeoutMessage}`
        }

        return h('', [
          h('at', { id: session.userId }),
          h('text', { content: message })
        ])

      } catch (error) {
        ctx.logger('xiuxian').error('启动机缘包失败:', error)
        return atMessage(session.userId, ' 触发机缘时遇到了问题')
      }
    })

  /**
   * 感悟包测试
   */
  ctx.command('修仙.感悟', '触发感悟包（测试）')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      try {
        const player = await playerService.getPlayer(session.userId)
        if (!player) {
          return atMessage(session.userId, ' 你尚未踏入仙途，使用 修仙.步入仙途 开启修仙之路吧！')
        }

        if (questioningService.isInQuestioning(session.userId)) {
          return atMessage(session.userId, ' 你正在进行问心，请先完成当前问心')
        }

        const result = await questioningService.startPackageByTagTest(
          session.userId,
          'enlightenment'
        )

        if (!result.success) {
          return atMessage(session.userId, ` ${result.message}`)
        }

        const data = result.data!

        let message = '\n\n━━━━━━━━━━━━━━\n'
        message += `✨ ${data.packageName}\n\n`
        message += `${data.description}\n\n`
        message += '━━━━━━━━━━━━━━\n\n'
        message += `【第1题】\n${data.question}\n\n`

        if (data.options) {
          data.options.forEach(opt => {
            message += `${opt}\n`
          })
          message += '\n请输入选项字母（A/B/C/D）'
        } else {
          message += '请输入你的答案'
        }

        if (data.timeoutMessage) {
          message += `\n\n⏱️ ${data.timeoutMessage}`
        }

        return h('', [
          h('at', { id: session.userId }),
          h('text', { content: message })
        ])

      } catch (error) {
        ctx.logger('xiuxian').error('启动感悟包失败:', error)
        return atMessage(session.userId, ' 触发感悟时遇到了问题')
      }
    })

  /**
   * 魔道包测试
   */
  ctx.command('修仙.心魔', '触发心魔包（测试）')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      try {
        const player = await playerService.getPlayer(session.userId)
        if (!player) {
          return atMessage(session.userId, ' 你尚未踏入仙途，使用 修仙.步入仙途 开启修仙之路吧！')
        }

        if (questioningService.isInQuestioning(session.userId)) {
          return atMessage(session.userId, ' 你正在进行问心，请先完成当前问心')
        }

        const result = await questioningService.startPackageByTagTest(
          session.userId,
          'demon'
        )

        if (!result.success) {
          return atMessage(session.userId, ` ${result.message}`)
        }

        const data = result.data!

        let message = '\n\n━━━━━━━━━━━━━━\n'
        message += `😈 ${data.packageName}\n\n`
        message += `${data.description}\n\n`
        message += '━━━━━━━━━━━━━━\n\n'
        message += `【第1题】\n${data.question}\n\n`

        if (data.options) {
          data.options.forEach(opt => {
            message += `${opt}\n`
          })
          message += '\n请输入选项字母（A/B/C/D）'
        } else {
          message += '请输入你的答案'
        }

        if (data.timeoutMessage) {
          message += `\n\n⏱️ ${data.timeoutMessage}`
        }

        return h('', [
          h('at', { id: session.userId }),
          h('text', { content: message })
        ])

      } catch (error) {
        ctx.logger('xiuxian').error('启动心魔包失败:', error)
        return atMessage(session.userId, ' 触发心魔时遇到了问题')
      }
    })

  /**
   * 遗迹包测试
   */
  ctx.command('修仙.遗迹', '触发遗迹探索包（测试）')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      try {
        const player = await playerService.getPlayer(session.userId)
        if (!player) {
          return atMessage(session.userId, ' 你尚未踏入仙途，使用 修仙.步入仙途 开启修仙之路吧！')
        }

        if (questioningService.isInQuestioning(session.userId)) {
          return atMessage(session.userId, ' 你正在进行问心，请先完成当前问心')
        }

        const result = await questioningService.startPackageByTagTest(
          session.userId,
          'exploration'
        )

        if (!result.success) {
          return atMessage(session.userId, ` ${result.message}`)
        }

        const data = result.data!

        let message = '\n\n━━━━━━━━━━━━━━\n'
        message += `🗺️ ${data.packageName}\n\n`
        message += `${data.description}\n\n`
        message += '━━━━━━━━━━━━━━\n\n'
        message += `【第1题】\n${data.question}\n\n`

        if (data.options) {
          data.options.forEach(opt => {
            message += `${opt}\n`
          })
          message += '\n请输入选项字母（A/B/C/D）'
        } else {
          message += '请输入你的答案'
        }

        if (data.timeoutMessage) {
          message += `\n\n⏱️ ${data.timeoutMessage}`
        }

        return h('', [
          h('at', { id: session.userId }),
          h('text', { content: message })
        ])

      } catch (error) {
        ctx.logger('xiuxian').error('启动遗迹包失败:', error)
        return atMessage(session.userId, ' 触发遗迹时遇到了问题')
      }
    })

  /**
   * 情义包测试
   */
  ctx.command('修仙.情义', '触发情义抉择包（测试）')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      try {
        const player = await playerService.getPlayer(session.userId)
        if (!player) {
          return atMessage(session.userId, ' 你尚未踏入仙途，使用 修仙.步入仙途 开启修仙之路吧！')
        }

        if (questioningService.isInQuestioning(session.userId)) {
          return atMessage(session.userId, ' 你正在进行问心，请先完成当前问心')
        }

        const result = await questioningService.startPackageByTagTest(
          session.userId,
          'bond'
        )

        if (!result.success) {
          return atMessage(session.userId, ` ${result.message}`)
        }

        const data = result.data!

        let message = '\n\n━━━━━━━━━━━━━━\n'
        message += `❤️ ${data.packageName}\n\n`
        message += `${data.description}\n\n`
        message += '━━━━━━━━━━━━━━\n\n'
        message += `【第1题】\n${data.question}\n\n`

        if (data.options) {
          data.options.forEach(opt => {
            message += `${opt}\n`
          })
          message += '\n请输入选项字母（A/B/C/D）'
        } else {
          message += '请输入你的答案'
        }

        if (data.timeoutMessage) {
          message += `\n\n⏱️ ${data.timeoutMessage}`
        }

        return h('', [
          h('at', { id: session.userId }),
          h('text', { content: message })
        ])

      } catch (error) {
        ctx.logger('xiuxian').error('启动情义包失败:', error)
        return atMessage(session.userId, ' 触发情义抉择时遇到了问题')
      }
    })

  /**
   * 欲望包测试
   */
  ctx.command('修仙.欲望', '触发欲望试炼包（测试）')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      try {
        const player = await playerService.getPlayer(session.userId)
        if (!player) {
          return atMessage(session.userId, ' 你尚未踏入仙途，使用 修仙.步入仙途 开启修仙之路吧！')
        }

        if (questioningService.isInQuestioning(session.userId)) {
          return atMessage(session.userId, ' 你正在进行问心，请先完成当前问心')
        }

        const result = await questioningService.startPackageByTagTest(
          session.userId,
          'desire'
        )

        if (!result.success) {
          return atMessage(session.userId, ` ${result.message}`)
        }

        const data = result.data!

        let message = '\n\n━━━━━━━━━━━━━━\n'
        message += `💎 ${data.packageName}\n\n`
        message += `${data.description}\n\n`
        message += '━━━━━━━━━━━━━━\n\n'
        message += `【第1题】\n${data.question}\n\n`

        if (data.options) {
          data.options.forEach(opt => {
            message += `${opt}\n`
          })
          message += '\n请输入选项字母（A/B/C/D）'
        } else {
          message += '请输入你的答案'
        }

        if (data.timeoutMessage) {
          message += `\n\n⏱️ ${data.timeoutMessage}`
        }

        return h('', [
          h('at', { id: session.userId }),
          h('text', { content: message })
        ])

      } catch (error) {
        ctx.logger('xiuxian').error('启动欲望包失败:', error)
        return atMessage(session.userId, ' 触发欲望试炼时遇到了问题')
      }
    })

  /**
   * 查看问道包列表
   */
  ctx.command('修仙.问道包列表 <tag:string>', '查看指定Tag的问道包')
    .action(async ({ session }, tag) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      try {
        if (!tag) {
          const stats = questioningService.getPackageStats()
          let message = '\n\n━━━━ 可用Tag ━━━━\n\n'
          message += '使用 修仙.问道包列表 <tag> 查看详情\n\n'

          const tagNames: Record<string, string> = {
            'opportunity': '💰 机缘',
            'enlightenment': '✨ 感悟',
            'demon': '😈 魔道',
            'exploration': '🗺️ 遗迹',
            'trial': '⚔️ 试炼',
            'bond': '❤️ 情义'
          }

          for (const [t, count] of Object.entries(stats.tagCounts)) {
            const name = tagNames[t] || t
            message += `   ${name} (${count}个)\n`
          }

          message += '\n━━━━━━━━━━━━━━'

          return h('', [
            h('at', { id: session.userId }),
            h('text', { content: message })
          ])
        }

        const packages = questioningService.getPackagesByTag(tag)

        if (packages.length === 0) {
          return atMessage(session.userId, ` 未找到Tag为 ${tag} 的问道包`)
        }

        let message = '\n\n━━━━━━━━━━━━━━\n'
        message += `Tag: ${tag} (${packages.length}个)\n\n`

        for (const pkg of packages) {
          message += `📦 ${pkg.name}\n`
          message += `   ${pkg.description}\n`

          const cond = pkg.triggerConditions
          if (cond.minRealm) {
            message += `   最低境界：${cond.minRealm}级\n`
          }
          if (cond.cooldownHours) {
            message += `   冷却：${cond.cooldownHours}小时\n`
          }
          if (cond.triggerChance) {
            message += `   触发率：${(cond.triggerChance * 100).toFixed(0)}%\n`
          }

          message += '\n'
        }

        message += '━━━━━━━━━━━━━━'

        return h('', [
          h('at', { id: session.userId }),
          h('text', { content: message })
        ])

      } catch (error) {
        ctx.logger('xiuxian').error('查询问道包列表失败:', error)
        return atMessage(session.userId, ' 查询问道包列表时遇到了问题')
      }
    })
}
