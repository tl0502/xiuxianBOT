/**
 * 问道包数据库类型定义
 * v1.1.0 新增：问道包信息建表
 */

/**
 * 问道包数据库记录
 * 用于运行时动态管理和查询优化
 */
export interface PathPackageDB {
  id: number                      // 自增主键
  packageId: string               // 问道包ID（唯一）
  packageName: string             // 包名称
  tags: string                    // 标签（JSON数组）
  enabled: boolean                // 是否启用

  // 触发条件（JSON存储）
  triggerConditions: string       // 完整触发条件（JSON）
  triggerChance: number           // 基础触发概率

  // 统计字段
  totalTriggered: number          // 总触发次数
  totalCompleted: number          // 总完成次数

  // 管理字段
  registeredAt: Date              // 注册时间戳
  lastModified: Date              // 最后修改时间
  remark: string                  // 备注说明
}
