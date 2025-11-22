# 修仙BOT - 开发记忆文档

本文档记录了项目开发过程中的重要决策、架构变更和问题解决方案。

## v1.1.0 - 问道守心系统重构 (2025-01-22)

### 问题背景
问道守心系统存在三个严重bug：
1. **境界检查失效**：0级炼气玩家触发了需要金丹（realm=3）的问道包
2. **日志完全不输出**：添加的debug日志一行都没显示
3. **冷却机制未生效**：可以无限触发问道守心，没有8小时限制

### 根本原因
- 代码错误使用了测试方法 `startPackageByTagTest` 而非正式方法 `startPackageByTag`
- 测试方法内部调用 `getRandomByTagNoCheck`，设置 `checkConditions: false`，跳过所有检查
- 导致境界检查、冷却检查、日志输出的代码路径完全被绕过

### 解决方案

#### 1. 修复代码路径
**文件**：`src/commands/questioning.ts:70`
```typescript
// 修改前（错误）
const result = await questioningService.startPackageByTagTest(
  session.userId,
  selectedPackage.tags[0]
)

// 修改后（正确）
const result = await questioningService.startPackageByTag(
  session.userId,
  selectedPackage.tags[0],
  player  // 传入玩家对象用于境界检查和冷却检查
)
```

#### 2. 实现命令级冷却机制
**核心设计**：冷却时间限制的是"问道守心"命令本身，而非特定问道包

**实现方式**：
- 在玩家表新增字段：`lastQuestioningTime: timestamp`
- 完成问道守心时更新此字段
- 开始问道守心时检查此字段，8小时内拒绝

**涉及文件**：
- `src/database/models/player.ts` - 添加数据库字段
- `src/types/player.ts` - 添加类型定义
- `src/services/questioning.service.ts:739-755` - 冷却检查逻辑
- `src/services/questioning.service.ts:959-962` - 更新完成时间

**冷却检查代码**：
```typescript
// 检查问道守心冷却（固定8小时）
const cooldownHours = 8
if (player.lastQuestioningTime) {
  const lastTime = new Date(player.lastQuestioningTime).getTime()
  const now = Date.now()
  const elapsed = now - lastTime
  const cooldownMs = cooldownHours * 60 * 60 * 1000

  if (elapsed < cooldownMs) {
    const remainingHours = Math.ceil((cooldownMs - elapsed) / (60 * 60 * 1000))
    return { success: false, message: `冷却中，还需 ${remainingHours} 小时` }
  }
}
```

#### 3. 优化日志输出
将关键日志从 `debug` 改为 `info` 级别，确保默认配置下可见：
- 境界检查日志
- 包筛选日志
- 冷却检查日志

**文件**：`src/services/path-package.service.ts`
- Line 226-263: 境界检查日志
- Line 336: 检查通过日志
- Line 459-486: 包筛选日志

### 新增功能

#### 1. 问道包数据库管理系统
**目的**：实现运行时动态管理和统计

**新建表**：`xiuxian_path_packages_v3`
```typescript
{
  id: number                 // 自增主键
  packageId: string          // 问道包ID（唯一）
  packageName: string        // 包名称
  tags: string              // 标签（JSON数组）
  enabled: boolean          // 是否启用
  triggerConditions: string // 触发条件（JSON）
  triggerChance: number     // 基础触发概率
  totalTriggered: number    // 总触发次数
  totalCompleted: number    // 总完成次数
  registeredAt: Date        // 注册时间
  lastModified: Date        // 最后修改时间
  remark: string            // 备注
}
```

**相关文件**：
- `src/types/path-package-db.ts` - 类型定义
- `src/database/models/path-package.ts` - 数据库模型
- `src/database/index.ts` - 注册表模型

#### 2. 数据同步功能
**功能**：插件启动时自动同步问道包信息到数据库

**实现**：`src/services/path-package.service.ts:629-675`
```typescript
async syncPackagesToDatabase(): Promise<void>
```

**调用位置**：`src/services/questioning.service.ts:59-61`

#### 3. 统计功能
**功能**：记录每个问道包的触发和完成次数

**实现方法**：
- `incrementTriggerCount(packageId)` - 触发时调用
- `incrementCompleteCount(packageId)` - 完成时调用

**调用位置**：
- `src/services/questioning.service.ts:775-778` - 记录触发次数
- `src/services/questioning.service.ts:953-956` - 记录完成次数

#### 4. 运行时管理命令
**文件**：`src/commands/dev-package.ts:437-517`

**命令列表**：
1. `问道包管理` - 查看所有问道包的状态和统计
   ```
   ━━━━ 问道包管理 ━━━━
   📊 包ID | 名称 | 状态 | 触发/完成
   ✅ inner_demon
      心魔试炼 (5/3)
      标签: trial
      概率: 15%
   ```

2. `问道包启用 <包ID>` - 动态启用指定问道包
3. `问道包禁用 <包ID>` - 动态禁用指定问道包

### 代码清理
**删除的错误代码**：
- `PathPackageService.checkGlobalCooldown()` - 基于数据库查询判断包类型的复杂逻辑（已废弃）
- `commands/questioning.ts` 中的重复冷却检查（已整合到 startPackageByTag）

**保留但未使用的代码**：
- `PathPackageService.checkCooldown()` - 单包冷却检查（标记为 @deprecated，保留用于未来功能）
- `QuestioningService.startRandomTrialQuestioning()` - 随机试炼问心（暂未使用，保留用于未来功能）

### 配置变更
**文件**：`src/config/constants.ts:392`
```typescript
GLOBAL_COOLDOWN_HOURS: 8  // 从72小时改为8小时
```

### 架构优化
- **统一冷却检查**：所有冷却逻辑集中在 `startPackageByTag` 方法中，避免重复检查
- **简化判断逻辑**：不再依赖数据库查询和复杂的包类型判断，直接使用玩家字段
- **提高代码可读性**：删除冗余代码，减少维护成本

### 验证清单
- [x] 境界检查生效：0级炼气不会触发金丹包
- [x] 日志正常输出：info级别日志在默认配置下可见
- [x] 冷却机制生效：8小时内无法再次触发问道守心
- [x] 数据库表创建：xiuxian_path_packages_v3 表正常创建
- [x] 管理命令可用：问道包管理、启用、禁用命令正常工作
- [x] 统计功能正常：触发和完成次数正确记录

### 技术债务
无

### 未来改进方向
1. **直接使用包ID创建session**：当前需要通过 tag 转换，可以优化架构直接支持包ID
2. **单包冷却功能**：当前保留了 checkCooldown 方法，未来可能支持特定包的独立冷却
3. **随机试炼触发**：保留了 startRandomTrialQuestioning 方法，未来可能添加随机触发机制

---

## 文档说明
- **目的**：帮助AI助手快速理解项目历史决策和架构演进
- **更新时机**：每次重大功能更新或架构变更后立即更新
- **保持原则**：简洁、准确、可追溯
