# Koishi 修仙插件 (koishi-plugin-xiuxian-txl)

一个基于 Koishi 的 QQ 修仙游戏插件，集成 AI 辅助功能，提供沉浸式修仙体验。

## 功能特性

### 当前实现（v1.3.0 + v1.2.0 + v1.1.0 + v1.0.1 + v1.0.0 + v0.6.0）

**问道系统灵活化（v1.3.0新增）**
- ✨ **可变题目数量**：支持1-3题灵活配置（最少1题，最多3题）
- ✨ **智能评分系统**：选择题从配置的 `value` 对象直接读取9维打分，无需硬编码规则
- ✨ **动态UI显示**：题目进度显示自动适应（如 "问题 2/3" 或 "问题 1/1"）
- ✨ **动态AI Prompt**：AI评语根据实际题目数量自动调整
- ✨ **数据库扩展**：新增 `answersJson` 字段存储完整答案数组
- ✨ **配置简化**：
  - 选择题 value 从字符串改为打分对象：`{ kindness: 4, courage: 2 }`
  - 删除未实现的22维性格系统代码，统一使用9维系统
  - 每个问道包可自由组合选择题和开放题

**通用冷却系统与流程优化（v1.2.0新增）**
- ✨ **通用冷却系统**：新建 `xiuxian_cooldown_v3` 表，支持多种冷却类型（命令、技能、物品、事件）
- ✨ **命令级包配置**：支持 `allowedTags` 白名单 + `excludeTags` 黑名单双重筛选
- ✨ **亲和度系统扩展**：
  - Tag级亲和度：提升整类包（如所有demon包+20%）
  - 包ID级亲和度：提升特定包（如inner_demon额外+30%）
  - 两种亲和度可叠加：最终概率 = 基础概率 + tag级加成 + 包ID级加成
- ✨ **流程优化**：
  - 新增 `createQuestioningSession` 方法，避免重复查询
  - 问道守心流程：冷却检查 → 选包 → 直接创建会话
  - 删除冗余的 `ensureGlobalCooldown` 方法
- ✨ **代码清理**：
  - 删除废弃的 `CooldownCheckData` 类型
  - 删除废弃的 `getGlobalCooldownHours` 方法
  - 不再使用玩家表的 `lastQuestioningTime` 字段（保留向后兼容）

**问道守心系统重构（v1.1.0新增）**
- ✨ **全局冷却机制**：移除单包冷却，改为全局冷却（默认8小时），所有问道包共享冷却时间
- ✨ **灵根亲和度系统**：基于玩家灵根提升特定问道包触发概率，概率归一化确保总和100%
- ✨ **增强权限检查**：
  - 大境界精准匹配：`exactRealm: 3` 精确要求特定境界
  - 小境界范围检查：`minRealmLevel/maxRealmLevel` 控制初期/中期/后期/大圆满
  - 灵根白名单/黑名单：`requiredSpiritualRoots` 和 `forbiddenSpiritualRoots`
  - 灵石数量要求：`minSpiritStone` 检查玩家灵石
  - 击杀数量要求：`minKillCount` 检查战绩
  - 条件跳过支持：使用 `false` 值跳过特定检查
- ✨ **问道包配置优化**：
  - `triggerChance` 移至包外层（PathPackageTemplate级别）
  - 全局环境变量控制冷却时间和亲和度开关
- ✨ **问道守心命令重构**：
  - 自动排除"步入仙途"包
  - 使用灵根亲和度智能选择问道包
  - 全局冷却检查和友好提示

**命令系统优化（v1.0.1新增）**
- ✨ **命令别名支持**：所有命令支持省略 `修仙.` 前缀，例如 `天道记录` 或 `修仙 天道记录`
- ✨ **@ 功能扩展**：查询命令支持查看其他玩家
  - `天道记录 @玩家` - 查看其他玩家信息
  - `问心历史 @玩家` - 查看其他玩家问心历史
  - `查看buff @玩家` - 查看其他玩家buff（需开发者权限）
- ✨ **突破机制优化**：区分小境界和大境界突破
  - 小境界突破：100%成功，修为保留
  - 大境界突破：概率成功，修为清零（成功或失败均清零）
  - 动态检测支持未来境界系统扩展
- ✨ **代码复用**：提取 `extractMentionedUserId()` 工具函数统一处理@提及
- ✨ **命令整合**：问道包测试命令统一移至开发者工具（需启用 enableDevTools）

**Buff系统（v1.0.0新增）**
- ✨ **多维度加成**：修炼速度、突破率、修为需求（战力、灵石收益预留）
- ✨ **加成公式**：
  - 修炼倍率 = (全局+永久) × 灵根 × (1+临时)
  - 突破率 = (全局+永久+灵根) + 临时
  - 所需修为 = 设定 × (1+永久+临时)
- ✨ **自动清理**：每小时清理过期buff
- ✨ **堆叠控制**：支持buff堆叠和最大堆叠数限制
- ✨ **多来源支持**：宗门、道具、特殊事件、全局活动等
- 开发者命令（需启用 enableDevTools）：
  - `查看buff @玩家` - 查看玩家所有buff
  - `添加buff @玩家 <类型> <数值> [小时]` - 添加buff
  - `删除buff <buffId>` - 删除指定buff
  - `清空buff @玩家` - 清空玩家所有buff
  - `清理过期buff` - 手动清理过期buff
  - `buff统计` - 查看系统buff统计

**AI开放题评分系统（v0.6.0）**
- ✨ **混合评分机制**：选择题使用规则评分（稳定）+ 开放题使用AI评分（智能）
- ✨ **智能作弊检测**：AI识别prompt注入、要求特定灵根等作弊行为
- ✨ **9维性格量化**：determination、courage、stability、focus、honesty、kindness、greed、impatience、manipulation
- ✨ **降级保护配置**：enableAIScoringFallback开关，控制AI失败时是否使用关键词降级
- ✨ **评分追溯性**：保存choiceScore、aiScores、usedAI等详细评分信息到数据库

**玩家系统（AI驱动）**
- `步入仙途` / `修仙 步入仙途` - 通过问心流程创建角色，AI 智能分配道号和灵根
- `天道记录` / `修仙 天道记录` - 查看修仙信息（支持 `@玩家` 查看他人）

