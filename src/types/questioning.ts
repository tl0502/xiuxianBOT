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
  // 是否正在完成中（防止并发重复完成）
  isCompleting?: boolean
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
export interface ServiceResult<T = void> {
  success: boolean
  message: string
  data?: T
}

/**
 * 问心开始返回数据
 */
export interface QuestioningStartData {
  question: string
  options?: string[]
  timeoutSeconds?: number
  timeoutMessage?: string
}

/**
 * 步入仙途开始返回数据
 */
export interface InitiationStartData {
  pathName: string
  pathDescription: string
  question: string
  options?: string[]
  timeoutSeconds?: number
  timeoutMessage?: string
}

/**
 * 答案提交返回数据
 */
export interface AnswerSubmitData {
  step?: number
  question?: string
  options?: string[]
  isLastQuestion?: boolean
  timeoutSeconds?: number
  timeoutMessage?: string
  // 试炼完成数据
  personality?: string
  tendency?: string
  reward?: {
    type: string
    value: number
    description: string
  }
  reason?: string
  // 步入仙途完成数据
  player?: any
  daoName?: string
  spiritualRoot?: string
}

/**
 * 步入仙途完成数据
 */
export interface InitiationCompleteData {
  player: any
  daoName: string
  spiritualRoot: string
  personality: string
  reason: string
}
