/**
 * ============================================================
 * 性格量化系统 v2.0 - 版本切换配置
 * ============================================================
 *
 * 当前状态: 默认 v1.0（可在 src/index.ts 中切换到 v2.0）
 *
 * 本文件负责管理 v1.0 和 v2.0 两个性格系统版本的切换。
 *
 * 版本对比:
 * - v1.0: 9维性格系统 + 固定选项加分 + 关键词匹配
 * - v2.0: 22维性格系统 + AI智能解析 + 多问道包
 *
 * 切换方法:
 * 在 src/index.ts 的 Config 中设置:
 *   personalitySystemVersion: 'v2.0'  // 切换到 v2.0
 *   enableMultiplePaths: true         // 启用多问道包
 *   fallbackToV1: true                // AI 失败时降级到 v1.0
 *
 * v2.0 系统相关文件:
 * - src/config/personality-system-config.ts（本文件）- 版本切换
 * - src/experimental/personality-dimensions.ts - 22维定义
 * - src/experimental/path-packages.ts - 多问道包配置
 * - src/experimental/ai-personality-analyzer.ts - AI解析器
 * - src/experimental/extended-fate-calculator.ts - 扩展天命计算器
 *
 * 注意事项:
 * - v2.0 系统未经过充分测试
 * - 需要更多 AI 调用，成本较高
 * - 建议在测试环境中启用
 *
 * 参考文档:
 * - .claude/性格量化系统v2升级方案.md
 *
 * ============================================================
 */

/**
 * 性格系统版本
 */
export enum PersonalitySystemVersion {
  V1 = 'v1.0',  // 原有系统（9维 + 固定匹配）
  V2 = 'v2.0'   // 新系统（22维 + AI解析）
}

/**
 * 性格系统配置接口
 */
export interface PersonalitySystemConfig {
  /**
   * 当前使用的版本
   * @default PersonalitySystemVersion.V1
   */
  version: PersonalitySystemVersion

  /**
   * v2.0 特定配置
   */
  v2Config?: {
    /**
     * AI 解析超时时间（秒）
     * @default 10
     */
    aiTimeout?: number

    /**
     * 是否启用多问道包（如果为 false，仅使用天问之路）
     * @default true
     */
    enableMultiplePaths?: boolean

    /**
     * AI 调用失败时是否降级到 v1.0
     * @default true
     */
    fallbackToV1?: boolean
  }
}

/**
 * 默认配置
 */
export const DEFAULT_PERSONALITY_CONFIG: PersonalitySystemConfig = {
  version: PersonalitySystemVersion.V1,  // 默认使用 v1.0，向后兼容
  v2Config: {
    aiTimeout: 10,
    enableMultiplePaths: true,
    fallbackToV1: true
  }
}

/**
 * 全局配置（由 index.ts 注入）
 */
let currentConfig: PersonalitySystemConfig = { ...DEFAULT_PERSONALITY_CONFIG }

/**
 * 设置配置
 */
export function setPersonalitySystemConfig(config: Partial<PersonalitySystemConfig>): void {
  currentConfig = {
    ...currentConfig,
    ...config,
    v2Config: {
      ...currentConfig.v2Config,
      ...config.v2Config
    }
  }
}

/**
 * 获取当前配置
 */
export function getPersonalitySystemConfig(): PersonalitySystemConfig {
  return currentConfig
}

/**
 * 是否使用 v2.0 系统
 */
export function isUsingV2(): boolean {
  return currentConfig.version === PersonalitySystemVersion.V2
}

/**
 * 是否启用多问道包（仅 v2.0 有效）
 */
export function isMultiplePathsEnabled(): boolean {
  return isUsingV2() && (currentConfig.v2Config?.enableMultiplePaths !== false)
}
