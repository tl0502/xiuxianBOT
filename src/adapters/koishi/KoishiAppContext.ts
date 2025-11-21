import { Context } from 'koishi'
import { IAppContext, IAIService } from '../interfaces'
import { KoishiDatabase } from './KoishiDatabase'
import { KoishiLogger } from './KoishiLogger'

/**
 * Koishi 应用上下文适配器
 * 将 Koishi 的 Context 包装为统一的 IAppContext 接口
 */
export class KoishiAppContext implements IAppContext {
  public readonly database: KoishiDatabase
  public readonly logger: KoishiLogger
  public readonly ai?: IAIService
  public readonly config?: any

  constructor(ctx: Context, namespace: string = 'xiuxian') {
    this.database = new KoishiDatabase(ctx)
    this.logger = new KoishiLogger(ctx, namespace)
    this.config = ctx.config

    // AI 服务（如果存在）
    if (ctx.xiuxianAI) {
      this.ai = ctx.xiuxianAI as IAIService
    }
  }

  /**
   * 静态工厂方法：从 Koishi Context 创建 AppContext
   */
  static from(ctx: Context, namespace?: string): IAppContext {
    return new KoishiAppContext(ctx, namespace)
  }
}
