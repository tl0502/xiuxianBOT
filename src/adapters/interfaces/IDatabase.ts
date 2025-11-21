/**
 * 数据库适配器接口
 * 用于抽象不同框架的数据库系统
 */
export interface IDatabase {
  /**
   * 查询记录
   * @param table 表名
   * @param query 查询条件
   * @param options 查询选项（如 limit, offset, orderBy）
   * @returns 匹配的记录数组
   */
  get<T = any>(
    table: string,
    query: Partial<T> | ((row: T) => boolean),
    options?: QueryOptions
  ): Promise<T[]>

  /**
   * 创建单个记录
   * @param table 表名
   * @param data 要创建的数据
   * @returns 创建的记录
   */
  create<T = any>(table: string, data: Partial<T>): Promise<T>

  /**
   * 批量创建记录
   * @param table 表名
   * @param dataList 要创建的数据数组
   * @returns 创建的记录数组
   */
  create<T = any>(table: string, dataList: Partial<T>[]): Promise<T[]>

  /**
   * 更新记录
   * @param table 表名
   * @param query 查询条件（定位要更新的记录）
   * @param updates 更新的字段
   */
  set<T = any>(
    table: string,
    query: Partial<T> | ((row: T) => boolean),
    updates: Partial<T>
  ): Promise<void>

  /**
   * 删除记录
   * @param table 表名
   * @param query 查询条件
   * @returns 删除的记录数组
   */
  remove<T = any>(
    table: string,
    query: Partial<T> | ((row: T) => boolean)
  ): Promise<T[]>
}

/**
 * 查询选项
 */
export interface QueryOptions {
  /** 限制返回记录数 */
  limit?: number
  /** 跳过记录数 */
  offset?: number
  /** 排序字段（Koishi 风格） */
  sort?: Record<string, 'asc' | 'desc'>
  /** 排序字段（通用风格） */
  orderBy?: {
    field: string
    order: 'asc' | 'desc'
  }[]
}
