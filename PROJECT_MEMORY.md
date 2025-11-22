# 项目记忆文档 - Koishi 修仙插件

## 项目概述

**项目名称**：koishi-plugin-xiuxian-txl
**类型**：Koishi 聊天机器人插件
**主要技术栈**：TypeScript 5.0+, Koishi v4.18+, ChatLuna (AI集成)
**数据库**：SQLite (通过 Koishi database 服务)
**当前版本**：v1.1.0

## 版本历史

### v1.1.0 (2025-11-22) - 问道守心系统重构

**核心改动**：
1. **全局冷却机制**
   - 移除单包冷却时间（`triggerConditions.cooldownHours`）
   - 实现全局冷却系统（默认72小时），所有问道包共享冷却
   - 环境变量配置：`PathPackageConfig.GLOBAL_COOLDOWN_HOURS`

2. **灵根亲和度系统**
   - 基于玩家灵根提升特定问道包触发概率
   - 实现概率归一化（确保总和100%）
   - 智能加权随机选择算法
   - 可通过 `PathPackageConfig.ENABLE_AFFINITY_BONUS` 开关控制

3. **增强权限检查系统**
   - **大境界检查**：
     - 精准匹配：`exactRealm: 3` (只允许元婴期)
     - 范围匹配：`minRealm: 2, maxRealm: 5` (金丹期到炼虚期)
   - **小境界检查**：
     - `minRealmLevel` / `maxRealmLevel` (0-3: 初期/中期/后期/大圆满)
   - **灵根检查**：
     - 白名单：`requiredSpiritualRoots: ['light', 'dark']` 或单个灵根
     - 黑名单：`forbiddenSpiritualRoots: ['fake']`
   - **资源检查**：
     - `minSpiritStone`: 最低灵石要求
   - **战绩检查**：
     - `minKillCount`: 最低击杀数要求
   - **条件跳过**：
     - 使用 `false` 值跳过特定检查（例如 `minRealm: false`）

4. **问道包配置优化**
   - `triggerChance` 从 `triggerConditions` 移至 `PathPackageTemplate` 外层
   - 所有问道包（包括 trial、opportunity、enlightenment、demon、exploration、bond、desire、initiation）统一格式

5. **问道守心命令重构**
   - 自动排除 "步入仙途" (initiation) 包
   - 使用新的 `selectPackageWithAffinity()` 方法智能选择
   - 集成全局冷却检查和友好提示

**修改文件**：
- `src/types/path-package.ts` - 扩展 TriggerConditions 接口
- `src/config/constants.ts` - 添加 PathPackageConfig
- `src/services/path-package.service.ts` - 重写权限检查和选择逻辑
- `src/commands/questioning.ts` - 重构问道守心命令
- `src/config/path-packages/*.ts` - 更新所有问道包配置
- `src/commands/dev-package.ts` - 修复类型安全
- `src/services/questioning.service.ts` - 修复类型安全

### v1.0.1 - 命令系统优化

**核心改动**：
1. **命令别名支持**：所有命令支持省略 `修仙.` 前缀
2. **@ 功能扩展**：查询命令支持查看其他玩家（天道记录、问心历史、查看buff）
3. **突破机制优化**：区分小境界突破（100%成功）和大境界突破（概率成功，修为清零）
4. **代码复用**：提取 `extractMentionedUserId()` 工具函数
5. **命令整合**：问道包测试命令统一移至开发者工具

### v1.0.0 - Buff系统

**核心改动**：
1. **多维度加成系统**：
   - 修炼速度：`(全局+永久) × 灵根 × (1+临时)`
   - 突破率：`(全局+永久+灵根) + 临时`
   - 修为需求：`设定 × (1+永久+临时)`
2. **Buff管理**：
   - 自动过期清理（每小时）
   - 堆叠控制和最大堆叠数
   - 多来源支持（宗门、道具、特殊事件、全局活动）
3. **开发者命令**：查看、添加、删除、清空、统计buff

### v0.6.0 - AI开放题评分系统

**核心改动**：
1. **混合评分机制**：选择题规则评分 + 开放题AI评分
2. **智能作弊检测**：识别prompt注入、要求特定灵根等作弊行为
3. **9维性格量化**：determination, courage, stability, focus, honesty, kindness, greed, impatience, manipulation
4. **降级保护**：`enableAIScoringFallback` 开关控制AI失败时的降级处理
5. **评分追溯性**：保存详细评分信息到数据库（choiceScore, aiScores, usedAI等）

### v0.3.0 - 问道包系统

