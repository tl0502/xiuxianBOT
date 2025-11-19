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
  answers: string[]
  startTime: Date
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
