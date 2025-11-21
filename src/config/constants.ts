/**
 * 游戏常量配置
 *
 * v0.9.2 更新：
 * - 删除未使用的物品系统常量（ItemType, ItemRarity）
 * - 删除过时的灵根常量（已迁移到 spiritual-root-registry.ts）
 * - 删除过时的冷却常量（已迁移到问道包配置）
 * - 新增战斗系统常量
 * - 新增修为系统常量
 * - 新增AI评分系统常量
 * - 新增封禁系统常量
 */

// ========================================
// 境界系统配置
// ========================================

/**
 * 境界配置（9个大境界）
 * 每个境界包含4个小境界：初期、中期、后期、大圆满
 */
export const REALMS = [
  { id: 0, name: '练气', maxCultivation: 1000 },
  { id: 1, name: '筑基', maxCultivation: 5000 },
  { id: 2, name: '金丹', maxCultivation: 20000 },
  { id: 3, name: '元婴', maxCultivation: 100000 },
  { id: 4, name: '化神', maxCultivation: 500000 },
  { id: 5, name: '炼虚', maxCultivation: 2000000 },
  { id: 6, name: '合体', maxCultivation: 10000000 },
  { id: 7, name: '渡劫', maxCultivation: 50000000 },
  { id: 8, name: '大乘', maxCultivation: 999999999 },
] as const

/**
 * 境界等级（小境界）
 */
export const REALM_LEVELS = [
  { id: 0, name: '初期' },
  { id: 1, name: '中期' },
  { id: 2, name: '后期' },
  { id: 3, name: '大圆满' },
] as const

// ========================================
// 玩家状态枚举
// ========================================

/**
 * 玩家状态
 */
export enum PlayerStatus {
  IDLE = 'idle',              // 空闲
  CULTIVATING = 'cultivating', // 修炼中
  COMBAT = 'combat',           // 战斗中
  // 未来扩展：EXPLORING, TRADING, etc.
}

// ========================================
// 游戏核心参数
// ========================================

/**
 * 游戏核心参数配置
 */
export const GameConfig = {
  // ========== 初始属性 ==========
  INITIAL_SPIRIT_STONE: 100,        // 初始灵石
  INITIAL_CULTIVATION: 0,           // 初始修为
  INITIAL_CULTIVATION_MAX: 250,     // 初始修为上限（练气初期）
  INITIAL_REALM: 0,                 // 初始境界（练气期）
  INITIAL_REALM_LEVEL: 0,           // 初始境界等级（初期）

  // ========== 修炼系统 ==========
  CULTIVATION_BASE_SPEED: 10,       // 基础修炼速度（每小时）
  CULTIVATION_SPIRITUAL_ROOT_MULTIPLIER: 0.5, // 灵根加成系数（已废弃，改用注册表）

  // ========== 突破系统 ==========
  BREAKTHROUGH_BASE_RATE: 0.5,      // 基础突破成功率（50%）

  // ========== 封禁系统 ==========
  BAN_CHECK_COMMANDS: [             // 需要检查封禁状态的命令
    '修仙.步入仙途',
    '修仙.打坐',
    '修仙.突破',
    '修仙.问心',
  ],
  PERMANENT_BAN_DURATION: null,     // 永久封禁的标识（bannedUntil为null）
} as const

// ========================================
// 修为计算系统
// ========================================

/**
 * 修为计算相关常量
 *
 * 📌 配置优先级说明：
 * - 全局统一配置，不支持单独自定义
 * - 所有修为分配和突破判定都使用这些参数
 *
 * 🔧 修改方法：
 * - 直接修改此处的 CultivationConfig 常量
 * - 修改后需要重新编译插件
 *
 * 📝 修为分配算法：
 * 小境界修为 = 前一境界上限 + (当前境界总修为 - 前一境界上限) * 比例
 *
 * 💡 示例（练气期）：
 * - 练气初期：0 -> 250 (0 + 1000 * 0.25)
 * - 练气中期：250 -> 500 (0 + 1000 * 0.5)
 * - 练气后期：500 -> 750 (0 + 1000 * 0.75)
 * - 练气大圆满：750 -> 1000 (0 + 1000 * 1.0)
 *
 * ⚠️ 注意事项：
 * - REALM_LEVEL_COUNT 应与 REALM_LEVELS 数组长度一致（默认4）
 * - 修改这些值会影响修炼速度和境界划分
 */
export const CultivationConfig = {
  /** 每个大境界的小境界数量 */
  REALM_LEVEL_COUNT: 4,

  /** 每个小境界占总修为的比例 */
  CULTIVATION_DIVISION_RATIO: 0.25,

  /**
   * 修为分配算法：
   * 小境界修为 = 前一境界上限 + (当前境界总修为 - 前一境界上限) * 比例
   *
   * 示例（练气期）：
   * - 练气初期：0 -> 250 (0 + 1000 * 0.25)
   * - 练气中期：250 -> 500 (0 + 1000 * 0.5)
   * - 练气后期：500 -> 750 (0 + 1000 * 0.75)
   * - 练气大圆满：750 -> 1000 (0 + 1000 * 1.0)
   */
} as const

