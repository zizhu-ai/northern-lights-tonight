你是 spec 核销员，不是猎手。审计对象：`需求｜v1-Codex实现.md`（第 2 轮，上限 5 轮）。

先只读打开这些文件（禁止修改任何文件）：
- `需求｜v1-Codex实现.md`
- `判断引擎｜门控规则.md`（§10）
- `engine/snapshot.py`（valid_until 计算）
- `content/ui-copy.json`
- `content/guides/where-to-see-northern-lights.md`
- `设计｜页面架构线框与后端.md`（定时小节）
- `CODEX-HANDOFF.md`
- `审计/cursor-opus5-1m-audit.md`
- `审计/cursor-r2-claimed.md`

上轮结论摘要：
2 严重 3 中等。S1 Alaska/Fairbanks「卡主句」不可测且与冻结人话冲突。S2 cron 20 分钟 × valid_until+10 分钟 × 过期 UNKNOWN 无法同时成立。M1 过期首屏是否保留 Fort Collins/Baker City 无来源。M2 Where md 混入实现指令。M3 「不滚动看到卡」未写视口。

声称已修（只核这些 + 修法是否引入新的严重/中等）：
见 `审计/cursor-r2-claimed.md`。

只做：
1. 上轮每条严重/中等是否落地（给行号）。
2. 这次修法有没有引入新的严重/中等。中等 = 两个合格执行者会写出可观察不同、且让某条验收失败的行为。「可能被读错」不是中等。
3. 禁止新开轻微清单。禁止全面复审。禁止建议确认轮或第 3 轮。

结论只能是下面之一：
- 「0 严重 0 中等。定稿，停止审计，不得再开一轮。」
- 列出剩余严重/中等（每条：位置 / 两个执行者会怎样分叉 / 最短修法）。

禁止修改任何文件。
用中文写报告。
