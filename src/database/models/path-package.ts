/**
 * 问道包数据库模型
 *
 * v1.1.0 新增
 * 定义问道包管理表结构和数据库扩展
 */

import { Context } from 'koishi'
import { PathPackageDB } from '../../types/path-package-db'

declare module 'koishi' {
  interface Tables {
    xiuxian_path_packages_v3: PathPackageDB
  }
}

/**
 * 初始化问道包数据库模型
 */
export function initPathPackageModel(ctx: Context) {
  ctx.model.extend('xiuxian_path_packages_v3', {
    // 主键
    id: 'unsigned',

    // 基础信息
    packageId: 'string',
    packageName: 'string',
    tags: 'text',                   // JSON数组
    enabled: { type: 'boolean', initial: true },

    // 触发条件
    triggerConditions: 'text',      // JSON对象
    triggerChance: { type: 'double', initial: 1.0 },

    // 统计字段
    totalTriggered: { type: 'unsigned', initial: 0 },
    totalCompleted: { type: 'unsigned', initial: 0 },

    // 管理字段
    registeredAt: 'timestamp',
    lastModified: 'timestamp',
    remark: { type: 'text', initial: '' }
  }, {
    primary: 'id',
    autoInc: true
  })

  // 添加索引优化查询性能
  ctx.model.extend('xiuxian_path_packages_v3', {}, {
    unique: [['packageId']],  // packageId唯一
    indexes: [
      // 按启用状态查询
      ['enabled'],
      // 按包ID查询（最常用）
      ['packageId']
    ]
  })

  ctx.logger('xiuxian').info('问道包数据库模型已初始化')
}
