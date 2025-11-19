# Koishi 修仙插件 (koishi-plugin-xiuxian)

一个基于 Koishi 的 QQ 修仙游戏插件，带有 AI 辅助功能。

## 功能特性

### 当前实现（v0.1.0 - 可行性测试版）
- ✅ `.步入仙途` - 创建角色，开启修仙之旅
- ✅ `.天道记录` - 查看个人修仙信息

### 计划功能
- 🚧 修炼系统（打坐、突破、境界提升）
- 🚧 战斗系统（PVE、PVP）
- 🚧 物品系统（背包、商店）
- 🚧 AI智能辅助（命令推荐、游戏指引）

## 部署方法

### 方式一：本地开发部署

#### 1. 编译插件

在插件目录下执行：

```bash
npm install
npm run build
```

#### 2. 在 Koishi 中加载

有两种方式：

**方法 A：使用本地插件（推荐用于开发）**

在你的 Koishi 实例的 `koishi.yml` 配置文件中添加：

```yaml
plugins:
  xiuxian:
    $path: D:\项目\修仙2  # 替换为你的插件实际路径
```

**方法 B：npm link（开发模式）**

```bash
# 在插件目录下
npm link

# 在 Koishi 实例目录下
npm link koishi-plugin-xiuxian
```

然后在 Koishi 控制台中启用插件。

#### 3. 配置数据库

确保你的 Koishi 已配置好数据库服务。推荐使用 SQLite（无需额外配置）：

```yaml
plugins:
  database-sqlite:
    path: ./data.db
```

### 方式二：生产部署

#### 1. 构建插件

```bash
npm run build
```

#### 2. 发布到 npm（可选）

```bash
npm publish
```

#### 3. 在 Koishi 中安装

```bash
# 在 Koishi 实例目录下
npm install koishi-plugin-xiuxian
```

或直接在 Koishi 控制台的插件市场中搜索安装。

## 使用说明

### 命令列表

| 命令 | 别名 | 说明 |
|------|------|------|
| `.步入仙途` | `步入仙途` | 创建角色，角色名为你的 QQ 昵称 |
| `.天道记录` | `天道记录` | 查看你的修仙信息 |

### 使用示例

```
用户: .步入仙途
Bot: @用户 恭喜你踏入修仙世界！
     ✨ 你的仙途由此开启 ✨
     道号：张三
     愿你在这修仙世界中破开虚妄，证得大道！
     💡 使用 .天道记录 查看你的信息

用户: .天道记录
Bot: @用户
     ━━━━ 天道记录 ━━━━
     👤 道号：张三
     📅 入门时间：2025/11/18 21:30:00
     ━━━━━━━━━━━━━━
```

## 技术架构

```
koishi-plugin-xiuxian/
├── src/
│   ├── index.ts       # 主插件文件（命令注册）
│   └── database.ts    # 数据库表定义
├── lib/               # 编译输出目录
├── package.json
├── tsconfig.json
└── README.md
```

### 数据库表结构

**xiuxian_player** - 玩家信息表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | unsigned (自增) | 主键 |
| userId | string (唯一) | QQ用户ID |
| username | string | 玩家名字（QQ昵称） |
| createTime | timestamp | 创建时间 |

## 开发指南

### 添加新命令

在 `src/index.ts` 中添加：

```typescript
ctx.command('你的命令名', '命令描述')
  .alias('.你的命令名')
  .action(async ({ session }) => {
    // 你的逻辑
  })
```

### 扩展数据库表

1. 在 `src/database.ts` 中修改 `Player` 接口
2. 在 `initDatabase` 函数中添加新字段

```typescript
export interface Player {
  // ... 现有字段
  level: number          // 新增字段：等级
  exp: number           // 新增字段：经验值
}

ctx.model.extend('xiuxian_player', {
  // ... 现有字段
  level: 'unsigned',
  exp: 'unsigned',
})
```

### 调试

开启 Koishi 的调试模式：

```bash
# 在 Koishi 实例目录下
koishi start --log-level debug
```

查看插件日志：

```typescript
ctx.logger('xiuxian').info('你的日志信息')
```

## 后续计划

### 阶段二：游戏内容扩充
- 境界系统（练气、筑基、金丹...）
- 修炼系统（打坐、闭关、突破）
- 简单战斗（打怪、PVP）

### 阶段三：AI 知识库集成
- 游戏命令索引
- 智能命令推荐
- 新手引导

### 阶段四：深度 AI 辅助
- 意图识别
- 上下文记忆
- 主动提醒

## 常见问题

### Q: 插件启动后找不到命令？
A: 检查 Koishi 控制台中插件是否启用，确保数据库服务已加载。

### Q: 数据库表没有自动创建？
A: 重启 Koishi 或使用 `ctx.database.drop()` 后重新创建表。

### Q: 如何重置玩家数据？
A: 使用数据库管理工具删除 `xiuxian_player` 表的对应记录。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
