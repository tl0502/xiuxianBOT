# Copilot / Agent Instructions — koishi-plugin-xiuxian-txl

目标：让 AI 编码代理快速理解并在此仓库中高效工作。

要点摘要：
- 主入口：`src/index.ts`。AI 集成点：`src/chatluna.ts`（ChatLuna 封装）。
- 主要模块：`src/commands/`（命令层），`src/services/`（业务逻辑），`src/config/`（游戏配置 & Prompt），`src/utils/`（工具类），`src/database/models/`（表模型）。
- 编译产物位于 `lib/`，开发时把 `lib/*` 复制到本地 Koishi 插件目录（见 README 中的 PowerShell 示例）。

工作流（快速上手）：
- 安装与构建：在项目根目录运行 `npm install`，`npm run build`（TypeScript -> `lib/`）。
- 本地调试：将构建产物复制到 Koishi 实例插件目录（README 提供了 `Copy-Item` PowerShell 命令）。确保 `chatluna` 在 `xiuxian-txl` 之前加载。
- 数据库：插件需要 Koishi 的数据库插件（建议 SQLite，配置示例在 README）。

代码与约定（请遵守）：
- 选项题严格输入：选项题只接受单个大写 ASCII 字母（`A`/`B`/`C`/`D`）；实现和校验在 `src/commands/questioning.ts` 与 `src/services/questioning.service.ts`。
- 答案持久化格式：选项题以 `{ letter, text }` 形式保存到 `xiuxian_questioning_v3` 表（参见 `src/database/models/questioning.ts`）。
- 并发保护：问心/问道类流程使用 `isCompleting` 并发锁防止重复完成（见 `src/services/questioning.service.ts`）。在修改业务流时保留该保护。
- AI 输出解析：项目容错策略使用正则提取 JSON，例如 `/\{[\s\S]*\}/`，以容忍模型在 JSON 前后附加说明文字（见 `utils/ai-open-question-scorer.ts`）。

AI / Prompt 相关（修改时优先注意）：
- Prompt 与路径配置位于 `src/config/questioning.ts` 及 `src/config/path-packages/*`。新增或调整 Prompt 时，同时更新对应 `aiHint` 字段以稳定评分行为。
- AI 评分代码位于 `src/utils/ai-open-question-scorer.ts` 与 `src/utils/hybrid-personality-analyzer.ts`（混合评分策略）。要调整评分流程，请在这两个文件中修改解析与打分逻辑。
- 可控降级：配置项 `enableFallback`（在插件配置中）控制是否在 AI 失败时使用关键词降级策略，默认 `false`（防作弊模式）。

项目结构示例引用（查阅这些文件以快速定位逻辑）：
- 命令注册：`src/commands/index.ts`, 单命令示例 `src/commands/player.ts`, `src/commands/questioning.ts`。
- 业务实现：`src/services/player.service.ts`, `src/services/questioning.service.ts`, `src/services/path-package.service.ts`。
- 配置与包：`src/config/path-packages/`（13 个问道包），`src/config/constants.ts`, `src/config/messages.ts`。
- AI 封装：`src/chatluna.ts`（与 `lib/chatluna.js` 对应），测试或模拟模式逻辑也在此处。

常见修改场景与示例：
- 添加新命令：在 `src/commands/` 新建文件并在 `src/commands/index.ts` 中导出并注册（README 示例）。
- 新增问道包：在 `src/config/path-packages/` 新建配置文件并在 `src/config/path-packages/index.ts` 中合并到 `ALL_PATH_PACKAGES`（README 示例代码段）。
- 调整 AI Prompt：修改 `src/config/questioning.ts` 或单个问道包中 `aiHint`，并在 `src/utils/ai-open-question-scorer.ts` 校验解析稳定性。

调试与日志：
- 在 `koishi.yml` 中可设置 `logLevel: 3` 以启用调试日志（README）。
- 观察会话/内存：本仓库已实现 session 自动清理与超时（每 5 分钟清理），修改会话相关逻辑时注意 `dispose()` 与超时实现（见 `src/utils` 或 `src/services` 中会话管理代码）。