**核心改动**：
1. Tag分类系统（机缘、感悟、魔道、遗迹、情义、欲望）
2. 9维性格分析系统
3. 智能匹配奖励（完美契合/良好匹配/普通匹配）
4. 13个问道包实现

## 核心架构

### 数据层 (Database)

**表结构**：
- `xiuxian_player` - 玩家信息（境界、修为、灵根、性格等）
- `xiuxian_questioning_v3` - 问心/问道历史记录
- `xiuxian_buff` - Buff系统（加成效果、过期时间、堆叠等）
- `xiuxian_spiritual_root_stats` - 灵根分布统计

### 服务层 (Services)

**PlayerService** (`src/services/player.service.ts`)
- 玩家创建、查询、更新
- 修炼逻辑（打坐）
- 突破逻辑（小境界/大境界）
- Buff系统集成

**QuestioningService** (`src/services/questioning.service.ts`)
- 问心会话管理（内存中）
- 问道包流程控制
- AI评分调用
- 奖励发放

**PathPackageService** (`src/services/path-package.service.ts`)
- 问道包注册和管理
- Tag索引和查询
- 权限检查（v1.1.0重写）
- 全局冷却检查（v1.1.0新增）
- 灵根亲和度选择（v1.1.0新增）

**BuffService** (`src/services/buff.service.ts`)
- Buff增删改查
- 加成计算（修炼速度、突破率、修为需求）
- 自动过期清理
- 堆叠控制

**AIService** (`src/services/ai.service.ts`)
- ChatLuna集成
- 道号生成
- 灵根分配
- 性格评分（9维）
- 作弊检测

### 命令层 (Commands)

**玩家命令** (`src/commands/player.ts`)
- 步入仙途、天道记录、打坐、突破

**问心命令** (`src/commands/questioning.ts`)
- 问道守心、问道历史

**开发者命令** (`src/commands/dev-*.ts`)
- 灵根测试、Buff管理、问道包测试、玩家管理

### 配置层 (Config)

**常量配置** (`src/config/constants.ts`)
- 境界系统配置
- Buff系统配置
- **PathPackageConfig** (v1.1.0新增)：
  - `GLOBAL_COOLDOWN_HOURS: 72` - 全局冷却时间
  - `ENABLE_AFFINITY_BONUS: true` - 灵根亲和度开关

**灵根注册表** (`src/config/spiritual-root-registry.ts`)
- 11种灵根配置（修炼加成、突破加成、战力加成）
- **packageAffinities** (v1.1.0)：灵根对问道包的亲和度配置

**问道包配置** (`src/config/path-packages/*.ts`)
- initiation.ts - 3个步入仙途包
- trial.ts - 3个试炼包
- opportunity.ts - 2个机缘包
- enlightenment.ts - 2个感悟包
- demon.ts - 2个魔道包
- exploration.ts - 2个遗迹包
- bond.ts - 2个情义包
- desire.ts - 3个欲望包

### 适配器层 (Adapters)

**IAppContext接口** (`src/adapters/interfaces.ts`)
- 解耦Koishi框架依赖
- 统一logger和database接口

**KoishiAdapter** (`src/adapters/koishi-adapter.ts`)
- Koishi框架适配实现

## 重要设计决策

### 1. 问道包架构设计 (v1.1.0)

**决策**：移除单包冷却，改为全局冷却 + 灵根亲和度系统

**理由**：
- 单包冷却管理复杂，需要为每个包单独记录时间
- 全局冷却更简单，防止玩家频繁刷问道包
- 灵根亲和度增加策略深度，不同灵根有不同体验
- 概率归一化确保公平性（总概率始终100%）

**实现细节**：
- 全局冷却检查查询 `xiuxian_questioning_v3` 表的最新记录
- 排除 initiation 包（步入仙途不计入冷却）
- 亲和度加成：`最终概率 = 基础triggerChance + 亲和度bonusChance`
- 归一化：`归一化概率 = 最终概率 / 所有包最终概率总和`

### 2. TriggerConditions 设计 (v1.1.0)

**决策**：使用 `number | false` 联合类型表示"检查值或跳过"

**理由**：
- `false` 语义明确表示"跳过此检查"
- 避免使用 `undefined` 导致的默认值歧义
- 支持精准匹配（`exactRealm`）和范围匹配（`minRealm`/`maxRealm`）组合

**使用示例**：
```typescript
// 只允许元婴期后期和大圆满
triggerConditions: {
  exactRealm: 3,          // 必须是元婴期
  minRealmLevel: 2,       // 至少后期
  maxRealmLevel: 3        // 最多大圆满
}

// 不限制境界，但需要1000灵石
triggerConditions: {
  minRealm: false,        // 跳过大境界检查
  minSpiritStone: 1000    // 需要1000灵石
}
```