// ========================================
// 战斗系统
// ========================================

/**
 * 战斗计算相关常量
 *
 * 📌 配置优先级说明：
 * - 全局统一配置，不支持单独自定义
 * - 所有战力计算都使用这些系数
 *
 * 🔧 修改方法：
 * - 直接修改此处的 CombatConfig 常量
 * - 修改后需要重新编译插件
 *
 * 📝 战力计算公式：
 * basePower = realm * REALM_MULTIPLIER + realmLevel * LEVEL_MULTIPLIER
 * finalPower = basePower * (1 + 灵根战力加成)
 *
 * 💡 示例：
 * - 练气初期（0, 0）+ 伪灵根（0%）= 0
 * - 练气大圆满（0, 3）+ 伪灵根（0%）= 600
 * - 筑基初期（1, 0）+ 气灵根（20%）= 1200
 * - 筑基大圆满（1, 3）+ 光灵根（30%）= 2080
 *
 * ⚠️ 注意事项：
 * - 修改这些值会影响游戏平衡性
 * - 建议保持合理的境界差距倍率
 */
export const CombatConfig = {
  /** 境界对战力的影响系数 */
  REALM_MULTIPLIER: 1000,

  /** 小境界对战力的影响系数 */
  LEVEL_MULTIPLIER: 200,

  /**
   * 战力计算公式：
   * basePower = realm * 1000 + realmLevel * 200
   * finalPower = basePower * (1 + 灵根战力加成)
   *
   * 示例：
   * - 练气初期（0, 0）+ 伪灵根（0%）= 0
   * - 练气大圆满（0, 3）+ 伪灵根（0%）= 600
   * - 筑基初期（1, 0）+ 气灵根（20%）= 1200
   * - 筑基大圆满（1, 3）+ 光灵根（30%）= 2080
   */
} as const

// ========================================
// 性格量化系统
// ========================================

/**
 * 性格量化系统常量（v1.0 - 9维系统）
 */
export const PersonalityConfig = {
  // ========== v1.0 系统参数 ==========
  /** 9维性格列表 */
  DIMENSIONS_V1: [
    'determination',  // 决断力
    'courage',        // 勇气
    'stability',      // 稳定性
    'focus',          // 专注力
    'honesty',        // 诚实
    'kindness',       // 善良
    'greed',          // 贪念
    'impatience',     // 急躁
    'manipulation',   // 操控
  ] as const,

  /** 每个维度的评分范围 */
  MIN_SCORE: 0,
  MAX_SCORE: 10,

  /** 性格特征显著阈值 */
  POSITIVE_TRAIT_THRESHOLD: 5,  // 正面特征>=5才显著
  NEGATIVE_TRAIT_THRESHOLD: 3,  // 负面特征>=3就显著

  // ========== v2.0 系统参数（实验性，未启用）==========
  /** 22维性格系统（未来扩展） */
  DIMENSIONS_V2_COUNT: 22,

  /** v2.0 系统配置 */
  V2_AI_TIMEOUT_SECONDS: 10,    // AI分析超时时间
  V2_FALLBACK_TO_V1: true,      // 失败时降级到v1.0
} as const

// ========================================
// AI评分系统
// ========================================

/**
 * AI评分系统常量
 *
 * 📌 配置优先级说明：
 * 1. 问道包自定义配置（PathPackageTemplate.scoringWeights）> 2. 全局默认配置（AIConfig）
 * 3. 代码内硬编码fallback
 *
 * 🔧 自定义方法：
 * - 全局修改：直接修改此处的 AIConfig 常量（影响所有问道包）
 * - 问道包单独配置：在问道包定义中设置 scoringWeights 字段（仅影响该问道包）
 *
 * 📝 验证方法：
 * - 查看日志输出或问道包评分结果
 * - 问道包自定义权重会覆盖全局默认值
 *
 * 💡 示例：
 * const enlightenmentPackage: PathPackageTemplate = {
 *   ...
 *   scoringWeights: { choiceWeight: 0.2, openWeight: 0.8 }  // 该包使用自定义权重
 * }
 */
export const AIConfig = {
  // ========== 评分参数 ==========
  /** 每个维度的最大评分 */
  MAX_SCORE_PER_DIMENSION: 8,

  /** 每个维度的最小评分 */
  MIN_SCORE_PER_DIMENSION: -3,

  /** 选择题权重 */
  CHOICE_QUESTION_WEIGHT: 0.3,

  /** 开放题权重 */
  OPEN_QUESTION_WEIGHT: 0.7,

  // ========== 步入仙途AI配置 ==========
  /** 步入仙途AI生成超时（秒） */
  INITIATION_AI_TIMEOUT: 30,

  /** 步入仙途AI评分超时（秒） */
  INITIATION_SCORING_TIMEOUT: 15,

  // ========== 问道包AI配置 ==========
  /** 问道包AI评分超时（秒） */
  PACKAGE_SCORING_TIMEOUT: 15,

  /** 问道包AI评语超时（秒） */
  PACKAGE_EVALUATION_TIMEOUT: 20,

  // ========== 降级配置 ==========
  /** AI失败时是否自动降级（默认值） */
  DEFAULT_FALLBACK_ENABLED: false,  // 防作弊，默认不降级

  /** 步入仙途AI失败降级（推荐开启，保证流程） */
  INITIATION_FALLBACK_ENABLED: true,
} as const

