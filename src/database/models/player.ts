import { Context } from 'koishi'
import { Player } from '../../types/player'
import { PlayerStatus, GameConfig } from '../../config/constants'
import { SpiritualRootType } from '../../config/spiritual-roots'

// 扩展数据库类型
declare module 'koishi' {
  interface Tables {
    xiuxian_player_v3: Player
  }
}

/**
 * 初始化玩家表
 */
export function initPlayerModel(ctx: Context) {
  ctx.model.extend('xiuxian_player_v3', {
    // 基础字段
    id: 'unsigned',
    userId: 'string',
    username: 'string',

    // 境界相关
    realm: { type: 'unsigned', initial: GameConfig.INITIAL_REALM },
    realmLevel: { type: 'unsigned', initial: GameConfig.INITIAL_REALM_LEVEL },
    cultivation: { type: 'unsigned', initial: GameConfig.INITIAL_CULTIVATION },
    cultivationMax: { type: 'unsigned', initial: 1000 },

    // 资源
    spiritStone: { type: 'unsigned', initial: GameConfig.INITIAL_SPIRIT_STONE },

    // 属性
    spiritualRoot: { type: 'string', initial: SpiritualRootType.PSEUDO }, // 当前灵根类型（可升级）
    initialSpiritualRoot: { type: 'string', initial: SpiritualRootType.PSEUDO }, // 初始灵根（不可变，用于统计）
    combatPower: { type: 'unsigned', initial: 0 },

    // 状态
    status: { type: 'string', initial: PlayerStatus.IDLE },
    statusEndTime: 'timestamp',

    // 宗门
    sectId: 'unsigned',
    sectContribution: { type: 'unsigned', initial: 0 },

    // 时间
    createTime: 'timestamp',
    lastActiveTime: 'timestamp',

    // 封禁状态（v0.9.2 新增）
    isBanned: { type: 'boolean', initial: false },
    banReason: 'string',
    bannedAt: 'timestamp',
    bannedUntil: 'timestamp',  // null = 永久封禁

    // 统计
    totalCombatWin: { type: 'unsigned', initial: 0 },
    totalCombatLose: { type: 'unsigned', initial: 0 },
  }, {
    primary: 'id',
    autoInc: true,
    unique: ['userId'],
  })
}
