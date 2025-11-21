import { IDatabase } from './IDatabase'
import { ILogger } from './ILogger'

/**
 * 应用上下文接口
 * 用于统一管理不同框架的核心服务
 *
 * 这是 Adapter 层的核心接口，所有 Service 层都应该依赖这个接口而非具体框架
 */
export interface IAppContext {
  /**
   * 数据库服务
   */
  database: IDatabase

  /**
   * 日志服务
   */
  logger: ILogger

  /**
   * AI 服务（可选，某些环境可能不可用）
   */
  ai?: IAIService

  /**
   * 配置对象（可选，用于访问插件配置）
   */
  config?: any
}

/**
 * AI 服务接口（简化版，后续扩展）
 */
export interface IAIService {
  /**
   * 检查 AI 服务是否可用
   */
  isAvailable(): boolean

  /**
   * 生成 AI 响应
   * @param prompt 提示词
   * @returns AI 生成的文本，失败返回 null
   */
  generate(prompt: string): Promise<string | null>
}
