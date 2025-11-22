import { Context } from 'koishi'
import { KoishiAppContext } from '../adapters/koishi'
import { PlayerService } from '../services/player.service'
import { BuffType, BuffSource } from '../types/buff'
import { atMessage } from '../utils/formatter'
import { extractMentionedUserId } from '../utils/common-helpers'

/**
 * 注册开发者Buff管理命令（v1.0.0）
 */
export function registerDevBuffCommands(ctx: Context, config?: any) {
  const appContext = KoishiAppContext.from(ctx, 'xiuxian', config)
  const playerService = new PlayerService(appContext)
  const buffService = playerService.getBuffService()

  /**
   * 查看玩家所有Buff
   */
  ctx.command('修仙/查看buff', '查看玩家的所有buff（开发者）')
    .alias('查看buff')
    .usage('修仙.查看buff @玩家 - @提及玩家，不提及则查看自己')
    .example('修仙.查看buff  // 查看自己的buff')
    .example('修仙.查看buff @张三  // 查看张三的buff')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      // 尝试从@提及中获取目标用户ID
      const mentionedUserId = extractMentionedUserId(session)
      const targetUserId = mentionedUserId || session.userId

      try {
        const buffs = await buffService.getActiveBuffs(targetUserId)

        if (buffs.length === 0) {
          return atMessage(session.userId, ' 当前没有任何生效的buff')
        }

        let message = `\n\n━━━━ Buff列表 ━━━━\n\n`
        message += `用户: ${targetUserId}\n`
        message += `当前buff数量: ${buffs.length}\n\n`

        for (const buff of buffs) {
          const valueStr = buff.isMultiplier
            ? `${(buff.value * 100).toFixed(0)}%`
            : `${buff.value >= 0 ? '+' : ''}${buff.value}`

          const remainingTime = buff.endTime
            ? `还剩${Math.ceil((new Date(buff.endTime).getTime() - Date.now()) / (60 * 60 * 1000))}小时`
            : '永久'

          message += `[${buff.id}] ${buff.description}\n`
          message += `  类型: ${buff.buffType} | 来源: ${buff.buffSource}\n`
          message += `  数值: ${valueStr} | ${remainingTime}\n\n`
        }

        message += `━━━━━━━━━━━━━━`

        return atMessage(session.userId, message)
      } catch (error) {
        ctx.logger('xiuxian').error('查看buff失败:', error)
        return atMessage(session.userId, ' 查询失败')
      }
    })

  /**
   * 添加Buff
   */
  ctx.command('修仙/添加buff <type:string> <value:number> [hours:number]', '给玩家添加buff（开发者）')
    .alias('添加buff')
    .usage('修仙.添加buff @玩家 <类型> <数值> [持续时间（小时）]')
    .usage('类型: cultivation_speed | breakthrough_rate | cultivation_requirement')
    .example('修仙.添加buff @张三 cultivation_speed 0.5 24  // 添加50%修炼加速，持续24小时')
    .example('修仙.添加buff @李四 breakthrough_rate 0.1 168  // 添加10%突破率，持续7天')
    .action(async ({ session }, type, value, hours) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      // 从@提及中获取目标用户ID
      const mentionedUserId = extractMentionedUserId(session)
      if (!mentionedUserId) {
        return atMessage(session.userId, ' 请使用 @提及 指定目标玩家')
      }

      if (!type || value === undefined) {
        return atMessage(session.userId, ' 参数不完整：修仙.添加buff @玩家 <类型> <数值> [小时]')
      }

      // 验证类型
      const validTypes = Object.values(BuffType)
      if (!validTypes.includes(type as BuffType)) {
        return atMessage(session.userId, ` 无效的buff类型，可选：${validTypes.join(', ')}`)
      }

      try {
        // 检查玩家是否存在
        const player = await playerService.getPlayer(mentionedUserId)
        if (!player) {
          return atMessage(session.userId, ` 玩家不存在`)
        }

        // 创建buff
        const buffData = {
          userId: mentionedUserId,
          buffType: type as BuffType,
          buffSource: BuffSource.SPECIAL,
          sourceId: 'dev_command',
          value,
          isMultiplier: Math.abs(value) < 10,  // 小于10认为是倍率，否则是固定值
          startTime: new Date(),
          endTime: hours ? new Date(Date.now() + hours * 60 * 60 * 1000) : null,
          stackable: true,
          maxStacks: 5,
          description: `开发者添加：${type} ${value >= 0 ? '+' : ''}${value}`
        }

        const result = await buffService.addBuff(buffData)

        if (result.success && result.data) {
          const durationText = hours ? `持续${hours}小时` : '永久'
          return atMessage(session.userId, ` 已添加buff [${result.data.id}]：${type} ${value >= 0 ? '+' : ''}${value}（${durationText}）`)
        } else {
          return atMessage(session.userId, ` 添加失败：${result.message}`)
        }
      } catch (error) {
        ctx.logger('xiuxian').error('添加buff失败:', error)
        return atMessage(session.userId, ' 添加失败')
      }
    })

  /**
   * 删除Buff
   */
  ctx.command('修仙/删除buff <buffId:number>', '删除指定buff（开发者）')
    .alias('删除buff')
    .usage('修仙.删除buff <BuffID>')
    .example('修仙.删除buff 123  // 删除ID为123的buff')
    .action(async ({ session }, buffId) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      if (!buffId) {
        return atMessage(session.userId, ' 请指定要删除的buff ID')
      }

      try {
        const result = await buffService.removeBuff(buffId)

        if (result.success) {
          return atMessage(session.userId, ` 已删除buff [${buffId}]`)
        } else {
          return atMessage(session.userId, ` 删除失败：${result.message}`)
        }
      } catch (error) {
        ctx.logger('xiuxian').error('删除buff失败:', error)
        return atMessage(session.userId, ' 删除失败')
      }
    })

  /**
   * 清理过期Buff
   */
  ctx.command('修仙/清理过期buff', '手动清理所有过期的buff（开发者）')
    .alias('清理过期buff')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      try {
        const count = await buffService.cleanExpiredBuffs()
        return atMessage(session.userId, ` 已清理 ${count} 个过期buff`)
      } catch (error) {
        ctx.logger('xiuxian').error('清理过期buff失败:', error)
        return atMessage(session.userId, ' 清理失败')
      }
    })

  /**
   * 查看Buff统计
   */
  ctx.command('修仙/buff统计', '查看当前系统中的buff统计信息（开发者）')
    .alias('buff统计')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      try {
        // 获取所有buff（包括过期的）
        const allBuffs = await ctx.database.get<any>('xiuxian_buff_v3', {})
        const now = Date.now()

        // 分类统计
        const activeBuffs = allBuffs.filter(b => !b.endTime || new Date(b.endTime).getTime() > now)
        const expiredBuffs = allBuffs.filter(b => b.endTime && new Date(b.endTime).getTime() <= now)

        // 按类型统计
        const typeStats: Record<string, number> = {}
        for (const buff of activeBuffs) {
          typeStats[buff.buffType] = (typeStats[buff.buffType] || 0) + 1
        }

        // 按来源统计
        const sourceStats: Record<string, number> = {}
        for (const buff of activeBuffs) {
          sourceStats[buff.buffSource] = (sourceStats[buff.buffSource] || 0) + 1
        }

        let message = `\n\n━━━━ Buff统计 ━━━━\n\n`
        message += `总计: ${allBuffs.length} 个\n`
        message += `生效中: ${activeBuffs.length} 个\n`
        message += `已过期: ${expiredBuffs.length} 个\n\n`

        message += `【按类型】\n`
        for (const [type, count] of Object.entries(typeStats)) {
          message += `${type}: ${count}\n`
        }

        message += `\n【按来源】\n`
        for (const [source, count] of Object.entries(sourceStats)) {
          message += `${source}: ${count}\n`
        }

        message += `\n━━━━━━━━━━━━━━`

        return atMessage(session.userId, message)
      } catch (error) {
        ctx.logger('xiuxian').error('查看buff统计失败:', error)
        return atMessage(session.userId, ' 查询失败')
      }
    })

  /**
   * 清空玩家所有Buff
   */
  ctx.command('修仙/清空buff', '清空指定玩家的所有buff（开发者）')
    .alias('清空buff')
    .usage('修仙.清空buff @玩家')
    .example('修仙.清空buff @张三  // 清空张三的所有buff')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      // 从@提及中获取目标用户ID
      const mentionedUserId = extractMentionedUserId(session)
      if (!mentionedUserId) {
        return atMessage(session.userId, ' 请使用 @提及 指定目标玩家')
      }

      try {
        const buffs = await buffService.getActiveBuffs(mentionedUserId)
        let count = 0

        for (const buff of buffs) {
          await buffService.removeBuff(buff.id)
          count++
        }

        return atMessage(session.userId, ` 已清空玩家的 ${count} 个buff`)
      } catch (error) {
        ctx.logger('xiuxian').error('清空buff失败:', error)
        return atMessage(session.userId, ' 清空失败')
      }
    })
}
