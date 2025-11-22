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
   * v1.1.0 更新：支持完整玩家对象检查
   */
  query(options: TagQueryOptions & { player?: any }): PathPackageTemplate[] {
    const { tags, matchAll = false, checkConditions = true, player } = options

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

    // 检查触发条件（使用完整玩家对象）
    if (checkConditions && player) {
      packages = packages.filter(pkg =>
        this.checkTriggerConditions(pkg.triggerConditions, player)
      )
    }

    return packages
  }

  /**
   * 随机选择一个问道包
   * v1.1.0 更新：使用完整玩家对象
   */
  getRandomByTag(tag: PathPackageTag, player?: any): PathPackageTemplate | null {
    const packages = this.query({
      tags: [tag],
      checkConditions: player !== undefined,
      player
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
   * 根据触发概率随机选择（v1.1.0 已废弃，改用新的亲和度系统）
   * @deprecated 请使用 selectPackageWithAffinity 方法
   */
  getRandomByChance(tag: PathPackageTag, player?: any): PathPackageTemplate | null {
    const packages = this.query({
      tags: [tag],
      checkConditions: player !== undefined,
      player
    })

    // 根据triggerChance进行加权随机
    const weightedPackages = packages.filter(pkg => {
      const chance = pkg.triggerChance ?? 1
      return Math.random() < chance
    })

    if (weightedPackages.length === 0) return null

    const index = Math.floor(Math.random() * weightedPackages.length)
    return weightedPackages[index]
  }

  /**
   * 检查触发条件（v1.1.0 重写）
   * 支持精准匹配、小境界、灵根、灵石、击杀数等全面检查
   *
   * @param conditions 触发条件
   * @param player 玩家对象（需要包含完整信息）
   * @returns 是否满足条件
   */
  private checkTriggerConditions(conditions: TriggerConditions, player: any): boolean {
    // ✨ 关键日志：记录检查开始
    this.context.logger.info(`[触发条件检查] 开始检查，玩家 realm=${player?.realm}, realmLevel=${player?.realmLevel}`)

    // ========== 大境界检查 ==========

    // 精准匹配优先
    if (conditions.exactRealm !== undefined && conditions.exactRealm !== false) {
      this.context.logger.info(`[触发条件检查] 精准匹配模式: exactRealm=${conditions.exactRealm}, 玩家realm=${player?.realm}`)
      if (player.realm !== conditions.exactRealm) {
        this.context.logger.info(`[触发条件检查] 境界不匹配，返回false`)
        return false
      }
    } else {
      // 范围匹配
      // 检查最低境界（false表示跳过检查）
      if (conditions.minRealm !== undefined && conditions.minRealm !== false) {
        this.context.logger.info(`[触发条件检查] 最低境界检查: minRealm=${conditions.minRealm}, 玩家realm=${player?.realm}`)

        // ✨ 安全检查：确保player.realm存在且是数字
        if (player.realm === undefined || player.realm === null) {
          this.context.logger.error(`[触发条件检查] 玩家realm字段为空！玩家数据: ${JSON.stringify(player)}`)
          return false
        }

        if (player.realm < conditions.minRealm) {
          this.context.logger.info(`[触发条件检查] 境界不足 (${player.realm} < ${conditions.minRealm})，返回false`)
          return false
        }
      }

      // 检查最高境界
      if (conditions.maxRealm !== undefined && conditions.maxRealm !== false) {
        this.context.logger.info(`[触发条件检查] 最高境界检查: maxRealm=${conditions.maxRealm}, 玩家realm=${player?.realm}`)
        if (player.realm > conditions.maxRealm) {
          this.context.logger.info(`[触发条件检查] 境界过高，返回false`)
          return false
        }
      }
    }

    // ========== 小境界检查（需要配合 exactRealm 或在范围内）==========

    // 最低小境界
    if (conditions.minRealmLevel !== undefined && conditions.minRealmLevel !== false) {
      if (player.realmLevel < conditions.minRealmLevel) {
        return false
      }
    }

    // 最高小境界
    if (conditions.maxRealmLevel !== undefined && conditions.maxRealmLevel !== false) {
      if (player.realmLevel > conditions.maxRealmLevel) {
        return false
      }
    }

    // ========== 灵根检查 ==========

    // 必需灵根（白名单）
    if (conditions.requiredSpiritualRoots !== undefined && conditions.requiredSpiritualRoots !== false) {
      const required = Array.isArray(conditions.requiredSpiritualRoots)
        ? conditions.requiredSpiritualRoots
        : [conditions.requiredSpiritualRoots]

      if (!required.includes(player.spiritualRoot)) {
        return false
      }
    }

    // 禁止灵根（黑名单）
    if (conditions.forbiddenSpiritualRoots && conditions.forbiddenSpiritualRoots.length > 0) {
      if (conditions.forbiddenSpiritualRoots.includes(player.spiritualRoot)) {
        return false
      }
    }

    // ========== 资源检查 ==========

    // 最低灵石
    if (conditions.minSpiritStone !== undefined && conditions.minSpiritStone !== false) {
      if (player.spiritStone < conditions.minSpiritStone) {
        return false
      }
    }

    // ========== 战绩检查 ==========

    // 最低击杀数（如果玩家对象有该字段）
    if (conditions.minKillCount !== undefined && conditions.minKillCount !== false) {
      // 安全检查：如果玩家对象没有 killCount 字段，视为0
      const killCount = player.killCount ?? 0
      if (killCount < conditions.minKillCount) {
        return false
      }
    }

    // ========== 其他条件（预留扩展）==========

    // 所需道具检查（暂未实现）
    if (conditions.requiredItems && conditions.requiredItems.length > 0) {
      // TODO: 实现道具检查逻辑
      this.context.logger.warn('道具检查功能暂未实现')
    }

    // 所需任务检查（暂未实现）
    if (conditions.requiredQuests && conditions.requiredQuests.length > 0) {
      // TODO: 实现任务检查逻辑
      this.context.logger.warn('任务检查功能暂未实现')
    }

    // ✨ 所有检查通过
    this.context.logger.info(`[触发条件检查] 所有条件通过，返回true`)
    return true
  }

  /**
   * 检查冷却时间（v1.1.0 已废弃，单包冷却改为全局冷却）
   * @deprecated 请使用 checkGlobalCooldown 方法
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
   * 基于灵根亲和度选择问道包（v1.1.0 新增）
   * 根据玩家的灵根类型，提升特定问道包的触发概率，然后归一化并加权随机选择
   *
   * @param player 玩家对象（需要包含 spiritualRoot 字段）
   * @param excludeTags 要排除的标签（例如 ['initiation']）
   * @returns 选中的问道包，如果没有可用包则返回 null
   */
  async selectPackageWithAffinity(
    player: any,
    excludeTags: PathPackageTag[] = ['initiation']
  ): Promise<PathPackageTemplate | null> {
    // 导入配置
    const { PathPackageConfig } = await import('../config/constants.js')
    const enableAffinity = PathPackageConfig.ENABLE_AFFINITY_BONUS

    // ✨ 关键日志：记录玩家境界信息
    this.context.logger.info(`[问道包筛选] 玩家境界: realm=${player.realm}, realmLevel=${player.realmLevel}, 灵根: ${player.spiritualRoot}`)

    // 获取所有问道包（排除 initiation 等指定标签）
    const allPackages = this.getAll()
    this.context.logger.info(`[问道包筛选] 总包数: ${allPackages.length}`)

    // ✨ 关键日志：记录每个包的筛选结果
    const candidatePackages = allPackages.filter(pkg => {
      // 排除指定标签的包
      if (excludeTags.some(tag => pkg.tags.includes(tag))) {
        this.context.logger.info(`[问道包筛选] 排除 ${pkg.name} (标签: ${pkg.tags.join(', ')})`)
        return false
      }
      // 检查触发条件
      const passed = this.checkTriggerConditions(pkg.triggerConditions, player)
      if (!passed) {
        this.context.logger.info(`[问道包筛选] 不满足条件: ${pkg.name} (minRealm=${pkg.triggerConditions.minRealm ?? 'none'})`)
      } else {
        this.context.logger.info(`[问道包筛选] 通过: ${pkg.name} (minRealm=${pkg.triggerConditions.minRealm ?? 'none'})`)
      }
      return passed
    })

    this.context.logger.info(`[问道包筛选] 符合条件的包数: ${candidatePackages.length}`)
    if (candidatePackages.length === 0) {
      this.context.logger.warn(`[问道包筛选] 没有符合条件的问道包`)
      return null
    }

    // 如果未启用亲和度加成，直接使用基础概率
    if (!enableAffinity) {
      return this.weightedRandomSelect(candidatePackages)
    }

    // 读取玩家灵根的亲和度配置
    const { SPIRITUAL_ROOT_REGISTRY } = await import('../config/spiritual-root-registry.js')
    const rootConfig = SPIRITUAL_ROOT_REGISTRY[player.spiritualRoot as keyof typeof SPIRITUAL_ROOT_REGISTRY]
    const affinities = rootConfig?.packageAffinities || []

    // 构建亲和度映射表
    const affinityMap = new Map<string, number>()
    for (const affinity of affinities) {
      affinityMap.set(affinity.packageId, affinity.bonusChance)
    }

    // 计算每个包的最终概率（基础概率 + 亲和度加成）
    const packagesWithProbability = candidatePackages.map(pkg => {
      const baseChance = pkg.triggerChance
      const affinityBonus = affinityMap.get(pkg.id) || 0
      const finalChance = baseChance + affinityBonus

      return {
        package: pkg,
        probability: Math.max(0, finalChance)  // 确保概率非负
      }
    })

    // 归一化概率（确保总和为1）
    const totalProbability = packagesWithProbability.reduce((sum, item) => sum + item.probability, 0)

    if (totalProbability === 0) {
      // 所有概率都为0，随机选择一个
      const index = Math.floor(Math.random() * candidatePackages.length)
      return candidatePackages[index]
    }

    const normalizedPackages = packagesWithProbability.map(item => ({
      package: item.package,
      probability: item.probability / totalProbability
    }))

    // 加权随机选择
    const random = Math.random()
    let accumulated = 0

    for (const item of normalizedPackages) {
      accumulated += item.probability
      if (random <= accumulated) {
        this.context.logger.debug(`选中问道包: ${item.package.name}, 概率: ${(item.probability * 100).toFixed(1)}%`)
        return item.package
      }
    }

    // 兜底：返回最后一个（理论上不应该走到这里）
    return normalizedPackages[normalizedPackages.length - 1].package
  }

  /**
   * 加权随机选择（内部辅助函数）
   * 根据 triggerChance 进行加权随机选择
   */
  private weightedRandomSelect(packages: PathPackageTemplate[]): PathPackageTemplate | null {
    if (packages.length === 0) return null

    // 计算总权重
    const totalWeight = packages.reduce((sum, pkg) => sum + pkg.triggerChance, 0)

    if (totalWeight === 0) {
      // 所有权重都为0，均匀随机选择
      const index = Math.floor(Math.random() * packages.length)
      return packages[index]
    }

    // 加权随机选择
    const random = Math.random() * totalWeight
    let accumulated = 0

    for (const pkg of packages) {
      accumulated += pkg.triggerChance
      if (random <= accumulated) {
        return pkg
      }
    }

    // 兜底
    return packages[packages.length - 1]
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

  // ==================== v1.1.0 新增：数据库管理功能 ====================

  /**
   * 同步问道包到数据库
   * 在插件启动时调用，将所有注册的问道包信息写入数据库
   */
  async syncPackagesToDatabase(): Promise<void> {
    const packages = Array.from(this.registry.values()).map(entry => entry.package)

    for (const pkg of packages) {
      try {
        // 检查是否已存在
        const existing = await this.context.database.get('xiuxian_path_packages_v3', {
          packageId: pkg.id
        } as any)

        const packageData = {
          packageId: pkg.id,
          packageName: pkg.name,
          tags: JSON.stringify(pkg.tags),
          enabled: true,
          triggerConditions: JSON.stringify(pkg.triggerConditions),
          triggerChance: pkg.triggerChance,
          totalTriggered: 0,
          totalCompleted: 0,
          registeredAt: new Date(),
          lastModified: new Date(),
          remark: pkg.description || ''
        }

        if (existing.length > 0) {
          // 更新现有记录（保留统计数据和enabled状态）
          await this.context.database.set('xiuxian_path_packages_v3', {
            packageId: pkg.id
          } as any, {
            packageName: pkg.name,
            tags: JSON.stringify(pkg.tags),
            triggerConditions: JSON.stringify(pkg.triggerConditions),
            triggerChance: pkg.triggerChance,
            lastModified: new Date(),
            remark: pkg.description || ''
          } as any)

          // ✨ v1.1.0 修复：从数据库读取 enabled 状态并应用到内存
          const dbEnabled = existing[0].enabled
          this.setEnabled(pkg.id, dbEnabled)
          this.context.logger.debug(`同步包 ${pkg.id} 状态: enabled=${dbEnabled}`)
        } else {
          // 创建新记录
          await this.context.database.create('xiuxian_path_packages_v3', packageData as any)
        }
      } catch (error) {
        this.context.logger.error(`同步问道包 ${pkg.id} 失败:`, error)
      }
    }

    this.context.logger.info(`已同步 ${packages.length} 个问道包到数据库`)
  }

  /**
   * 动态启用/禁用问道包
   */
  async setPackageEnabled(packageId: string, enabled: boolean): Promise<boolean> {
    try {
      // 更新内存中的状态
      const success = this.setEnabled(packageId, enabled)
      if (!success) return false

      // 更新数据库
      await this.context.database.set('xiuxian_path_packages_v3', {
        packageId
      } as any, {
        enabled,
        lastModified: new Date()
      } as any)

      this.context.logger.info(`问道包 ${packageId} 已${enabled ? '启用' : '禁用'}`)
      return true
    } catch (error) {
      this.context.logger.error(`设置问道包状态失败:`, error)
      return false
    }
  }

  /**
   * 增加触发次数统计
   */
  async incrementTriggerCount(packageId: string): Promise<void> {
    try {
      const [pkg] = await this.context.database.get('xiuxian_path_packages_v3', {
        packageId
      } as any)

      if (pkg) {
        await this.context.database.set('xiuxian_path_packages_v3', {
          packageId
        } as any, {
          totalTriggered: (pkg.totalTriggered || 0) + 1
        } as any)
      }
    } catch (error) {
      this.context.logger.error(`更新触发次数失败:`, error)
    }
  }

  /**
   * 增加完成次数统计
   */
  async incrementCompleteCount(packageId: string): Promise<void> {
    try {
      const [pkg] = await this.context.database.get('xiuxian_path_packages_v3', {
        packageId
      } as any)

      if (pkg) {
        await this.context.database.set('xiuxian_path_packages_v3', {
          packageId
        } as any, {
          totalCompleted: (pkg.totalCompleted || 0) + 1
        } as any)
      }
    } catch (error) {
      this.context.logger.error(`更新完成次数失败:`, error)
    }
  }

  /**
   * 获取数据库中的所有问道包信息
   */
  async getAllPackagesFromDatabase(): Promise<any[]> {
    try {
      return await this.context.database.get('xiuxian_path_packages_v3', {})
    } catch (error) {
      this.context.logger.error(`查询数据库问道包失败:`, error)
      return []
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
