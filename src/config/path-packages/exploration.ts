/**
 * 示例问道包 - 遗迹探索包
 * 考验玩家的探险能力和决策智慧
 */

import { PathPackageTemplate } from '../../types/path-package'

export const explorationPackages: PathPackageTemplate[] = [
  {
    id: 'exploration_ancient_ruins',
    name: '上古遗迹',
    description: '你发现了一处上古遗迹的入口，里面机关重重',
    tags: ['exploration', 'opportunity'],
    triggerConditions: {
      minRealm: 2,
      cooldownHours: 96,     // 4天冷却
      triggerChance: 0.12    // 12%触发率
    },

    // ✨ v0.6.0 启用AI评分
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
        question: '遗迹入口有三条路：左边暗道幽深，中间大道平坦但有守卫石像，右边小径有阵法波动。你选？',
        options: [
          { text: 'A. 左边暗道，隐蔽安全', value: 'cautious' },
          { text: 'B. 中间大道，正面突破', value: 'direct' },
          { text: 'C. 右边小径，阵法或藏机缘', value: 'adventurous' },
          { text: 'D. 先探查再决定', value: 'thorough' }
        ]
      },
      {
        id: 'q2',
        type: 'choice',
        question: '深入遗迹后，你遇到一个受困的修士和一个上锁的宝箱，机关只能开启一处。你会？',
        options: [
          { text: 'A. 救人为先，宝物可以不要', value: 'righteous' },
          { text: 'B. 先拿宝箱，再看能否救人', value: 'pragmatic' },
          { text: 'C. 询问修士宝箱里是什么', value: 'calculating' },
          { text: 'D. 尝试同时破解两处机关', value: 'ambitious' }
        ]
      },
      {
        id: 'q3',
        type: 'text',
        question: '遗迹深处，你发现一幅壁画记载了上古大能的传承条件：必须放弃现有功法从头修炼。你的抉择是？',
        // ✨ v0.6.0 AI评分提示
        aiHint: '评估修士对机遇的把握和取舍智慧。识别是否果断抓住机会（determination高、courage高）、贪恋现状不敢舍弃（greed中、courage低）、冷静权衡利弊（stability高、focus高）还是急躁盲从（impatience高）。检测作弊行为。'
      }
    ],
    optimalScore: {
      target: {
        determination: 7,
        courage: 8,          // 需要勇气探险
        stability: 6,
        focus: 7,
        honesty: 5,
        kindness: 6,
        greed: 4,            // 适度的获取欲
        impatience: 3,
        manipulation: 3
      },
      rewards: {
        perfect: {
          type: 'spirit_stone',
          value: 600,
          aiPromptHint: '完美探索，满载而归'
        },
        good: {
          type: 'spirit_stone',
          value: 250,
          aiPromptHint: '有所收获，但错过了部分机缘'
        },
        normal: {
          type: 'spirit_stone',
          value: 80,
          aiPromptHint: '勉强脱险，收获甚微'
        }
      }
    },
    version: '1.0',
    author: 'system',
    enabled: true
  },

  {
    id: 'exploration_secret_realm',
    name: '秘境寻宝',
    description: '你获得了一张秘境地图，上面标注了宝藏位置',
    tags: ['exploration'],
    triggerConditions: {
      minRealm: 3,           // 筑基期
      cooldownHours: 168,    // 7天冷却
      triggerChance: 0.1     // 10%触发率
    },

    // ✨ v0.6.0 启用AI评分
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
        question: '地图上有三处宝藏标记，但你的时间只够探索一处。标记分别是：危险但收获大、安全但收获中等、未知。你选择？',
        options: [
          { text: 'A. 危险高收益，富贵险中求', value: 'risk_taker' },
          { text: 'B. 安全中收益，稳中求进', value: 'conservative' },
          { text: 'C. 未知处，也许有意外惊喜', value: 'adventurous' },
          { text: 'D. 快速扫荡，三处都去看看', value: 'greedy' }
        ]
      },
      {
        id: 'q2',
        type: 'choice',
        question: '途中遇到另一队探宝者，他们提议合作分宝。你会？',
        options: [
          { text: 'A. 同意合作，人多力量大', value: 'cooperative' },
          { text: 'B. 婉拒，独行更自在', value: 'independent' },
          { text: 'C. 假意合作，暗中警惕', value: 'cautious' },
          { text: 'D. 先下手为强，消灭竞争者', value: 'aggressive' }
        ]
      },
      {
        id: 'q3',
        type: 'text',
        question: '最终你找到宝藏，却发现是一位前辈的衣冠冢和遗言。他希望你继承遗志而非取走宝物。你会怎么做？',
        // ✨ v0.6.0 AI评分提示
        aiHint: '评估修士对传承和物质利益的态度。识别是否尊重前辈遗志（honesty高、kindness高）、贪图宝物利益（greed高、kindness低）、真诚思考权衡（honesty高、stability高）还是敷衍了事（impatience高）。检测作弊行为。'
      }
    ],
    optimalScore: {
      target: {
        determination: 7,
        courage: 7,
        stability: 7,
        focus: 6,
        honesty: 6,
        kindness: 5,
        greed: 3,
        impatience: 3,
        manipulation: 2
      },
      rewards: {
        perfect: {
          type: 'spirit_stone',
          value: 800,
          aiPromptHint: '不负前辈所托，获得真正传承'
        },
        good: {
          type: 'spirit_stone',
          value: 350,
          aiPromptHint: '有所领悟，获得部分宝藏'
        },
        normal: {
          type: 'spirit_stone',
          value: 100,
          aiPromptHint: '贪念作祟，错失良机'
        }
      }
    },
    version: '1.0',
    author: 'system',
    enabled: true
  }
]