**修炼系统**
- `打坐 [小时]` / `修仙 打坐` - 开始修炼，灵根影响修炼速度
- `突破` / `修仙 突破` - 尝试突破到更高境界
  - 小境界（初期→中期→后期→大圆满）：100%成功，修为保留
  - 大境界（练气→筑基→...）：概率成功，成功或失败均清空修为

**问心系统（AI评估）**
- `问心` / `修仙 问心` - 进行试炼问心（随机路径），获得修为或灵石奖励
- `问心历史` / `修仙 问心历史` - 查看问心记录（支持 `@玩家` 查看他人）

**问道包系统（v0.3.0）**
- ✨ **Tag分类系统**：支持机缘、感悟、魔道、遗迹、情义、欲望等多种类型
- ✨ **9维性格分析**：基于回答计算性格向量（决断、勇气、诚信、善良等）
- ✨ **智能匹配奖励**：根据性格匹配度给予三级奖励（完美契合/良好匹配/普通匹配）
- ✨ **13个问道包**：机缘2个、感悟2个、魔道2个、遗迹2个、情义2个、欲望3个
- 开发者测试命令（需启用 enableDevTools）：
  - `机缘`、`感悟`、`心魔`、`遗迹`、`情义`、`欲望` - 测试对应问道包
  - `问道包统计` - 查看问道包系统统计
  - `问道包列表` - 查看所有问道包
  - `问心列表` - 查看所有问心路径

**AI集成（ChatLuna）**
- ✅ 真实 ChatLuna API 调用（智谱 GLM-4-Flash）
- ✅ 动态模型选择（支持所有 ChatLuna 模型）
- ✅ 可控降级机制（防作弊开关）
- ✅ 智能道号生成（根据回答组合）
- ✅ 性格评估和奖励分配

**灵根系统（11种灵根）**
- **天灵根**：光灵根、暗灵根（修炼+50%，突破+10%）
- **五行灵根**：金木水火土（修炼+30%，突破+5%）
- **真灵根**：气灵根（修炼+40%，突破+8%）
- **伪灵根**：无加成
- **隐藏灵根**：哈根（修炼+100%，突破+15%，战力+50%）

**开发者工具（需启用 enableDevTools）**

灵根统计相关：
- `测试灵根 [次数]` - 模拟灵根分配测试（默认100次，最大1000次）
- `查看统计` - 查看当前所有玩家的实际灵根分布
- `同步统计` - 从玩家表重新统计灵根分布
- `重置统计` - 重置灵根统计数据
- `测试性格 <答案>` - 测试性格分析结果

Buff管理相关：
- `查看buff @玩家` - 查看玩家所有buff（可省略@查看自己）
- `添加buff @玩家 <类型> <数值> [小时]` - 给玩家添加buff
- `删除buff <buffId>` - 删除指定buff
- `清空buff @玩家` - 清空玩家所有buff
- `清理过期buff` - 手动清理过期buff
- `buff统计` - 查看系统buff统计

问道包测试相关：
- `机缘`、`感悟`、`心魔`、`遗迹`、`情义`、`欲望` - 测试对应问道包
- `问道包统计` - 查看问道包完成统计
- `问道包列表` - 查看所有问道包
- `问心列表` - 查看所有问心路径

玩家管理相关：
- `清理玩家 @玩家` - 删除指定玩家的所有数据（包括问心、buff记录）

⚠️ 需要在插件配置中启用「开发者工具」，默认禁用

### 境界系统

练气 → 筑基 → 金丹 → 元婴 → 化神 → 炼虚 → 合体 → 渡劫 → 大乘

每个大境界分为：初期 → 中期 → 后期 → 大圆满（共36个境界等级）

### 计划功能
- 🚧 战斗系统（PVE历练、PVP切磋）
- 🚧 物品系统（背包、商店、丹药）
- 🚧 宗门系统（加入宗门、宗门任务）
- 🚧 更多问道包类型和路径
- 🚧 问心会话持久化（支持重启恢复）

## 部署方法

### 1. 编译插件

```bash
cd D:\项目\修仙2
npm install
npm run build
```

### 2. 部署到 Koishi（开发阶段推荐）

将构建产物复制到实例的插件目录，并在 `koishi.yml` 启用插件。

```powershell
# 1) 确保目标目录存在
New-Item -ItemType Directory -Force -Path "C:\Users\TXL\AppData\Roaming\Koishi\Desktop\data\instances\default\node_modules\koishi-plugin-xiuxian-txl\lib" | Out-Null

# 2) 复制构建产物
Copy-Item -Path "D:\项目\修仙2\lib\*" -Destination "C:\Users\TXL\AppData\Roaming\Koishi\Desktop\data\instances\default\node_modules\koishi-plugin-xiuxian-txl\lib\" -Recurse -Force
```

在实例的 `koishi.yml` 中启用插件：

```yaml
plugins:
  # 确保 ChatLuna 在修仙插件之前加载
  chatluna:
    defaultChatMode: chat
    defaultModel: zhipu/GLM-4-Flash

  chatluna-zhipu-adapter:
    apiKeys:
      - - YOUR_API_KEY_HERE

  xiuxian-txl:
    model: zhipu/GLM-4-Flash        # 选择使用的 AI 模型
    enableFallback: false            # AI 降级开关（false=防作弊模式）
    enableDevTools: false            # 开发者工具（默认禁用，生产环境建议保持禁用）
```

**配置说明**：
- `model`: AI模型选择，支持所有ChatLuna模型
- `enableFallback`: AI评分降级开关，false为防作弊模式
- `enableDevTools`: 开发者工具开关，启用后可使用测试命令和buff管理命令

**v1.1.0 新增配置常量**（位于 `src/config/constants.ts`）：
- `GLOBAL_COOLDOWN_HOURS`: 全局冷却时间（小时），默认8小时
- `ENABLE_AFFINITY_BONUS`: 是否启用灵根亲和度加成，默认true

### 问道包触发条件字段指引

- `minRealm` / `maxRealm`: 控制玩家大境界范围，日志以 `[触发条件检查]` 开头记录实际判定值，`false` 可跳过检查。
- `exactRealm`: 精准匹配大境界，可与小境界字段组合；命中时日志会输出 `exactRealm` 判定信息。
- `minRealmLevel` / `maxRealmLevel`: 限制小境界（初期/中期/后期/大圆满 对应 0-3），仅当玩家境界满足大境界要求时生效。
- `requiredSpiritualRoots`: 灵根白名单，支持单个或数组；`forbiddenSpiritualRoots` 用于黑名单，触发时日志会提示被拒绝的灵根。
- `minSpiritStone`: 要求最低灵石数量；`minKillCount`: 要求最低战绩击杀数。未满足会在日志中输出不足原因。
- `requiredItems` / `requiredQuests`: 预留字段，目前服务端只记录 `TODO` 日志提示，未实际校验，请勿依赖。

