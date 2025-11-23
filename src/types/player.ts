/**
 * 玩家相关类型定义
 */

import { PlayerStatus } from '../config/constants'
import { SpiritualRootType } from '../config/spiritual-roots'

// 玩家数据库模型
export interface Player {
  id: number                    // 自增主键
  userId: string                // QQ用户ID（平台ID）
  username: string              // 玩家道号（AI分配）

  // 境界相关
  realm: number                 // 大境界（0-8）
  realmLevel: number            // 小境界（0-3）
  cultivation: number           // 当前修为值
  cultivationMax: number        // 突破所需修为

  // 资源
  spiritStone: number           // 灵石

  // 属性
  spiritualRoot: string         // 当前灵根类型（可升级）
  initialSpiritualRoot: string  // 初始灵根（不可变，用于统计）
  combatPower: number           // 战力

  // 状态
  status: PlayerStatus          // 当前状态
  statusEndTime: Date | null    // 状态结束时间

  // 宗门
  sectId: number | null         // 所属宗门ID
  sectContribution: number      // 宗门贡献

  // 时间
  createTime: Date              // 创建时间
  lastActiveTime: Date          // 最后活跃时间

  /**
   * @deprecated v1.2.0 已废弃：改用通用冷却系统（xiuxian_cooldown_v3表）
   * 保留字段用于向后兼容，不再更新
   */
  lastQuestioningTime?: Date    // v1.1.0 新增：最后一次完成问道守心的时间

  // 封禁状态（v0.9.2 新增）
  isBanned: boolean             // 是否封禁
  banReason?: string            // 封禁原因
  bannedAt?: Date               // 封禁时间
  bannedUntil?: Date            // 封禁截止（null = 永久）

  // 统计
  totalCombatWin: number        // 总胜场
  totalCombatLose: number       // 总败场

  // ========== 永久加成字段（v1.0.0 新增 - Buff系统）==========
  /**
   * 永久修炼速度加成（倍率）
   * - 默认值：0
   * - 示例：0.1 表示永久 +10% 修炼速度
   * - 来源：装备、永久性物品、特殊奖励等
   */
  permanentCultivationBonus?: number

  /**
   * 永久突破率加成（固定值）
   * - 默认值：0
   * - 示例：0.05 表示永久 +5% 突破成功率
   * - 来源：装备、永久性物品、特殊奖励等
   */
  permanentBreakthroughBonus?: number

  /**
   * 永久修为需求倍率（可正可负）
   * - 默认值：0
   * - 示例：-0.1 表示永久减少10%修为需求，0.2 表示永久增加20%修为需求
   * - 来源：装备、事件、特殊状态等
   */
  permanentCultivationRequirement?: number

  /**
   * 永久战力加成（倍率）【预留】
   * - 默认值：0
   * - 示例：0.2 表示永久 +20% 战力
   * - 来源：装备、永久性物品等
   */
  permanentCombatPowerBonus?: number

  /**
   * 永久灵石收益加成（倍率）【预留】
   * - 默认值：0
   * - 示例：0.15 表示永久 +15% 灵石收益
   * - 来源：装备、宗门福利等
   */
  permanentSpiritStoneGainBonus?: number
}

// 创建玩家时的输入（由 AI 生成）
export interface CreatePlayerInput {
  userId: string
  username: string              // AI 分配的道号
  spiritualRoot: SpiritualRootType  // AI 分配的灵根
}

// 玩家信息展示
export interface PlayerDisplayInfo {
  name: string
  realm: string
  cultivation: number
  cultivationMax: number
  spiritStone: number
  spiritualRoot: string         // 灵根显示名称
  spiritualRootDesc: string     // 灵根描述
  combatPower: number
  createDate: string
}

// 服务层返回结果
export interface ServiceResult<T = void> {
  success: boolean
  data?: T
  message: string
}
