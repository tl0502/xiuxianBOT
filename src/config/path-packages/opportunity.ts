/**
 * 示例问道包 - 机缘包
 * 测试玩家能否把握机遇、识破陷阱
 *
 * v1.1.0 更新：
 * - triggerChance 移到外层
 * - 删除单个包冷却时间，改用全局冷却
 */

import { PathPackageTemplate } from '../../types/path-package'

export const opportunityPackages: PathPackageTemplate[] = [
  {
    id: 'opportunity_treasure_cave',
    name: '宝藏洞府',
    description: '你在修炼时偶然发现一处隐秘洞府，似有宝物气息传出',
    tags: ['opportunity', 'exploration'],

    // v1.1.0 移到外层
    triggerChance: 0.15,

    triggerConditions: {
      minRealm: 2           // 金丹期
    },

    // ✨ v0.8.2 新增：评分权重配置
    scoringWeights: {
      choiceWeight: 0.4,  // 选择题40%（机缘包更看重具体选择）
      openWeight: 0.6     // 开放题60%
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
        question: '洞府入口有一道禁制，你隐约感觉到危险气息，你会？',
        options: [
          { text: 'A. 仔细研究禁制，寻找破解之法', value: { focus: 5, stability: 3 } },
          { text: 'B. 直接强行闯入，速战速决', value: { courage: 4, impatience: 3, determination: 2 } },
          { text: 'C. 先退后观察，等待时机', value: { stability: 5, focus: 2 } },
          { text: 'D. 设法引诱他人先行试探', value: { manipulation: 5, greed: 2 } }
        ]
      },
      {
        id: 'q2',
        type: 'choice',
        question: '洞府中你发现两件宝物：一件光芒璀璨但有怪异气息，一件朴实无华但蕴含纯正灵气。你会？',
        options: [
          { text: 'A. 只取朴实那件，光芒太盛必有蹊跷', value: { focus: 4, stability: 4, honesty: 2 } },
          { text: 'B. 两件都要，管他什么气息', value: { greed: 5, impatience: 3 } },
          { text: 'C. 都不取，直觉告诉你这是陷阱', value: { stability: 5, focus: 2 } },
          { text: 'D. 先用法诀检验两件宝物', value: { focus: 5, stability: 3 } }
        ]
      },
      {
        id: 'q3',
        type: 'text',
        question: '离开洞府时，一个受伤的修士请求你分享宝物换取他的传承。你的决定是？',
        // ✨ v0.6.0 AI评分提示
        aiHint: '评估修士面对利益交换时的态度。识别是否贪婪（greed高）、谨慎（stability高）、善良（kindness高）还是冷酷（kindness低）。检测作弊行为。'
      }
    ],
    optimalScore: {
      target: {
        determination: 7,    // 需要果断
        courage: 6,          // 需要勇气
        stability: 7,        // 需要冷静
        focus: 8,            // 需要专注
        honesty: 5,          // 中等
        kindness: 4,         // 略低（需要一定自保意识）
        greed: 3,            // 低贪念（不被宝物迷惑）
        impatience: 2,       // 低急躁（耐心观察）
        manipulation: 2      // 低操控
      },
      rewards: {
        perfect: {
          type: 'spirit_stone',
          value: 500,
          aiPromptHint: '完美把握机缘，展现出过人的智慧与定力'
        },
        good: {
          type: 'spirit_stone',
          value: 200,
          aiPromptHint: '有所收获，但仍有提升空间'
        },
        normal: {
          type: 'spirit_stone',
          value: 50,
          aiPromptHint: '与机缘擦肩而过，需要更多历练'
        }
      }
    },
    version: '1.0',
    author: 'system',
    enabled: true
  },

  {
    id: 'opportunity_mysterious_merchant',
    name: '神秘商人',
    description: '一位神秘商人出现在你面前，声称有绝世秘籍出售',
    tags: ['opportunity'],

    // v1.1.0 移到外层
    triggerChance: 0.20,

    triggerConditions: {
      minRealm: 1           // 筑基期
    },

    // ✨ v0.6.0 启用AI评分（向后兼容示例）
    // 注：保留旧配置以展示向后兼容性，等价于 aiFeatures: { enableScoring: true, enableEvaluation: true }
    requiresAI: true,

    // ✨ v1.1.0 评分权重配置
    scoringWeights: {
      choiceWeight: 0.3,
      openWeight: 0.7
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
        question: '商人开出的价格远低于市价，你的第一反应是？',
        options: [
          { text: 'A. 立即购买，这是难得的机会', value: { impatience: 4, greed: 3 } },
          { text: 'B. 仔细检查秘籍真伪', value: { focus: 5, stability: 3 } },
          { text: 'C. 询问秘籍来源', value: { focus: 4, honesty: 2 } },
          { text: 'D. 直接离开，便宜没好货', value: { stability: 4, focus: 2 } }
        ]
      },
      {
        id: 'q2',
        type: 'choice',
        question: '商人见你犹豫，又拿出一件更珍贵的宝物，声称可以搭售。你会？',
        options: [
          { text: 'A. 更加警惕，这像是在下套', value: { stability: 5, focus: 4 } },
          { text: 'B. 心动不已，立即成交', value: { greed: 5, impatience: 4 } },
          { text: 'C. 假装离开，看他反应', value: { manipulation: 4, focus: 3 } },
          { text: 'D. 要求试用后再决定', value: { focus: 4, stability: 2 } }
        ]
      },
      {
        id: 'q3',
        type: 'text',
        question: '最终，你发现秘籍是真的但有缺页。面对商人的狡辩，你会如何处理？',
        // ✨ v0.6.0 AI评分提示
        aiHint: '评估修士面对欺骗时的反应。识别是否冷静应对（stability高）、愤怒冲动（impatience高）、寻求补偿（determination高）还是忍气吞声（courage低）。检测作弊行为。'
      }
    ],
    optimalScore: {
      target: {
        determination: 6,
        courage: 5,
        stability: 8,        // 高稳定，不被诱惑
        focus: 7,
        honesty: 6,
        kindness: 5,
        greed: 2,            // 低贪念
        impatience: 2,       // 不急躁
        manipulation: 3
      },
      rewards: {
        perfect: {
          type: 'spirit_stone',
          value: 400,
          aiPromptHint: '识破骗局，展现出修士的智慧'
        },
        good: {
          type: 'spirit_stone',
          value: 150,
          aiPromptHint: '虽有损失，但吸取了教训'
        },
        normal: {
          type: 'spirit_stone',
          value: 30,
          aiPromptHint: '被骗得很惨，需要更多防范意识'
        }
      }
    },
    version: '1.0',
    author: 'system',
    enabled: true
  }
]
