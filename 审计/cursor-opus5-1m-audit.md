## 审计报告｜`需求｜v1-Codex实现.md`（v1 实现合同）

先说通过的部分，免得下面的问题被误读为「整篇不能用」：`wave1.json` 15 个地点的 `nearby_slugs` 全部 3–5 条且只指向 Wave 1，`primary_verdict_point` 全部是 `verdict_north` 角色（没有拿 `role=population` 的城心当首屏），`data/us-places.json` 覆盖 15 个 slug 且检索键无「同键不同 slug」冲突，四篇 md 的 title/h1 与合同第 5 节一致，模块顺序在合同 4.3 与 `设计｜页面架构线框与后端.md` 3.2 之间一致。抽查 colorado / ohio 常青字段与档案规范一致。

结论：**2 严重、3 中等**，列在下面。

---

## 严重

### S1. 「Alaska 与 Fairbanks 今晚卡主句不同」这条验收不可机械判定，且与冻结文案数学冲突

**位置：** 合同 4.3「禁止两页今晚卡主句完全相同」＋ 第 8 节验收第 6 条 ＋ 第 11 节「结论卡人话（有快照时）用 `verdict.*_human`」＋ `content/ui-copy.json` 的 `verdict.*_human`。

**两个执行者怎样分叉：** 「卡主句」没有定义。执行者 A 认定主句 = 卡里那句人话，人话被第 11 节冻结成四句常量，于是两页同态时（`alaska`/`fairbanks` 用的是同一对坐标 64.8378/−147.7164，只差 `urban` 标记，同态很常见；仓库当前 15 份快照 `valid_until` 全部早于 `generated_at`，两页现在都是 UNKNOWN → 两句都是 `We are not guessing.`）验收第 6 条必然失败。执行者 B 认定主句 = 答案段（引擎 `answer_sentence`，实测 `GO (Fairbanks area).` vs `MAYBE in Fairbanks.`）或自己给 Alaska 卡拼一句限定语，验收过，但要么违反「人话只用 ui-copy」，要么绕过「禁止模型另写一套」。

**最短修法：** 把验收改成可机械判定的字段级断言，并给 Alaska 卡一个固定 kicker：在 `ui-copy.json` 加 `verdict.alaska_kicker = "Statewide · headline: Fairbanks Interior"`，合同写明「Alaska 卡在人话上方渲染该 kicker，Fairbanks 卡不渲染」，验收第 6 条改为「`/forecast/alaska` 含该 kicker 且 `/forecast/fairbanks` 不含」。

### S2. 20 分钟刷新 × `valid_until = generated_at + 10 分钟` ×「过期即 UNKNOWN」三条同时冻结，没有任何合规实现，且没有一条验收能发现

**位置：** 合同第 3 节「线上刷新：每 20 分钟」＋「若 `snapshots/` 有实质变化则 commit」＋ 冻结行为 6「`now > valid_until` → UNKNOWN + `DATA_STALE`」＋ `判断引擎｜门控规则.md` 第 10 节「默认 `generated_at + 10 分钟`」。

**两个执行者怎样分叉：** 执行者 A 按字面做请求时判定 + cron `*/20`，于是每个周期后 10 分钟全站（首页 15 行、15 个钱页、Where 榜）都是 UNKNOWN + `DATA_STALE`；再叠加「只有实质变化才 commit」，安静夜状态不变即不提交，快照一路老化，钱页可以整夜 UNKNOWN。执行者 B 为了让站看起来正常，改成构建期渲染（把 `valid_until` 判定实际取消）或自行把 `valid_until` 拉长 / cron 改 10 分钟——那是改冻结条款。两者产出的是完全不同的产品，而验收第 2、3、4 条对「15 行 UNKNOWN」「过期显示 UNKNOWN」都判通过，抓不到。

**最短修法：** 选一组自洽数字并加一条正向验收：cron 改每 10 分钟；`valid_until = generated_at + 25 分钟`（保留「不超过 OVATION Forecast Time + 40 分钟」上限）；「实质变化」明确为「含 `generated_at` 的任意字段变化即提交」；验收加「任意时刻访问 `/forecast/colorado`，卡不为 `DATA_STALE`」。

---

## 中等

### M1. 过期 / 无快照时首屏该保留什么，没有来源；与验收「首屏 Fort Collins / Baker City」直接对撞

**位置：** 合同 4.3「过期 → UNKNOWN，禁止显示旧 GO」＋ 验收第 4、5 条＋ 第 11 节「英文 UI 失败句 = `ui-copy.json`，禁止模型另写」。`ui-copy.json` 里没有 `DATA_STALE` 对应句，`view.unknown_main_issue` 是 `/view` 名下的键。

