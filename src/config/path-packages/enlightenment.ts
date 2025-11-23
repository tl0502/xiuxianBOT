/**
 * 示例问道包 - 感悟包
 * 考验玩家的悟性和对道的理解
 *
 * v1.1.0 更新：
 * - triggerChance 移到外层
 * - 删除单个包冷却时间，改用全局冷却
 */

import { PathPackageTemplate } from '../../types/path-package'

export const enlightenmentPackages: PathPackageTemplate[] = [
  {
    id: 'enlightenment_dao_question',
    name: '道心叩问',
    description: '静坐修炼时，心中浮现关于大道的疑问',
    tags: ['enlightenment', 'trial'],

    // v1.1.0 移到外层
    triggerChance: 0.25,

    triggerConditions: {
      minRealm: 1
    },

    // ✨ v0.8.2 新增：评分权重配置（感悟包更看重开放式回答）
    scoringWeights: {
      choiceWeight: 0.2,  // 选择题20%
      openWeight: 0.8     // 开放题80%
    },

    // ✨ v0.8.2 新增：AI功能独立控制
    aiFeatures: {
      enableScoring: true,      // 启用AI打分
      enableEvaluation: true    // 启用AI评语
    },

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
        question: '若修炼与救人只能二选一，你会如何抉择？',
        options: [
          { text: 'A. 修炼为先，唯有强大才能救更多人', value: { determination: 4, focus: 3, greed: 2 } },
          { text: 'B. 救人为先，道心不可失', value: { kindness: 5, courage: 4, honesty: 2 } },
          { text: 'C. 视情况而定，没有绝对的选择', value: { stability: 4, focus: 3 } },
          { text: 'D. 寻求两全之法，不做非此即彼的选择', value: { focus: 5, determination: 3 } }
        ]
      },
      {
        id: 'q2',
        type: 'choice',
        question: '面对道心动摇，你会如何应对？',
        options: [
          { text: 'A. 直面内心，剖析动摇之因', value: { honesty: 5, focus: 5 } },
          { text: 'B. 坚定信念，不予理会', value: { determination: 5, stability: 3 } },
          { text: 'C. 寻求师长指点', value: { honesty: 4, kindness: 2 } },
          { text: 'D. 入世历练，在红尘中磨砺', value: { courage: 4, determination: 3 } }
        ]
      },
      {
        id: 'q3',
        type: 'text',
        question: '请用一句话描述你对"道"的理解：',
        // ✨ v0.6.0 AI评分提示
        aiHint: '评估修士对"道"的理解深度。深刻的理解（>20字）给focus和stability加分。玄学空谈给impatience加分。识别作弊行为。'
      }
    ],
    optimalScore: {
      target: {
        determination: 6,
        courage: 6,
        stability: 8,        // 道心稳定
        focus: 9,            // 专注悟道
        honesty: 8,          // 坦诚面对内心
        kindness: 6,
        greed: 1,            // 无贪念
        impatience: 1,       // 沉稳
        manipulation: 1
      },
      rewards: {
        perfect: {
          type: 'cultivation',
          value: 100,
          aiPromptHint: '悟道深刻，修为大进'
        },
        good: {
          type: 'cultivation',
          value: 40,
          aiPromptHint: '有所领悟，修为小进'
        },
        normal: {
          type: 'cultivation',
          value: 10,
          aiPromptHint: '尚需沉淀，继续修行'
        }
      }
    },
    version: '1.0',
    author: 'system',
    enabled: true
  },

  {
    id: 'enlightenment_nature_insight',
    name: '天地感悟',
    description: '观察天地万物，你似乎有所领悟',
    tags: ['enlightenment'],

    // v1.1.0 移到外层
    triggerChance: 0.20,

    triggerConditions: {
      minRealm: 2
    },

    // ✨ v0.8.2 新增：评分权重配置（使用默认权重）
    scoringWeights: {
      choiceWeight: 0.3,  // 选择题30%
      openWeight: 0.7     // 开放题70%
    },

    // ✨ v0.8.2 新增：AI功能独立控制
    aiFeatures: {
      enableScoring: true,      // 启用AI打分
      enableEvaluation: true    // 启用AI评语
    },

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
        question: '观落叶飘零，你悟出了什么？',
        options: [
          { text: 'A. 顺势而为，不强求', value: { stability: 5, focus: 2 } },
          { text: 'B. 生死循环，皆是自然', value: { stability: 4, honesty: 3 } },
          { text: 'C. 落叶归根，饮水思源', value: { kindness: 4, honesty: 3 } },
          { text: 'D. 只是落叶，何必多想', value: { stability: 3, focus: 1 } }
        ]
      },
      {
        id: 'q2',
        type: 'choice',
        question: '观流水不息，你体会到什么？',
        options: [
          { text: 'A. 柔能克刚，水滴石穿', value: { determination: 4, stability: 4 } },
          { text: 'B. 随形就势，灵活变通', value: { stability: 4, focus: 3 } },
          { text: 'C. 百川归海，殊途同归', value: { stability: 4, honesty: 2 } },
          { text: 'D. 逝者如斯，要珍惜时间', value: { focus: 3, impatience: 2 } }
        ]
      },
      {
        id: 'q3',
        type: 'text',
        question: '将你此刻的感悟凝练成一句话：',
        // ✨ v0.6.0 AI评分提示
        aiHint: '评估修士对天地自然的感悟深度。真诚详细的感悟（>15字）给stability和focus加分。空洞敷衍（<5字）给impatience加分。识别作弊行为。'
      }
    ],
    optimalScore: {
      target: {
        determination: 5,
        courage: 5,
        stability: 9,
        focus: 8,
        honesty: 7,
        kindness: 7,
        greed: 1,
        impatience: 1,
        manipulation: 1
      },
      rewards: {
        perfect: {
          type: 'cultivation',
          value: 80,
          aiPromptHint: '天人合一，领悟深刻'
        },
        good: {
          type: 'cultivation',
          value: 30,
          aiPromptHint: '略有所悟'
        },
        normal: {
          type: 'cultivation',
          value: 5,
          aiPromptHint: '悟性尚浅'
        }
      }
    },
    version: '1.0',
    author: 'system',
    enabled: true
  }
]
