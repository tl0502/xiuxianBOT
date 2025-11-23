/**
 * 问道包 - 情义抉择
 * 考察玩家对友情、亲情、爱情的态度
 *
 * v1.1.0 更新：
 * - triggerChance 移到外层
 * - 删除单个包冷却时间，改用全局冷却
 */

import { PathPackageTemplate } from '../../types/path-package'

export const bondPackages: PathPackageTemplate[] = [
  {
    id: 'bond_friend_betrayal',
    name: '故友之约',
    description: '昔日好友陷入危机，向你求助，但帮助他可能会让你陷入困境',
    tags: ['bond', 'trial'],

    // v1.1.0 移到外层
    triggerChance: 0.15,

    triggerConditions: {
      minRealm: 1           // 筑基期
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
      maxScorePerDimension: 8,   // AI最多给8分
      minScorePerDimension: -3   // AI最少扣3分
    },

    questions: [
      {
        id: 'q1',
        type: 'choice',
        question: '你的挚友被仇家追杀，来向你求助。但帮助他会得罪一个强大的宗门。你会？',
        options: [
          { text: 'A. 毫不犹豫地帮助，朋友比什么都重要', value: { kindness: 5, courage: 5, honesty: 2 } },
          { text: 'B. 提供有限帮助，但不直接对抗', value: { kindness: 3, stability: 3, manipulation: 2 } },
          { text: 'C. 劝说他自首或逃走，自己不参与', value: { stability: 4, focus: 2 } },
          { text: 'D. 拒绝帮助，甚至考虑出卖换取好处', value: { greed: 5, manipulation: 5, kindness: -3 } }
        ]
      },
      {
        id: 'q2',
        type: 'choice',
        question: '后来你发现，朋友其实是被诬陷的。你会？',
        options: [
          { text: 'A. 调查真相，为他洗清冤屈', value: { honesty: 5, courage: 5, kindness: 3 } },
          { text: 'B. 告诉他真相，由他自己决定', value: { honesty: 4, kindness: 3 } },
          { text: 'C. 保持沉默，事不关己', value: { stability: 3, kindness: -2 } },
          { text: 'D. 这改变不了我的决定', value: { determination: 4, stability: 2 } }
        ]
      },
      {
        id: 'q3',
        type: 'text',
        question: '在修仙之路上，友情、爱情、亲情对你来说意味着什么？如果必须在道途与情义之间选择，你会如何抉择？',
        // ✨ v0.6.0 AI评分提示：告诉AI这题想考察什么
        aiHint: '评估修士对友情、爱情、亲情的重视程度。识别是否重情重义（kindness, honesty高分），还是绝情寡义（greed, manipulation高分）。真诚深入的回答给honesty和focus加分。'
      }
    ],
    optimalScore: {
      target: {
        determination: 6,
        courage: 7,
        stability: 6,
        focus: 5,
        honesty: 8,         // 重视诚信
        kindness: 9,        // 重视善良
        greed: 2,
        impatience: 3,
        manipulation: 2
      },
      rewards: {
        perfect: {
          type: 'special',
          value: 2,
          aiPromptHint: '义薄云天，情重如山，人缘大增'
        },
        good: {
          type: 'spirit_stone',
          value: 300,
          aiPromptHint: '重情重义，获得好友赠礼'
        },
        normal: {
          type: 'spirit_stone',
          value: 50,
          aiPromptHint: '情义淡薄，仅得些许好处'
        }
      }
    },
    version: '1.0',
    author: 'system',
    enabled: true
  },

  {
    id: 'bond_family_choice',
    name: '血脉羁绊',
    description: '家族遭遇危机，你必须在修炼与家族责任之间做出选择',
    tags: ['bond'],

    // v1.1.0 移到外层
    triggerChance: 0.12,

    triggerConditions: {
      minRealm: 2
    },

    // ✨ v1.1.0 评分权重配置
    scoringWeights: {
      choiceWeight: 0.3,
      openWeight: 0.7
    },

    // ✨ v1.1.0 AI功能配置
    aiFeatures: {
      enableScoring: true,
      enableEvaluation: true
    },

    // ✨ v1.1.0 AI评分配置
    aiScoringConfig: {
      openQuestionIndices: [2],
      maxScorePerDimension: 8,
      minScorePerDimension: -3
    },

    questions: [
      {
        id: 'q1',
        type: 'choice',
        question: '家族遭遇灭门危机，族长传讯让你立刻回去。但你正在闭关突破的关键时刻。你会？',
        options: [
          { text: 'A. 立即放弃突破，回家救援', value: { kindness: 5, courage: 5, determination: 2 } },
          { text: 'B. 加速突破，然后回去（可能来不及）', value: { determination: 4, focus: 3, impatience: 2 } },
          { text: 'C. 完成突破再回去，实力更强才能帮上忙', value: { focus: 4, determination: 3, greed: 2 } },
          { text: 'D. 不回去，避免自己也陷入险境', value: { greed: 4, stability: 3, kindness: -3 } }
        ]
      },
      {
        id: 'q2',
        type: 'choice',
        question: '你赶回时发现，家族危机是因为族长的错误决策引起的。此时你的选择是？',
        options: [
          { text: 'A. 无论如何都要救家族，这是血脉责任', value: { kindness: 5, courage: 4, honesty: 2 } },
          { text: 'B. 救人但要求族长认错改过', value: { honesty: 5, determination: 4, kindness: 2 } },
          { text: 'C. 只救无辜族人，不管族长', value: { kindness: 4, focus: 3, determination: 2 } },
          { text: 'D. 这是他自找的，让他自己承担', value: { determination: 3, stability: 2, kindness: -2 } }
        ]
      },
      {
        id: 'q3',
        type: 'text',
        question: '修仙本就是逆天而行的孤独之路。你认为修士应该保留凡心的羁绊，还是斩断一切红尘情丝？为什么？',
        // ✨ v1.1.0 AI评分提示
        aiHint: '评估修士对凡心羁绊与修行的态度。识别是否重视情义（kindness高、honesty高）、冷酷绝情（kindness低、greed高）、真诚权衡（honesty高、stability高）还是敷衍了事（impatience高）。检测作弊行为。'
      }
    ],
    optimalScore: {
      target: {
        determination: 7,
        courage: 8,
        stability: 7,
        focus: 6,
        honesty: 7,
        kindness: 8,
        greed: 2,
        impatience: 4,
        manipulation: 2
      },
      rewards: {
        perfect: {
          type: 'cultivation',
          value: 120,
          aiPromptHint: '情深不寿，却因大爱而道心圆满'
        },
        good: {
          type: 'cultivation',
          value: 60,
          aiPromptHint: '维系了血脉之情，略有感悟'
        },
        normal: {
          type: 'spirit_stone',
          value: 20,
          aiPromptHint: '情义薄凉，道心难圆'
        }
      }
    },
    version: '1.0',
    author: 'system'
  }
]