**两个执行者怎样分叉：** 过期时 `answer_sentence` / `main_obstacle_text` 都带着旧状态词不能用。执行者 A 换成通用 UNKNOWN 卡，连 headline point 名字一起丢掉 → 验收第 4 条「`/forecast/colorado` 首屏 Fort Collins」和第 5 条「oregon 首屏 Baker City」失败（当前仓库全部快照过期，这是默认路径而非边角）。执行者 B 保留 kicker/`headline_point_name`，Main issue 自己硬编码引擎第 9 节的 `Source data is too old to treat as live.` → 过验收但违反「失败句只用 ui-copy」。

**最短修法：** `ui-copy.json` 增 `verdict.stale_main_issue`（取引擎第 9 节 `DATA_STALE` 原句）与 `verdict.unknown_window = "—"`；合同 4.3 补一句「过期/无快照时保留 H1、kicker、`headline_point_name` 与常青块，仅把 status、窗口、Main issue 换成 UNKNOWN / `—` / `stale_main_issue`」。

### M2. `content/guides/where-to-see-northern-lights.md` 混入实现指令，而合同冻结「正文按仓库定稿、禁止模型另写」

**位置：** 合同 4.6 / 4.7（「下半 + 导语 = 该 md」）＋ 验收第 11、17 条；md 第 10 行 `Render the Wave 1 snapshot table here, grouped GO → MAYBE → NO...`、第 18 行 `Do not build extra URLs for Boston, Minneapolis, or "northern Michigan."`。

**两个执行者怎样分叉：** 文件没有标出哪段是给读者的正文、哪段是给实现者的指令。执行者 A 按「禁止另写」整篇渲染，线上页面把开发指令印给用户 → 验收第 11 条「英文可读」判失败。执行者 B 删掉 `## Tonight's list` 整节和第 18 行，被判为「模型改了定稿正文」→ 验收第 17 条判失败。

**最短修法：** 在合同 4.7 表格该行注明「`## Tonight's list` 一节是占位，由快照分组榜替换；`Do not build extra URLs...` 一行不渲染」，或直接把这两处从 md 移进 frontmatter 注释。

### M3.「手机不滚动看到 H1 + 状态卡」没有视口和元素清单，验收第 14 条会一人通过一人失败

**位置：** 验收第 14 条＋合同 4.3「第一屏（手机）：H1 + 答案段 + 结论卡」＋`设计｜视觉与UI规范.md` 3.3（H1 30px、状态词 52px）与 5（第一屏还多一个 kicker：州 + 时区）。

**两个执行者怎样分叉：** 执行者 A 按 390×844 排版并把三行答案段整段放进第一屏（56 顶栏 + kicker + 两行 H1 + 3 行答案段 + 四格 meta 的夜卡），在 375×667 上卡片被压到折线下 → 验收第 14 条失败。执行者 B 以 375×667 为硬约束，把答案段折到卡下或截成一行 → 通过，但模块顺序看起来「答案段不在卡前」。同一份文档两种自洽读法。

**最短修法：** 验收第 14 条写明「视口 375×667 与 390×844，`status` 大词与 `Best window` 行需完整可见；答案段允许被折页截断」，并在 4.3 注明 kicker 是否计入第一屏必需元素。

---

## 轻微（最多 5 条）

**不挡定稿，不要为这些再开一轮。**

1. `data/us-places.json` 中 ZIP `99701` 同时挂在 `Alaska`(slug alaska) 与 `Fairbanks, AK`(slug fairbanks) 上，合同第 11 节的匹配顺序没有同 ZIP 的 tie-break。
2. 合同第 4 节开头「布局以 `线框图｜首版.md` 为准／模块顺序以 `页面｜首版结构.md` 为准」与头部冲突序（这两份分别是第 3、第 7 级、后者标注为「旧布局草图」）以及冻结第 3 条「主栏仍按 1→8」互相矛盾，只能靠冲突序化解。
3. `ui-copy.json` 的 `errors.search_not_us` 没有触发路径：地点表里没有非美国行，GPS 分支也没定义非美国坐标怎么处理。
4. 第 11 节 GPS「在表里找最近的美国点」没有距离上限也没有国境判断：温哥华定位会落到 `/forecast/seattle`。
5. `页面｜首版结构.md` 第 3、8 节仍要求可索引 + sitemap，`设计｜视觉与UI规范.md` 第 5 节给钱页加了不在冻结模块清单里的 kicker（州 + 时区）；都只靠冲突序压住。
