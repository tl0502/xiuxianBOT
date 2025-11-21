/**
 * 日志记录器接口
 * 用于抽象不同框架的日志系统
 */
export interface ILogger {
  /**
   * 记录信息级别日志
   * @param message 日志消息
   * @param args 额外参数
   */
  info(message: string, ...args: any[]): void

  /**
   * 记录警告级别日志
   * @param message 日志消息
   * @param args 额外参数
   */
  warn(message: string, ...args: any[]): void

  /**
   * 记录错误级别日志
   * @param message 日志消息
   * @param args 额外参数
   */
  error(message: string, ...args: any[]): void

  /**
   * 记录调试级别日志
   * @param message 日志消息
   * @param args 额外参数
   */
  debug(message: string, ...args: any[]): void

  /**
   * 记录成功级别日志（可选，某些框架可能不支持）
   * @param message 日志消息
   * @param args 额外参数
   */
  success?(message: string, ...args: any[]): void
}