> 建议在新增问道包时对照上述字段填写，并观察启动日志中的 `[触发条件检查]` 记录，确保配置与预期一致。

注：开发阶段不再使用 `npm link` 方式，以免引发跨盘/路径解析问题。

### 3. 配置数据库

确保 Koishi 已配置数据库服务（推荐 SQLite）：

```yaml
plugins:
  database-sqlite:
    path: ./data.db
```

## 使用示例

### 步入仙途（AI驱动创角）

```
用户: 步入仙途
Bot: @用户
     ━━━━ 天命问心 ━━━━

     你即将踏入修仙世界，天道将通过问心了解你的本性...

     📝 问题 1/3：
     你在山路上遇到一位受伤的修士，他身上有珍贵的灵药。你会？

     A. 全力救治，不求回报
     B. 救治但希望得到报酬
     C. 权衡利弊后决定
     D. 夺宝而去

     请回复选项字母（如：A）

     ⏱️ 本题限时 60 秒，请及时回复。

用户: A

Bot: @用户
     📝 问题 2/3：
     你的同门师兄嫉妒你的天赋，处处针对你。你会？

     A. 正面对抗，证明实力
     B. 智谋周旋，借势反击
     C. 隐忍蓄势，等待时机
     D. 审时度势，见机行事

     请回复选项字母（如：A）

用户: C

Bot: @用户
     📝 问题 3/3：
     请用一句话描述你的修仙志向

用户: 成为最强者，保护重要的人

Bot: @用户
     ━━━━ 踏入仙途 ━━━━

     ✨ 恭喜你踏入修仙世界！

     🎭 天道评语：
     你心怀善念而不失谨慎，懂得隐忍蓄势，志向远大而不忘本心。

     📜 分配依据：
     你的仁慈之心与隐忍性格相得益彰，赐予道号"慈隐"，木灵根助你稳步前行。

     ━━━━ 你的信息 ━━━━

     👤 道号：慈隐
     🌟 灵根：木灵根
        修炼速度+30%，突破成功率+5%，生生不息，厚积薄发

     愿你在这修仙世界中破开虚妄，证得大道！

     💡 使用 天道记录 查看完整信息

     ━━━━━━━━━━━━━━
```

### 修炼与突破

```
用户: 打坐 2
Bot: @用户 你开始盘膝打坐，进入修炼状态...
     修炼时长：2小时
     预计收益：130修为（木灵根加成 +30%）
     2小时后再次使用本命令结算收益

用户: 天道记录
Bot: @用户
     ━━━━ 天道记录 ━━━━
     👤 道号：慈隐
     ⭐ 境界：练气期初期
     📊 修为：130/250
     💎 灵石：100
     🌟 灵根：木灵根（修炼+30%，突破+5%）
     ⚔️ 战力：750
     📅 入门时间：2025/11/20 10:30:00
     ━━━━━━━━━━━━━━

用户: 突破
Bot: @用户 🎉 突破成功！恭喜你踏入 练气期中期 境界！
     你感觉到体内灵力澎湃，实力大增！
```

### 问心试炼

```
用户: 问心
Bot: @用户
     ━━━━ 道心考验 ━━━━

     你在修炼中遇到瓶颈，需要反思内心...

     📝 问题 1/3：
     ...

用户: （完成3个问题后）

Bot: @用户
     ━━━━ 问心完成 ━━━━

     ✨ 你的道心坚定，临危不乱，是大器之材。

     🎭 问心倾向：正道

     🎁 获得奖励：+350 修为
     💭 你的答案展现了修士应有的品德，天道嘉奖于你。

     ━━━━━━━━━━━━━━
```

### 问道包系统

```
用户: 修仙.机缘
Bot: @用户
     ━━━━━━━━━━━━━━
     💰 破败古宅

     你偶遇一座破败古宅，传闻中曾有前辈高人在此陨落...

     ━━━━━━━━━━━━━━

     【第1题】
     古宅大门虚掩，内部传来淡淡的灵力波动。你会？

     A. 谨慎探查，确认安全后进入
     B. 大胆闯入，机缘不等人
     C. 在外观察，寻找线索
     D. 离开此地，避免风险

     请输入选项字母（A/B/C/D）

     ⏱️ 本题限时 60 秒，请及时回复。

用户: （完成3个问题后）

Bot: @用户
     ━━━━ 问道完成 ━━━━

     📦 破败古宅

     🎯 匹配度：92.3%
     ✨ 等级：完美契合

     💬 天道评语：
     你的谨慎与智慧完美契合此次机缘，获得前辈传承。

     🎁 获得奖励：
        特殊奖励：神秘古籍（可提升悟性）

     💭 你的道心与此处机缘完美契合，实乃天命所归。

     ━━━━━━━━━━━━━━
```

## 技术架构

