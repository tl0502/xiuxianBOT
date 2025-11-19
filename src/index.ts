import { Context, Schema } from 'koishi'
import { initDatabase } from './database'
import { registerCommands } from './commands'
import * as chatluna from './chatluna'

export const name = 'xiuxian-txl'
export const inject = {
  required: ['database'],
  optional: ['chatluna', 'xiuxianAI']
}

export interface Config {
  chatluna?: chatluna.Config
}

export const Config: Schema<Config> = Schema.object({
  chatluna: chatluna.Config.description('AI 模型配置（可选）')
})

export function apply(ctx: Context, config: Config) {
  // 初始化数据库
  initDatabase(ctx)

  // 加载 ChatLuna 子插件（如果配置了）
  if (config.chatluna) {
    ctx.plugin(chatluna, config.chatluna)
  }

  // 注册所有命令
  registerCommands(ctx)

  // 插件启动日志
  ctx.logger('xiuxian').info('修仙插件已启动')
}
