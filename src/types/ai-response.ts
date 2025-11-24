/**
 * AI 响应相关类型定义
 *
 * 本文件包含所有 AI 服务返回的响应类型定义
 */

/**
 * 奖励类型
 */
export type RewardType = 'cultivation' | 'spiritStone'

/**
 * 问心奖励
 */
export interface QuestioningReward {
  type: RewardType
  value: number
}

/**
 * AI 响应 - 步入仙途
 *
 * 用于步入仙途流程中的 AI 评估响应
 */
export interface InitiationAIResponse {
  daoName: string          // 道号
  spiritualRoot: string    // 灵根类型（由代码确定，AI 只负责生成道号和评语）
  personality: string      // 性格评语
  reason: string          // 分配理由
}