```
koishi-plugin-xiuxian-txl/
├── src/
│   ├── index.ts                 # 主入口
│   ├── chatluna.ts              # ChatLuna AI服务封装 ✨
│   ├── adapters/                # 适配器层（框架解耦） ✨NEW
│   │   ├── interfaces/          # 接口定义
│   │   │   ├── IAppContext.ts   # 统一上下文接口
│   │   │   ├── IDatabase.ts     # 数据库接口
│   │   │   └── ILogger.ts       # 日志接口
│   │   └── koishi/              # Koishi 框架适配实现
│   │       ├── KoishiAppContext.ts  # 应用上下文适配器
│   │       ├── KoishiDatabase.ts    # 数据库适配器
│   │       ├── KoishiLogger.ts      # 日志适配器
│   │       └── index.ts
│   ├── config/                  # 配置层
│   │   ├── constants.ts         # 境界、游戏参数
│   │   ├── messages.ts          # 所有文案
│   │   ├── spiritual-roots.ts   # 灵根系统定义 ✨
│   │   ├── questioning.ts       # 问心路径配置、AI Prompt
│   │   ├── fate-distribution.ts # 天命概率配置 ✨
│   │   ├── personality-system-config.ts  # 性格系统版本配置
│   │   └── path-packages/       # 问道包配置目录 ✨
│   │       ├── index.ts         # 主入口
│   │       ├── opportunity.ts   # 机缘包配置
│   │       ├── enlightenment.ts # 感悟包配置
│   │       ├── demon.ts         # 魔道包配置
│   │       ├── exploration.ts   # 遗迹包配置
│   │       ├── bond.ts          # 情义包配置 ✨
│   │       └── desire.ts        # 欲望包配置 ✨
│   ├── database/                # 数据库层
│   │   ├── index.ts
│   │   └── models/
│   │       ├── player.ts        # 玩家表（v3）
│   │       ├── questioning.ts   # 问心记录表（v3）
│   │       └── initial-root-stats.ts  # 灵根统计表 ✨
│   ├── services/                # 业务逻辑层（已解耦 ✨NEW）
│   │   ├── index.ts
│   │   ├── player.service.ts    # 玩家服务（✅完全解耦）
│   │   ├── questioning.service.ts # 问心服务（🔄部分解耦）
│   │   ├── path-package.service.ts  # 问道包管理服务（✅完全解耦）
│   │   ├── root-stats.service.ts    # 灵根统计服务（✅完全解耦）
│   │   ├── buff.service.ts      # Buff服务（v1.0.0新增，✅完全解耦）
│   │   └── bonus-calculator.service.ts # 加成计算服务（v1.0.0新增，✅完全解耦）
│   ├── commands/                # 命令层
│   │   ├── index.ts
│   │   ├── player.ts            # 步入仙途、天道记录
│   │   ├── cultivation.ts       # 打坐、突破
│   │   ├── questioning.ts       # 问心相关命令 ✨
│   │   ├── dev-test.ts          # 开发者测试命令（v0.9.1新增）
│   │   ├── dev-buff.ts          # Buff管理命令（v1.0.0新增）
│   │   └── dev-package.ts       # 问道包测试命令（v1.0.1新增）
│   ├── utils/                   # 工具层
│   │   ├── calculator.ts        # 战力、速度计算
│   │   ├── formatter.ts         # 格式化工具
│   │   ├── random.ts            # 随机工具
│   │   ├── common-helpers.ts    # 通用辅助函数（v1.0.1新增）
│   │   ├── ai-helper.ts         # AI 辅助工具 ✨
│   │   ├── fate-calculator.ts   # 天命计算器 ✨
│   │   ├── personality-analyzer.ts # 性格分析器 ✨
│   │   ├── hybrid-personality-analyzer.ts # 混合分析器 ✨
│   │   ├── ai-open-question-scorer.ts # AI开放题评分 ✨
│   │   └── score-matcher.ts     # 分数匹配器 ✨
│   └── types/                   # 类型定义（类型安全增强 ✨）
│       ├── player.ts
│       ├── questioning.ts       # 问心相关接口 ✨
│       ├── path-package.ts      # 问道包类型定义 ✨
│       ├── buff.ts              # Buff类型定义（v1.0.0新增）
│       └── ai-response.ts       # AI响应类型 ✨
└── lib/                         # 编译输出
```

### 架构亮点 ✨

**1. Adapter 层解耦架构（v0.8.1 新增）**
- 所有 Service 层通过 `IAppContext` 接口访问框架功能
- 支持 Koishi 的所有 adapter（QQ/Telegram/Discord 等多平台）
- 易于测试（可用 Mock 对象进行单元测试）
- 框架升级影响范围小（仅 adapter 层需要修改）

**2. 跨平台兼容**
- 消息格式遵循 Satori 标准协议
- 无平台特定 API 调用
- 一次开发，多平台运行

**3. 代码质量**
- TypeScript 编译 0 错误
- 类型安全覆盖率 95%
- 依赖注入模式，职责清晰

## 最近变更

### 2025-11-23 - v1.2.0 通用冷却系统与流程优化

**通用冷却系统**
- ✅ **新建冷却表**：`xiuxian_cooldown_v3` 支持多种冷却类型
  - 冷却类型：command（命令）、skill（技能）、item（物品）、event（事件）、package（问道包）
  - 组合唯一索引：(userId, cooldownType, cooldownKey)
  - 过期时间索引：用于批量清理过期记录
- ✅ **CooldownService 服务**：
  - `checkCooldown()` - 检查冷却状态
  - `setCooldown()` - 设置冷却
  - `clearCooldown()` - 清除冷却
  - `cleanupExpired()` - 批量清理过期记录
- ✅ **命令冷却配置**：`src/config/command-cooldowns.ts`
  - 问道守心：8小时冷却
  - 支持未来扩展更多命令

**命令级包配置**
- ✅ **CommandPackageConfig 接口**：支持白名单+黑名单
  - `allowedTags`: 允许的tag白名单
  - `excludeTags`: 排除的tag黑名单
- ✅ **问道守心配置**：`{ excludeTags: ['initiation'] }`

**亲和度系统扩展**
- ✅ **PackageAffinity 接口扩展**：
  - `tag`: Tag级亲和度，提升整类包
  - `packageId`: 包ID级亲和度，提升特定包
  - `bonusChance`: 额外触发概率，可叠加
- ✅ **计算公式**：最终概率 = 基础概率 + tag级加成 + 包ID级加成

**流程优化**
- ✅ **新增 createQuestioningSession**：直接用已选好的包创建会话，避免重复查询
- ✅ **问道守心命令重构**：
  1. 检查冷却（checkCommandCooldown）
  2. 选包（selectPackageWithAffinity）
  3. 创建会话（createQuestioningSession）
- ✅ **设置冷却时机**：问道完成时（completePackageQuestioning）设置冷却

**代码清理**
- ✅ 删除 `ensureGlobalCooldown` 方法（已废弃）
- ✅ 删除 `getGlobalCooldownHours` 方法（已废弃）
- ✅ 删除 `CooldownCheckData` 类型（已废弃）
- ✅ 更新 `startRandomTrialQuestioning` 使用新冷却系统
- ✅ 更新 `startPackageByTag` 使用新冷却系统

**新增文件**：
- `src/types/cooldown.ts` - 冷却类型定义
- `src/database/models/cooldown.ts` - 冷却表模型
- `src/services/cooldown.service.ts` - 冷却服务
- `src/config/command-cooldowns.ts` - 命令冷却配置

