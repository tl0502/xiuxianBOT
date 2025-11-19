# Koishi 修仙插件 (koishi-plugin-xiuxian-txl)

一个基于 Koishi 的 QQ 修仙游戏插件，带有 AI 辅助功能。

## 功能特性

### 当前实现（v0.2.0 - 架构重构版）

**玩家系统**
- `步入仙途` - 创建角色，随机生成灵根资质
- `天道记录` - 查看完整修仙信息（境界、修为、灵石、战力等）

**修炼系统**
- `打坐 [小时]` - 开始修炼，获得修为
- `突破` - 尝试突破到更高境界

### 境界系统
练气 → 筑基 → 金丹 → 元婴 → 化神 → 炼虚 → 合体 → 渡劫 → 大乘

每个大境界分为：初期 → 中期 → 后期 → 大圆满

### 计划功能
- 🚧 战斗系统（PVE历练、PVP切磋）
- 🚧 物品系统（背包、商店、丹药）
- 🚧 宗门系统（加入宗门、宗门任务）
- 🚧 AI智能辅助（命令推荐、游戏指引）

## 部署方法

### 1. 编译插件

```bash
cd D:\项目\修仙2
npm install
npm run build
```

### 2. 部署到 Koishi

将 `lib` 目录复制到 Koishi 插件目录：

```bash
xcopy /E /Y D:\项目\修仙2\lib C:\Users\TXL\AppData\Roaming\Koishi\Desktop\data\instances\default\node_modules\koishi-plugin-xiuxian-txl\lib
```

或在 `koishi.yml` 中使用本地路径：

```yaml
plugins:
  xiuxian-txl:
    $path: D:\项目\修仙2
```

### 3. 配置数据库

确保 Koishi 已配置数据库服务（推荐 SQLite）：

```yaml
plugins:
  database-sqlite:
    path: ./data.db
```

## 使用示例

```
用户: 步入仙途
Bot: @用户 恭喜你踏入修��世界！
     ✨ 你的仙途由此开启 ✨
     道号：张三
     灵根资质：75
     ⭐ 优秀灵根，修炼速度将远超常人
     ...

用户: 打坐 2
Bot: @用户 你开始盘膝打坐，进入修炼状态...
     修炼时长：2小时
     预计收益：94修为
     2小时后再次使用本命令结算收益

用户: 天道记录
Bot: @用户
     ━━━━ 天道记录 ━━━━
     👤 道号：张三
     ⭐ 境界：练气期初期
     📊 修为：94/250
     💎 灵石：100
     🌟 灵根：75
     ⚔️ 战力：750
     📅 入门时间：2025/11/19 10:30:00
     ━━━━━━━━━━━━━━

用户: .���破
Bot: @用户 🎉 突破成功！恭喜你踏入 练气期中期 境界！
     你感觉到体内灵力澎湃，实力大增！
```

## 技术架构

```
koishi-plugin-xiuxian-txl/
├── src/
│   ├── index.ts                 # 主入口
│   ├── config/                  # 配置
│   │   ├── constants.ts         # 游戏常量（境界、参数等）
│   │   └── messages.ts          # 消息文案
│   ├── database/                # 数据库
│   │   ├── index.ts             # 数据��初始化
│   │   └── models/player.ts     # 玩家模型
│   ├── services/                # 业务逻辑
│   │   └── player.service.ts    # 玩家服务
│   ├── commands/                # 命令
│   │   ├── index.ts             # 命令注册
│   │   ├── player.ts            # 玩家命令
│   │   └── cultivation.ts       # 修炼命令
│   ├── utils/                   # 工具
│   │   ├── calculator.ts        # 计算函数
│   │   ├── formatter.ts         # 格式化
│   │   └── random.ts            # 随机数
│   └── types/                   # 类型定义
│       └── player.ts            # 玩家类型
├── lib/                         # 编译输出
├── package.json
└── tsconfig.json
```

### 数据库表结构

**xiuxian_player** - 玩家信息表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | unsigned | 主键���自增） |
| userId | string | QQ用户ID（唯一） |
| username | string | 道号 |
| realm | unsigned | 大境界（0-8） |
| realmLevel | unsigned | 小境界（0-3） |
| cultivation | unsigned | 当前修为 |
| cultivationMax | unsigned | 突破所需修为 |
| spiritStone | unsigned | 灵石 |
| spiritualRoot | unsigned | 灵根（1-100） |
| combatPower | unsigned | 战力 |
| status | string | 状态 |
| statusEndTime | timestamp | 状态结束时间 |
| createTime | timestamp | 创建时间 |

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
- 战斗系统（简单战力对比）
- 物品系统（背包、商店）
- 灵石获取途径

### 阶段三：AI知识库
- 命令知识库构建
- 简单关键词匹配
- `.帮助` 智能搜索

### 阶段四：深度AI集成
- 与 ChatLuna 集成
- 意图识别
- 个性化推荐

## 许可证

MIT License
