/**
 * 示例问道包 - 魔道包
 * 考验玩家面对黑暗诱惑时的抉择
 *
 * v1.1.0 更新：
 * - triggerChance 移到外层
 * - 删除单个包冷却时间，改用全局冷却
 */

import { PathPackageTemplate } from '../../types/path-package'

export const demonPackages: PathPackageTemplate[] = [
  {
    id: 'demon_dark_temptation',
    name: '心魔试炼',
    description: '修炼中遭遇心魔，黑暗的力量在向你招手',
    tags: ['demon', 'trial'],

    // v1.1.0 移到外层
    triggerChance: 0.10,

    triggerConditions: {
      minRealm: 3           // 元婴期
    },

    // ✨ v0.8.2 新增：评分权重配置（使用默认权重）
    scoringWeights: {
      choiceWeight: 0.3,  // 选择题30%
      openWeight: 0.7     // 开放题70%
    },

    // ✨ v0.8.2 新增：AI功能独立控制（展示仅AI评语场景）
    aiFeatures: {
      enableScoring: false,     // 关闭AI打分
      enableEvaluation: true    // 仅启用AI评语
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
        question: '心魔以你最深的执念化形，许诺实现你的愿望。你会？',
        options: [
          { text: 'A. 坚守本心，拒绝诱惑', value: 'steadfast' },
          { text: 'B. 虚与委蛇，寻找破绽', value: 'strategic' },
          { text: 'C. 细听条件，再做决定', value: 'cautious' },
          { text: 'D. 直接接受，力量就是一切', value: 'corrupted' }
        ]
      },
      {
        id: 'q2',
        type: 'choice',
        question: '心魔展示了一条捷径：以他人为祭，可获强大力量。你的反应是？',
        options: [
          { text: 'A. 宁死不从，这违背我的道', value: 'righteous' },
          { text: 'B. 询问是否有其他方法', value: 'negotiating' },
          { text: 'C. 沉默不语，内心挣扎', value: 'conflicted' },
          { text: 'D. 弱者存在的意义就是成为强者的养分', value: 'ruthless' }
        ]
      },
      {
        id: 'q3',
        type: 'text',
        question: '心魔最后问你：若有一日你所守护之人成为你修行的障碍，你会如何选择？',
        // ✨ v0.6.0 AI评分提示
        aiHint: '评估修士在道途与情义之间的抉择。识别是否道心坚定（stability高）、重情重义（kindness高、honesty高）、冷酷无情（kindness低、greed高）还是真诚纠结（honesty高、stability中）。检测作弊行为。'
      }
    ],
    optimalScore: {
      target: {
        determination: 9,    // 极高决断
        courage: 8,
        stability: 9,        // 道心稳固
        focus: 7,
        honesty: 8,
        kindness: 6,
        greed: 1,            // 极低贪念
        impatience: 2,
        manipulation: 1      // 不走捷径
      },
      rewards: {
        perfect: {
          type: 'special',
          value: 1,          // 特殊奖励ID
          aiPromptHint: '道心通明，心魔尽除，获得心境提升'
        },
        good: {
          type: 'cultivation',
          value: 60,
          aiPromptHint: '勉强通过试炼，但心魔未完全消除'
        },
        normal: {
          type: 'spirit_stone',
          value: -100,       // 负数表示损失
          aiPromptHint: '心魔入侵，道心受损，损失灵石'
        }
      }
    },
    version: '1.0',
    author: 'system',
    enabled: true
  },

  {
    id: 'demon_forbidden_knowledge',
    name: '禁忌之书',
    description: '你意外得到一本禁忌功法，上面记载着邪道秘术',
    tags: ['demon'],

    // v1.1.0 移到外层
    triggerChance: 0.08,

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
        question: '翻开禁书，你发现其中功法威力惊人但需吸取生灵精元。你会？',
        options: [
          { text: 'A. 立即销毁，这是祸害', value: 'destroy' },
          { text: 'B. 收藏研究，知己知彼', value: 'study' },
          { text: 'C. 尝试改良，去其糟粕', value: 'reform' },
          { text: 'D. 照修不误，力量至上', value: 'embrace' }
        ]
      },
      {
        id: 'q2',
        type: 'choice',
        question: '书中有一页记载了可以不伤生灵的变通之法，但修炼速度会大减。你的选择是？',
        options: [
          { text: 'A. 采用变通之法，稳步前进', value: 'patient' },
          { text: 'B. 仍然销毁，不想沾染邪术', value: 'principled' },
          { text: 'C. 两种都尝试，比较效果', value: 'experimental' },
          { text: 'D. 原版效率更高，变通法太慢', value: 'impatient' }
        ]
      },
      {
        id: 'q3',
        type: 'text',
        question: '若你的挚友因修炼邪功而走火入魔，你会如何处置？',
        // ✨ v0.6.0 AI评分提示
        aiHint: '评估修士对邪道的态度和对友情的重视。识别是否正义果断（determination高、kindness高、courage高）、冷酷无情（kindness低）、感性纠结（kindness高、stability低）还是明辨善恶（honesty高、stability高）。检测作弊行为。'
      }
    ],
    optimalScore: {
      target: {
        determination: 8,
        courage: 7,
        stability: 8,
        focus: 6,
        honesty: 7,
        kindness: 7,
        greed: 2,
        impatience: 2,
        manipulation: 2
      },
      rewards: {
        perfect: {
          type: 'cultivation',
          value: 80,
          aiPromptHint: '明辨善恶，道心坚定'
        },
        good: {
          type: 'cultivation',
          value: 30,
          aiPromptHint: '有所犹豫，但终归正道'
        },
        normal: {
          type: 'spirit_stone',
          value: -50,
          aiPromptHint: '心性不稳，险些堕入魔道'
        }
      }
    },
    version: '1.0',
    author: 'system',
    enabled: true
  }
]
