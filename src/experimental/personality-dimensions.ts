/**
 * ============================================================
 * 性格量化系统 v2.0 - 22维性格维度定义（实验性功能）
 * ============================================================
 *
 * 当前状态: 未启用（默认使用 v1.0 的 9 维系统）
 * 系统版本: v2.0 - 22维扩展性格系统
 *
 * 本文件定义了 v2.0 系统的 22 个性格维度，从 v1.0 的 9 维扩展而来。
 *
 * v2.0 性格维度分类:
 * - 核心特质 (10个): determination, courage, patience, wisdom, compassion,
 *                     ambition, loyalty, creativity, discipline, adaptability
 * - 道德倾向 (6个): righteousness, selflessness, pragmatism,
 *                   ruthlessness, greed, manipulation
 * - 修炼风格 (6个): combat_oriented, cultivation_focused, social_oriented,
 *                   knowledge_seeking, power_seeking, balance_seeking
 *
 * v1.0 vs v2.0 对比:
 * - v1.0: 9 维固定评分 + 关键词匹配
 * - v2.0: 22 维 AI 智能解析 + 多问道包系统
 *
 * v2.0 系统相关文件:
 * - src/experimental/personality-dimensions.ts（本文件）- 22维定义
 * - src/experimental/path-packages.ts - 多问道包配置
 * - src/config/personality-system-config.ts - 版本切换
 * - src/experimental/ai-personality-analyzer.ts - AI解析器
 * - src/experimental/extended-fate-calculator.ts - 扩展天命计算器
 *
 * 启用方法:
 * 在 src/index.ts 的 Config 中设置:
 *   personalitySystemVersion: 'v2.0'
 *
 * 注意事项:
 * - v2.0 系统未经过充分测试
 * - 所有题目都需要 AI 评估，成本较高
 * - 与 v1.0 数据结构不完全兼容
 *
 * 参考文档:
 * - .claude/性格量化系统v2升级方案.md
 * - .claude/性格量化解析详解.md
 *
 * ============================================================
 */

/**
 * 性格维度类别
 */
export enum PersonalityCategory {
  CORE_TRAITS = 'core_traits',           // 核心特质
  MORAL_ALIGNMENT = 'moral_alignment',   // 道德倾向
  CULTIVATION_STYLE = 'cultivation_style' // 修炼风格
}

/**
 * 性格维度定义
 */
export interface PersonalityDimension {
  key: string                  // 维度键名
  category: PersonalityCategory // 所属类别
  name: string                 // 中文名称
  description: string          // 详细描述
  positiveTraits: string[]     // 正面表现
  negativeTraits: string[]     // 负面表现
  oppositeOf?: string          // 对立维度（如有）
  relatedTo?: string[]         // 相关维度
}

/**
 * 完整的性格维度库
 */
