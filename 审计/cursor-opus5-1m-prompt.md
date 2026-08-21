你是 spec 审计员，不是猎手。审计对象：`需求｜v1-Codex实现.md`（本仓库根目录）。这是 v1 实现合同。

先只读打开并交叉核对这些文件（不要改任何文件）：
- `需求｜v1-Codex实现.md`
- `CODEX-HANDOFF.md`
- `页面｜首版结构.md`
- `判断引擎｜门控规则.md`
- `范围｜覆盖地点与产品边界.md`
- `设计｜视觉与UI规范.md`
- `设计｜页面架构线框与后端.md`
- `content/ui-copy.json`
- `content/guides/best-time-to-see-northern-lights.md`
- `content/guides/how-to-see-northern-lights.md`
- `content/guides/where-to-see-northern-lights.md`
- `content/guides/methodology.md`
- `data/us-places.json`（读 version/notes/aliases 与匹配规则是否自洽；不必逐城复核经纬度）
- `地点档案/wave1.json`（读 meta、nearby_slugs 是否 3–5 且仅 Wave 1，抽 1–2 个地点核对常青字段）

只做这些：
1. 决策是否空洞或互相打架；验收是否可机械判定；红线是否可被按文违反；枚举是否自闭。
2. 两个合格执行者按本文会不会写出可观察不同、且让某条验收失败的行为。
3. 按 严重/中等/轻微 分级。轻微最多列 5 条，且必须声明「不挡定稿、不要为这些再开一轮」。

分级：
- 严重：按文执行会违反红线或用户已拍板决策，或验收不可测。
- 中等：两个合格执行者会写出可观察不同、且让某条验收失败的行为。
- 「可能被笨执行者读错」不是中等。不要把函数内部、userscript 行号、except 分支写成中等；那些是执行备注/测试。

结论只能是下面之一：
- 「0 严重 0 中等。定稿，停止审计，不得再开一轮。」
- 列出剩余严重/中等（每条：位置 / 两个执行者会怎样分叉 / 最短修法）。

禁止：建议确认轮；要求 0 轻微才签字；全面搜轻微当主交付；修改任何文件。
用中文写报告。
