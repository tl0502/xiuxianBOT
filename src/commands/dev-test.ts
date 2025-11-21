import { Context } from 'koishi'
import { FateCalculator } from '../utils/fate-calculator'
import { analyzePersonality, PersonalityScore } from '../utils/personality-analyzer'
import { KoishiAppContext } from '../adapters/koishi'
import { RootStatsService } from '../services/root-stats.service'
import { atMessage } from '../utils/formatter'

/**
 * 注册开发者测试命令
 */
export function registerDevTestCommands(ctx: Context) {
  const appContext = KoishiAppContext.from(ctx)
  const rootStatsService = new RootStatsService(appContext)
  const fateCalculator = new FateCalculator(ctx)

  /**
   * 测试灵根分布
   */
  ctx.command('修仙.测试灵根 [count:number]', '测试灵根概率分布（开发者）')
    .usage('测试灵根 [次数] - 默认100次')
    .example('测试灵根 500  // 模拟500次灵根分配')
    .action(async ({ session }, count = 100) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      // 限制测试次数
      if (count < 1 || count > 1000) {
        return atMessage(session.userId, ' 测试次数必须在 1-1000 之间')
      }

      try {
        // 统计结果
        const results: Record<string, number> = {}
        const personalities = [
          'balanced',    // 平衡型
          'kind',        // 善良型
          'greedy',      // 贪婪型
          'brave',       // 勇敢型
          'cautious'     // 谨慎型
        ]

        // 模拟分配
        for (let i = 0; i < count; i++) {
          // 随机选择一种性格倾向
          const personalityType = personalities[Math.floor(Math.random() * personalities.length)]
          const personality = generateTestPersonality(personalityType)

          // 使用 FateCalculator 选择灵根
          const rootType = await fateCalculator.selectSpiritualRoot(personality)

          // 统计结果
          results[rootType] = (results[rootType] || 0) + 1
        }

        // 格式化输出
        let message = `\n\n━━━━ 灵根分布测试 ━━━━\n\n`
        message += `测试次数：${count}\n\n`

        // 按数量排序
        const sorted = Object.entries(results).sort((a, b) => b[1] - a[1])

        for (const [rootType, num] of sorted) {
          const percent = ((num / count) * 100).toFixed(1)
          const bar = '█'.repeat(Math.floor(num / count * 20))
          message += `${rootType}: ${num} (${percent}%) ${bar}\n`
        }

        message += `\n━━━━━━━━━━━━━━`

        return atMessage(session.userId, message)

      } catch (error) {
        ctx.logger('xiuxian').error('测试灵根分布失败:', error)
        return atMessage(session.userId, ' 测试失败: ' + (error as Error).message)
      }
    })

  /**
   * 查看当前灵根统计
   */
  ctx.command('修仙.查看统计', '查看当前灵根分布统计（开发者）')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      try {
        const stats = await rootStatsService.getAllStats()

        let message = `\n\n━━━━ 灵根分布统计 ━━━━\n\n`

        let totalInitial = 0
        let totalCurrent = 0
        for (const counts of stats.values()) {
          totalInitial += counts.initialCount
          totalCurrent += counts.currentCount
        }

        if (totalInitial === 0 && totalCurrent === 0) {
          message += '暂无玩家数据\n'
        } else {
          // 转换 Map 为数组并按 initialCount 排序
          const sorted = Array.from(stats.entries()).sort((a, b) => b[1].initialCount - a[1].initialCount)

          message += `【初始灵根】\n`
          for (const [rootType, counts] of sorted) {
            if (counts.initialCount > 0) {
              const percent = ((counts.initialCount / totalInitial) * 100).toFixed(1)
              message += `${rootType}: ${counts.initialCount} (${percent}%)\n`
            }
          }

          message += `\n【当前灵根】\n`
          for (const [rootType, counts] of sorted) {
            if (counts.currentCount > 0) {
              const percent = ((counts.currentCount / totalCurrent) * 100).toFixed(1)
              message += `${rootType}: ${counts.currentCount} (${percent}%)\n`
            }
          }

          message += `\n总计: ${totalInitial} 人（初始）/ ${totalCurrent} 人（当前）`
        }

        message += `\n\n━━━━━━━━━━━━━━`

        return atMessage(session.userId, message)

      } catch (error) {
        ctx.logger('xiuxian').error('查看统计失败:', error)
        return atMessage(session.userId, ' 查询失败')
      }
    })

  /**
   * 同步统计（从玩家表重新统计）
   */
  ctx.command('修仙.同步统计', '从玩家表重新统计灵根分布（开发者）')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      try {
        await rootStatsService.rebuildStats()
        return atMessage(session.userId, ' 灵根统计已同步，使用 修仙.查看统计 查看结果')
      } catch (error) {
        ctx.logger('xiuxian').error('同步统计失败:', error)
        return atMessage(session.userId, ' 同步失败')
      }
    })

  /**
   * 重置灵根统计
   */
  ctx.command('修仙.重置统计', '重置灵根分布统计（开发者）')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      try {
        await rootStatsService.initializeStats()
        return atMessage(session.userId, ' 灵根统计已重置')
      } catch (error) {
        ctx.logger('xiuxian').error('重置统计失败:', error)
        return atMessage(session.userId, ' 重置失败')
      }
    })

  /**
   * 清理测试玩家
   */
  ctx.command('修仙.清理玩家 <userId:string>', '删除指定玩家数据（开发者）')
    .usage('清理玩家 <用户ID>')
    .example('清理玩家 123456')
    .action(async ({ session }, userId) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      if (!userId) {
        return atMessage(session.userId, ' 请指定要清理的用户ID')
      }

      try {
        // 删除玩家数据
        await ctx.database.remove('xiuxian_player_v3', { odId: userId } as any)
        // 删除问心记录
        await ctx.database.remove('xiuxian_questioning_v3', { odId: userId } as any)

        return atMessage(session.userId, ` 已清理玩家 ${userId} 的数据`)

      } catch (error) {
        ctx.logger('xiuxian').error('清理玩家失败:', error)
        return atMessage(session.userId, ' 清理失败')
      }
    })

  /**
   * 测试性格分析
   */
  ctx.command('修仙.测试性格 <answers:text>', '测试性格分析结果（开发者）')
    .usage('测试性格 <答案1,答案2,答案3>')
    .example('测试性格 A,B,我选择帮助他人')
    .action(async ({ session }, answers) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      if (!answers) {
        return atMessage(session.userId, ' 请输入答案（逗号分隔）')
      }

      try {
        const answerList = answers.split(',').map(a => a.trim())

        // 使用性格分析器
        const personality = analyzePersonality(answerList)

        let message = `\n\n━━━━ 性格分析结果 ━━━━\n\n`

        for (const [key, value] of Object.entries(personality)) {
          const bar = '█'.repeat(Math.floor(value * 10))
          message += `${key}: ${value.toFixed(2)} ${bar}\n`
        }

        message += `\n━━━━━━━━━━━━━━`

        return atMessage(session.userId, message)

      } catch (error) {
        ctx.logger('xiuxian').error('测试性格分析失败:', error)
        return atMessage(session.userId, ' 分析失败')
      }
    })
}

