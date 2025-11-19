import { Context, Schema, h } from 'koishi'
import { initDatabase } from './database'

export const name = 'xiuxian-txl'
export const inject = ['database']

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  // 初始化数据库
  initDatabase(ctx)

  /**
   * 命令：步入仙途
   * 功能：创建角色，角色名为玩家的QQ昵称
   */
  ctx.command('步入仙途', '踏入修仙世界，开启仙途之旅')
    .action(async ({ session }) => {
      if (!session) return '系统错误：无法获取会话信息'

      const userId = session.userId
      const username = session.username || session.author?.nick || session.author?.username || '无名修士'

      try {
        // 检查是否已经创建过角色
        const existingPlayer = await ctx.database.get('xiuxian_player', { userId })

        if (existingPlayer.length > 0) {
          return h('', [
            h('at', { id: userId }),
            h('text', { content: ` 你已踏入仙途，无需重复入门。\n道号：${existingPlayer[0].username}` })
          ])
        }

        // 创建新角色
        await ctx.database.create('xiuxian_player', {
          userId,
          username,
          createTime: new Date(),
        })

        return h('', [
          h('at', { id: userId }),
          h('text', { content: ` 恭喜你踏入修仙世界！\n\n✨ 你的仙途由此开启 ✨\n道号：${username}\n\n愿你在这修仙世界中破开虚妄，证得大道！\n\n💡 使用 .天道记录 查看你的信息` })
        ])

      } catch (error) {
        ctx.logger('xiuxian').error('创建角色失败:', error)
        return h('', [
          h('at', { id: userId }),
          h('text', { content: ' 踏入仙途时遇到了天劫阻碍，请稍后再试...' })
        ])
      }
    })

  /**
   * 命令：天道记录
   * 功能：查看玩家个人信息
   */
  ctx.command('天道记录', '查看你的修仙信息')
    .action(async ({ session }) => {
      if (!session) return '系统错误：无法获取会话信息'

      const userId = session.userId

      try {
        // 查询玩家信息
        const player = await ctx.database.get('xiuxian_player', { userId })

        if (player.length === 0) {
          return h('', [
            h('at', { id: userId }),
            h('text', { content: ' 你尚未踏入仙途，使用 .步入仙途 开启修仙之路吧！' })
          ])
        }

        const playerInfo = player[0]
        const createDate = new Date(playerInfo.createTime).toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai'
        })

        return h('', [
          h('at', { id: userId }),
          h('text', { content: `\n\n━━━━ 天道记录 ━━━━\n\n👤 道号：${playerInfo.username}\n📅 入门时间：${createDate}\n\n━━━━━━━━━━━━━━` })
        ])

      } catch (error) {
        ctx.logger('xiuxian').error('查询玩家信息失败:', error)
        return h('', [
          h('at', { id: userId }),
          h('text', { content: ' 查询天道记录时遇到了问题，请稍后再试...' })
        ])
      }
    })

  // 插件启动日志
  ctx.logger('xiuxian').info('修仙插件已启动')
}
