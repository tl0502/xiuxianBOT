import { Context, h } from 'koishi'
import { QuestioningService } from '../services/questioning.service'
import { PlayerService } from '../services/player.service'
import { atMessage } from '../utils/formatter'
import { getRealmName } from '../utils/calculator'

/**
 * 注册开发者问道包命令（v1.0.1）
 */
export function registerDevPackageCommands(
  ctx: Context,
  playerService: PlayerService,
  questioningService: QuestioningService
) {
  const pathPackageService = questioningService.getPathPackageService()

  /**
   * 问道包统计
   */
  ctx.command('修仙/问道包统计', '查看问道包完成统计（开发者）')
    .alias('问道包统计')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      try {
        const player = await playerService.getPlayer(session.userId)
        if (!player) {
          return atMessage(session.userId, ' 你尚未踏入仙途')
        }

        const stats = pathPackageService.getStats()

        let message = '\n\n━━━━ 问道包统计 ━━━━\n\n'

        const entries = Object.entries(stats)
        if (entries.length === 0) {
          message += '暂无问道包数据\n'
        } else {
          for (const [packageId, count] of entries) {
            const pkg = pathPackageService.getById(packageId)
            const packageName = pkg ? pkg.name : packageId
            message += `📦 ${packageName}\n`
            message += `   完成次数：${count}\n\n`
          }
        }

        message += '━━━━━━━━━━━━━━'

        return atMessage(session.userId, message)
      } catch (error) {
        ctx.logger('xiuxian').error('查询问道包统计失败:', error)
        return atMessage(session.userId, ' 查询失败')
      }
    })

  /**
   * 机缘
   */
  ctx.command('修仙/机缘', '测试【机缘】问道包（开发者）')
    .alias('机缘')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      try {
        const player = await playerService.getPlayer(session.userId)
        if (!player) {
          return atMessage(session.userId, ' 你尚未踏入仙途')
        }

        const result = await questioningService.startPackageByTagTest(
          session.userId,
          'opportunity'
        )

        if (!result.success || !result.data) {
          return atMessage(session.userId, ' ' + result.message)
        }

        let message = `\n\n━━━━ ${result.data.packageName} ━━━━\n\n`
        message += `${result.data.description}\n\n`
        message += `📝 问题 1/3：\n${result.data.question}\n\n`

        if (result.data.options) {
          result.data.options.forEach((opt: string, i: number) => {
            message += `${String.fromCharCode(65 + i)}. ${opt}\n`
          })
          message += `\n请回复选项字母（如：A）`
        } else {
          message += `请自由回答`
        }

        if (result.data.timeoutMessage) {
          message += `\n\n${result.data.timeoutMessage}`
        }

        return atMessage(session.userId, message)
      } catch (error) {
        ctx.logger('xiuxian').error('开始机缘问道包失败:', error)
        return atMessage(session.userId, ' 开始问道包失败')
      }
    })

  /**
   * 感悟
   */
  ctx.command('修仙/感悟', '测试【感悟】问道包（开发者）')
    .alias('感悟')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      try {
        const player = await playerService.getPlayer(session.userId)
        if (!player) {
          return atMessage(session.userId, ' 你尚未踏入仙途')
        }

        const result = await questioningService.startPackageByTagTest(
          session.userId,
          'enlightenment'
        )

        if (!result.success || !result.data) {
          return atMessage(session.userId, ' ' + result.message)
        }

        let message = `\n\n━━━━ ${result.data.packageName} ━━━━\n\n`
        message += `${result.data.description}\n\n`
        message += `📝 问题 1/3：\n${result.data.question}\n\n`

        if (result.data.options) {
          result.data.options.forEach((opt: string, i: number) => {
            message += `${String.fromCharCode(65 + i)}. ${opt}\n`
          })
          message += `\n请回复选项字母（如：A）`
        } else {
          message += `请自由回答`
        }

        if (result.data.timeoutMessage) {
          message += `\n\n${result.data.timeoutMessage}`
        }

        return atMessage(session.userId, message)
      } catch (error) {
        ctx.logger('xiuxian').error('开始感悟问道包失败:', error)
        return atMessage(session.userId, ' 开始问道包失败')
      }
    })

  /**
   * 心魔
   */
  ctx.command('修仙/心魔', '测试【心魔】问道包（开发者）')
    .alias('心魔')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      try {
        const player = await playerService.getPlayer(session.userId)
        if (!player) {
          return atMessage(session.userId, ' 你尚未踏入仙途')
        }

        const result = await questioningService.startPackageByTagTest(
          session.userId,
          'inner_demon'
        )

        if (!result.success || !result.data) {
          return atMessage(session.userId, ' ' + result.message)
        }

        let message = `\n\n━━━━ ${result.data.packageName} ━━━━\n\n`
        message += `${result.data.description}\n\n`
        message += `📝 问题 1/3：\n${result.data.question}\n\n`

        if (result.data.options) {
          result.data.options.forEach((opt: string, i: number) => {
            message += `${String.fromCharCode(65 + i)}. ${opt}\n`
          })
          message += `\n请回复选项字母（如：A）`
        } else {
          message += `请自由回答`
        }

        if (result.data.timeoutMessage) {
          message += `\n\n${result.data.timeoutMessage}`
        }

        return atMessage(session.userId, message)
      } catch (error) {
        ctx.logger('xiuxian').error('开始心魔问道包失败:', error)
        return atMessage(session.userId, ' 开始问道包失败')
      }
    })

  /**
   * 遗迹
   */
  ctx.command('修仙/遗迹', '测试【遗迹】问道包（开发者）')
    .alias('遗迹')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      try {
        const player = await playerService.getPlayer(session.userId)
        if (!player) {
          return atMessage(session.userId, ' 你尚未踏入仙途')
        }

        const result = await questioningService.startPackageByTagTest(
          session.userId,
          'ruins'
        )

        if (!result.success || !result.data) {
          return atMessage(session.userId, ' ' + result.message)
        }

        let message = `\n\n━━━━ ${result.data.packageName} ━━━━\n\n`
        message += `${result.data.description}\n\n`
        message += `📝 问题 1/3：\n${result.data.question}\n\n`

        if (result.data.options) {
          result.data.options.forEach((opt: string, i: number) => {
            message += `${String.fromCharCode(65 + i)}. ${opt}\n`
          })
          message += `\n请回复选项字母（如：A）`
        } else {
          message += `请自由回答`
        }

        if (result.data.timeoutMessage) {
          message += `\n\n${result.data.timeoutMessage}`
        }

        return atMessage(session.userId, message)
      } catch (error) {
        ctx.logger('xiuxian').error('开始遗迹问道包失败:', error)
        return atMessage(session.userId, ' 开始问道包失败')
      }
    })

  /**
   * 情义
   */
  ctx.command('修仙/情义', '测试【情义】问道包（开发者）')
    .alias('情义')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      try {
        const player = await playerService.getPlayer(session.userId)
        if (!player) {
          return atMessage(session.userId, ' 你尚未踏入仙途')
        }

        const result = await questioningService.startPackageByTagTest(
          session.userId,
          'relationship'
        )

        if (!result.success || !result.data) {
          return atMessage(session.userId, ' ' + result.message)
        }

        let message = `\n\n━━━━ ${result.data.packageName} ━━━━\n\n`
        message += `${result.data.description}\n\n`
        message += `📝 问题 1/3：\n${result.data.question}\n\n`

        if (result.data.options) {
          result.data.options.forEach((opt: string, i: number) => {
            message += `${String.fromCharCode(65 + i)}. ${opt}\n`
          })
          message += `\n请回复选项字母（如：A）`
        } else {
          message += `请自由回答`
        }

        if (result.data.timeoutMessage) {
          message += `\n\n${result.data.timeoutMessage}`
        }

        return atMessage(session.userId, message)
      } catch (error) {
        ctx.logger('xiuxian').error('开始情义问道包失败:', error)
        return atMessage(session.userId, ' 开始问道包失败')
      }
    })

  /**
   * 欲望
   */
  ctx.command('修仙/欲望', '测试【欲望】问道包（开发者）')
    .alias('欲望')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      try {
        const player = await playerService.getPlayer(session.userId)
        if (!player) {
          return atMessage(session.userId, ' 你尚未踏入仙途')
        }

        const result = await questioningService.startPackageByTagTest(
          session.userId,
          'desire'
        )

        if (!result.success || !result.data) {
          return atMessage(session.userId, ' ' + result.message)
        }

        let message = `\n\n━━━━ ${result.data.packageName} ━━━━\n\n`
        message += `${result.data.description}\n\n`
        message += `📝 问题 1/3：\n${result.data.question}\n\n`

        if (result.data.options) {
          result.data.options.forEach((opt: string, i: number) => {
            message += `${String.fromCharCode(65 + i)}. ${opt}\n`
          })
          message += `\n请回复选项字母（如：A）`
        } else {
          message += `请自由回答`
        }

        if (result.data.timeoutMessage) {
          message += `\n\n${result.data.timeoutMessage}`
        }

        return atMessage(session.userId, message)
      } catch (error) {
        ctx.logger('xiuxian').error('开始欲望问道包失败:', error)
        return atMessage(session.userId, ' 开始问道包失败')
      }
    })

  /**
   * 问道包列表
   */
  ctx.command('修仙/问道包列表', '查看所有可用的问道包（开发者）')
    .alias('问道包列表')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      try {
        const player = await playerService.getPlayer(session.userId)
        if (!player) {
          return atMessage(session.userId, ' 你尚未踏入仙途')
        }

        const packages = pathPackageService.getAll()

        if (packages.length === 0) {
          return atMessage(session.userId, ' 当前没有可用的问道包')
        }

        let message = '\n\n━━━━ 问道包列表 ━━━━\n\n'
        message += '💫 可使用对应命令直接触发：\n\n'

        for (const pkg of packages) {
          message += `📦 ${pkg.name}\n`
          message += `   ${pkg.description}\n`
          message += `   标签：${pkg.tags.join('、')}\n\n`
        }

        message += '━━━━━━━━━━━━━━'

        return atMessage(session.userId, message)
      } catch (error) {
        ctx.logger('xiuxian').error('查询问道包列表失败:', error)
        return atMessage(session.userId, ' 查询失败')
      }
    })

  /**
   * 问心列表
   */
  ctx.command('修仙/问心列表', '查看可用的问心路径（开发者）')
    .alias('问心列表')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      try {
        const player = await playerService.getPlayer(session.userId)
        if (!player) {
          return h('', [
            atMessage(session.userId, ' 你尚未踏入仙途，使用 步入仙途 开启修仙之路吧！')
          ])
        }

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

          if (path.triggerConditions.minRealm !== undefined && path.triggerConditions.minRealm !== false) {
            message += `   最低要求：${getRealmName(path.triggerConditions.minRealm, 0)}\n`
          }

          // v1.2.0: 冷却时间已改用通用冷却系统，不再从包配置读取

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
   * 问道包管理（v1.1.0 新增）
   * 查看数据库中所有问道包的信息和统计
   */
  ctx.command('修仙/问道包管理', '管理问道包启用状态（开发者）')
    .alias('问道包管理')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      try {
        // 从数据库查询所有问道包
        const packages = await pathPackageService.getAllPackagesFromDatabase()

        if (packages.length === 0) {
          return atMessage(session.userId, ' 数据库中暂无问道包数据，请重启插件进行初始化')
        }

        let message = '\n\n━━━━ 问道包管理 ━━━━\n\n'
        message += '📊 包ID | 名称 | 状态 | 触发/完成\n'
        message += '─'.repeat(30) + '\n\n'

        for (const pkg of packages) {
          const status = pkg.enabled ? '✅' : '❌'
          const stats = `${pkg.totalTriggered || 0}/${pkg.totalCompleted || 0}`
          message += `${status} ${pkg.packageId}\n`
          message += `   ${pkg.packageName} (${stats})\n`

          const tags = JSON.parse(pkg.tags || '[]')
          message += `   标签: ${tags.join(', ')}\n`
          message += `   概率: ${(pkg.triggerChance * 100).toFixed(0)}%\n\n`
        }

        message += '━━━━━━━━━━━━━━\n'
        message += '💡 使用 问道包启用/禁用 <包ID> 管理包状态'

        return atMessage(session.userId, message)
      } catch (error) {
        ctx.logger('xiuxian').error('查询问道包管理失败:', error)
        return atMessage(session.userId, ' 查询失败')
      }
    })

  /**
   * 问道包启用（v1.1.0 新增）
   */
  ctx.command('修仙/问道包启用 <packageId:text>', '启用指定问道包（开发者）')
    .alias('问道包启用')
    .action(async ({ session }, packageId) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'
      if (!packageId) return atMessage(session.userId, ' 请指定问道包ID')

      try {
        const success = await pathPackageService.setPackageEnabled(packageId, true)
        if (success) {
          return atMessage(session.userId, ` 问道包【${packageId}】已启用`)
        } else {
          return atMessage(session.userId, ` 未找到问道包【${packageId}】`)
        }
      } catch (error) {
        ctx.logger('xiuxian').error('启用问道包失败:', error)
        return atMessage(session.userId, ' 操作失败')
      }
    })

  /**
   * 问道包禁用（v1.1.0 新增）
   */
  ctx.command('修仙/问道包禁用 <packageId:text>', '禁用指定问道包（开发者）')
    .alias('问道包禁用')
    .action(async ({ session }, packageId) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'
      if (!packageId) return atMessage(session.userId, ' 请指定问道包ID')

      try {
        const success = await pathPackageService.setPackageEnabled(packageId, false)
        if (success) {
          return atMessage(session.userId, ` 问道包【${packageId}】已禁用`)
        } else {
          return atMessage(session.userId, ` 未找到问道包【${packageId}】`)
        }
      } catch (error) {
        ctx.logger('xiuxian').error('禁用问道包失败:', error)
        return atMessage(session.userId, ' 操作失败')
      }
    })
}