/**
 * 生成测试用性格数据
 */
function generateTestPersonality(type: string): PersonalityScore {
  const base: PersonalityScore = {
    determination: 0.5,
    courage: 0.5,
    stability: 0.5,
    focus: 0.5,
    honesty: 0.5,
    kindness: 0.5,
    greed: 0.5,
    impatience: 0.5,
    manipulation: 0.5
  }

  // 添加随机波动
  const addNoise = (value: number) => Math.max(0, Math.min(1, value + (Math.random() - 0.5) * 0.3))

  switch (type) {
    case 'kind':
      return { ...base, kindness: addNoise(0.8), greed: addNoise(0.2), honesty: addNoise(0.7) }
    case 'greedy':
      return { ...base, greed: addNoise(0.8), kindness: addNoise(0.3), manipulation: addNoise(0.6) }
    case 'brave':
      return { ...base, courage: addNoise(0.8), determination: addNoise(0.7) }
    case 'cautious':
      return { ...base, courage: addNoise(0.3), stability: addNoise(0.7) }
    default:
      // 平衡型：所有值添加随机波动
      return {
        determination: addNoise(0.5),
        courage: addNoise(0.5),
        stability: addNoise(0.5),
        focus: addNoise(0.5),
        honesty: addNoise(0.5),
        kindness: addNoise(0.5),
        greed: addNoise(0.5),
        impatience: addNoise(0.5),
        manipulation: addNoise(0.5)
      }
  }
}