export const PERSONALITY_DIMENSIONS: Record<string, PersonalityDimension> = {
  // ===== 核心特质 (10个) =====

  determination: {
    key: 'determination',
    category: PersonalityCategory.CORE_TRAITS,
    name: '决断力',
    description: '快速做出决定并付诸行动的能力',
    positiveTraits: ['果决', '干脆', '不拖延', '有主见'],
    negativeTraits: ['冲动', '莽撞', '不思后果'],
    oppositeOf: 'hesitation',
    relatedTo: ['courage', 'confidence']
  },

  courage: {
    key: 'courage',
    category: PersonalityCategory.CORE_TRAITS,
    name: '勇气',
    description: '面对危险和困难时的无畏精神',
    positiveTraits: ['勇敢', '无畏', '敢于挑战'],
    negativeTraits: ['鲁莽', '不计后果'],
    relatedTo: ['determination', 'confidence']
  },

  patience: {
    key: 'patience',
    category: PersonalityCategory.CORE_TRAITS,
    name: '耐心',
    description: '等待时机、持久坚持的能力',
    positiveTraits: ['有耐心', '能忍耐', '持之以恒'],
    negativeTraits: ['过于谨慎', '畏首畏尾'],
    oppositeOf: 'impatience',
    relatedTo: ['discipline', 'stability']
  },

  wisdom: {
    key: 'wisdom',
    category: PersonalityCategory.CORE_TRAITS,
    name: '智慧',
    description: '深刻理解事物本质的能力',
    positiveTraits: ['睿智', '通达', '洞察力强'],
    negativeTraits: ['过度思考', '优柔寡断'],
    relatedTo: ['knowledge_seeking', 'adaptability']
  },

  compassion: {
    key: 'compassion',
    category: PersonalityCategory.CORE_TRAITS,
    name: '同情心',
    description: '理解和关怀他人苦难的能力',
    positiveTraits: ['仁慈', '善良', '富有同情心'],
    negativeTraits: ['过于感性', '易被利用'],
    relatedTo: ['selflessness', 'righteousness']
  },

  ambition: {
    key: 'ambition',
    category: PersonalityCategory.CORE_TRAITS,
    name: '野心',
    description: '追求更高目标和成就的渴望',
    positiveTraits: ['有抱负', '进取', '追求卓越'],
    negativeTraits: ['贪心', '不择手段'],
    relatedTo: ['power_seeking', 'determination']
  },

  loyalty: {
    key: 'loyalty',
    category: PersonalityCategory.CORE_TRAITS,
    name: '忠诚',
    description: '对承诺和关系的坚守',
    positiveTraits: ['忠诚', '守信', '重情义'],
    negativeTraits: ['固执', '不知变通'],
    relatedTo: ['righteousness', 'discipline']
  },

  creativity: {
    key: 'creativity',
    category: PersonalityCategory.CORE_TRAITS,
    name: '创造力',
    description: '创新思维和打破常规的能力',
    positiveTraits: ['富有创意', '灵活', '独特'],
    negativeTraits: ['不守规矩', '难以控制'],
    relatedTo: ['adaptability', 'knowledge_seeking']
  },

  discipline: {
    key: 'discipline',
    category: PersonalityCategory.CORE_TRAITS,
    name: '自律',
    description: '自我约束和遵守规则的能力',
    positiveTraits: ['自律', '有规矩', '守纪律'],
    negativeTraits: ['死板', '缺乏灵活性'],
    relatedTo: ['patience', 'cultivation_focused']
  },

  adaptability: {
    key: 'adaptability',
    category: PersonalityCategory.CORE_TRAITS,
    name: '适应力',
    description: '应对变化和调整策略的能力',
    positiveTraits: ['灵活', '善变', '随机应变'],
    negativeTraits: ['缺乏原则', '摇摆不定'],
    relatedTo: ['wisdom', 'creativity']
  },

  // ===== 道德倾向 (6个) =====

  righteousness: {
    key: 'righteousness',
    category: PersonalityCategory.MORAL_ALIGNMENT,
    name: '正义',
    description: '维护公平和正义的倾向',
    positiveTraits: ['正直', '公正', '嫉恶如仇'],
    negativeTraits: ['过于理想化', '不知变通'],
    oppositeOf: 'ruthlessness',
    relatedTo: ['selflessness', 'compassion']
  },

  selflessness: {
    key: 'selflessness',
    category: PersonalityCategory.MORAL_ALIGNMENT,
    name: '无私',
    description: '为他人着想甚于自己的倾向',
    positiveTraits: ['无私', '奉献', '舍己为人'],
    negativeTraits: ['忽视自身', '易被利用'],
    oppositeOf: 'greed',
    relatedTo: ['compassion', 'righteousness']
  },

  pragmatism: {
    key: 'pragmatism',
    category: PersonalityCategory.MORAL_ALIGNMENT,
    name: '务实',
    description: '注重实际效果和利益的倾向',
    positiveTraits: ['现实', '理性', '讲求实效'],
    negativeTraits: ['功利', '缺乏理想'],
    relatedTo: ['wisdom', 'adaptability']
  },

  ruthlessness: {
    key: 'ruthlessness',
    category: PersonalityCategory.MORAL_ALIGNMENT,
    name: '冷酷',
    description: '为达目的不择手段的倾向',
    positiveTraits: ['果断', '不受感情影响', '有魄力'],
    negativeTraits: ['残忍', '无情', '冷血'],
    oppositeOf: 'righteousness',
    relatedTo: ['manipulation', 'ambition']
  },

  greed: {
    key: 'greed',
    category: PersonalityCategory.MORAL_ALIGNMENT,
    name: '贪婪',
    description: '过度追求物质和权力的倾向',
    positiveTraits: ['进取', '不满足现状'],
    negativeTraits: ['贪得无厌', '自私', '唯利是图'],
    oppositeOf: 'selflessness',
    relatedTo: ['ambition', 'power_seeking']
  },

  manipulation: {
    key: 'manipulation',
    category: PersonalityCategory.MORAL_ALIGNMENT,
    name: '操控',
    description: '通过欺骗和操纵达成目的的倾向',
    positiveTraits: ['谋略', '智计'],
    negativeTraits: ['狡诈', '不诚实', '阴险'],
    relatedTo: ['ruthlessness', 'greed']
  },

  // ===== 修炼风格 (6个) =====

  combat_oriented: {
    key: 'combat_oriented',
    category: PersonalityCategory.CULTIVATION_STYLE,
    name: '战斗型',
    description: '偏好通过战斗提升实力',
    positiveTraits: ['勇武', '善战', '实战经验丰富'],
    negativeTraits: ['好斗', '冲动'],
    relatedTo: ['courage', 'determination']
  },

  cultivation_focused: {
    key: 'cultivation_focused',
    category: PersonalityCategory.CULTIVATION_STYLE,
    name: '修炼型',
    description: '专注于静修和功法修炼',
    positiveTraits: ['专注', '沉稳', '根基扎实'],
    negativeTraits: ['缺乏实战', '理论派'],
    relatedTo: ['discipline', 'patience']
  },

  social_oriented: {
    key: 'social_oriented',
    category: PersonalityCategory.CULTIVATION_STYLE,
    name: '社交型',
    description: '善于建立人际关系和合作',
    positiveTraits: ['善于交际', '人脉广', '团队协作'],
    negativeTraits: ['依赖他人', '缺乏独立性'],
    relatedTo: ['compassion', 'loyalty']
  },

  knowledge_seeking: {
    key: 'knowledge_seeking',
    category: PersonalityCategory.CULTIVATION_STYLE,
    name: '求知型',
    description: '追求知识和真理',
    positiveTraits: ['博学', '好学', '求知欲强'],
    negativeTraits: ['书呆子', '缺乏实践'],
    relatedTo: ['wisdom', 'creativity']
  },

  power_seeking: {
    key: 'power_seeking',
    category: PersonalityCategory.CULTIVATION_STYLE,
    name: '求力型',
    description: '以力量为最高追求',
    positiveTraits: ['强大', '有威慑力'],
    negativeTraits: ['武力至上', '忽视其他'],
    relatedTo: ['ambition', 'combat_oriented']
  },

  balance_seeking: {
    key: 'balance_seeking',
    category: PersonalityCategory.CULTIVATION_STYLE,
    name: '平衡型',
    description: '追求各方面的均衡发展',
    positiveTraits: ['全面', '和谐', '中庸'],
    negativeTraits: ['样样通样样松', '缺乏特色'],
    relatedTo: ['wisdom', 'adaptability']
  }
}