**修改文件**：
- `src/config/spiritual-root-registry.ts` - PackageAffinity 接口扩展
- `src/types/path-package.ts` - 新增 CommandPackageConfig
- `src/database/index.ts` - 注册冷却表
- `src/services/path-package.service.ts` - 重构 selectPackageWithAffinity
- `src/services/questioning.service.ts` - 集成冷却服务、新增 createQuestioningSession
- `src/commands/questioning.ts` - 问道守心命令重构
- `src/types/questioning.ts` - 删除 CooldownCheckData

---

### 2025-01-22 - v1.1.0 问道守心系统修复与优化

**关键Bug修复**
- ✅ **境界检查失效修复**：修复0级炼气玩家触发金丹包（realm=3）的严重bug
  - 根因：错误使用测试方法 `startPackageByTagTest` 跳过了所有检查
  - 修复：改用正式方法 `startPackageByTag`，传入玩家对象进行完整检查
- ✅ **日志输出修复**：日志完全不显示的问题
  - 根因：测试方法跳过了包含日志的代码路径
  - 优化：将关键日志从 debug 改为 info 级别，确保默认可见
- ✅ **冷却机制重构**：8小时冷却限制未生效
  - 旧逻辑：复杂的数据库查询判断包类型（已废弃）
  - 新逻辑：在玩家表新增 `lastQuestioningTime` 字段，直接限制命令本身

**冷却机制说明**
- **命令级冷却**：限制的是"问道守心"命令本身，而非特定问道包
- **实现方式**：
  1. 完成问道守心时更新 `player.lastQuestioningTime`
  2. 触发命令时检查此字段，8小时内拒绝
  3. 不再区分包类型，所有问道包共享冷却
- **涉及文件**：
  - `src/database/models/player.ts` - 新增数据库字段
  - `src/types/player.ts` - 新增类型定义
  - `src/services/questioning.service.ts:739-755` - 冷却检查
  - `src/services/questioning.service.ts:959-962` - 更新完成时间

**问道包管理系统**
- ✅ **数据库表**：新建 `xiuxian_path_packages_v3` 存储包信息和统计
- ✅ **自动同步**：插件启动时自动同步问道包到数据库
- ✅ **统计功能**：记录每个包的触发和完成次数
- ✅ **管理命令**：
  - `问道包管理` - 查看所有包的状态和统计
  - `问道包启用 <包ID>` - 动态启用指定包
  - `问道包禁用 <包ID>` - 动态禁用指定包

**代码质量优化**
- ✅ **删除错误代码**：清理基于错误理解的 `checkGlobalCooldown` 方法
- ✅ **统一检查逻辑**：所有冷却逻辑集中在 `startPackageByTag` 中
- ✅ **简化判断**：不再依赖复杂的数据库查询，直接使用玩家字段
- ✅ **日志优化**：关键日志改为 info 级别，便于问题排查

**修改文件**：
- `src/commands/questioning.ts:70` - 修复代码路径
- `src/database/models/player.ts:48` - 新增 lastQuestioningTime 字段
- `src/types/player.ts:39` - 新增类型定义
- `src/types/path-package-db.ts` - 新建问道包数据库类型
- `src/database/models/path-package.ts` - 新建问道包表模型
- `src/services/path-package.service.ts` - 新增数据库管理方法
- `src/services/questioning.service.ts` - 简化冷却检查逻辑
- `src/commands/dev-package.ts` - 新增管理命令

**详细文档**：见 `MEMORY.md` v1.1.0 章节

---

### 2025-11-22 - v1.0.1 命令系统优化与交互增强

**命令别名支持**
- ✅ **省略前缀**：所有命令支持省略 `修仙.` 前缀
  - 示例：`天道记录`、`打坐 2`、`突破` 等直接使用
  - 保持兼容：`修仙 天道记录` 仍然有效
- ✅ **统一实现**：使用 `.alias()` 方法为每个命令添加别名

**@ 功能扩展**
- ✅ **查看其他玩家**：支持通过@提及查看他人信息
  - `天道记录 @玩家` - 查看其他玩家修仙信息和buff加成
  - `问心历史 @玩家` - 查看其他玩家问心历史
  - `查看buff @玩家` - 查看其他玩家buff（开发者权限）
- ✅ **代码复用**：提取 `extractMentionedUserId()` 工具函数

**突破机制优化**
- ✅ **区分小境界和大境界**：
  - 小境界突破（初期→中期→后期→大圆满）：100%成功，修为保留
  - 大境界突破（练气→筑基→...）：概率成功，修为清零（成功或失败均清零）
- ✅ **动态检测**：使用 `REALM_LEVELS.length - 1` 动态判断，支持未来扩展

**命令整合**
- ✅ **开发者命令重组**：
  - 创建 `dev-package.ts` 整合9个问道包测试命令和问心列表
  - 删除 `修仙.取消问心` 命令（用户体验优化）
  - 移除 `修仙.问心列表`（迁移至开发者工具）
- ✅ **代码清理**：删除 `package-test.ts`，统一命令注册

**修改文件**：
- `src/services/player.service.ts` - 突破逻辑重构（lines 224-342）
- `src/utils/common-helpers.ts` - 新增工具函数
- `src/commands/player.ts` - 添加别名和@功能
- `src/commands/cultivation.ts` - 添加别名
- `src/commands/questioning.ts` - 删除命令、添加别名和@功能
- `src/commands/dev-test.ts`、`dev-buff.ts` - 添加别名、使用common-helpers
- `src/commands/dev-package.ts` - 新增文件（迁移问道包测试命令）
- `src/commands/index.ts` - 更新命令注册

---

### 2025-11-22 - v1.0.0 Buff系统

**核心功能**
- ✅ **Buff系统**：支持修炼速度、突破率、修为需求三大类加成（战力、灵石收益预留）
- ✅ **加成公式**：
  - 修炼倍率 = (全局+永久) × 灵根 × (1+临时)
  - 突破率 = (全局+永久+灵根) + 临时
  - 所需修为 = 设定 × (1+永久+临时)
- ✅ **自动清理**：每小时清理过期buff
- ✅ **堆叠控制**：支持buff堆叠和最大堆叠数限制
- ✅ **多来源支持**：宗门、道具、特殊事件、全局活动等

**数据库变更**
- ✅ **xiuxian_player_v3 新增字段**：
  - `permanentCultivationBonus` - 永久修炼加成（倍率）
  - `permanentBreakthroughBonus` - 永久突破加成（百分比）
  - `permanentCombatPowerBonus` - 永久战力加成（倍率）
  - `permanentSpiritStoneBonus` - 永久灵石收益加成（倍率）
  - `permanentCultivationRequirement` - 永久修为需求倍率
