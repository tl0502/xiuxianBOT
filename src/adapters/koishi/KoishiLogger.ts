import { Context, Logger } from 'koishi'
import { ILogger } from '../interfaces/ILogger'

/**
 * Koishi Logger 适配器
 * 将 Koishi 的 Logger 包装为统一的 ILogger 接口
 */
export class KoishiLogger implements ILogger {
  private logger: Logger

  constructor(ctx: Context, namespace: string = 'xiuxian') {
    this.logger = ctx.logger(namespace)
  }

  info(message: string, ...args: any[]): void {
    this.logger.info(message, ...args)
  }

  warn(message: string, ...args: any[]): void {
    this.logger.warn(message, ...args)
  }

  error(message: string, ...args: any[]): void {
    this.logger.error(message, ...args)
  }

  debug(message: string, ...args: any[]): void {
    this.logger.debug(message, ...args)
  }

  success(message: string, ...args: any[]): void {
    // Koishi 支持 success 级别
    this.logger.success(message, ...args)
  }
}
