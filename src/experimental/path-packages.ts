/**
 * ============================================================
 * 性格量化系统 v2.0 - 多问道包配置（实验性功能）
 * ============================================================
 *
 * 当前状态: 未启用（默认使用 v1.0）
 * 系统版本: v2.0 - 22维性格系统 + 多问道包
 *
 * 本文件属于 v2.0 实验性功能，暂时搁置，尚未集成到主流程。
 *
 * v2.0 系统相关文件:
 * - src/experimental/path-packages.ts（本文件）- 多问道包定义
 * - src/experimental/personality-dimensions.ts - 22维性格系统
 * - src/config/personality-system-config.ts - 版本切换配置
 * - src/experimental/ai-personality-analyzer.ts - AI性格解析器
 * - src/experimental/extended-fate-calculator.ts - 扩展天命计算器
 *
 * 启用方法:
 * 在 src/index.ts 的 Config 中设置:
 *   personalitySystemVersion: 'v2.0'
 *
 * 注意事项:
 * - v2.0 系统未经过充分测试
 * - 需要更多 AI 调用，成本较高
 * - 数据结构与 v1.0 不完全兼容
 * - 建议在测试环境中启用
 *
 * 参考文档:
 * - .claude/性格量化系统v2升级方案.md
 * - .claude/PROJECT_MEMORY.md（第1358-1438行）
 *
 * ============================================================
 */

/**
 * 问道包类型
 */
export enum PathPackageType {
  INITIATION = 'initiation',       // 步入仙途（原有）
  INNER_DEMON = 'inner_demon',     // 心魔试炼
  OPPORTUNITY = 'opportunity',      // 机缘考验
  BOND = 'bond',                    // 情义抉择
  DESIRE = 'desire',                // 欲望试炼
  WISDOM = 'wisdom',                // 智慧问道
  COMBAT = 'combat'                 // 战斗意志
}

/**
 * 问道包重点维度配置
 */
export interface PathDimensionFocus {
  dimension: string    // 维度键名
  weight: number       // 权重（影响匹配度计算）
  description: string  // 说明
}

/**
 * 问道包定义
 */
export interface PathPackageDefinition {
  id: string                       // 唯一标识
  type: PathPackageType            // 类型
  name: string                     // 名称
  description: string              // 描述
  theme: string                    // 主题说明
  focusDimensions: PathDimensionFocus[]  // 重点考察的维度
  questions: PathQuestion[]        // 问题列表
  minRealm?: number                // 最低境界要求
  cooldown?: number                // 冷却时间（小时）
}

/**
 * 问道包问题
 */
export interface PathQuestion {
  question: string                 // 问题文本
  type: 'choice' | 'open'          // 题目类型
  options?: PathQuestionOption[]   // 选项（选择题）
  placeholder?: string             // 占位符（开放题）
  dimensionHints?: string[]        // 该题重点考察的维度（提示AI）
}

/**
 * 问题选项
 */
export interface PathQuestionOption {
  letter: string      // 选项字母 (A/B/C/D)
  text: string        // 选项文本
  hint?: string       // 维度倾向提示（给AI参考）
}

/**
 * 所有问道包配置
 */