安全与反作弊要点（不要绕过这些）：
- 不要移除对答案格式的严格校验（A/B/C/D 大写）；移除会破坏反作弊行为检测。
- AI 降级行为受 `enableFallback` 控制，默认关闭以防注入/作弊。若需要开启，务必同时加强 prompt 校验与日志审计。

开发者提示（快速查找）：
- ChatLuna 集成：`src/chatluna.ts`、`lib/chatluna.js`
- AI 打分：`src/utils/ai-open-question-scorer.ts`
- 混合性格分析：`src/utils/hybrid-personality-analyzer.ts`
- 问道包配置：`src/config/path-packages/`（查看 `opportunity.ts`, `enlightenment.ts` 等）
- 数据模型：`src/database/models/`（`player.ts`, `questioning.ts`, `initial-root-stats.ts`）

如果你是 AI 代理要做的第一件事：
1. 阅读 `src/index.ts`、`src/chatluna.ts`、`src/commands/questioning.ts`、`src/services/questioning.service.ts`、`src/config/path-packages/*`。
2. 运行 `npm install && npm run build` 并按 README 中的 PowerShell 命令将 `lib/` 拷贝到 Koishi 测试实例，然后在 `koishi.yml` 中启用 `chatluna`（置于 `xiuxian-txl` 之前）。

反馈请求：我已基于 README 与项目文件整理以上要点。请告诉我是否需要额外包含：
- 更详细的代码导航（按函数/类列出），或
- 具体文件内的 TODO/修复点摘录，或
- 将说明翻译为中文/英文双语版。

**详细代码导航**

以下按文件列出仓库中最重要的类/函数、它们的位置及简要行为描述——AI 代理应优先阅读这些符号以快速建立执行上下文。

- **`src/index.ts`**: 插件入口
	- `export const name` / `inject`: 插件元信息与依赖注入（需 `database`，可选 `chatluna`）。
	- `Config` (Koishi Schema): 所有运行时开关（AI、降级、性格系统版本等）。
	- `apply(ctx, config)`: 初始化数据库、设置性格系统、注册 `chatluna` 插件（如果配置）、调用 `registerCommands` 并记录启动日志。

- **`src/chatluna.ts`**: ChatLuna / AI 封装
	- `export class XiuxianAIService extends Service`:
		- `constructor(ctx, config)`: 在 `ready` 时通过 `chatluna.createChatModel` 初始化模型。
		- `async generate(prompt): Promise<string | null>`: 调用模型并返回文本；出错返回 `null`。
		- `isAvailable()`: 是否有可用模型引用。
		- `isFallbackEnabled()`: 是否允许降级到模拟响应（由插件配置控制）。
	- `apply(ctx, config)`: 将服务注册到 `ctx`，并扩展 `Context.xiuxianAI`。

- **`src/commands/questioning.ts`**: 问心命令与中间件（交互层）
	- `registerQuestioningCommands(ctx, playerService, questioningService)`:
		- 注册命令：`问心列表`、`问心`、`取消问心`、`问心历史`。
		- 中间件：当用户处于问心会话中，拦截并把普通输入当作答案提交；会区分问道包（package）和 INITIATION（注册流程）。
		- 命令输出使用 `utils/formatter.ts` 的 `atMessage`、`koishi` 的 `h` 渲染富文本。