### 3. AI评分系统设计 (v0.6.0)

**决策**：混合评分（选择题规则 + 开放题AI）

**理由**：
- 选择题规则评分稳定可控
- 开放题AI评分增加智能性和趣味性
- 权重可配置（默认 choice 30% + open 70%）
- 降级机制防止AI服务故障影响游戏体验

### 4. Buff系统设计 (v1.0.0)

**决策**：乘法和加法混合的加成公式

**理由**：
- 修炼速度使用乘法：确保灵根加成和buff加成分别生效
- 突破率使用加法：避免乘法导致的概率爆炸
- 修为需求使用乘法：保持平衡性

### 5. 会话管理设计

**决策**：问心会话存储在内存中，不持久化

**理由**：
- 问心流程短暂（通常3-5分钟完成）
- 重启后丢失会话是可接受的（玩家重新开始即可）
- 简化实现，避免数据库频繁读写

**待改进**：未来可考虑持久化，支持长时间未完成的会话恢复

## 已知问题和待办事项

### 已知问题

1. **问道守心命令的架构限制** (`src/commands/questioning.ts:68-73`)
   - 当前使用 `startPackageByTagTest()` 方法启动问道包
   - 该方法会根据tag随机选择，可能与已选择的包不一致
   - **待优化**：创建 `startPackageById()` 方法直接使用指定包ID

2. **会话不持久化**
   - 插件重启会丢失进行中的问心会话
   - **待改进**：实现会话持久化到数据库

### 待办功能

- [ ] 战斗系统（PVE历练、PVP切磋）
- [ ] 物品系统（背包、商店、丹药）
- [ ] 宗门系统（加入宗门、宗门任务）
- [ ] 更多问道包类型和路径
- [ ] 问心会话持久化（支持重启恢复）
- [ ] 道具触发条件检查（`requiredItems`）
- [ ] 任务触发条件检查（`requiredQuests`）

## 开发规范

### 代码风格

1. **TypeScript严格模式**：启用所有严格类型检查
2. **命名规范**：
   - 服务类：`XxxService`
   - 接口：`IXxx` 或描述性名称
   - 类型：`XxxType` 或描述性名称
   - 常量：`UPPER_SNAKE_CASE`
3. **文件组织**：
   - 服务层：`src/services/`
   - 命令层：`src/commands/`
   - 配置层：`src/config/`
   - 类型定义：`src/types/`
   - 工具函数：`src/utils/`

### Git规范

**提交信息格式**：
```
<type>(<scope>): <subject>

[optional body]
```

**类型**：
- `feat`: 新功能
- `fix`: 修复bug
- `refactor`: 重构
- `docs`: 文档更新
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例**：
```
feat(questioning): 实现灵根亲和度抽取系统

- 添加 selectPackageWithAffinity 方法
- 实现概率归一化算法
- 支持环境变量开关控制
```

### 版本规范

**语义化版本** (Semantic Versioning)：
- **主版本号**：不兼容的API更改
- **次版本号**：向后兼容的新功能
- **修订号**：向后兼容的bug修复

**示例**：
- v1.1.0 - 新增问道守心系统重构（次版本）
- v1.0.1 - 命令系统优化（修订版）
- v1.0.0 - Buff系统（次版本）

### 数据库迁移

**原则**：
1. 新增字段使用默认值，确保兼容旧数据
2. 字段改名保留旧字段，通过中间件迁移
3. 删除字段前确认无引用

**示例**：
```typescript
// 扩展字段（v1.1.0新增killCount）
ctx.model.extend('xiuxian_player', {
  killCount: { type: 'integer', initial: 0 }  // 使用initial确保旧数据兼容
})
```

## 测试策略

### 单元测试（待实现）

**优先级**：
1. `PathPackageService.checkTriggerConditions()` - 权限检查逻辑
2. `PathPackageService.selectPackageWithAffinity()` - 亲和度选择逻辑
3. `BuffService.calculateBonus()` - 加成计算逻辑
4. `AIService.scorePersonality()` - 性格评分逻辑

### 集成测试（待实现）

**场景**：
1. 完整问心流程（步入仙途）
2. 完整问道流程（问道守心）
3. 修炼和突破流程
4. Buff系统加成验证

### 手动测试

**当前v1.1.0重点测试**：
1. 全局冷却机制：
   - 完成问道包后立即再次使用"问道守心"，应提示冷却中
   - 等待冷却时间后应可再次使用
