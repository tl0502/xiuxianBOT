/**
 * 问心系统配置
 */

/**
 * 路径包类型（用于不同场景）
 */
export enum PathPackageType {
  INITIATION = 'initiation',   // 步入仙途专用
  TRIAL = 'trial',              // 试炼问心
  ENLIGHTENMENT = 'enlightenment', // 悟道问心
  CUSTOM = 'custom'             // 自定义扩展
}

export interface QuestionOption {
  text: string
  value: string
}

export interface Question {
  id: string
  type: 'choice' | 'text'
  question: string
  options?: QuestionOption[]  // 选择题的选项（数量可变，支持2-10个选项）

  // ✨ v0.6.0 新增：AI评分提示
  aiHint?: string  // 告诉AI这题想考察什么（仅用于开放题）
}

export interface QuestioningPath {
  id: string
  name: string
  description: string
  packageType: PathPackageType  // 新增：路径包类型
  questions: [Question, Question, Question] // 固定三题
  minRealm?: number // 最低境界要求（可选）
  cooldown?: number // 冷却时间（小时）
}

/**
 * 步入仙途专用路径包
 */
export const INITIATION_PATHS: QuestioningPath[] = [
  {
    id: 'initiation_path_1',
    name: '踏入仙途·初心之问',
    description: '天道感知你的初心，将为你指引前路',
    packageType: PathPackageType.INITIATION,
    questions: [
      {
        id: 'q1',
        type: 'choice',
        question: '若有一日，你修得大道，你将如何？',
        options: [
          { text: 'A. 守护世间，济世为怀', value: 'guardian' },
          { text: 'B. 独善其身，逍遥自在', value: 'freedom' },
          { text: 'C. 探索天地，求知无尽', value: 'knowledge' },
          { text: 'D. 君临万界，至高无上', value: 'domination' }
        ]
      },
      {
        id: 'q2',
        type: 'choice',
        question: '在修仙路上，你最害怕失去什么？',
        options: [
          { text: 'A. 珍视的人', value: 'people' },
          { text: 'B. 自由意志', value: 'freedom' },
          { text: 'C. 探索真理的机会', value: 'truth' },
          { text: 'D. 力量与地位', value: 'power' }
        ]
      },
      {
        id: 'q3',
        type: 'text',
        question: '请描述你心中的"道"是什么：'
      }
    ]
  },
  {
    id: 'initiation_path_2',
    name: '踏入仙途·本性之辨',
    description: '本性难移，天道将观你真我',
    packageType: PathPackageType.INITIATION,
    questions: [
      {
        id: 'q1',
        type: 'choice',
        question: '遇见一位垂危的陌生修士，他身怀重宝，你会？',
        options: [
          { text: 'A. 全力救治，不问回报', value: 'altruistic' },
          { text: 'B. 救治后希望获得感谢', value: 'reciprocal' },
          { text: 'C. 观察情况，权衡利弊', value: 'pragmatic' },
          { text: 'D. 夺宝而去，弱肉强食', value: 'ruthless' }
        ]
      },
      {
        id: 'q2',
        type: 'choice',
        question: '面对远超你的强敌，你会如何应对？',
        options: [
          { text: 'A. 奋力一战，虽死无悔', value: 'courage' },
          { text: 'B. 寻找援助，智取对手', value: 'strategic' },
          { text: 'C. 暂时撤退，积蓄实力', value: 'patient' },
          { text: 'D. 低头臣服，待机而动', value: 'adaptive' }
        ]
      },
      {
        id: 'q3',
        type: 'text',
        question: '用一句话形容你想成为怎样的修仙者：'
      }
    ]
  },
  {
    id: 'initiation_path_3',
    name: '踏入仙途·命运之择',
    description: '命运交织，选择决定你的仙途',
    packageType: PathPackageType.INITIATION,
    questions: [
      {
        id: 'q1',
        type: 'choice',
        question: '你认为修仙最重要的品质是什么？',
        options: [
          { text: 'A. 坚定不移的意志', value: 'will' },
          { text: 'B. 敏锐灵活的智慧', value: 'wisdom' },
          { text: 'C. 温和宽容的心性', value: 'kindness' },
          { text: 'D. 无所畏惧的勇气', value: 'courage' }
        ]
      },
      {
        id: 'q2',
        type: 'choice',
        question: '若要你放弃一样东西才能突破，你会选择放弃？',
        options: [
          { text: 'A. 过往的记忆', value: 'memory' },
          { text: 'B. 部分寿命', value: 'lifespan' },
          { text: 'C. 某种感情', value: 'emotion' },
          { text: 'D. 我不会放弃任何', value: 'nothing' }
        ]
      },
      {
        id: 'q3',
        type: 'text',
        question: '如果有机会重新选择，你会对当初的自己说什么？'
      }
    ]
  }
]

