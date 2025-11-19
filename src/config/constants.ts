/**
 * 游戏常量配置
 */

// 境界配置
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

// 境界等级（小境界）
export const REALM_LEVELS = [
  { id: 0, name: '初期' },
  { id: 1, name: '中期' },
  { id: 2, name: '后期' },
  { id: 3, name: '大圆满' },
] as const

// 玩家状态
export enum PlayerStatus {
  IDLE = 'idle',              // 空闲
  CULTIVATING = 'cultivating', // 修炼中
  COMBAT = 'combat',           // 战斗中
}

// 物品类型
export enum ItemType {
  PILL = 'pill',           // 丹药
  SKILL = 'skill',         // 功法
  EQUIPMENT = 'equipment', // 装备
  TREASURE = 'treasure',   // 法宝
  MATERIAL = 'material',   // 材料
}

// 物品稀有度
export enum ItemRarity {
  COMMON = 1,    // 普通（白）
  UNCOMMON = 2,  // 优秀（绿）
  RARE = 3,      // 稀有（蓝）
  EPIC = 4,      // 史诗��紫）
  LEGENDARY = 5, // 传说（橙）
}

// 游戏参数
export const GameConfig = {
  // 初始属性
  INITIAL_SPIRIT_STONE: 100,        // 初始灵石
  INITIAL_CULTIVATION: 0,            // 初始修为
  INITIAL_REALM: 0,                  // 初始境界
  INITIAL_REALM_LEVEL: 0,            // 初始境界等级

  // 灵根范围
  MIN_SPIRITUAL_ROOT: 1,             // 最低灵根
  MAX_SPIRITUAL_ROOT: 100,           // 最高灵根

  // 修炼参数
  CULTIVATION_BASE_SPEED: 10,        // 基础修炼速度（每小时）
  CULTIVATION_SPIRITUAL_ROOT_MULTIPLIER: 0.5, // 灵根加成系数

  // 突破参数
  BREAKTHROUGH_BASE_RATE: 0.5,       // 基础突破成功率
  BREAKTHROUGH_SPIRITUAL_ROOT_BONUS: 0.003, // 灵根对突破的加成

  // 冷却时间（毫秒）
  COOLDOWN_MEDITATION: 60 * 1000,    // 打坐冷却：1分钟
  COOLDOWN_BREAKTHROUGH: 300 * 1000, // 突破冷却：5分钟
  COOLDOWN_COMBAT: 30 * 1000,        // 战斗冷却：30秒
} as const
