## 核销结果｜`需求｜v1-Codex实现.md` 第 2 轮

上轮 2 严重 3 中等**全部落地**，修法**未引入新的严重/中等**。

### 一、逐条核销（行号）

**S1 已落地。** `content/ui-copy.json:38` 有 `verdict.alaska_kicker = "Statewide · headline: Fairbanks Interior"`；合同 `需求｜v1-Codex实现.md:190-194` 写明 Alaska 卡在人话上方渲染该 kicker、Fairbanks 不渲染、「分工靠 kicker 有无，不靠另写主句」；验收第 6 条 `:307` 改为字符串级断言（alaska HTML 含该句 / fairbanks 不含）。合同正文里「禁止两页主句相同」的表述已消失，两页人话仍统一走 `verdict.*_human`，不再有数学冲突。Title 差异由 `:243-244` 两行例外 + `:251` 兜住，同样可机械判定。

**S2 已落地且三方数字自洽。** 合同 `:123-125` = 每 10 分钟 + `valid_until = generated_at + 25 分钟`（cap 在 OVATION Forecast Time + 40 分钟）+「含仅 `generated_at`/`valid_until` 变化也提交」；`判断引擎｜门控规则.md:268` 同为 25 分钟同 cap，`:270` 新增「v1 请求路径不得重算」，把「过期判定在请求时做、但不许重算引擎」这层歧义关掉；`engine/snapshot.py:663-667` 实现 25 分钟 + 40 分钟 cap；`设计｜页面架构线框与后端.md:516/526` 已改 10 分钟；正向验收 `:316`（valid_until 之内打开 `/forecast/colorado` 不为 `DATA_STALE`）存在。10 < 25 有 15 分钟余量，构建/部署延迟可吸收，不再是不可实现约束。

**M1 已落地。** `ui-copy.json:37` `unknown_window = "—"`、`:39` `stale_main_issue = "Source data is too old to treat as live."`；合同 `:175` 规定过期/无快照仍保留 H1、kicker、`headline_point_name` 与常青/FAQ，只换 status / 窗口 / Main issue / 人话，并区分「过期用 `stale_main_issue`、无文件用 `view.unknown_main_issue`」；验收 `:305`/`:306` 已改为过期时仍见 Fort Collins / Baker City。

**M2 已落地。** `content/guides/where-to-see-northern-lights.md:1-8` 把两条实现指令收进 frontmatter 的 `tonight_list` / `do_not_render`，读者正文 `:10-18` 已不含 `Render the Wave 1…` 与 `Do not build extra URLs…`；合同 `:220-221`（4.6）与 `:231`（4.7 表格行）都写明 frontmatter 与 `do_not_render` 不进 HTML。「整篇渲染」与「删定稿正文」两条分叉都被切断。

**M3 已落地。** 合同 `:163` 第一屏改为 H1 + 结论卡（status 大词与 Best window 必须完整可见）、kicker 计入、答案段允许被折页截断；验收 `:315` 写死视口 375×667 与 390×844 及可见元素清单。

### 二、新引入的严重/中等

无。检查过的几处修法副作用都不满足「两个合格执行者写出可观察不同 **且** 让某条验收失败」：

- 「kicker」一词现在同时指档案的州名+时区 kicker（`:163`）和 `alaska_kicker`（`:192`）。两种渲染取舍下验收 `:307` 与 `:315` 都仍通过。
- `:175` 的过期答案段示例 `UNKNOWN in northern Colorado (Fort Collins area).` 没给模板来源，但验收 `:305`/`:306` 接受 H1 或 kicker/`headline_point_name`，措辞差异不触发失败。
- Where 页导语（md `:10`）放在分组榜上或下，无验收覆盖。

一处非阻塞残留，供你顺手清，不构成再开一轮的理由：`设计｜页面架构线框与后端.md:564/568` 的时序图标签仍写 `cron 20 min` 与「有实质变化才 commit」，与同文件 `:516`、合同 `:123-125`、`CODEX-HANDOFF.md:10` 相反；同理 `:344` 还留着「禁止与 Alaska 卡主句相同」的旧说法。三处都被同文件自身与更高优先级文档明确覆盖，属于会被冲突序化解的笔误，不是执行者分叉。

**0 严重 0 中等。定稿，停止审计，不得再开一轮。**

（本轮全程只读，未修改任何文件。）
