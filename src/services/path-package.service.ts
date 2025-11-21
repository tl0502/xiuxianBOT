/**
 * 问道包管理服务 - 处理Tag注册、查询和随机选择
 *
 * 注意：此服务已解耦 Koishi 框架，依赖 IAppContext 接口
 */

import { IAppContext } from '../adapters/interfaces'
import {
  PathPackageTemplate,
  PathPackageTag,
  PackageRegistryEntry,
  TagQueryOptions,
  TriggerConditions
} from '../types/path-package'

/**
 * 问道包管理服务
 */
export class PathPackageService {
  // 问道包注册表
  private registry: Map<string, PackageRegistryEntry> = new Map()

  // Tag索引（加速查询）
  private tagIndex: Map<PathPackageTag, Set<string>> = new Map()

  constructor(private context: IAppContext) {}

  /**
   * 注册问道包
   */
  register(pkg: PathPackageTemplate, enabled: boolean = true): void {
    // 检查ID唯一性
    if (this.registry.has(pkg.id)) {
      this.context.logger.warn(`问道包 ${pkg.id} 已存在，将被覆盖`)
    }

    // 注册到主表
    this.registry.set(pkg.id, {
      package: pkg,
      registeredAt: new Date(),
      enabled
    })

    // 更新Tag索引
    for (const tag of pkg.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set())
      }
      this.tagIndex.get(tag)!.add(pkg.id)
    }

    this.context.logger.info(`注册问道包：${pkg.name} [${pkg.tags.join(', ')}]`)
  }

  /**
   * 批量注册问道包
   */
  registerAll(packages: PathPackageTemplate[]): void {
    for (const pkg of packages) {
      this.register(pkg)
    }
  }

  /**
   * 注销问道包
   */
  unregister(packageId: string): boolean {
    const entry = this.registry.get(packageId)
    if (!entry) return false

    // 从Tag索引中移除
    for (const tag of entry.package.tags) {
      this.tagIndex.get(tag)?.delete(packageId)
    }

    // 从主表移除
    this.registry.delete(packageId)
    return true
  }

  /**
   * 启用/禁用问道包
   */
  setEnabled(packageId: string, enabled: boolean): boolean {
    const entry = this.registry.get(packageId)
    if (!entry) return false
    entry.enabled = enabled
    return true
  }

  /**
   * 根据ID获取问道包
   */
  getById(packageId: string): PathPackageTemplate | null {
    const entry = this.registry.get(packageId)
    return entry?.enabled ? entry.package : null
  }

  /**
   * 根据Tag获取问道包列表
   */
  getByTag(tag: PathPackageTag): PathPackageTemplate[] {
    const ids = this.tagIndex.get(tag)
    if (!ids) return []

    return Array.from(ids)
      .map(id => this.registry.get(id))
      .filter(entry => entry?.enabled)
      .map(entry => entry!.package)
  }

  /**
   * 高级查询：根据条件获取问道包
   */
  query(options: TagQueryOptions): PathPackageTemplate[] {
    const { tags, matchAll = false, checkConditions = true, playerRealm } = options

    // 获取候选问道包
    let candidateIds: Set<string>

    if (matchAll) {
      // 需要匹配所有tag
      candidateIds = new Set(
        Array.from(this.registry.keys()).filter(id => {
          const entry = this.registry.get(id)
          if (!entry?.enabled) return false
          return tags.every(tag => entry.package.tags.includes(tag))
        })
      )
    } else {
      // 匹配任一tag
      candidateIds = new Set()
      for (const tag of tags) {
        const ids = this.tagIndex.get(tag)
        if (ids) {
          for (const id of ids) {
            const entry = this.registry.get(id)
            if (entry?.enabled) {
              candidateIds.add(id)
            }
          }
        }
      }
    }

    // 转换为问道包列表
    let packages = Array.from(candidateIds)
      .map(id => this.registry.get(id)!.package)

    // 检查触发条件
    if (checkConditions && playerRealm !== undefined) {
      packages = packages.filter(pkg =>
        this.checkTriggerConditions(pkg.triggerConditions, playerRealm)
      )
    }

    return packages
  }

  /**
   * 随机选择一个问道包
   */
  getRandomByTag(tag: PathPackageTag, playerRealm?: number): PathPackageTemplate | null {
    const packages = this.query({
      tags: [tag],
      checkConditions: playerRealm !== undefined,
      playerRealm
    })

    if (packages.length === 0) return null

    const index = Math.floor(Math.random() * packages.length)
    return packages[index]
  }

  /**
   * 随机选择一个问道包（测试用，不检查条件）
   */
  getRandomByTagNoCheck(tag: PathPackageTag): PathPackageTemplate | null {
    const packages = this.query({
      tags: [tag],
      checkConditions: false
    })

    if (packages.length === 0) return null

    const index = Math.floor(Math.random() * packages.length)
    return packages[index]
  }

  /**
   * 根据触发概率随机选择
   */
  getRandomByChance(tag: PathPackageTag, playerRealm?: number): PathPackageTemplate | null {
    const packages = this.query({
      tags: [tag],
      checkConditions: playerRealm !== undefined,
      playerRealm
    })

    // 根据triggerChance进行加权随机
    const weightedPackages = packages.filter(pkg => {
      const chance = pkg.triggerConditions.triggerChance ?? 1
      return Math.random() < chance
    })

    if (weightedPackages.length === 0) return null

    const index = Math.floor(Math.random() * weightedPackages.length)
    return weightedPackages[index]
  }

  /**
   * 检查触发条件
   */
  private checkTriggerConditions(conditions: TriggerConditions, playerRealm: number): boolean {
    // 检查最低境界
    if (conditions.minRealm !== undefined && playerRealm < conditions.minRealm) {
      return false
    }

    // 检查最高境界
    if (conditions.maxRealm !== undefined && playerRealm > conditions.maxRealm) {
      return false
    }

    return true
  }

  /**
   * 检查冷却时间
   */
  async checkCooldown(userId: string, packageId: string): Promise<{
    canUse: boolean
    remainingHours?: number
  }> {
    const pkg = this.getById(packageId)
    if (!pkg || !pkg.triggerConditions.cooldownHours) {
      return { canUse: true }
    }

    // 查询最近一次该问道包的记录
    const records = await this.context.database.get<any>('xiuxian_questioning_v3', {
      userId,
      pathId: packageId
    } as any, {
      sort: { createTime: 'desc' },
      limit: 1
    })

    if (records.length === 0) {
      return { canUse: true }
    }

    const lastTime = new Date(records[0].createTime).getTime()
    const now = Date.now()
    const cooldownMs = pkg.triggerConditions.cooldownHours * 60 * 60 * 1000
    const elapsed = now - lastTime

    if (elapsed < cooldownMs) {
      const remainingHours = Math.ceil((cooldownMs - elapsed) / (60 * 60 * 1000))
      return { canUse: false, remainingHours }
    }

    return { canUse: true }
  }

  /**
   * 获取所有已注册的Tag
   */
  getAllTags(): PathPackageTag[] {
    return Array.from(this.tagIndex.keys())
  }

  /**
   * 获取指定Tag下的问道包数量
   */
  getTagCount(tag: PathPackageTag): number {
    return this.tagIndex.get(tag)?.size ?? 0
  }

  /**
   * 获取所有问道包
   */
  getAll(): PathPackageTemplate[] {
    return Array.from(this.registry.values())
      .filter(entry => entry.enabled)
      .map(entry => entry.package)
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalPackages: number
    enabledPackages: number
    tagCounts: Record<string, number>
  } {
    const all = Array.from(this.registry.values())
    const enabled = all.filter(e => e.enabled)

    const tagCounts: Record<string, number> = {}
    for (const [tag, ids] of this.tagIndex) {
      tagCounts[tag] = ids.size
    }

    return {
      totalPackages: all.length,
      enabledPackages: enabled.length,
      tagCounts
    }
  }

  /**
   * 清空所有注册
   */
  clear(): void {
    this.registry.clear()
    this.tagIndex.clear()
  }
}
