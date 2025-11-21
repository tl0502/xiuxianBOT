import { Context, Schema } from 'koishi'
import { initDatabase } from './database'
import { registerCommands } from './commands'
import { KoishiAppContext } from './adapters/koishi'
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
  enableInitiationAIScoring?: boolean
  enableInitiationAIScoringFallback?: boolean
}

export const Config: Schema<Config> = Schema.intersect([
  // ========== AI 服务配置（基础依赖）==========
  Schema.object({
    chatluna: chatluna.Config.description('选择 ChatLuna 模型（如 zhipu/GLM-4-Flash）和配置降级策略')
  }).description('🤖 AI 服务配置（必需，用于问心系统和灵根分配）'),

  // ========== 步入仙途（角色创建）配置 ==========
  Schema.object({
    enableInitiationAIScoring: Schema.boolean()
      .default(true)
      .description('✅ 推荐开启 | 使用 AI 客观评估第3题开放题，提升性格分析准确性'),

    enableInitiationAIScoringFallback: Schema.boolean()
      .default(true)
      .description('✅ 推荐开启 | AI 失败时自动降级到关键词评分，保证角色创建流程不中断')
  }).description('⭐ 步入仙途 AI 评分（v0.7.0 | 灵根分配专用）'),

  // ========== 问道包（试炼系统）配置 ==========
  Schema.object({
    enableAIScoring: Schema.boolean()
      .default(true)
      .description('✅ 推荐开启 | 使用 AI 智能评估开放题答案，识别复杂语义和作弊行为'),

    enableAIScoringFallback: Schema.boolean()
      .default(false)
      .description('⚠️ 建议关闭 | 关闭可防止作弊，AI 失败时会提示用户重试而非静默降级')
  }).description('🎯 问道包 AI 评分（v0.6.0 | 试炼问心和奖励计算）'),

  // ========== 性格量化系统（高级功能，暂时搁置）==========
  Schema.object({
    personalitySystemVersion: Schema.union([
      Schema.const('v1.0' as const).description('v1.0 - 9维性格 + 规则评分（当前使用）'),
      Schema.const('v2.0' as const).description('v2.0 - 22维性格 + 全AI解析（实验性，未启用）')
    ]).default('v1.0' as PersonalitySystemVersion).description('性格系统版本（⚠️ v2.0 暂未集成，请保持 v1.0）'),

    enableMultiplePaths: Schema.boolean()
      .default(true)
      .description('多问道包系统（v2.0 专用，当前无效）'),

    fallbackToV1: Schema.boolean()
      .default(true)
      .description('v2.0 失败时降级到 v1.0（v2.0 专用，当前无效）')
  }).description('⚙️ 性格量化系统（高级 | 保持默认即可）')
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
      const appContext = KoishiAppContext.from(ctx)
      const rootStatsService = new RootStatsService(appContext)
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
