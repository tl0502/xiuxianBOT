import { Context } from 'koishi'

// 数据库表接口定义
export interface Player {
  id: number              // 自增主键
  userId: string          // QQ用户ID（平台ID）
  username: string        // 玩家名字（QQ昵称）
  createTime: Date        // 创建时间
}

// 扩展数据库类型
declare module 'koishi' {
  interface Tables {
    xiuxian_player: Player
  }
}

/**
 * 初始化数据库表
 */
export function initDatabase(ctx: Context) {
  // 扩展数据库表
  ctx.model.extend('xiuxian_player', {
    id: 'unsigned',
    userId: 'string',
    username: 'string',
    createTime: 'timestamp',
  }, {
    primary: 'id',
    autoInc: true,
    unique: ['userId'], // userId唯一，一个QQ号只能创建一个角色
  })
}