- ✅ **xiuxian_buff_v3 新表**：
  - buffType、buffSource、sourceId、value、isMultiplier
  - startTime、endTime、stackable、maxStacks、description

**新增服务**
- ✅ **BuffService**：buff增删查、自动清理、堆叠控制
- ✅ **BonusCalculatorService**：加成计算、公式封装、详情查询

**开发者命令**（需启用 enableDevTools）
- `修仙.查看buff @玩家` - 查看玩家所有buff（支持@提及）
- `修仙.添加buff @玩家 <类型> <数值> [小时]` - 添加buff
- `修仙.删除buff <buffId>` - 删除指定buff
- `修仙.清空buff @玩家` - 清空玩家所有buff
- `修仙.清理过期buff` - 手动清理过期buff
- `修仙.buff统计` - 查看系统buff统计

**修改文件**：
- `src/services/buff.service.ts` - 新增buff服务
- `src/services/bonus-calculator.service.ts` - 新增加成计算服务
- `src/services/player.service.ts` - 集成buff系统
- `src/types/buff.ts` - buff类型定义
- `src/commands/dev-buff.ts` - 新增buff管理命令
- `src/database/models/player.ts` - 新增永久加成字段
- `src/database/models/buff.ts` - 新增buff表

**详细说明**：见上方"Buff系统（v1.0.0新增）"和"数据库表结构"章节

---

### 2025-11-21 - v0.9.1 命令整理与开发工具

> **注意**：此版本的命令已在 v1.0.1 中进一步优化，新增别名支持并删除部分命令

**命令前缀统一**
- ✅ **统一命名**：所有命令改为 `修仙.xxx` 格式，在 Koishi 指令管理面板统一显示
- ✅ **父命令**：新增 `修仙` 父命令，所有子命令自动分组
- ✅ **影响命令**：
  - `步入仙途` → `修仙.步入仙途`（v1.0.1新增别名支持）
  - `天道记录` → `修仙.天道记录`（v1.0.1新增别名支持）
  - `打坐` → `修仙.打坐`（v1.0.1新增别名支持）
  - `突破` → `修仙.突破`（v1.0.1新增别名支持）
  - `问心` → `修仙.问心`（v1.0.1新增别名支持）
  - `问心历史` → `修仙.问心历史`（v1.0.1新增别名支持和@功能）
  - ~~`问心列表` → `修仙.问心列表`~~（v1.0.1已删除，迁移至开发者工具）
  - ~~`取消问心` → `修仙.取消问心`~~（v1.0.1已删除）

**开发者工具**（需在配置中启用）
- ✅ **配置开关**：在插件配置面板新增「开发者工具」部分
- ✅ **测试命令**：
  - `修仙.测试灵根 [次数]` - 模拟灵根分配测试（v1.0.1新增别名支持）
  - `修仙.查看统计` - 查看当前所有玩家的实际灵根分布（v1.0.1新增别名支持）
  - `修仙.同步统计` - 从玩家表重新统计灵根分布（v1.0.1新增别名支持）
  - `修仙.重置统计` - 重置灵根统计数据（v1.0.1新增别名支持）
  - `修仙.清理玩家 @玩家` - 删除指定玩家的所有数据（v1.0.1改用@提及）
  - `修仙.测试性格 <答案>` - 测试性格分析结果（v1.0.1新增别名支持）
- ✅ **安全设计**：默认禁用，避免污染生产环境

**修改文件**：
- `src/commands/index.ts` - 父命令定义 + 开发工具条件注册
- `src/commands/player.ts` - 2个命令前缀修改（v1.0.1新增别名和@功能）
- `src/commands/cultivation.ts` - 2个命令前缀修改（v1.0.1新增别名）
- `src/commands/questioning.ts` - 4个命令前缀修改（v1.0.1删除2个命令并新增别名和@功能）
- `src/index.ts` - 开发工具配置
- `src/commands/dev-test.ts` - 新增开发者测试命令（v1.0.1新增别名）

**详细文档**：`.claude/v0.9.1-命令整理与开发工具.md`

---

### 2025-11-21 - v0.9.0 灵根注册表系统

**核心重构**
- ✅ **灵根注册表**：引入单灵根概率定义，解决"等级展开导致概率失衡"问题
- ✅ **性格匹配数据化**：将硬编码的性格匹配规则移入注册表配置
- ✅ **代码简化**：删除约100行展开逻辑和硬编码，天命计算器更清晰

**新增文件**：
- `src/config/spiritual-root-registry.ts` - 灵根注册表（单灵根配置）

**修改文件**：
- `src/utils/fate-calculator.ts` - 简化逻辑，使用注册表API

**详细文档**：`.claude/v0.9.0-灵根注册表系统.md`

---

### 2025-11-20 - v0.6.0 AI开放题评分系统 + 关键Bug修复

**AI开放题评分系统**
- ✅ **混合评分算法**：选择题使用规则评分（稳定可靠）+ 开放题使用AI评分（智能理解）
- ✅ **作弊检测增强**：AI能识别prompt注入、要求特定灵根等作弊行为
- ✅ **新增工具类**：`ai-open-question-scorer.ts`（AI评分服务）、`hybrid-personality-analyzer.ts`（混合分析器）
- ✅ **问道包扩展**：支持requiresAI字段和aiHint字段，标记需要AI评分的问题
- ✅ **UI配置**：Koishi控制台新增"AI开放题评分配置"面板
- ✅ **评分追溯**：保存choiceScore、aiScores、usedAI等详细评分信息到数据库

**关键Bug修复（CRITICAL）**
- ✅ **会话重复完成漏洞**：用户快速重复发送答案导致多次完成流程，获得多倍奖励
  - 修复方案：添加 `isCompleting` 并发锁标志，防止并发重复完成
  - 影响：防止刷奖励漏洞，保护游戏经济平衡
- ✅ **choiceScore全为零**：选择题分数计算错误，传递了完整选项文本而非字母
  - 修复方案：将 `.text` 改为 `.letter`，正确传递答案字母
  - 影响：修复后规则评分正常工作
- ✅ **AI评语JSON解析失败**：AI返回的JSON前后有说明文字导致解析失败
  - 修复方案：使用正则提取 `\{[\s\S]*\}` 容忍前后文字
  - 影响：提升AI评语生成成功率