// ========================================
// 灵根系统（注：详细配置已迁移到 spiritual-root-registry.ts）
// ========================================

/**
 * 灵根系统常量
 *
 * 注意：具体的灵根配置（概率、加成、性格匹配）已迁移到：
 * - src/config/spiritual-root-registry.ts - 灵根注册表
 * - src/config/fate-distribution.ts - 天命分布配置
 *
 * 📌 配置优先级说明：
 * - 这些常量是全局统一配置，不支持单独自定义
 * - 所有灵根抽取和统计平衡都使用这些参数
 *
 * 🔧 修改方法：
 * - 直接修改此处的 SpiritualRootConfig 常量
 * - 修改后需要重新编译插件
 *
 * ⚠️ 注意事项：
 * - 修改这些值会影响灵根抽取的公平性
 * - 建议在充分测试后再修改
 * - MAX_PERSONALITY_INCREASE/DECREASE 影响性格对灵根概率的影响范围
 * - STATISTICAL_BALANCE_THRESHOLD 决定何时启用统计平衡
 * - STATISTICAL_BALANCE_MAX_ADJUSTMENT 控制统计平衡的调整力度
 */
export const SpiritualRootConfig = {
  /** 天命调整范围：性格匹配最大增加 */
  MAX_PERSONALITY_INCREASE: 0.08,  // 8%

  /** 天命调整范围：性格不匹配最大减少 */
  MAX_PERSONALITY_DECREASE: 0.10,  // 10%

  /** 统计平衡启动阈值（玩家数量） */
  STATISTICAL_BALANCE_THRESHOLD: 100,

  /** 统计平衡调整范围 */
  STATISTICAL_BALANCE_MAX_ADJUSTMENT: 0.05,  // ±5%

  /** 灵根总数（包括隐藏灵根） */
  TOTAL_ROOT_TYPES: 10,  // 1伪 + 5五行 + 1气 + 2天(光暗) + 1隐藏(哈)
} as const

// ========================================
// 问道包系统（注：详细配置在各问道包定义文件中）
// ========================================

/**
 * 问道包系统常量
 *
 * 📌 配置优先级说明：
 * - 这些常量定义全局默认阈值
 * - 不支持单独自定义，所有问道包共用这些阈值
 *
 * 🔧 修改方法：
 * - 直接修改此处的 PathPackageConfig 常量
 * - 修改后需要重新编译插件
 *
 * 📝 使用说明：
 * - PERFECT_MATCH_THRESHOLD: 匹配度达到此值判定为"完美契合"
 * - GOOD_MATCH_THRESHOLD: 匹配度达到此值判定为"良好匹配"
 * - MATCH_SCORE_MIN/MAX: 性格匹配分数的取值范围（用于灵根和问道包）
 * - SESSION_TIMEOUT_MINUTES: 问心会话超时时间
 *
 * ⚠️ 注意事项：
 * - 修改阈值会影响所有问道包的奖励判定
 * - 建议保持 GOOD < PERFECT 的关系
 */
export const PathPackageConfig = {
  /** 问道包类型数量 */
  PACKAGE_TYPE_COUNT: 8,  // initiation, trial, opportunity, enlightenment, demon, exploration, bond, desire

  /** 匹配度分级阈值 */
  PERFECT_MATCH_THRESHOLD: 0.8,   // >=80% 完美契合
  GOOD_MATCH_THRESHOLD: 0.6,      // >=60% 良好匹配
  // <60% 普通匹配

  /** 性格匹配计算参数 */
  MATCH_SCORE_MIN: -10,           // 性格匹配最低分
  MATCH_SCORE_MAX: 10,            // 性格匹配最高分

  /** 问心会话超时（分钟） */
  SESSION_TIMEOUT_MINUTES: 30,
} as const

// ========================================
// 开发者工具常量
// ========================================

/**
 * 开发者工具常量
 */
export const DevConfig = {
  /** 测试灵根分配的最大次数 */
  MAX_TEST_COUNT: 1000,

  /** 测试灵根分配的默认次数 */
  DEFAULT_TEST_COUNT: 100,
} as const

// ========================================
// 类型导出（便于其他模块使用）
// ========================================

export type RealmInfo = typeof REALMS[number]
export type RealmLevelInfo = typeof REALM_LEVELS[number]
export type PersonalityDimensionV1 = typeof PersonalityConfig.DIMENSIONS_V1[number]
