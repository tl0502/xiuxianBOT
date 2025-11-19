import { Context, Schema } from 'koishi'
import { initDatabase } from './database'
import { registerCommands } from './commands'

export const name = 'xiuxian-txl'
export const inject = ['database']

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  // 初始化数据库
  initDatabase(ctx)

  // 注册所有命令
  registerCommands(ctx)

  // 插件启动日志
  ctx.logger('xiuxian').info('修仙插件已启动')
}
