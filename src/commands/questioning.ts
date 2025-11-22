import { Context, h } from 'koishi'
import { QuestioningService } from '../services/questioning.service'
import { PlayerService } from '../services/player.service'
import { atMessage } from '../utils/formatter'
import { getSpiritualRootInfo } from '../utils/calculator'
import { AnswerSubmitData } from '../types/questioning'
import { extractMentionedUserId } from '../utils/common-helpers'

/**
 * 注册问道相关命令
 * v1.1.0 更新：问心系统统一到问道包系统
 */
export function registerQuestioningCommands(
  ctx: Context,
  playerService: PlayerService,
  questioningService: QuestioningService
) {

  /**
   * 问道守心（随机选择问道包）
   * v1.1.0 重构：使用全局冷却和灵根亲和度抽取系统
   * 触发范围：所有问道包（排除 initiation）
   */
  ctx.command('修仙/问道守心', '进行问道试炼（随机路径）')
    .alias('问道守心')
    .alias('问道')
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

        // v1.1.0 新增：使用灵根亲和度抽取问道包
        const pathPackageService = questioningService.getPathPackageService()
        const selectedPackage = await pathPackageService.selectPackageWithAffinity(
          player,
          ['initiation']  // 排除步入仙途包
        )

        if (!selectedPackage) {
          return h('', [
            atMessage(session.userId, ' 当前没有适合你的问道包，请提升境界后再来')
          ])
        }

        // 检查是否已有进行中的问心（安全检查）
        if (questioningService.isInQuestioning(session.userId)) {
          return h('', [
            atMessage(session.userId, ' 你正在进行问心，请先完成或取消')
          ])
        }

        // 使用包的第一个tag启动（内部会检查冷却时间）
        const result = await questioningService.startPackageByTag(
          session.userId,
          selectedPackage.tags[0],
          player  // 传入玩家对象用于境界检查和冷却检查
        )

        if (!result.success || !result.data) {
          return h('', [
            atMessage(session.userId, ' ' + result.message)
          ])
        }

        let message = `\n\n━━━━ ${result.data.packageName} ━━━━\n\n`
        message += `${result.data.description}\n\n`
        message += `📝 问题 1/3：\n${result.data.question}\n\n`

        if (result.data.options) {
          result.data.options.forEach((opt: string) => {
            message += `${opt}\n`
          })
          message += `\n请输入严格的大写选项字母（例如：A），有效选项：${result.data.options.map((_, i) => String.fromCharCode(65 + i)).join('/')}`
        } else {
          message += `请自由回答`
        }

        if (result.data.timeoutMessage) {
          message += `\n\n${result.data.timeoutMessage}`
        }

        return h('', [
          h('at', { id: session.userId }),
          h('text', { content: message })
        ])

      } catch (error) {
        ctx.logger('xiuxian').error('开始问道守心失败:', error)
        return h('', [
          atMessage(session.userId, ' 开始问道试炼时遇到了问题')
        ])
      }
    })

  /**
   * 问道历史（原问心历史）
   * v1.0.1 更新：支持@提及查看其他玩家
   * v1.1.0 更新：改名为问道历史
   */
  ctx.command('修仙/问道历史', '查看问道历史记录')
    .alias('问道历史')
    .alias('问心历史')  // 兼容旧命令
    .usage('问心历史 - 查看自己的问心记录\n问心历史 @玩家 - 查看被@玩家的问心记录')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      const currentUserId = session.userId

      try {
        // 检查是否有@提及
        const mentionedUserId = extractMentionedUserId(session)
        const targetUserId = mentionedUserId || currentUserId

        const result = await questioningService.getHistory(targetUserId)

        if (!result.success || !result.data || result.data.length === 0) {
          return h('', [
            atMessage(currentUserId, mentionedUserId ? ' 该玩家暂无问心记录' : ' 暂无问心记录')
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
          h('at', { id: currentUserId }),
          h('text', { content: message })
        ])

      } catch (error) {
        ctx.logger('xiuxian').error('查询问心历史失败:', error)
        return h('', [
          atMessage(currentUserId, ' 查询问心历史时遇到了问题')
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

        // ✨ 关键修复：排除 INITIATION 包，让它走注册流程
        if (pkg && !pkg.tags.includes('initiation')) {
          // 使用问道包处理逻辑（仅用于非注册包）
          result = await questioningService.submitPackageAnswer(session.userId, answer)
        } else {
          // 使用传统问心逻辑（包括步入仙途注册流程）
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
          data.options.forEach((opt) => {
            message += `${opt}\n`
          })
          message += `\n请输入严格的大写选项字母（例如：A），有效选项：${data.options.map((_, i) => String.fromCharCode(65 + i)).join('/')}`
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
       // message += `🎭 天道评语：\n${data.personality}\n\n`
        message += `📜 天道反馈：\n${data.reason}\n\n`
        message += `━━━━ 你的信息 ━━━━\n\n`
        message += `👤 道号：${data.daoName}\n`
        message += `🌟 灵根：${spiritualRootInfo.name}\n`
        message += `   ${spiritualRootInfo.description}\n\n`
        message += `💡 使用 天道记录 查看完整信息\n\n`

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
