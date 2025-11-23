/**
 * 命令冷却配置
 * v1.2.0 新增
 *
 * 定义各命令的冷却时间（小时）
 */
export const COMMAND_COOLDOWNS: Record<string, number> = {
  // 问道守心：8小时
  '问道守心': 8,

  // 预留：未来扩展
  // '历练': 1,        // 1小时
  // '闭关': 24,       // 24小时
  // '宗门任务': 12,   // 12小时
}

/**
 * 获取命令冷却时间
 * @param commandName 命令名称
 * @returns 冷却时间（小时），如果未配置返回 0
 */
export function getCommandCooldown(commandName: string): number {
  return COMMAND_COOLDOWNS[commandName] || 0
}
