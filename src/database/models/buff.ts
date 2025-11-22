/**
 * Buff数据库模型
 *
 * v1.0.0 新增
 * 定义buff表结构和数据库扩展
 */

import { Context } from 'koishi'
import { Buff } from '../../types/buff'

declare module 'koishi' {
  interface Tables {
    xiuxian_buff_v3: Buff
  }
}

/**
 * 初始化Buff数据库模型
 */
export function initBuffModel(ctx: Context) {
  ctx.model.extend('xiuxian_buff_v3', {
    // 主键
    id: 'unsigned',

    // 基础信息
    userId: 'string',
    buffType: 'string',
    buffSource: 'string',
    sourceId: 'string',

    // 加成数值
    value: 'double',
    isMultiplier: 'boolean',

    // 时效性
    startTime: 'timestamp',
    endTime: 'timestamp',

    // 叠加规则
    stackable: { type: 'boolean', initial: false },
    maxStacks: 'unsigned',

    // 描述
    description: 'text',

    // 时间戳
    createTime: 'timestamp'
  }, {
    primary: 'id',
    autoInc: true
  })

  // 添加索引优化查询性能
  ctx.model.extend('xiuxian_buff_v3', {}, {
    unique: [],
    indexes: [
      // 按用户查询
      ['userId'],
      // 按用户和类型查询（最常用）
      ['userId', 'buffType'],
      // 按过期时间查询（定时清理）
      ['endTime']
    ]
  })

  ctx.logger('xiuxian').info('Buff数据库模型已初始化')
}