- ✅ **日志级别配置**：在 `koishi.yml` 中添加 `logLevel: 3` 支持debug日志

**问道包更新**
- ✅ 所有现有问道包（13个）已启用AI评分（除INITIATION类型）
- ✅ 更新问道包：opportunity、enlightenment、demon、exploration、desire、bond
- ✅ 每个开放题都添加了 `aiHint` 字段，指导AI评分重点

### 2025-11-20 - 代码质量优化

**类型安全增强**
- ✅ 新增5个类型接口，消除95%的 `any` 类型使用
- ✅ 修复43个 TypeScript 编译错误
- ✅ 类型定义完整性从60%提升到95%

**内存管理优化**
- ✅ 实现自动 session 清理机制（每5分钟）
- ✅ 添加超时检测，自动清除过期会话
- ✅ 新增 `dispose()` 方法用于资源释放
- ✅ 内存泄漏风险从"高"降低到"低"

**新增问道包类型**
- ✅ **情义抉择包**（bond）：故友之约、血脉羁绊
- ✅ **欲望试炼包**（desire）：权力诱惑、财富迷局、红粉骷髅
- ✅ 问道包总数从8个增加到13个
- ✅ 新增测试命令：`修仙.情义`、`修仙.欲望`

**优化成果统计**
| 指标 | 优化前 | 优化后 | 改进 |
|------|--------|--------|------|
| TypeScript 编译错误 | 43个 | 0个 | ✅ 100% |
| any 类型使用 | 15+处 | <5处 | ✅ -67% |
| 类型定义完整性 | 60% | 95% | ✅ +35% |
| 内存泄漏风险 | 高 | 低 | ✅ 显著改善 |
| 问道包数量 | 8个 | 13个 | ✅ +5个 |
| 测试命令 | 4个 | 6个 | ✅ +2个 |

### 2025-11-19 - 问心系统增强

- 强制选项答题严格化：选项题现在仅接受单个大写 ASCII 字母（A/B/C/D），会拒绝小写、全角、带标点或多字符输入
- 每题倒计时支持：对问心类对话增加每题限时机制，默认 60 秒
- 会话级超时配置：超时值可在 `src/config/timeout.json` 中配置
- 答案存储与反作弊：选项题以 `{ letter, text }` 形式保存，增强反作弊检测
- ChatLuna 真实 AI 集成：步入仙途和试炼问心都使用智谱 GLM-4-Flash 生成真实响应
- AI 可控降级开关：`enableFallback` 配置项，默认 `false`（防作弊模式）

### 数据库表结构

**xiuxian_player_v3** - 玩家信息表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | unsigned | 主键（自增） |
| userId | string | QQ用户ID（唯一） |
| username | string | 道号（AI分配） |
| realm | unsigned | 大境界（0-8） |
| realmLevel | unsigned | 小境界（0-3） |
| cultivation | unsigned | 当前修为 |
| cultivationMax | unsigned | 突破所需修为 |
| spiritStone | unsigned | 灵石 |
| spiritualRoot | string | 灵根类型（light/dark/metal/wood/water/fire/earth/qi/pseudo/ha） |
| initialSpiritualRoot | string | 初始灵根（用于统计，不可变） |
| combatPower | unsigned | 战力 |
| status | string | 状态 |
| statusEndTime | timestamp | 状态结束时间 |
| sectId | unsigned | 宗门ID |
| sectContribution | unsigned | 宗门贡献 |
| permanentCultivationBonus | number | 永久修炼加成（倍率，v1.0.0新增） |
| permanentBreakthroughBonus | number | 永久突破加成（百分比，v1.0.0新增） |
| permanentCombatPowerBonus | number | 永久战力加成（倍率，v1.0.0新增） |
| permanentSpiritStoneBonus | number | 永久灵石收益加成（倍率，v1.0.0新增） |
| permanentCultivationRequirement | number | 永久修为需求倍率（v1.0.0新增） |
| createTime | timestamp | 创建时间 |
| lastActiveTime | timestamp | 最后活跃时间 |
| totalCombatWin | unsigned | 总胜场 |
| totalCombatLose | unsigned | 总败场 |

**xiuxian_questioning_v3** - 问心记录表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | unsigned | 主键（自增） |
| userId | string | 用户ID |
| pathId | string | 路径ID |
| pathName | string | 路径名称 |
| answer1 | string | 第1题答案 |
| answer2 | string | 第2题答案 |
| answer3 | string | 第3题答案（文本题） |
| aiResponse | string | AI完整响应（JSON） |
| personality | string | 性格评语 |
| tendency | string | 问心倾向 |
| rewardType | string | 奖励类型 |
| rewardValue | number | 奖励数值 |
| rewardReason | string | 奖励原因 |
| createTime | timestamp | 创建时间 |

**xiuxian_initial_root_stats** - 初始灵根统计表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | unsigned | 主键（自增） |
| rootType | string | 灵根类型 |
| count | unsigned | 分配次数 |
| lastUpdateTime | timestamp | 最后更新时间 |

**xiuxian_buff_v3** - Buff数据表（v1.0.0新增）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | unsigned | 主键（自增） |
| userId | string | 用户ID |
| buffType | string | Buff类型（cultivation_speed/breakthrough_rate/cultivation_requirement等） |
| buffSource | string | Buff来源（sect/item/special/global） |
| sourceId | string | 来源ID（用于标识具体的宗门、物品等） |
| value | number | 加成数值 |
| isMultiplier | boolean | 是否为倍率（true为倍率，false为固定值） |
| startTime | timestamp | 生效时间 |
| endTime | timestamp | 过期时间（null表示永久） |
| stackable | boolean | 是否可堆叠 |
| maxStacks | unsigned | 最大堆叠数 |
| description | string | Buff描述 |

**xiuxian_cooldown_v3** - 冷却数据表（v1.2.0新增）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | unsigned | 主键（自增） |
| userId | string | 用户ID |
| cooldownType | string | 冷却类型（command/skill/item/event/package） |
| cooldownKey | string | 冷却标识（命令名/技能ID/物品ID等） |
| lastTriggerTime | timestamp | 最后触发时间 |
| expiresAt | timestamp | 过期时间 |
| metadata | text | 额外元数据（JSON格式） |

索引：
- 组合唯一索引：(userId, cooldownType, cooldownKey)
- 过期时间索引：expiresAt（用于批量清理）

## 开发工作流

### 标准开发流程

1. **编译插件**
   ```bash
   cd D:\项目\修仙2
   npm run build
   ```

