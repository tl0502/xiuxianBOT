/**
 * 试炼问心问道包
 * 用于已入门玩家的心境磨练和修为考验
 *
 * v1.1.0 更新：
 * - triggerChance 移到外层
 * - 删除单个包冷却时间，改用全局冷却
 * - 添加 scoringWeights 配置
 */

import { PathPackageTemplate } from '../../types/path-package'

/**
 * 试炼问心专用问道包
 * - 需要已创建角色的玩家
 * - 有境界要求
 * - 第3题为开放题，启用AI评分
 */
export const trialPackages: PathPackageTemplate[] = [
  {
    id: 'inner_demon',
    name: '心魔试炼',
    description: '直面内心深处的心魔，了解真实的自己',
    tags: ['trial'],

    // v1.1.0 移到外层
    triggerChance: 0.15,

    triggerConditions: {
      minRealm: 0           // 练气期即可
    },

    // ✨ v0.6.0 启用AI评分（第3题开放题）
    requiresAI: true,

    // ✨ v0.6.0 AI评分配置
    aiScoringConfig: {
      openQuestionIndices: [2],  // 第3题是开放题
      maxScorePerDimension: 8,
      minScorePerDimension: -3
    },

    // ✨ v1.1.0 评分权重配置
    scoringWeights: {
      choiceWeight: 0.3,
      openWeight: 0.7
    },

    questions: [
      {
        id: 'q1',
        type: 'choice',
        question: '在修仙路上，你最看重什么？',
        options: [
          { text: '强大的力量', value: { determination: 4, greed: 3, impatience: 2 } },
          { text: '悠长的寿命', value: { stability: 4, focus: 2, greed: 2 } },
          { text: '至高的境界', value: { determination: 5, focus: 4, stability: 2 } },
          { text: '内心的平静', value: { stability: 5, honesty: 3, kindness: 2 } }
        ]
      },
      {
        id: 'q2',
        type: 'choice',
        question: '当面对生死抉择时，你会？',
        options: [
          { text: '舍身取义，保护他人', value: { courage: 5, kindness: 5, determination: 2 } },
          { text: '随机应变，寻找生机', value: { focus: 4, determination: 3 } },
          { text: '冷静分析，权衡利弊', value: { stability: 5, focus: 4 } },
          { text: '遵从本心，无愧于心', value: { honesty: 5, stability: 3 } }
        ]
      },
      {
        id: 'q3',
        type: 'text',
        question: '请用一句话描述你的修仙之道：',
        // ✨ v0.6.0 AI评分提示
        aiHint: '评估修士的修行理念。识别核心追求：力量（greed高）、平和（stability高）、仁慈（kindness高）、还是野心（determination高）。检测作弊行为。'
      }
    ],
    optimalScore: {
      target: {
        determination: 6,
        courage: 6,
        stability: 8,        // 需要稳定心境
        focus: 7,            // 需要专注自省
        honesty: 8,          // 需要诚实面对自己
        kindness: 5,
        greed: 2,            // 低贪念
        impatience: 2,       // 不急躁
        manipulation: 1      // 不自欺
      },
      rewards: {
        perfect: {
          type: 'cultivation',
          value: 500,
          aiPromptHint: '直面心魔，道心通明，修为大进'
        },
        good: {
          type: 'cultivation',
          value: 300,
          aiPromptHint: '有所领悟，心境渐明'
        },
        normal: {
          type: 'cultivation',
          value: 100,
          aiPromptHint: '略有所得，仍需磨练'
        }
      }
    },
    version: '1.0',
    author: 'system',
    enabled: true
  },

  {
    id: 'dao_heart',
    name: '道心叩问',
    description: '扣问道心，明悟修行真意',
    tags: ['trial'],

    // v1.1.0 移到外层
    triggerChance: 0.12,

    triggerConditions: {
      minRealm: 1           // 筑基期
    },

    requiresAI: true,

    aiScoringConfig: {
      openQuestionIndices: [2],
      maxScorePerDimension: 8,
      minScorePerDimension: -3
    },

    // ✨ v1.1.0 评分权重配置
    scoringWeights: {
      choiceWeight: 0.3,
      openWeight: 0.7
    },

    questions: [
      {
        id: 'q1',
        type: 'choice',
        question: '修仙的意义是什么？',
        options: [
          { text: '超脱生死，长生不老', value: { stability: 3, greed: 3, determination: 2 } },
          { text: '探索天地，求知若渴', value: { focus: 5, determination: 3, stability: 2 } },
          { text: '守护世间，济世为怀', value: { kindness: 5, courage: 3, honesty: 2 } },
          { text: '证道成仙，飞升上界', value: { determination: 5, focus: 4 } }
        ]
      },
      {
        id: 'q2',
        type: 'choice',
        question: '若有捷径可走，代价是违背本心，你会？',
        options: [
          { text: '坚守本心，绝不妥协', value: { honesty: 5, determination: 4, stability: 2 } },
          { text: '视情况而定，灵活变通', value: { focus: 3, manipulation: 2, stability: 1 } },
          { text: '权衡利弊，理性选择', value: { focus: 4, stability: 3 } },
          { text: '相信直觉，跟随内心', value: { honesty: 4, courage: 2 } }
        ]
      },
      {
        id: 'q3',
        type: 'text',
        question: '在你心中，"道"是什么？',
        aiHint: '评估修士的道心境界。识别是否坚守本心（honesty高）、灵活变通（stability低、focus低）、务实理性（focus高）。检测作弊行为。'
      }
    ],
    optimalScore: {
      target: {
        determination: 7,    // 需要坚定
        courage: 5,
        stability: 7,        // 需要稳定
        focus: 8,            // 需要专注悟道
        honesty: 9,          // 需要绝对诚实面对本心
        kindness: 6,
        greed: 1,            // 极低贪念
        impatience: 1,       // 不急躁
        manipulation: 1      // 不自欺欺人
      },
      rewards: {
        perfect: {
          type: 'cultivation',
          value: 800,
          aiPromptHint: '道心坚定，明悟大道，修为暴涨'
        },
        good: {
          type: 'cultivation',
          value: 500,
          aiPromptHint: '道心渐明，有所领悟'
        },
        normal: {
          type: 'cultivation',
          value: 200,
          aiPromptHint: '道心未稳，仍需修行'
        }
      }
    },
    version: '1.0',
    author: 'system',
    enabled: true
  },

  {
    id: 'karma_trial',
    name: '因果审判',
    description: '回顾过往，审视因果，明了业力',
    tags: ['trial'],

    // v1.1.0 移到外层
    triggerChance: 0.10,

    triggerConditions: {
      minRealm: 2           // 金丹期
    },

    requiresAI: true,

    aiScoringConfig: {
      openQuestionIndices: [2],
      maxScorePerDimension: 8,
      minScorePerDimension: -3
    },

    // ✨ v1.1.0 评分权重配置
    scoringWeights: {
      choiceWeight: 0.3,
      openWeight: 0.7
    },

    questions: [
      {
        id: 'q1',
        type: 'choice',
        question: '回首修仙路，你最大的遗憾是？',
        options: [
          { text: '未能保护重要的人', value: { kindness: 4, honesty: 3, courage: 1 } },
          { text: '错过重要的机缘', value: { greed: 3, impatience: 2, focus: 1 } },
          { text: '做出了错误的选择', value: { honesty: 4, focus: 3 } },
          { text: '从无遗憾，坦然前行', value: { determination: 4, stability: 3 } }
        ]
      },
      {
        id: 'q2',
        type: 'choice',
        question: '面对曾经的过错，你会？',
        options: [
          { text: '竭力弥补，赎回过失', value: { determination: 4, kindness: 4, honesty: 2 } },
          { text: '接受现实，放下过去', value: { stability: 5, focus: 2 } },
          { text: '深刻反思，避免重蹈', value: { focus: 5, honesty: 4 } },
          { text: '无愧于心，继续前行', value: { honesty: 4, determination: 3 } }
        ]
      },
      {
        id: 'q3',
        type: 'text',
        question: '如果可以对过去的自己说一句话，你会说什么？',
        aiHint: '评估修士对因果的理解。识别是否有悔意（stability低）、坚定（determination高）、反思（focus高）、还是逃避（honesty低）。检测作弊行为。'
      }
    ],
    optimalScore: {
      target: {
        determination: 7,    // 需要坚定
        courage: 6,
        stability: 8,        // 需要稳定心境
        focus: 9,            // 需要深刻反思
        honesty: 8,          // 需要诚实面对过去
        kindness: 7,         // 需要悲悯之心
        greed: 2,            // 低贪念
        impatience: 1,       // 不急躁
        manipulation: 1      // 不逃避责任
      },
      rewards: {
        perfect: {
          type: 'cultivation',
          value: 1000,
          aiPromptHint: '明悟因果，业力清净，修为大涨'
        },
        good: {
          type: 'cultivation',
          value: 600,
          aiPromptHint: '有所领悟，业力渐消'
        },
        normal: {
          type: 'cultivation',
          value: 300,
          aiPromptHint: '略有所得，仍需参悟'
        }
      }
    },
    version: '1.0',
    author: 'system',
    enabled: true
  }
]
