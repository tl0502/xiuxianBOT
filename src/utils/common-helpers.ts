/**
 * 通用辅助函数
 * v1.0.1 新增：提取常用的会话处理函数供多个命令复用
 */

import { h } from 'koishi'

/**
 * 从消息元素中提取@提及的用户ID
 * @param session Koishi会话对象
 * @returns 提及的用户ID，如果没有@提及则返回null
 *
 * @example
 * // 用户发送：天道记录 @张三
 * const mentionedUserId = extractMentionedUserId(session)  // 返回张三的userId
 *
 * // 用户发送：天道记录
 * const mentionedUserId = extractMentionedUserId(session)  // 返回null
 */
export function extractMentionedUserId(session: any): string | null {
  if (!session?.elements) return null
  const atElements = h.select(session.elements, 'at')
  return atElements.length > 0 ? atElements[0].attrs.id : null
}
