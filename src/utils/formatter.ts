import { h } from 'koishi'

/**
 * 构建带 @ 的消息
 */
export function atMessage(userId: string, content: string) {
  return h('', [
    h('at', { id: userId }),
    h('text', { content })
  ])
}

/**
 * 格式化数字，添加千分位
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 格式化日期
 */
export function formatDate(date: Date): string {
  return new Date(date).toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai'
  })
}

/**
 * 计算剩余时间（秒）
 */
export function getRemainingSeconds(endTime: Date): number {
  const now = Date.now()
  const end = new Date(endTime).getTime()
  return Math.max(0, Math.ceil((end - now) / 1000))
}

/**
 * 格式化时长
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时`
  return `${Math.floor(seconds / 86400)}天`
}