2. **部署到测试环境**
   ```powershell
   Copy-Item -Path 'D:\项目\修仙2\lib\*' -Destination 'C:\Users\TXL\AppData\Roaming\Koishi\Desktop\data\instances\default\node_modules\koishi-plugin-xiuxian-txl\lib\' -Recurse -Force
   ```

3. **重启 Koishi**
   - 在 Koishi 控制台中重启插件或重启整个实例

4. **验证功能**
   - 在 QQ 中测试修改的功能
   - 查看 Koishi 日志确认无错误

### 数据库迁移（如需要）

当数据库表结构变更时：

```bash
# 删除旧表（谨慎操作）
sqlite3 "C:\Users\TXL\AppData\Roaming\Koishi\Desktop\data\instances\default\data\koishi.db" "DROP TABLE IF EXISTS xiuxian_player_v2; DROP TABLE IF EXISTS xiuxian_questioning_v2;"

# 重启 Koishi 会自动创建新表
```

### 调试技巧

**查看日志**：在 `koishi.yml` 中设置日志级别
```yaml
logLevel: 3  # 0=无, 1=error/success, 2=warning/info, 3=debug
```

**查看数据库**：
```bash
sqlite3 "C:\Users\TXL\AppData\Roaming\Koishi\Desktop\data\instances\default\data\koishi.db"
.tables
.schema xiuxian_player_v3
SELECT * FROM xiuxian_player_v3;
```

## 常见问题排查

### ChatLuna 相关

**问题：ctx.chatluna 未注入**
- 原因：插件加载顺序错误
- 解决：在 `koishi.yml` 中确保 ChatLuna 在修仙插件之前
- 参考：PROJECT_MEMORY.md "已修复问题 > v0.5.0 > ChatLuna未注入问题"

**问题：AI 调用失败**
- 检查 ChatLuna 配置是否正确
- 检查 API Key 是否有效
- 查看日志中的详细错误信息
- 考虑开启 `enableFallback: true` 允许降级

### 数据库相关

**问题：unknown field "xxx" in model**
- 原因：数据库表结构与代码不匹配
- 解决：删除旧表，让 Koishi 重建
- 参考：PROJECT_MEMORY.md "已修复问题 > v0.4.0 > 数据库架构不匹配"

### 编译相关

**问题：Module not found 错误**
- 检查 `tsconfig.json` 中的 `moduleResolution` 设置
- 确保使用 `"nodenext"` 而非 `"node"`
- 参考：PROJECT_MEMORY.md "已修复问题 > v0.5.0 > 模块解析不兼容"

### 游戏逻辑相关

**问题：用户快速重复提交获得多倍奖励**
- 原因：并发控制缺失
- 已修复：v0.6.0 添加了 `isCompleting` 锁机制
- 参考：PROJECT_MEMORY.md "已修复问题 > v0.6.0 > 会话重复完成漏洞"

## 开发指南

### 添加新命令

1. 在 `src/commands/` 下创建新的命令文件
2. 在 `src/commands/index.ts` 中导入并注册

```typescript
// src/commands/combat.ts
export function registerCombatCommands(ctx: Context, playerService: PlayerService) {
  ctx.command('历练', '外出历练打怪')
    .action(async ({ session }) => {
      // 你的逻辑
    })
}
```

### 添加新问道包

在 `src/config/path-packages/` 下创建新的问道包配置：

```typescript
// src/config/path-packages/custom.ts
import { PathPackageTemplate } from '../../types/path-package'

export const customPackages: PathPackageTemplate[] = [
  {
    id: 'custom_example',
    name: '自定义问道包',
    description: '这是一个示例问道包',
    tags: ['custom'],
    triggerConditions: {
      minRealm: 0,
      cooldownHours: 24,
      triggerChance: 0.1
    },
    questions: [
      // 3个问题...
    ],
    optimalScore: {
      target: {
        determination: 7,
        courage: 6,
        // ...其他维度
      },
      rewards: {
        perfect: { type: 'cultivation', value: 200, aiPromptHint: '...' },
        good: { type: 'spirit_stone', value: 100, aiPromptHint: '...' },
        normal: { type: 'spirit_stone', value: 30, aiPromptHint: '...' }
      }
    }
  }
]
```

然后在 `src/config/path-packages/index.ts` 中注册：

```typescript
import { customPackages } from './custom'

export const ALL_PATH_PACKAGES: PathPackageTemplate[] = [
  // ...其他包
  ...customPackages
]
```

### 添加新服务

在 `src/services/` 下创建新的服务类：

```typescript
// src/services/combat.service.ts
export class CombatService {
  constructor(private ctx: Context) {}

  async fight(attackerId: string, defenderId: string) {
    // 战斗逻辑
  }
}
```

### 修改游戏参数

编辑 `src/config/constants.ts`：

```typescript
export const GameConfig = {
  CULTIVATION_BASE_SPEED: 10,  // 修炼速度
  BREAKTHROUGH_BASE_RATE: 0.5, // 突破成功率
  // ...
}
```

## 后续计划

### 阶段二：战斗与物品
- [ ] 战斗系统（PVE历练、PVP切磋）
- [ ] 物品系统（背包、商店）
- [ ] 丹药系统（加速修炼、提升突破率）
- [ ] 灵石获取途径

### 阶段三：问心系统优化
- [x] 基础问心流程
- [x] AI 评估与奖励
- [x] 多路径支持
- [x] 路径包分类系统
- [x] 步入仙途集成问心
- [x] 智能道号生成
- [x] 问道包 Tag 系统（13个问道包）
- [ ] 问心会话持久化（支持重启恢复）
- [ ] 更多问题类型（多选、排序）
- [ ] 问心路径解锁机制

### 阶段四：深度 AI 集成
- [x] ChatLuna 基础集成（问心系统）✅
- [x] 真实 ChatLuna API 调用（智谱 GLM-4-Flash）✅
- [x] 智能模拟响应（开发模式/降级模式）✅
- [x] AI 可控降级开关（防作弊机制）✅
- [x] 动态模型选择（支持所有 ChatLuna 模型）✅
- [ ] 意图识别（用户问题 → 推荐命令）
- [ ] 实时注入游戏上下文
- [ ] 智能推荐下一步操作

### 后续功能
- [ ] 宗门系统
- [ ] 排行榜
- [ ] 任务系统
- [ ] 随机事件

## 许可证

MIT License
