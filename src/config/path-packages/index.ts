/**
 * 问道包配置主入口
 * 导出所有问道包模板
 */

import { PathPackageTemplate } from '../../types/path-package'
import { opportunityPackages } from './opportunity'
import { enlightenmentPackages } from './enlightenment'
import { demonPackages } from './demon'
import { explorationPackages } from './exploration'
import { bondPackages } from './bond'
import { desirePackages } from './desire'

/**
 * 所有示例问道包
 */
export const ALL_PATH_PACKAGES: PathPackageTemplate[] = [
  ...opportunityPackages,
  ...enlightenmentPackages,
  ...demonPackages,
  ...explorationPackages,
  ...bondPackages,
  ...desirePackages
]

/**
 * 按Tag分类导出
 */
export {
  opportunityPackages,
  enlightenmentPackages,
  demonPackages,
  explorationPackages,
  bondPackages,
  desirePackages
}

/**
 * 获取指定Tag的所有问道包
 */
export function getPackagesByTag(tag: string): PathPackageTemplate[] {
  return ALL_PATH_PACKAGES.filter(pkg => pkg.tags.includes(tag))
}

/**
 * 获取随机的步入仙途问道包（向后兼容）
 */
export function getRandomInitiationPath(): PathPackageTemplate | null {
  const initiationPackages = getPackagesByTag('initiation')
  if (initiationPackages.length === 0) return null
  const index = Math.floor(Math.random() * initiationPackages.length)
  return initiationPackages[index]
}

/**
 * 获取问道包统计信息
 */
export function getPackageStats(): {
  total: number
  byTag: Record<string, number>
} {
  const byTag: Record<string, number> = {}

  for (const pkg of ALL_PATH_PACKAGES) {
    for (const tag of pkg.tags) {
      byTag[tag] = (byTag[tag] || 0) + 1
    }
  }

  return {
    total: ALL_PATH_PACKAGES.length,
    byTag
  }
}