2. 灵根亲和度：
   - 不同灵根玩家多次触发，观察问道包分布是否符合亲和度配置
3. 权限检查：
   - 创建不同境界/灵根玩家，验证问道包触发条件准确性
4. 精准匹配：
   - 配置 `exactRealm` 的问道包，验证只有特定境界能触发

## 部署流程

### 开发环境部署

```powershell
# 1. 编译
cd D:\项目\修仙2
npm run build

# 2. 部署到Koishi实例
Copy-Item -Path "lib\*" -Destination "C:\Users\TXL\AppData\Roaming\Koishi\Desktop\data\instances\default\node_modules\koishi-plugin-xiuxian-txl\lib\" -Recurse -Force

# 3. 重启Koishi（Web界面或命令行）
```

### 生产环境部署（npm发布）

```bash
# 1. 更新版本号
npm version patch  # 或 minor, major

# 2. 编译
npm run build

# 3. 发布到npm
npm publish

# 4. 在Koishi实例中更新插件
npm update koishi-plugin-xiuxian-txl
```

## 配置参考

### koishi.yml 配置示例

```yaml
plugins:
  # ChatLuna依赖（必须在修仙插件之前加载）
  chatluna:
    defaultChatMode: chat
    defaultModel: zhipu/GLM-4-Flash

  chatluna-zhipu-adapter:
    apiKeys:
      - - YOUR_API_KEY_HERE

  # 修仙插件配置
  xiuxian-txl:
    model: zhipu/GLM-4-Flash        # AI模型选择
    enableFallback: false            # AI降级开关（false=防作弊）
    enableDevTools: false            # 开发者工具（生产环境建议禁用）
```

### 环境变量配置

**位置**：`src/config/constants.ts`

```typescript
export const PathPackageConfig = {
  GLOBAL_COOLDOWN_HOURS: 72,      // 全局冷却时间（小时）
  ENABLE_AFFINITY_BONUS: true,    // 启用灵根亲和度加成
} as const
```

**调整建议**：
- 测试环境：`GLOBAL_COOLDOWN_HOURS: 1` (1小时冷却，方便测试)
- 生产环境：`GLOBAL_COOLDOWN_HOURS: 72` (3天冷却，防止刷包)

## 性能优化记录

### v1.1.0 优化

1. **Tag索引**：`PathPackageService` 使用 `Map<PathPackageTag, Set<string>>` 加速tag查询
2. **亲和度映射**：`Map<string, number>` 缓存亲和度配置，避免重复查找
3. **动态导入**：使用动态 `import()` 避免循环依赖，减少初始加载体积

### 待优化项

1. **会话查询优化**：`checkGlobalCooldown()` 每次查询数据库，可考虑内存缓存
2. **问道包注册**：当前启动时全部注册，未来包数量多时可考虑懒加载
3. **Buff清理**：当前每小时全表扫描，可考虑使用定时任务框架优化

## 常见问题 (FAQ)

### Q: 为什么使用全局冷却而不是单包冷却？

A: 全局冷却设计更简单，且更符合游戏平衡性。如果使用单包冷却，玩家可以频繁切换不同类型的问道包绕过限制。全局冷却确保玩家在固定时间内只能完成一次问道。

### Q: 灵根亲和度是否会导致某些包永远不被触发？

A: 不会。归一化机制确保所有符合条件的包都有触发概率。即使某个包没有任何灵根的亲和度加成，它仍然有基础 `triggerChance` 概率。只是有亲和度的包概率会更高。

### Q: 为什么问道包的 triggerChance 要移到外层？

A: 因为 `triggerChance` 是问道包的固有属性（基础触发概率），不是触发条件。它与玩家的境界、灵根等无关，所以应该放在 `PathPackageTemplate` 外层。`triggerConditions` 内应该只包含需要检查玩家状态的条件。

### Q: AI评分失败时会发生什么？

A: 取决于 `enableFallback` 配置：
- `false`（防作弊模式）：AI失败时问心流程中止，玩家需要重新开始
- `true`（兼容模式）：AI失败时降级使用关键词评分（但可能被作弊）

生产环境建议使用 `false`。

### Q: 如何添加新的问道包？

A: 步骤如下：
1. 在 `src/config/path-packages/` 创建或编辑配置文件
2. 定义 `PathPackageTemplate` 对象（包含questions、optimalScore、rewards等）
3. 在 `src/index.ts` 中使用 `pathPackageService.register()` 注册
4. （可选）在 `spiritual-root-registry.ts` 为某些灵根添加亲和度配置

---

**文档最后更新**：2025-11-22
**对应版本**：v1.1.0
