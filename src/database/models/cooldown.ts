import { Context } from 'koishi'
import { CooldownRecord } from '../../types/cooldown'

// 扩展数据库类型
declare module 'koishi' {
  interface Tables {
    xiuxian_cooldown_v3: CooldownRecord
  }
}

/**
 * 初始化冷却表
 * v1.2.0 新增：通用冷却系统
 */
export function initCooldownModel(ctx: Context) {
  ctx.model.extend('xiuxian_cooldown_v3', {
    id: 'unsigned',
    userId: 'string',
    cooldownType: 'string',
    cooldownKey: 'string',
    lastTriggerTime: 'timestamp',
    expiresAt: 'timestamp',
    metadata: { type: 'text', initial: '{}' }
  }, {
    primary: 'id',
    autoInc: true
  })

  // 添加索引
  ctx.model.extend('xiuxian_cooldown_v3', {}, {
    unique: [['userId', 'cooldownType', 'cooldownKey']],  // 组合唯一索引
    indexes: [['expiresAt']]  // 用于清理过期记录
  })

  ctx.logger('xiuxian').info('冷却表模型已初始化')
}