export const PATH_PACKAGES: PathPackageDefinition[] = [
  // ===== 1. 步入仙途（经典路径）=====
  {
    id: 'initiation_tianwen',
    type: PathPackageType.INITIATION,
    name: '天问之路',
    description: '考察修士的基本道德观和性格倾向',
    theme: '这是踏入仙途的第一步，天道将通过问心了解你的本质',
    focusDimensions: [
      { dimension: 'compassion', weight: 1.5, description: '同情心' },
      { dimension: 'righteousness', weight: 1.5, description: '正义感' },
      { dimension: 'courage', weight: 1.3, description: '勇气' },
      { dimension: 'wisdom', weight: 1.2, description: '智慧' },
      { dimension: 'greed', weight: -1.5, description: '贪婪（负面）' },
      { dimension: 'manipulation', weight: -1.5, description: '操控（负面）' }
    ],
    questions: [
      {
        question: '你在修仙路上遇到一位垂危的修士，他身旁有一件宝物。此时你会？',
        type: 'choice',
        options: [
          { letter: 'A', text: '全力救治，不顾宝物', hint: 'compassion+4, righteousness+3' },
          { letter: 'B', text: '先救人，希望日后得到回报', hint: 'pragmatism+3, compassion+2' },
          { letter: 'C', text: '权衡利弊后再决定', hint: 'wisdom+3, pragmatism+3' },
          { letter: 'D', text: '夺宝而去', hint: 'greed+5, ruthlessness+4' }
        ],
        dimensionHints: ['compassion', 'righteousness', 'greed', 'ruthlessness', 'pragmatism']
      },
      {
        question: '一个比你强大得多的修士向你发起挑战，你会？',
        type: 'choice',
        options: [
          { letter: 'A', text: '正面迎战，虽千万人吾往矣', hint: 'courage+5, determination+3' },
          { letter: 'B', text: '智谋借力，寻求他人相助', hint: 'wisdom+4, social_oriented+3' },
          { letter: 'C', text: '隐忍蓄势，待实力足够再战', hint: 'patience+5, discipline+3' },
          { letter: 'D', text: '审时度势，能战则战，不能则避', hint: 'wisdom+4, adaptability+3' }
        ],
        dimensionHints: ['courage', 'wisdom', 'patience', 'determination', 'adaptability']
      },
      {
        question: '请描述你的修仙志向，或是你最看重的品质。',
        type: 'open',
        placeholder: '例如：我想守护众生...',
        dimensionHints: ['所有维度（AI自由分析）']
      }
    ]
  },

  // ===== 2. 心魔试炼 =====
  {
    id: 'inner_demon_trial',
    type: PathPackageType.INNER_DEMON,
    name: '心魔试炼',
    description: '直面内心深处的欲望和恐惧',
    theme: '修炼到达瓶颈时，必须克服心魔。这道关卡将考验你的内心',
    focusDimensions: [
      { dimension: 'discipline', weight: 1.8, description: '自律' },
      { dimension: 'determination', weight: 1.5, description: '决断力' },
      { dimension: 'greed', weight: -1.8, description: '贪婪（负面）' },
      { dimension: 'ruthlessness', weight: -1.5, description: '冷酷（负面）' },
      { dimension: 'selflessness', weight: 1.3, description: '无私' }
    ],
    questions: [
      {
        question: '你在幻境中看到了无尽的财富和力量，只需踏过你最亲之人的尸体即可获得。你会？',
        type: 'choice',
        options: [
          { letter: 'A', text: '立刻拒绝，这是心魔的考验', hint: 'discipline+5, selflessness+4' },
          { letter: 'B', text: '犹豫良久，最终拒绝', hint: 'discipline+3, greed+2' },
          { letter: 'C', text: '尝试寻找两全其美的方法', hint: 'wisdom+4, creativity+3' },
          { letter: 'D', text: '毫不犹豫地踏过去', hint: 'ruthlessness+5, greed+5' }
        ],
        dimensionHints: ['discipline', 'selflessness', 'greed', 'ruthlessness', 'wisdom']
      },
      {
        question: '你的心魔化身为你最恨的人，嘲笑你的过往。你会？',
        type: 'choice',
        options: [
          { letter: 'A', text: '冷静分析，识破幻象', hint: 'wisdom+5, discipline+3' },
          { letter: 'B', text: '愤怒反击', hint: 'courage+3, impatience+4（注：impatience不在新系统）' },
          { letter: 'C', text: '尝试理解和原谅', hint: 'compassion+5, wisdom+3' },
          { letter: 'D', text: '转身离开，不予理会', hint: 'discipline+4, adaptability+2' }
        ],
        dimensionHints: ['wisdom', 'discipline', 'compassion', 'courage']
      },
      {
        question: '在这场心魔试炼中，你最害怕失去什么？为什么？',
        type: 'open',
        placeholder: '例如：我最害怕失去自我...',
        dimensionHints: ['selflessness', 'discipline', 'greed', 'manipulation']
      }
    ],
    minRealm: 3,  // 需要筑基境界
    cooldown: 168  // 7天冷却
  },

  // ===== 3. 机缘考验 =====
  {
    id: 'opportunity_test',
    type: PathPackageType.OPPORTUNITY,
    name: '机缘考验',
    description: '测试能否把握机遇、识破陷阱',
    theme: '修仙界机缘与危险并存，你的选择将决定命运',
    focusDimensions: [
      { dimension: 'wisdom', weight: 1.8, description: '智慧' },
      { dimension: 'adaptability', weight: 1.5, description: '适应力' },
      { dimension: 'creativity', weight: 1.3, description: '创造力' },
      { dimension: 'pragmatism', weight: 1.2, description: '务实' },
      { dimension: 'manipulation', weight: -1.5, description: '操控（负面）' }
    ],
    questions: [
      {
        question: '你发现一处无人秘境，但入口有强大禁制。你会？',
        type: 'choice',
        options: [
          { letter: 'A', text: '研究禁制，寻找破解之法', hint: 'wisdom+5, knowledge_seeking+4' },
          { letter: 'B', text: '强行破阵，直接进入', hint: 'courage+4, combat_oriented+3' },
          { letter: 'C', text: '先观察，等待其他修士来探路', hint: 'pragmatism+4, wisdom+2' },
          { letter: 'D', text: '放弃，寻找更安全的机缘', hint: 'patience+4, discipline+3' }
        ],
        dimensionHints: ['wisdom', 'courage', 'pragmatism', 'patience']
      },
      {
        question: '秘境中有三条道路：金光大道、幽暗小径、普通石路。你选择？',
        type: 'choice',
        options: [
          { letter: 'A', text: '金光大道，看起来最安全', hint: 'pragmatism+3, courage-1' },
          { letter: 'B', text: '幽暗小径，可能有隐藏宝藏', hint: 'creativity+4, ambition+3' },
          { letter: 'C', text: '普通石路，中庸之道', hint: 'balance_seeking+4, wisdom+2' },
          { letter: 'D', text: '都不走，自己开辟新路', hint: 'creativity+5, determination+4' }
        ],
        dimensionHints: ['creativity', 'wisdom', 'ambition', 'determination']
      },
      {
        question: '你认为什么样的机缘最适合你？为什么？',
        type: 'open',
        placeholder: '例如：我需要能提升战力的...',
        dimensionHints: ['所有修炼风格维度']
      }
    ],
    minRealm: 2,
    cooldown: 72  // 3天冷却
  },

  // ===== 4. 情义抉择 =====
  {
    id: 'bond_choice',
    type: PathPackageType.BOND,
    name: '情义抉择',
    description: '考验对友情、亲情、爱情的态度',
    theme: '修仙路漫长，情义是羁绊还是助力？',
    focusDimensions: [
      { dimension: 'loyalty', weight: 1.8, description: '忠诚' },
      { dimension: 'compassion', weight: 1.5, description: '同情心' },
      { dimension: 'selflessness', weight: 1.5, description: '无私' },
      { dimension: 'social_oriented', weight: 1.3, description: '社交型' },
      { dimension: 'ruthlessness', weight: -1.8, description: '冷酷（负面）' }
    ],
    questions: [
      {
        question: '你的挚友为救你身受重伤，但你必须立即闭关突破境界。你会？',
        type: 'choice',
        options: [
          { letter: 'A', text: '放弃突破，照顾挚友', hint: 'loyalty+5, compassion+4' },
          { letter: 'B', text: '先突破再救，实力更强才能更好保护他人', hint: 'pragmatism+4, determination+3' },
          { letter: 'C', text: '托付他人照顾，自己去突破', hint: 'social_oriented+3, pragmatism+2' },
          { letter: 'D', text: '挚友已无救，突破更重要', hint: 'ruthlessness+5, cultivation_focused+3' }
        ],
        dimensionHints: ['loyalty', 'compassion', 'ruthlessness', 'pragmatism']
      },
      {
        question: '宗门长老让你出卖同门以换取晋升机会，你会？',
        type: 'choice',
        options: [
          { letter: 'A', text: '断然拒绝', hint: 'loyalty+5, righteousness+4' },
          { letter: 'B', text: '假装答应，暗中告知同门', hint: 'wisdom+4, loyalty+4' },
          { letter: 'C', text: '考虑利弊，如果同门确有过错就答应', hint: 'pragmatism+4, righteousness+2' },
          { letter: 'D', text: '答应并执行', hint: 'ruthlessness+5, ambition+4' }
        ],
        dimensionHints: ['loyalty', 'righteousness', 'ruthlessness', 'wisdom']
      },
      {
        question: '在你心中，情义和力量哪个更重要？为什么？',
        type: 'open',
        placeholder: '例如：情义是我前进的动力...',
        dimensionHints: ['loyalty', 'compassion', 'selflessness', 'ruthlessness']
      }
    ],
    minRealm: 1,
    cooldown: 72
  },

  // ===== 5. 欲望试炼 =====
  {
    id: 'desire_trial',
    type: PathPackageType.DESIRE,
    name: '欲望试炼',
    description: '面对权力、财富、美色的诱惑',
    theme: '欲望是修炼的动力，还是堕落的深渊？',
    focusDimensions: [
      { dimension: 'discipline', weight: 1.8, description: '自律' },
      { dimension: 'ambition', weight: 1.5, description: '野心' },
      { dimension: 'greed', weight: -1.8, description: '贪婪（负面）' },
      { dimension: 'power_seeking', weight: 1.2, description: '求力型' },
      { dimension: 'balance_seeking', weight: 1.2, description: '平衡型' }
    ],
    questions: [
      {
        question: '你获得了一枚可以提升十年修为的丹药，但需要牺牲十年寿元。你会？',
        type: 'choice',
        options: [
          { letter: 'A', text: '立即服用，修为更重要', hint: 'power_seeking+5, determination+3' },
          { letter: 'B', text: '保存起来，等到必要时使用', hint: 'wisdom+4, discipline+3' },
          { letter: 'C', text: '卖掉换取其他资源', hint: 'pragmatism+4, wisdom+2' },
          { letter: 'D', text: '不要，寿元更珍贵', hint: 'patience+4, balance_seeking+3' }
        ],
        dimensionHints: ['power_seeking', 'wisdom', 'discipline', 'balance_seeking']
      },
      {
        question: '你有机会成为一方势力之主，但需要踏着无数人的尸骨。你会？',
        type: 'choice',
        options: [
          { letter: 'A', text: '坚决拒绝，这与我的道不符', hint: 'righteousness+5, selflessness+4' },
          { letter: 'B', text: '尝试寻找不伤人的方法', hint: 'wisdom+4, compassion+4' },
          { letter: 'C', text: '只要他们是恶人，我可以接受', hint: 'pragmatism+4, righteousness+2' },
          { letter: 'D', text: '成王败寇，这是修仙界的规则', hint: 'ruthlessness+5, power_seeking+5' }
        ],
        dimensionHints: ['righteousness', 'ruthlessness', 'power_seeking', 'wisdom']
      },
      {
        question: '你最渴望得到什么？为了它你愿意付出多少代价？',
        type: 'open',
        placeholder: '例如：我渴望力量，但不愿失去自我...',
        dimensionHints: ['ambition', 'greed', 'discipline', 'power_seeking']
      }
    ],
    minRealm: 2,
    cooldown: 72
  }
]

/**
 * 根据ID获取问道包
 */
export function getPathPackageById(id: string): PathPackageDefinition | null {
  return PATH_PACKAGES.find(p => p.id === id) || null
}

/**
 * 根据类型获取所有问道包
 */
export function getPathPackagesByType(type: PathPackageType): PathPackageDefinition[] {
  return PATH_PACKAGES.filter(p => p.type === type)
}

/**
 * 获取适合指定境界的问道包
 */
export function getAvailablePathPackages(realm: number): PathPackageDefinition[] {
  return PATH_PACKAGES.filter(p => !p.minRealm || realm >= p.minRealm)
}

/**
 * 随机选择一个问道包（步入仙途用）
 */
export function getRandomInitiationPath(): PathPackageDefinition | null {
  const initiationPaths = getPathPackagesByType(PathPackageType.INITIATION)
  if (initiationPaths.length === 0) return null
  return initiationPaths[Math.floor(Math.random() * initiationPaths.length)]
}
