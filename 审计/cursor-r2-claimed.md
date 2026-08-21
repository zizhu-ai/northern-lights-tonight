只声称修了上轮严重/中等（未改正文里的轻微）：

S1：`content/ui-copy.json` 增加 `verdict.alaska_kicker = "Statewide · headline: Fairbanks Interior"`。合同 4.3 改为 Alaska 卡在人话上方渲染该 kicker、Fairbanks 不渲染；验收第 6 条改为 HTML 有无该句，不再用「卡主句不同」。

S2：GitHub Action 改为每 10 分钟；`valid_until` 默认 `generated_at + 25 分钟`（仍 cap 在 OVATION Forecast Time + 40 分钟）——已改合同 §3、`判断引擎｜门控规则.md` §10、`engine/snapshot.py`。commit 条件改为 snapshots 有任何变化（含仅 generated_at/valid_until）。引擎 §10 写明 v1 请求路径不得重算。验收增加：valid_until 之内打开 `/forecast/colorado` 卡不是 DATA_STALE。`设计｜页面架构线框与后端.md` 定时改为 10 分钟。

M1：`ui-copy.json` 增加 `verdict.stale_main_issue`、`verdict.unknown_window`。合同 4.3 规定过期/无快照仍保留 H1、kicker、headline_point_name、常青；只换 status / 窗口 / Main issue / 人话。验收 4、5 条改为过期时仍见 Fort Collins / Baker City。

M2：`content/guides/where-to-see-northern-lights.md` 把实现指令移入 frontmatter（`tonight_list`、`do_not_render`）；读者正文不再含「Render the Wave 1…」和「Do not build extra URLs…」。合同 4.6 / 4.7 写明 frontmatter 不进 HTML。

M3：合同 4.3 第一屏改为 H1 + 卡（status 大词与 Best window 必须完整可见）；kicker 计入第一屏；答案段允许被折页截断。验收改为视口 375×667 与 390×844。
