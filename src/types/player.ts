/**
 * 玩家相关类型定义
 */

import { PlayerStatus } from '../config/constants'

// 玩家数据库模型
export interface Player {
  id: number                    // 自增主键
  userId: string                // QQ用户ID（平台ID）
  username: string              // 玩家道号

  // 境界相关
  realm: number                 // 大境界（0-8）
  realmLevel: number            // 小境界（0-3）
  cultivation: number           // 当前修为值
  cultivationMax: number        // 突破所需修为

  // 资源
  spiritStone: number           // 灵石

  // 属性
  spiritualRoot: number         // 灵根（1-100）
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

// 创建玩家时的输入
export interface CreatePlayerInput {
  userId: string
  username: string
}

// 玩家信息展示
export interface PlayerDisplayInfo {
  name: string
  realm: string
  cultivation: number
  cultivationMax: number
  spiritStone: number
  spiritualRoot: number
  combatPower: number
  createDate: string
}

// 服务层返回结果
export interface ServiceResult<T = void> {
  success: boolean
  data?: T
  message: string
}
