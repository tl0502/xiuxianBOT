import { Context } from 'koishi'
import { IDatabase, QueryOptions } from '../interfaces/IDatabase'

/**
 * Koishi Database 适配器
 * 将 Koishi 的 Database 包装为统一的 IDatabase 接口
 */
export class KoishiDatabase implements IDatabase {
  private ctx: Context

  constructor(ctx: Context) {
    this.ctx = ctx
  }

  async get<T = any>(
    table: string,
    query: Partial<T> | ((row: T) => boolean),
    _options?: QueryOptions  // TODO: 未实现查询选项，使用 _ 前缀避免警告
  ): Promise<T[]> {
    // 简化实现：直接使用 Koishi 的 database.get
    // 注意：Koishi 不支持函数查询和复杂选项，这里做简单适配
    if (typeof query === 'function') {
      // 函数查询：获取所有记录然后过滤
      const all = await this.ctx.database.get(table as any, {})
      return all.filter(query as any) as T[]
    }

    // 简单查询
    return this.ctx.database.get(table as any, query as any) as Promise<T[]>
  }

  async create<T = any>(table: string, data: Partial<T> | Partial<T>[]): Promise<T | T[]> {
    // 支持单个或批量创建
    if (Array.isArray(data)) {
      // 批量创建
      const results: T[] = []
      for (const item of data) {
        const created = await this.ctx.database.create(table as any, item as any)
        results.push(created as T)
      }
      return results
    } else {
      // 单个创建
      return this.ctx.database.create(table as any, data as any) as Promise<T>
    }
  }

  async set<T = any>(
    table: string,
    query: Partial<T> | ((row: T) => boolean),
    updates: Partial<T>
  ): Promise<void> {
    // Koishi 的 set 返回 void
    if (typeof query === 'function') {
      // 函数查询：先找到记录，然后逐个更新
      const all = await this.ctx.database.get(table as any, {})
      const toUpdate = all.filter(query as any)

      // 逐个更新
      for (const row of toUpdate) {
        await this.ctx.database.set(table as any, { id: (row as any).id }, updates as any)
      }
    } else {
      // 直接更新
      await this.ctx.database.set(table as any, query as any, updates as any)
    }
  }

  async remove<T = any>(
    table: string,
    query: Partial<T> | ((row: T) => boolean)
  ): Promise<T[]> {
    // 先查询要删除的记录
    const toRemove = await this.get(table, query)

    if (toRemove.length === 0) return []

    // 删除记录
    if (typeof query === 'function') {
      // 使用 ID 删除
      for (const row of toRemove) {
        await this.ctx.database.remove(table as any, { id: (row as any).id })
      }
    } else {
      // 直接删除
      await this.ctx.database.remove(table as any, query as any)
    }

    return toRemove
  }
}
