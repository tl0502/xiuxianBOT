/**
 * 步入仙途问道包
 * 新玩家踏入修仙世界时的初心问询
 */

import { PathPackageTemplate } from '../../types/path-package'

/**
 * 步入仙途专用问道包
 * - 用于新玩家初始化
 * - 无境界要求，无冷却时间
 * - 第3题为开放题，启用AI评分
 */
export const initiationPackages: PathPackageTemplate[] = [
  {
    id: 'initiation_path_1',
    name: '踏入仙途·初心之问',
    description: '天道感知你的初心，将为你指引前路',
    tags: ['initiation'],
    triggerConditions: {
      minRealm: 0,           // 无境界要求
      cooldownHours: 0,       // 无冷却时间
      triggerChance: 1.0      // 100% 触发（随机选择其中一个）
    },

    // ✨ v0.6.0 启用AI评分（第3题开放题）
    requiresAI: true,

    // ✨ v0.6.0 AI评分配置
    aiScoringConfig: {
      openQuestionIndices: [2],  // 第3题是开放题
      maxScorePerDimension: 8,
      minScorePerDimension: -3
    },

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
        question: '请描述你心中的"道"是什么：',
        // ✨ v0.6.0 AI评分提示
        aiHint: '评估修士对"道"的理解。识别核心价值观：是仁慈（kindness高）、求知（focus高）、自由（stability低但determination高）、还是权力（greed高、manipulation高）。检测作弊行为。'
      }
    ]
  },

  {
    id: 'initiation_path_2',
    name: '踏入仙途·本性之辨',
    description: '本性难移，天道将观你真我',
    tags: ['initiation'],
    triggerConditions: {
      minRealm: 0,
      cooldownHours: 0,
      triggerChance: 1.0
    },

    requiresAI: true,

    aiScoringConfig: {
      openQuestionIndices: [2],
      maxScorePerDimension: 8,
      minScorePerDimension: -3
    },

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
        question: '用一句话形容你想成为怎样的修仙者：',
        aiHint: '评估修士的自我定位和理想。识别性格倾向：勇敢（courage高）、谨慎（stability高）、善良（kindness高）、野心（greed高）。检测作弊行为。'
      }
    ]
  },

  {
    id: 'initiation_path_3',
    name: '踏入仙途·命运之择',
    description: '命运交织，选择决定你的仙途',
    tags: ['initiation'],
    triggerConditions: {
      minRealm: 0,
      cooldownHours: 0,
      triggerChance: 1.0
    },

    requiresAI: true,

    aiScoringConfig: {
      openQuestionIndices: [2],
      maxScorePerDimension: 8,
      minScorePerDimension: -3
    },

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
        question: '如果有机会重新选择，你会对当初的自己说什么？',
        aiHint: '评估修士的人生观和价值观。识别是否有决断力（determination高）、后悔（stability低）、坚定（determination高）、还是贪婪（greed高）。检测作弊行为。'
      }
    ]
  }
]
