/**
 * 问心系统类型定义
 */

/**
 * 问心记录
 */
export interface QuestioningRecord {
  id: number
  userId: string
  pathId: string
  pathName: string
  answer1: string
  answer2: string
  answer3: string
  aiResponse: string // JSON string of AIQuestioningResponse
  personality: string
  tendency: string
  rewardType: string
  rewardValue: number
  rewardReason: string
  createTime: Date
}

/**
 * 问心会话状态
 */
export interface QuestioningSession {
  userId: string
  pathId: string
  currentStep: number // 0: 未开始, 1-3: 对应题号
  // 答案可以是自由文本，也可以是选项对象 { letter: 'A', text: '选项内容' }
  answers: Array<string | { letter: string; text: string }>
  startTime: Date
  // 上一次出题时间，用于限时回答（每题倒计时）
  lastQuestionTime?: Date
  // 本会话生效的每题超时（秒），若未设置则使用默认值
  timeoutSeconds?: number
}

/**
 * 问心结果
 */
export interface QuestioningResult {
  success: boolean
  message?: string
  data?: {
    personality: string
    tendency: string
    reward: {
      type: string
      value: number
      description: string
    }
    reason: string
  }
}

/**
 * Service 返回结果
 */
export interface ServiceResult<T = any> {
  success: boolean
  message: string
  data?: T
}