/**
 * 扩展的性格评分
 * 每个维度 0-10 分
 */
export interface ExtendedPersonalityScore {
  // 核心特质
  determination: number
  courage: number
  patience: number
  wisdom: number
  compassion: number
  ambition: number
  loyalty: number
  creativity: number
  discipline: number
  adaptability: number

  // 道德倾向
  righteousness: number
  selflessness: number
  pragmatism: number
  ruthlessness: number
  greed: number
  manipulation: number

  // 修炼风格
  combat_oriented: number
  cultivation_focused: number
  social_oriented: number
  knowledge_seeking: number
  power_seeking: number
  balance_seeking: number

  // 添加索引签名以支持动态访问
  [key: string]: number
}

/**
 * 创建空的扩展性格评分
 */
export function createEmptyExtendedScore(): ExtendedPersonalityScore {
  return {
    determination: 0,
    courage: 0,
    patience: 0,
    wisdom: 0,
    compassion: 0,
    ambition: 0,
    loyalty: 0,
    creativity: 0,
    discipline: 0,
    adaptability: 0,
    righteousness: 0,
    selflessness: 0,
    pragmatism: 0,
    ruthlessness: 0,
    greed: 0,
    manipulation: 0,
    combat_oriented: 0,
    cultivation_focused: 0,
    social_oriented: 0,
    knowledge_seeking: 0,
    power_seeking: 0,
    balance_seeking: 0
  }
}

/**
 * 获取维度的详细信息
 */
export function getDimensionInfo(key: string): PersonalityDimension | null {
  return PERSONALITY_DIMENSIONS[key] || null
}

/**
 * 获取某个类别下的所有维度
 */
export function getDimensionsByCategory(category: PersonalityCategory): PersonalityDimension[] {
  return Object.values(PERSONALITY_DIMENSIONS).filter(dim => dim.category === category)
}

/**
 * 获取所有维度的键名列表
 */
export function getAllDimensionKeys(): string[] {
  return Object.keys(PERSONALITY_DIMENSIONS)
}
