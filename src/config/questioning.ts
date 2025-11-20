/**
 * 问心系统配置
 */

import { initiationPackages } from './path-packages/initiation'
import { trialPackages } from './path-packages/trial'
import type { PathPackageTemplate } from '../types/path-package'

/**
 * 路径包类型（用于不同场景）
 */
export enum PathPackageType {
  INITIATION = 'initiation',   // 步入仙途专用
  TRIAL = 'trial',              // 试炼问心
  ENLIGHTENMENT = 'enlightenment', // 悟道问心
  CUSTOM = 'custom'             // 自定义扩展
}

export interface QuestionOption {
  text: string
  value: string
}

export interface Question {
  id: string
  type: 'choice' | 'text'
  question: string
  options?: QuestionOption[]  // 选择题的选项（数量可变，支持2-10个选项）

  // ✨ v0.6.0 新增：AI评分提示
  aiHint?: string  // 告诉AI这题想考察什么（仅用于开放题）
}

export interface QuestioningPath {
  id: string
  name: string
  description: string
  packageType: PathPackageType  // 新增：路径包类型
  questions: [Question, Question, Question] // 固定三题
  minRealm?: number // 最低境界要求（可选）
  cooldown?: number // 冷却时间（小时）
}

/**
 * 将 PathPackageTemplate 转换为 QuestioningPath
 * 这是一个桥接函数，因为问道包已迁移到 path-packages/，但 questioning service 仍需要 QuestioningPath 格式
 */
function convertPathPackageToQuestioningPath(pkg: PathPackageTemplate): QuestioningPath {
  // 确定包类型
  let packageType: PathPackageType
  if (pkg.tags.includes('initiation')) {
    packageType = PathPackageType.INITIATION
  } else if (pkg.tags.includes('trial')) {
    packageType = PathPackageType.TRIAL
  } else if (pkg.tags.includes('enlightenment')) {
    packageType = PathPackageType.ENLIGHTENMENT
  } else {
    packageType = PathPackageType.CUSTOM
  }

  return {
    id: pkg.id,
    name: pkg.name,
    description: pkg.description,
    packageType,
    questions: [
      pkg.questions[0] as Question,
      pkg.questions[1] as Question,
      pkg.questions[2] as Question
    ],
    minRealm: pkg.triggerConditions.minRealm,
    cooldown: pkg.triggerConditions.cooldownHours
  }
}

/**
 * 获取所有步入仙途路径（从 path-packages 转换）
 */
const INITIATION_PATHS_CONVERTED: QuestioningPath[] = initiationPackages.map(convertPathPackageToQuestioningPath)

/**
 * 获取所有试炼问心路径（从 path-packages 转换）
 */
const TRIAL_PATHS_CONVERTED: QuestioningPath[] = trialPackages.map(convertPathPackageToQuestioningPath)

/**
 * 根据路径包类型获取路径列表
 */
export function getPathsByPackageType(packageType: PathPackageType): QuestioningPath[] {
  if (packageType === PathPackageType.INITIATION) {
    return INITIATION_PATHS_CONVERTED
  }
  if (packageType === PathPackageType.TRIAL) {
    return TRIAL_PATHS_CONVERTED
  }
  return []
}

/**
 * 从指定路径包中随机选择一条路径
 */
export function getRandomPath(packageType: PathPackageType): QuestioningPath | null {
  const paths = getPathsByPackageType(packageType)
  if (paths.length === 0) return null

  const randomIndex = Math.floor(Math.random() * paths.length)
  return paths[randomIndex]
}

/**
 * 根据ID获取路径（同时查找 INITIATION 和 TRIAL）
 */
export function getPathById(pathId: string): QuestioningPath | null {
  // 先从步入仙途中查找
  const initiationPath = INITIATION_PATHS_CONVERTED.find(p => p.id === pathId)
  if (initiationPath) return initiationPath

  // 再从试炼问心中查找
  const trialPath = TRIAL_PATHS_CONVERTED.find(p => p.id === pathId)
  if (trialPath) return trialPath

  return null
}

/**
 * 重新导出 AI 响应类型（向后兼容）
 *
 * 注意：这些类型已移动到 types/ai-response.ts
 * 此处保留导出以保持向后兼容性
 */
export type {
  RewardType,
  QuestioningReward,
  InitiationAIResponse,
  TrialAIResponse
} from '../types/ai-response'
