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

  // 统计
  totalCombatWin: number        // 总胜场
  totalCombatLose: number       // 总败场
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
