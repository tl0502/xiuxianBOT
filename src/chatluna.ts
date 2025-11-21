import { Context, Schema, Service } from 'koishi'
import type { ChatLunaService } from 'koishi-plugin-chatluna/services/chat'
import { getMessageContent } from 'koishi-plugin-chatluna/utils/string'
import { ChatLunaChatModel } from 'koishi-plugin-chatluna/llm-core/platform/model'
import { modelSchema } from 'koishi-plugin-chatluna/utils/schema'
import { ComputedRef } from '@vue/reactivity'

export interface Config {
  model: string
  // 注意：enableFallback 已移至主配置的步入仙途区块
}

export const Config: Schema<Config> = Schema.object({
  model: Schema.dynamic('model').description('AI 模型（全局，用于所有AI功能）'),
})

/**
 * 修仙 AI 服务
 */
export class XiuxianAIService extends Service {
  private modelRef: ComputedRef<ChatLunaChatModel | undefined> | undefined

  constructor(ctx: Context, public config: Config) {
    super(ctx, 'xiuxianAI', true)

    // 注册 model schema
    modelSchema(ctx)

    // 在 ready 事件中初始化模型
    ctx.on('ready', async () => {
      try {
        const chatluna = (ctx as any).chatluna as ChatLunaService | undefined
        if (chatluna) {
          const modelName = config.model || chatluna.config?.defaultModel || 'zhipu/GLM-4-Flash'
          this.modelRef = await chatluna.createChatModel(modelName)
          ctx.logger('xiuxian-ai').info(`ChatLuna 模型已初始化: ${modelName}`)
        } else {
          ctx.logger('xiuxian-ai').warn('ChatLuna 服务未加载，AI 功能将使用模拟响应')
        }
      } catch (error) {
        ctx.logger('xiuxian-ai').warn('ChatLuna 模型初始化失败:', error)
      }
    })
  }

  /**
   * 调用 AI 生成文本响应
   */
  async generate(prompt: string): Promise<string | null> {
    const model = this.modelRef?.value
    if (!model) {
      this.ctx.logger('xiuxian-ai').warn('ChatLuna 模型未初始化')
      return null
    }

    try {
      this.ctx.logger('xiuxian-ai').debug('调用 AI 模型...')
      const message = await model.invoke(prompt)
      const response = getMessageContent(message.content)
      this.ctx.logger('xiuxian-ai').debug('AI 响应成功')
      return response
    } catch (error) {
      this.ctx.logger('xiuxian-ai').error('调用 AI 失败:', error)
      return null
    }
  }

  /**
   * 检查 AI 是否可用
   */
  isAvailable(): boolean {
    return !!this.modelRef?.value
  }
}

// 扩展 Context 类型
declare module 'koishi' {
  interface Context {
    xiuxianAI: XiuxianAIService
  }
}

export const name = 'chatluna-entry-point'
export const inject = ['chatluna']

export function apply(ctx: Context, config: Config) {
  ctx.plugin(XiuxianAIService, config)
}