/**
 * 试炼问心路径包
 */
export const TRIAL_PATHS: QuestioningPath[] = [
  {
    id: 'inner_demon',
    name: '心魔试炼',
    description: '直面内心深处的心魔，了解真实的自己',
    packageType: PathPackageType.TRIAL,
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
    packageType: PathPackageType.TRIAL,
    minRealm: 1,
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
    packageType: PathPackageType.TRIAL,
    minRealm: 2,
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
 * 所有路径包汇总
 */
export const ALL_PATHS = [...INITIATION_PATHS, ...TRIAL_PATHS]

/**
 * 根据路径包类型获取路径列表
 */
export function getPathsByPackageType(packageType: PathPackageType): QuestioningPath[] {
  return ALL_PATHS.filter(path => path.packageType === packageType)
}

/**
 * 从指定路径包中随机选择一条路径
 */
export function getRandomPath(packageType: PathPackageType): QuestioningPath | null {
  const paths = getPathsByPackageType(packageType)
  if (paths.length === 0) return null

  const randomIndex = Math.floor(Math.random() * paths.length)
  return paths[randomIndex]
}

/**
 * AI Prompt 模板 - 步入仙途专用
 */
export const INITIATION_AI_PROMPT = `你是修仙世界的天道意志，正在为一位新入门的修仙者分配灵根和道号。

问心路径：{pathName}
路径描述：{pathDescription}

修仙者回答：
问题1：{question1}
回答1：{answer1}

问题2：{question2}
回答2：{answer2}

问题3：{question3}
回答3：{answer3}

请基于修仙者的回答，生成一个 JSON 格式的评估结果（必须严格遵循 JSON 格式）：

{
  "daoName": "为修仙者起一个2-4字的道号，要有仙侠风格",
  "spiritualRoot": "从以下灵根中选择一个最匹配的：light(光灵根), dark(暗灵根), metal(金灵根), wood(木灵根), water(水灵根), fire(火灵根), earth(土灵根), qi(气灵根), pseudo(伪灵根), ha(哈根-极其稀有)",
  "personality": "基于回答的性格评语（50字以内）",
  "reason": "为什么分配这个灵根和道号（50字以内）"
}

灵根分配指南：
- light/dark(天灵根): 心怀大志、正邪分明、极端性格
- metal(金): 果断刚毅、攻击性强
- wood(木): 温和善良、生机勃勃
- water(水): 灵活变通、智慧圆融
- fire(火): 热情激进、勇往直前
- earth(土): 沉稳厚重、坚韧不拔
- qi(气灵根): 超然物外、天赋异禀
- pseudo(伪灵根): 平庸普通、但或许有特殊际遇
- ha(哈根): 只有极其特殊、幽默、或不走寻常路的回答才给予

道号风格参考：
- 2字：青云、玄月、寒冰、烈焰等
- 3字：凌霄子、碧云真、紫霄仙等
- 4字：逍遥散人、无量真君等

注意：必须严格输出 JSON 格式，不要有其他内容`

/**
 * AI Prompt 模板 - 试炼问心专用
 */
export const TRIAL_AI_PROMPT = `你是修仙世界的天道意志，正在评估一位修仙者的问心结果。

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
- 道号：{username}
- 境界：{realm}
- 灵根：{spiritualRoot}
- 修为：{cultivation}/{cultivationMax}

请基于修仙者的回答，生成一个 JSON 格式的评估结果（必须严格遵循 JSON 格式）：

{
  "personality": "基于回答的性格评语（50字以内）",
  "tendency": "问心倾向（如：力量型、智慧型、守护型、超脱型等）",
  "reward": {
    "type": "cultivation|spiritStone",
    "value": 数值（cultivation: 100-500, spiritStone: 50-200）
  },
  "reason": "奖励原因说明（30字以内）"
}

注意：
1. 奖励应与回答的深度和境界相匹配
2. 性格评语要体现修仙者的道心特质
3. 必须严格输出 JSON 格式，不要有其他内容`

/**
 * 奖励类型定义
 */
export type RewardType = 'cultivation' | 'spiritStone'

export interface QuestioningReward {
  type: RewardType
  value: number
}

/**
 * AI 响应类型 - 步入仙途
 */
export interface InitiationAIResponse {
  daoName: string
  spiritualRoot: string
  personality: string
  reason: string
}

/**
 * AI 响应类型 - 试炼问心
 */
export interface TrialAIResponse {
  personality: string
  tendency: string
  reward: QuestioningReward
  reason: string
}