- **`src/services/questioning.service.ts`**: 问心与问道包的核心业务逻辑（强烈推荐完整阅读）
	- 类: `QuestioningService`
		- `constructor(ctx)`: 初始化 `AIHelper`、`PlayerService`、`PathPackageService`、`HybridPersonalityAnalyzer`，并注册 `ALL_PATH_PACKAGES`，启动会话清理定时器。
		- 会话管理：`sessions: Map<string, QuestioningSession>`，方法 `getSession`, `isInQuestioning`, `cancelQuestioning`, `dispose`。
		- 会话超时：`getDefaultTimeoutSeconds()` 从 `src/config/timeout.json` 读取，默认 60s；定期清理在 `cleanupExpiredSessions()`。
		- 路径与冷却：`getAvailablePaths(player)`, `getPathById(pathId)`, `checkCooldown(userId, pathId)`。
		- 传统问心逻辑（INITIATION）:
			- `startInitiationQuestioning(userId)`：创建会话并返回第一题。
			- `submitAnswer(userId, answer)`：严格的选项校验（只接受单个大写字母），开放题反作弊检查 `detectExploitation`，完成后调用 `completeInitiationQuestioning`。
			- `completeInitiationQuestioning(...)`：调用 `HybridPersonalityAnalyzer`、`AIHelper.generateInitiationResponse`，创建玩家、更新灵根统计、持久化记录到 `xiuxian_questioning_v3`。
		- 问道包逻辑（TRIAL / 包机制）:
			- `startRandomTrialQuestioning(userId, player)`：路径选择、冷却检查、创建会话。
			- `startPackageByTag(...)` / `startPackageByTagTest(...)`：按 Tag 启动包（测试用的会跳过条件）。
			- `submitPackageAnswer(userId, answer)` -> `handlePackageAnswer(...)`：与 `submitAnswer` 类似，但最终走 `completePackageQuestioning`。
			- `completePackageQuestioning(...)`：调用 `HybridPersonalityAnalyzer.analyze`（选择题规则 + AI 评估开放题）、计算匹配 `calculateMatchResult`、调用 `generatePackageEvaluation` 生成 AI 评语并持久化、发放奖励。
		- 辅助方法：`applyReward(userId, type, value)`, `getRewardDescription(...)`, `detectExploitation(text)`（反作弊关键逻辑，包含关键词列表与严重度判断）。

- **`src/services/path-package.service.ts`**: 问道包注册与查询
	- 类: `PathPackageService`
		- `register(pkg, enabled)`, `registerAll(packages)`, `unregister(id)`, `setEnabled(id, enabled)`。
		- 查询与随机：`getById`, `getByTag`, `query(options)`, `getRandomByTag`, `getRandomByTagNoCheck`, `getRandomByChance`。
		- 条件检查 `checkTriggerConditions` 与冷却 `checkCooldown(userId, packageId)`。

- **`src/utils/ai-open-question-scorer.ts`**: AI 开放题评分器（核心 AI 接口）
	- 类: `AIOpenQuestionScorer`
		- `scoreOpenQuestion(question, answer, options)`: 构建 prompt 调用 `ctx.xiuxianAI.generate`，解析 JSON（容错提取 `{...}`），验证并 clamp 分数，支持 `enableFallback` 降级到 `getFallbackScore`。
		- `scoreMultipleOpenQuestions(...)`: 合并多个开放题批量评分。
		- `scoreInitiationOpenQuestion(answer, previousAnswers, options)`: INITIATION 专用的更保守 prompt、评分范围与逻辑。
		- `parseAIResponse(response)`: 清理 code block、JSON 解析并保证 9 维度存在。
		- `getFallbackScore(answer)`: 关键词规则降级逻辑（重要：实现了防作弊默认策略）。

- **`src/config/path-packages/index.ts`**: 问道包配置导出
	- `ALL_PATH_PACKAGES`: 从 `initiation`, `trial`, `opportunity`, `enlightenment`, `demon`, `exploration`, `bond`, `desire` 中聚合所有包；路径包模板位于 `src/config/path-packages/*`。
	- 导出辅助函数：`getPackagesByTag`, `getRandomInitiationPath`, `getPackageStats`。

阅读建议与优先级：
- 首读（高优先级）：`src/services/questioning.service.ts`（理解会话流、并发保护与AI交互）、`src/utils/ai-open-question-scorer.ts`（AI评分细节、降级策略）、`src/chatluna.ts`（AI模型初始化与调用）。
- 次读（中优先级）：`src/commands/questioning.ts`（交互/中间件）、`src/services/path-package.service.ts`（包管理）、`src/config/path-packages/*`（具体问道包数据与 `aiHint`）。
- 低优先级：`src/services/player.service.ts`、`src/services/root-stats.service.ts`、`src/utils/*`（formatter/calculator/fate），按需阅读以实现特定功能。

如果你希望，我可以把上述导航转换为机器可解析的符号清单（CSV/JSON），便于快速索引或自动化审查。请确认是否需要。 
