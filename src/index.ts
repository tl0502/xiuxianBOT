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
  // 问道包AI打分（三态：'auto'使用包内配置, 'on'强制开启, 'off'强制关闭）
  enableAIScoring?: 'auto' | 'on' | 'off'
  enableAIScoringFallback?: boolean
  // 问道包AI评语（v0.8.2 新增，三态）
  enableAIEvaluation?: 'auto' | 'on' | 'off'
  enableAIEvaluationFallback?: boolean
  // 步入仙途AI评分
  enableInitiationAIScoring?: boolean
  enableInitiationAIScoringFallback?: boolean
  // 步入仙途AI生成（v0.8.2 新增）
  enableInitiationAIResponse?: boolean
  enableInitiationAIResponseFallback?: boolean
  // 开发者工具
  enableDevTools?: boolean
}

export const Config: Schema<Config> = Schema.intersect([
  // ========== AI 服务配置（基础依赖）==========
  Schema.object({
    chatluna: chatluna.Config.description('🌐 全局 AI 模型配置 | 选择 ChatLuna 模型（用于所有AI功能）')
  }).description('🤖 AI 服务配置（必需）'),

  // ========== 步入仙途（角色创建）配置 ==========
  Schema.object({
    enableInitiationAIResponse: Schema.boolean()
      .default(true)
      .description('✅ 推荐开启 | 使用 AI 生成个性化道号和天道评语'),

    enableInitiationAIResponseFallback: Schema.boolean()
      .default(false)
      .description('⚠️ 建议关闭 | AI 失败时自动降级到模拟响应（禁用可防止作弊，但 AI 故障时功能不可用）'),

    enableInitiationAIScoring: Schema.boolean()
      .default(true)
      .description('✅ 推荐开启 | 使用 AI 客观评估第3题开放题，提升性格分析准确性（用于灵根分配）'),

    enableInitiationAIScoringFallback: Schema.boolean()
      .default(true)
      .description('✅ 推荐开启 | AI 评分失败时自动降级到关键词评分，保证角色创建流程不中断')
  }).description('⭐ 步入仙途配置（v0.8.2 | AI生成道号+评语+性格评分）'),

  // ========== 问道包（试炼系统）配置 ==========
  Schema.object({
    enableAIScoring: Schema.union([
      Schema.const('auto' as const).description('默认 - 使用包内预设配置（推荐）'),
      Schema.const('on' as const).description('强制开启 - 所有问道包都使用AI打分'),
      Schema.const('off' as const).description('强制关闭 - 所有问道包都禁用AI打分')
    ]).default('auto').description('🎯 AI打分总开关 | 优先级高于包内配置'),

    enableAIScoringFallback: Schema.boolean()
      .default(false)
      .description('⚠️ 建议关闭 | AI打分失败时自动降级到关键词评分，关闭可防止作弊'),

    enableAIEvaluation: Schema.union([
      Schema.const('auto' as const).description('默认 - 使用包内预设配置（推荐）'),
      Schema.const('on' as const).description('强制开启 - 所有问道包都使用AI评语'),
      Schema.const('off' as const).description('强制关闭 - 所有问道包都禁用AI评语')
    ]).default('auto').description('🎭 AI评语总开关 | 优先级高于包内配置'),

    enableAIEvaluationFallback: Schema.boolean()
      .default(true)
      .description('✅ 推荐开启 | AI评语失败时自动降级到模板评语，提升用户体验')
  }).description('🎯 问道包 AI 配置（v0.8.2 | 独立控制打分和评语）'),

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
  }).description('⚙️ 性格量化系统（高级 | 保持默认即可）'),

  // ========== 开发者工具 ==========
  Schema.object({
    enableDevTools: Schema.boolean()
      .default(false)
      .description('🔧 启用开发者测试命令 | 用于测试灵根分布、清理数据等')
  }).description('🛠️ 开发者工具（仅供测试）')
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
