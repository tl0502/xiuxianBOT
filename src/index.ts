import { Context, Schema } from 'koishi'
import { initDatabase } from './database'
import { registerCommands } from './commands'
import { RootStatsService } from './services/root-stats.service'
import * as chatluna from './chatluna'
import { PersonalitySystemVersion, setPersonalitySystemConfig } from './config/personality-system-config'

export const name = 'xiuxian-txl'
export const inject = {
  required: ['database'],
  optional: ['chatluna', 'xiuxianAI']
}

export interface Config {
  chatluna?: chatluna.Config
  personalitySystemVersion?: 'v1.0' | 'v2.0'
  enableMultiplePaths?: boolean
  fallbackToV1?: boolean
  enableAIScoring?: boolean
  enableAIScoringFallback?: boolean
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    personalitySystemVersion: Schema.union([
      Schema.const('v1.0' as const).description('v1.0 - 9维性格系统 + 固定选项加分（经典版）'),
      Schema.const('v2.0' as const).description('v2.0 - 22维性格系统 + AI智能解析（新版）')
    ]).default('v1.0' as PersonalitySystemVersion).description('性格量化系统版本'),

    enableMultiplePaths: Schema.boolean()
      .default(true)
      .description('是否启用多问道包系统（仅 v2.0 有效）'),

    fallbackToV1: Schema.boolean()
      .default(true)
      .description('v2.0 AI 解析失败时是否降级到 v1.0（仅 v2.0 有效）')
  }).description('性格量化系统配置'),

  Schema.object({
    enableAIScoring: Schema.boolean()
      .default(true)
      .description('是否启用AI评分开放题功能（v0.6.0新增）'),

    enableAIScoringFallback: Schema.boolean()
      .default(false)
      .description('AI评分失败时是否使用关键词降级（建议关闭以防作弊）')
  }).description('AI开放题评分配置（v0.6.0）'),

  Schema.object({
    chatluna: chatluna.Config.description('AI 模型配置（可选）')
  }).description('AI 服务配置')
])

export function apply(ctx: Context, config: Config) {
  // 初始化数据库
  initDatabase(ctx)

  // 配置性格量化系统版本
  setPersonalitySystemConfig({
    version: (config.personalitySystemVersion || 'v1.0') as PersonalitySystemVersion,
    v2Config: {
      enableMultiplePaths: config.enableMultiplePaths !== false,
      fallbackToV1: config.fallbackToV1 !== false
    }
  })

  // 记录当前使用的版本
  const version = config.personalitySystemVersion || 'v1.0'
  ctx.logger('xiuxian').info(`性格量化系统版本: ${version}`)
  if (version === 'v2.0') {
    ctx.logger('xiuxian').info(`  - 多问道包: ${config.enableMultiplePaths !== false ? '启用' : '禁用'}`)
    ctx.logger('xiuxian').info(`  - AI失败降级: ${config.fallbackToV1 !== false ? '启用' : '禁用'}`)
  }

  // 初始化灵根统计表（公平性系统）
  ctx.on('ready', async () => {
    try {
      const rootStatsService = new RootStatsService(ctx)
      await rootStatsService.initializeStats()
      ctx.logger('xiuxian').info('初始灵根统计表已初始化')
    } catch (error) {
      ctx.logger('xiuxian').error('初始化灵根统计表失败:', error)
    }
  })

  // 加载 ChatLuna 子插件（如果配置了）
  if (config.chatluna) {
    ctx.plugin(chatluna, config.chatluna)
  }

  // 注册所有命令
  registerCommands(ctx)

  // 插件启动日志
  ctx.logger('xiuxian').info('修仙插件已启动')
}
