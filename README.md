# Koishi 修仙插件 (koishi-plugin-xiuxian-txl)

一个基于 Koishi 的 QQ 修仙游戏插件，集成 AI 辅助功能，提供沉浸式修仙体验。

## 功能特性

### 当前实现（v0.6.0 + v0.5.0 + v0.3.0扩展）

**AI开放题评分系统（v0.6.0新增）**
- ✨ **混合评分机制**：选择题使用规则评分（稳定）+ 开放题使用AI评分（智能）
- ✨ **智能作弊检测**：AI识别prompt注入、要求特定灵根等作弊行为
- ✨ **9维性格量化**：determination、courage、stability、focus、honesty、kindness、greed、impatience、manipulation
- ✨ **降级保护配置**：enableAIScoringFallback开关，控制AI失败时是否使用关键词降级
- ✨ **评分追溯性**：保存choiceScore、aiScores、usedAI等详细评分信息到数据库

**玩家系统（AI驱动）**
- `步入仙途` - 通过问心流程创建角色，AI 智能分配道号和灵根
- `天道记录` - 查看完整修仙信息（境界、修为、灵石、战力、灵根等）

**修炼系统**
- `打坐 [小时]` - 开始修炼，灵根影响修炼速度
- `突破` - 尝试突破到更高境界，灵根影响成功率

**问心系统（AI评估）**
- `问心` - 进行试炼问心（随机路径），获得修为或灵石奖励
- `问心列表` - 查看所有可用的问心路径
- `问心历史` - 查看历史问心记录
- `取消问心` - 中途退出当前问心

**问道包系统（v0.3.0新增）**
- ✨ **Tag分类系统**：支持机缘、感悟、魔道、遗迹、情义、欲望等多种类型
- ✨ **9维性格分析**：基于回答计算性格向量（决断、勇气、诚信、善良等）
- ✨ **智能匹配奖励**：根据性格匹配度给予三级奖励（完美契合/良好匹配/普通匹配）
- ✨ **13个问道包**：机缘2个、感悟2个、魔道2个、遗迹2个、情义2个、欲望3个
- 测试命令：`修仙.机缘`、`修仙.感悟`、`修仙.心魔`、`修仙.遗迹`、`修仙.情义`、`修仙.欲望`
- `修仙.问道包统计` - 查看问道包系统统计
- `修仙.问道包列表 [tag]` - 查看指定类型的问道包

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
    model: zhipu/GLM-4-Flash     # 选择使用的 AI 模型
    enableFallback: false         # AI 降级开关（false=防作弊模式）
```

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
│   │       ├── bond.ts          # 情义包配置 ✨新增
│   │       └── desire.ts        # 欲望包配置 ✨新增
│   ├── database/                # 数据库层
│   │   ├── index.ts
│   │   └── models/
│   │       ├── player.ts        # 玩家表（v3）
│   │       ├── questioning.ts   # 问心记录表（v3）
│   │       └── initial-root-stats.ts  # 灵根统计表 ✨
│   ├── services/                # 业务逻辑层
│   │   ├── index.ts
│   │   ├── player.service.ts    # 玩家服务
│   │   ├── questioning.service.ts # 问心服务 ✨
│   │   ├── path-package.service.ts  # 问道包管理服务 ✨
│   │   └── root-stats.service.ts    # 灵根统计服务 ✨
│   ├── commands/                # 命令层
│   │   ├── index.ts
│   │   ├── player.ts            # 步入仙途、天道记录
│   │   ├── cultivation.ts       # 打坐、突破
│   │   ├── questioning.ts       # 问心相关命令 ✨
│   │   └── package-test.ts      # 问道包测试命令 ✨
│   ├── utils/                   # 工具层
│   │   ├── calculator.ts        # 战力、速度计算
│   │   ├── formatter.ts         # 格式化工具
│   │   ├── random.ts            # 随机工具
│   │   ├── ai-helper.ts         # AI 辅助工具 ✨
│   │   ├── fate-calculator.ts   # 天命计算器 ✨
│   │   ├── personality-analyzer.ts # 性格分析器 ✨
│   │   └── score-matcher.ts     # 分数匹配器 ✨
│   └── types/                   # 类型定义（类型安全增强 ✨）
│       ├── player.ts
│       ├── questioning.ts       # 5个新接口 ✨
│       └── path-package.ts      # 问道包类型定义 ✨
└── lib/                         # 编译输出
```

## 最近变更

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
| combatPower | unsigned | 战力 |
| status | string | 状态 |
| statusEndTime | timestamp | 状态结束时间 |
| sectId | unsigned | 宗门ID |
| sectContribution | unsigned | 宗门贡献 |
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
