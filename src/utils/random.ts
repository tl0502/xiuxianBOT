/**
 * 生成指定范围的随机整数 [min, max]
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * 根据概率判断是否成功
 * @param rate 成功率 (0-1)
 */
export function randomSuccess(rate: number): boolean {
  return Math.random() < rate
}

/**
 * 从数组中随机选择一个元素
 */
export function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * 生成随机浮点数 [min, max)
 */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}
