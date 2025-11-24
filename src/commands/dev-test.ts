import { Context } from 'koishi'
import { FateCalculator } from '../utils/fate-calculator'
import { analyzePersonality, PersonalityScore } from '../utils/personality-analyzer'
import { KoishiAppContext } from '../adapters/koishi'
import { RootStatsService } from '../services/root-stats.service'
import { atMessage } from '../utils/formatter'
import { extractMentionedUserId } from '../utils/common-helpers'
import { initiationPackages } from '../config/path-packages/initiation'

/**
 * 注册开发者测试命令
 */
export function registerDevTestCommands(ctx: Context) {
  const appContext = KoishiAppContext.from(ctx)
  const rootStatsService = new RootStatsService(appContext)
  const fateCalculator = new FateCalculator(ctx)

  /**
   * 测试灵根分布（v1.3.1 更新：选择题配置化评分 + 开放题随机分数）
   */
  ctx.command('修仙/测试灵根 [count:number]', '测试灵根概率分布（开发者）')
    .alias('测试灵根')
    .usage('测试灵根 [次数] - 默认100次')
    .example('测试灵根 500  // 模拟500次灵根分配')
    .action(async ({ session }, count = 100) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      // 限制测试次数
      if (count < 1 || count > 1000) {
        return atMessage(session.userId, ' 测试次数必须在 1-1000 之间')
      }

      try {
        // 获取 INITIATION 包的问题配置
        const initPkg = initiationPackages[0]
        if (!initPkg) {
          return atMessage(session.userId, ' 未找到 INITIATION 包配置')
        }

        // 统计结果
        const results: Record<string, number> = {}

        // 选择题答案组合（A/B/C/D）
        const choiceOptions = ['A', 'B', 'C', 'D']

        // 模拟分配
        for (let i = 0; i < count; i++) {
          // 随机生成答案组合
          const answer1 = choiceOptions[Math.floor(Math.random() * choiceOptions.length)]
          const answer2 = choiceOptions[Math.floor(Math.random() * choiceOptions.length)]

          // 直接从配置读取选择题分数（配置化评分）
          const score = buildScoreFromConfig(initPkg.questions, answer1, answer2)

          // 开放题分数随机生成（模拟 AI 评分的随机性）
          addRandomOpenQuestionScore(score)

          // 使用 FateCalculator 选择灵根
          const rootType = await fateCalculator.selectSpiritualRoot(score)

          // 统计结果
          results[rootType] = (results[rootType] || 0) + 1
        }

        // 格式化输出
        let message = `\n\n━━━━ 灵根分布测试（v1.3.1）━━━━\n\n`
        message += `测试次数：${count}\n`
        message += `评分方式：选择题配置化 + 开放题随机\n\n`

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
  ctx.command('修仙/查看统计', '查看当前灵根分布统计（开发者）')
    .alias('查看统计')
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
  ctx.command('修仙/同步统计', '从玩家表重新统计灵根分布（开发者）')
    .alias('同步统计')
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
  ctx.command('修仙/重置统计', '重置灵根分布统计（开发者）')
    .alias('重置统计')
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
  ctx.command('修仙/清理玩家', '删除指定玩家数据（开发者）')
    .alias('清理玩家')
    .usage('修仙.清理玩家 @玩家')
    .example('修仙.清理玩家 @张三')
    .action(async ({ session }) => {
      if (!session?.userId) return '系统错误：无法获取用户信息'

      // 从@提及中获取目标用户ID
      const mentionedUserId = extractMentionedUserId(session)
      if (!mentionedUserId) {
        return atMessage(session.userId, ' 请使用 @提及 指定要清理的玩家')
      }

      try {
        // 删除玩家数据
        await ctx.database.remove('xiuxian_player_v3', { userId: mentionedUserId } as any)
        // 删除问心记录
        await ctx.database.remove('xiuxian_questioning_v3', { userId: mentionedUserId } as any)
        // 删除buff记录
        await ctx.database.remove('xiuxian_buff_v3', { userId: mentionedUserId } as any)

        return atMessage(session.userId, ` 已清理玩家的数据`)

      } catch (error) {
        ctx.logger('xiuxian').error('清理玩家失败:', error)
        return atMessage(session.userId, ' 清理失败')
      }
    })

  /**
   * 测试性格分析
   */
  ctx.command('修仙/测试性格 <answers:text>', '测试性格分析结果（开发者）')
    .alias('测试性格')
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
 * v1.3.1: 从配置读取选择题分数
 * 直接读取 initiation.ts 中的 value 对象
 */
function buildScoreFromConfig(
  questions: any[],
  answer1: string,
  answer2: string
): PersonalityScore {
  const score: PersonalityScore = {
    determination: 0,
    courage: 0,
    stability: 0,
    focus: 0,
    honesty: 0,
    kindness: 0,
    greed: 0,
    impatience: 0,
    manipulation: 0
  }

  // 第1题
  const q1 = questions[0]
  if (q1?.type === 'choice' && q1.options) {
    const optIndex1 = answer1.charCodeAt(0) - 65
    if (optIndex1 >= 0 && optIndex1 < q1.options.length) {
      const value = q1.options[optIndex1].value
      if (value) {
        for (const key in value) {
          const k = key as keyof PersonalityScore
          if (typeof value[k] === 'number') {
            score[k] += value[k]
          }
        }
      }
    }
  }

  // 第2题
  const q2 = questions[1]
  if (q2?.type === 'choice' && q2.options) {
    const optIndex2 = answer2.charCodeAt(0) - 65
    if (optIndex2 >= 0 && optIndex2 < q2.options.length) {
      const value = q2.options[optIndex2].value
      if (value) {
        for (const key in value) {
          const k = key as keyof PersonalityScore
          if (typeof value[k] === 'number') {
            score[k] += value[k]
          }
        }
      }
    }
  }

  return score
}

/**
 * v1.3.1: 为开放题添加随机分数（模拟 AI 评分）
 * 范围：-3 到 +5（与 AI 评分配置一致）
 */
function addRandomOpenQuestionScore(score: PersonalityScore): void {
  const dimensions: (keyof PersonalityScore)[] = [
    'determination', 'courage', 'stability', 'focus',
    'honesty', 'kindness', 'greed', 'impatience', 'manipulation'
  ]

  // 随机选择 2-4 个维度添加分数
  const numDimensions = 2 + Math.floor(Math.random() * 3)
  const shuffled = dimensions.sort(() => Math.random() - 0.5)

  for (let i = 0; i < numDimensions; i++) {
    const dim = shuffled[i]
    // 随机分数 -3 到 +5
    const randomScore = Math.floor(Math.random() * 9) - 3
    score[dim] = Math.max(0, Math.min(10, score[dim] + randomScore))
  }
}
