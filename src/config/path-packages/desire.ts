/**
 * 问道包 - 欲望试炼
 * 面对权力、财富、美色的诱惑，考验自律与野心的平衡
 *
 * v1.1.0 更新：
 * - triggerChance 移到外层
 * - 删除单个包冷却时间，改用全局冷却
 */

import { PathPackageTemplate } from '../../types/path-package'

export const desirePackages: PathPackageTemplate[] = [
  {
    id: 'desire_power_temptation',
    name: '权力诱惑',
    description: '一个强大宗门向你抛出橄榄枝，许诺给你长老之位，但需要你做一些见不得光的事',
    tags: ['desire', 'trial'],

    // v1.1.0 移到外层
    triggerChance: 0.12,

    triggerConditions: {
      minRealm: 2           // 金丹期
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
        question: '宗门长老私下找你，承诺让你成为核心弟子，但要你帮忙陷害一个竞争对手。你会？',
        options: [
          { text: 'A. 拒绝，不屑用这种手段', value: { honesty: 5, courage: 3, kindness: 2 } },
          { text: 'B. 假意答应，暗中调查', value: { manipulation: 4, focus: 4, honesty: 2 } },
          { text: 'C. 询问详情，评估风险收益', value: { focus: 4, stability: 2, greed: 2 } },
          { text: 'D. 欣然同意，机会难得', value: { greed: 5, manipulation: 4, impatience: 2 } }
        ]
      },
      {
        id: 'q2',
        type: 'choice',
        question: '你发现那个竞争对手其实是无辜的，只是挡了某些人的路。此时你会？',
        options: [
          { text: 'A. 揭穿阴谋，维护正义', value: { honesty: 5, courage: 5, kindness: 3 } },
          { text: 'B. 暗中帮助对手，不暴露自己', value: { kindness: 4, manipulation: 3, stability: 2 } },
          { text: 'C. 保持中立，不参与任何一方', value: { stability: 4, focus: 2 } },
          { text: 'D. 继续执行计划，弱肉强食', value: { greed: 5, manipulation: 5, kindness: -3 } }
        ]
      },
      {
        id: 'q3',
        type: 'text',
        question: '修仙之路，权力意味着资源和保护。你如何看待为了获取权力而妥协底线？你的底线在哪里？',
        // ✨ v0.6.0 AI评分提示
        aiHint: '评估修士对权力和原则的态度。识别是否坚持原则（honesty高、determination高）、为权力妥协（greed高、manipulation高）、道心坚定（stability高）还是模棱两可无底线（focus低、honesty低）。检测作弊行为。'
      }
    ],
    optimalScore: {
      target: {
        determination: 8,
        courage: 7,
        stability: 8,
        focus: 7,
        honesty: 7,
        kindness: 6,
        greed: 3,           // 适度的欲望
        impatience: 3,
        manipulation: 3     // 不过度算计
      },
      rewards: {
        perfect: {
          type: 'special',
          value: 3,
          aiPromptHint: '明辨是非，权力在握却不为所惑'
        },
        good: {
          type: 'spirit_stone',
          value: 250,
          aiPromptHint: '保持了原则，获得些许势力支持'
        },
        normal: {
          type: 'cultivation',
          value: -30,
          aiPromptHint: '欲望蒙蔽了双眼，道心受损'
        }
      }
    },
    version: '1.0',
    author: 'system',
    enabled: true
  },

  {
    id: 'desire_wealth_greed',
    name: '财富迷局',
    description: '你发现了一处隐秘宝库的线索，但获取它需要付出道德代价',
    tags: ['desire'],

    // v1.1.0 移到外层
    triggerChance: 0.14,

    triggerConditions: {
      minRealm: 1
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
        question: '你得知一处遗迹中有巨额宝藏，但那是一位前辈生前托付给他后人的遗产。你会？',
        options: [
          { text: 'A. 不动，这是别人的东西', value: { honesty: 5, kindness: 3 } },
          { text: 'B. 寻找那位后人，告知此事', value: { honesty: 5, kindness: 5 } },
          { text: 'C. 先取一部分，留一部分给后人', value: { greed: 4, manipulation: 3, honesty: 2 } },
          { text: 'D. 全部拿走，先到先得', value: { greed: 5, impatience: 3, honesty: -2 } }
        ]
      },
      {
        id: 'q2',
        type: 'choice',
        question: '后来你发现，那位后人是个作恶多端的恶徒。你对宝藏的想法是？',
        options: [
          { text: 'A. 仍然归还，承诺是承诺', value: { honesty: 5, determination: 4 } },
          { text: 'B. 代为保管，等他改过自新', value: { kindness: 4, determination: 3, manipulation: 2 } },
          { text: 'C. 将宝藏用于行善，不给恶人', value: { kindness: 5, honesty: 3, determination: 2 } },
          { text: 'D. 既然如此，那就自己留着', value: { greed: 5, manipulation: 3, honesty: -2 } }
        ]
      },
      {
        id: 'q3',
        type: 'text',
        question: '灵石、法宝、丹药...修仙需要大量资源。你认为修士在追求财富时应该遵循什么原则？君子爱财，取之有道，对你意味着什么？',
        // ✨ v0.6.0 AI评分提示
        aiHint: '评估修士对财富的态度和道德观。识别是否君子爱财取之有道（honesty高、greed低）、贪婪无度（greed高、kindness低）、真诚深入思考（honesty高、focus高）还是敷衍空谈（impatience高、focus低）。检测作弊行为。'
      }
    ],
    optimalScore: {
      target: {
        determination: 7,
        courage: 6,
        stability: 7,
        focus: 6,
        honesty: 9,         // 重视诚信
        kindness: 7,
        greed: 3,           // 低贪念
        impatience: 3,
        manipulation: 2
      },
      rewards: {
        perfect: {
          type: 'spirit_stone',
          value: 500,
          aiPromptHint: '君子爱财取之有道，天道有感，降下财运'
        },
        good: {
          type: 'spirit_stone',
          value: 200,
          aiPromptHint: '心性尚可，获得适当回报'
        },
        normal: {
          type: 'spirit_stone',
          value: 30,
          aiPromptHint: '贪念难消，所得甚微'
        }
      }
    },
    version: '1.0',
    author: 'system',
    enabled: true
  },

  {
    id: 'desire_beauty_charm',
    name: '红粉骷髅',
    description: '你遇到了一位绝世美人，她愿意与你双修，但似乎另有目的',
    tags: ['desire', 'trial'],

    // v1.1.0 移到外层
    triggerChance: 0.08,

    triggerConditions: {
      minRealm: 3           // 元婴期
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
        question: '一位神秘女修主动接近你，提出双修之约，可大幅提升修为。你的反应是？',
        options: [
          { text: 'A. 礼貌拒绝，专心修炼', value: { focus: 5, stability: 4, determination: 2 } },
          { text: 'B. 询问她的来历和目的', value: { focus: 5, stability: 3 } },
          { text: 'C. 半信半疑，小心尝试', value: { greed: 3, stability: 2, manipulation: 2 } },
          { text: 'D. 欣然接受，美色与修为兼得', value: { greed: 5, impatience: 4, stability: -2 } }
        ]
      },
      {
        id: 'q2',
        type: 'choice',
        question: '你发现她是来盗取你身上某件宝物的。但你也发现她似乎是被人胁迫。你会？',
        options: [
          { text: 'A. 帮助她解决困境', value: { kindness: 5, courage: 4, honesty: 2 } },
          { text: 'B. 揭穿并驱逐，但不伤害她', value: { honesty: 4, determination: 3, kindness: 2 } },
          { text: 'C. 假装不知，暗中防范', value: { manipulation: 4, stability: 3 } },
          { text: 'D. 将计就计，反过来利用她', value: { manipulation: 5, greed: 4, kindness: -2 } }
        ]
      },
      {
        id: 'q3',
        type: 'text',
        question: '情欲、美色，对修士既是试炼也是红尘陷阱。你如何看待修仙路上的情爱？是该斩断情丝，还是拥抱红尘？',
        // ✨ v0.6.0 AI评分提示
        aiHint: '评估修士对情爱的态度和道心稳定性。识别是否道心坚定（stability高、focus高）、沉迷美色（stability低、greed高）、真诚思考情爱（honesty高、kindness高）还是冷酷无情（kindness低、stability高）。检测作弊行为。'
      }
    ],
    optimalScore: {
      target: {
        determination: 8,
        courage: 6,
        stability: 9,        // 高道心稳定
        focus: 8,
        honesty: 7,
        kindness: 7,
        greed: 2,
        impatience: 2,
        manipulation: 3
      },
      rewards: {
        perfect: {
          type: 'cultivation',
          value: 100,
          aiPromptHint: '色不迷人人自迷，道心坚定，境界提升'
        },
        good: {
          type: 'cultivation',
          value: 40,
          aiPromptHint: '心有波澜但未迷失，略有长进'
        },
        normal: {
          type: 'cultivation',
          value: -50,
          aiPromptHint: '沉迷美色，修为受损'
        }
      }
    },
    version: '1.0',
    author: 'system',
    enabled: true
  }
]
