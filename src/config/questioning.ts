/**
 * 问心系统配置
 */

export interface QuestionOption {
  text: string
  value: string
}

export interface Question {
  id: string
  type: 'choice' | 'text'
  question: string
  options?: QuestionOption[]
}

export interface QuestioningPath {
  id: string
  name: string
  description: string
  questions: [Question, Question, Question] // 固定三题
  minRealm?: number // 最低境界要求（可选）
  cooldown?: number // 冷却时间（小时）
}

/**
 * 问心路径题库
 */
export const QUESTIONING_PATHS: QuestioningPath[] = [
  {
    id: 'inner_demon',
    name: '心魔试炼',
    description: '直面内心深处的心魔，了解真实的自己',
    minRealm: 0,
    cooldown: 24,
    questions: [
      {
        id: 'q1',
        type: 'choice',
        question: '在修仙路上，你最看重什么？',
        options: [
          { text: 'A. 强大的力量', value: 'power' },
          { text: 'B. 悠长的寿命', value: 'longevity' },
          { text: 'C. 至高的境界', value: 'realm' },
          { text: 'D. 内心的平静', value: 'peace' }
        ]
      },
      {
        id: 'q2',
        type: 'choice',
        question: '当面对生死抉择时，你会？',
        options: [
          { text: 'A. 舍身取义，保护他人', value: 'sacrifice' },
          { text: 'B. 随机应变，寻找生机', value: 'adapt' },
          { text: 'C. 冷静分析，权衡利弊', value: 'rational' },
          { text: 'D. 遵从本心，无愧于心', value: 'instinct' }
        ]
      },
      {
        id: 'q3',
        type: 'text',
        question: '请用一句话描述你的修仙之道：'
      }
    ]
  },
  {
    id: 'dao_heart',
    name: '道心叩问',
    description: '扣问道心，明悟修行真意',
    minRealm: 1, // 需要筑基期
    cooldown: 48,
    questions: [
      {
        id: 'q1',
        type: 'choice',
        question: '修仙的意义是什么？',
        options: [
          { text: 'A. 超脱生死，长生不老', value: 'immortal' },
          { text: 'B. 探索天地，求知若渴', value: 'knowledge' },
          { text: 'C. 守护世间，济世为怀', value: 'guardian' },
          { text: 'D. 证道成仙，飞升上界', value: 'ascension' }
        ]
      },
      {
        id: 'q2',
        type: 'choice',
        question: '若有捷径可走，代价是违背本心，你会？',
        options: [
          { text: 'A. 坚守本心，绝不妥协', value: 'integrity' },
          { text: 'B. 视情况而定，灵活变通', value: 'flexible' },
          { text: 'C. 权衡利弊，理性选择', value: 'pragmatic' },
          { text: 'D. 相信直觉，跟随内心', value: 'intuitive' }
        ]
      },
      {
        id: 'q3',
        type: 'text',
        question: '在你心中，"道"是什么？'
      }
    ]
  },
  {
    id: 'karma_trial',
    name: '因果审判',
    description: '回顾过往，审视因果，明了业力',
    minRealm: 2, // 需要金丹期
    cooldown: 72,
    questions: [
      {
        id: 'q1',
        type: 'choice',
        question: '回首修仙路，你最大的遗憾是？',
        options: [
          { text: 'A. 未能保护重要的人', value: 'regret_protect' },
          { text: 'B. 错过重要的机缘', value: 'regret_chance' },
          { text: 'C. 做出了错误的选择', value: 'regret_choice' },
          { text: 'D. 从无遗憾，坦然前行', value: 'no_regret' }
        ]
      },
      {
        id: 'q2',
        type: 'choice',
        question: '面对曾经的过错，你会？',
        options: [
          { text: 'A. 竭力弥补，赎回过失', value: 'redemption' },
          { text: 'B. 接受现实，放下过去', value: 'acceptance' },
          { text: 'C. 深刻反思，避免重蹈', value: 'reflection' },
          { text: 'D. 无愧于心，继续前行', value: 'forward' }
        ]
      },
      {
        id: 'q3',
        type: 'text',
        question: '如果可以对过去的自己说一句话，你会说什么？'
      }
    ]
  }
]

/**
 * AI Prompt 模板
 */
export const AI_PROMPT_TEMPLATE = `你是修仙世界的天道意志，正在评估一位修仙者的问心结果。

问心路径：{pathName}
路径描述：{pathDescription}

修仙者回答：
问题1：{question1}
回答1：{answer1}

问题2：{question2}
回答2：{answer2}

问题3：{question3}
回答3：{answer3}

修仙者当前信息：
- 境界：{realm}
- 灵根：{spiritualRoot}
- 修为：{cultivation}/{cultivationMax}

请基于修仙者的回答，生成一个 JSON 格式的评估结果（必须严格遵循 JSON 格式，不要添加任何其他文字）：

{
  "personality": "基于回答的性格评语（50字以内）",
  "tendency": "问心倾向（如：力量型、智慧型、守护型、超脱型等）",
  "reward": {
    "type": "cultivation|spiritualRoot|spiritStone|breakthrough",
    "value": 数值（cultivation: 100-500, spiritualRoot: 1-5, spiritStone: 50-200, breakthrough: 提升成功率 0.05-0.2）
  },
  "reason": "奖励原因说明（30字以内）"
}

注意：
1. 奖励应与回答的深度和境界相匹配
2. 性格评语要体现修仙者的道心特质
3. 倾向要准确概括修仙者的核心追求
4. 必须严格输出 JSON 格式，不要有其他内容`

/**
 * 奖励类型定义
 */
export type RewardType = 'cultivation' | 'spiritualRoot' | 'spiritStone' | 'breakthrough'

export interface QuestioningReward {
  type: RewardType
  value: number
}

export interface AIQuestioningResponse {
  personality: string
  tendency: string
  reward: QuestioningReward
  reason: string
}
