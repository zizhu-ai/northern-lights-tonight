# 审计报告：前端页面 + 线框 + 后端选型（对照 v1 实现合同）

审计对象：附件 1《架构与线框｜v1》  
对照物：附件 2《需求｜v1 Codex 实现包》（实现合同）  
范围：A 页面清单 · B 第一任务/钱页首屏/反 IP/AK–FB · C 线框与合同是否打架 · D 登录/存储/技术结构 · E `/view` 无快照 · F 能否当布局+架构附图  
材料以外的仓库、skill、网页均未使用。

---

## 1. 结论（能否交给 Codex）

不能把附件 1 原样当「布局 + 架构附图」交给 Codex 一并做。  
对照合同 URL 表：8 类路由都在，没有漏页，也没有把 `/map`、`/login`、`/account`、`/places/*` 画回来。钱页手机第一屏、首页「不改 H1 / 不靠定位出主答案」、Alaska / Fairbanks 分工，作为排版附图是可用的。  
但是 `/view` 的数据路径自相矛盾：线框按「现算出结论」画，架构写成「UNKNOWN 或只预计算白名单」，合同又要求远窗门控与「远窗不 GO」。按现算，与「页面只读 `snapshots/`、禁止把 Python 引擎搬进 Vercel Serverless」冲突，属于无法实现；按 UNKNOWN，线框样例和合同 4.5 同时破产。  
Find place / 非法 `forecast` slug 的路由未封死，Title / 全站壳 / 结论卡字段与合同不一致。先冻结第 4 节三件事再交；登录、用户库、地图等保持禁止，不要用本包去补这些能力。

---

## 2. 问题表

### 严重

| id | 问题 | 证据（文档名 + 短引） | 影响 | 建议 |
|---|---|---|---|---|
| S1 | `/view` 无预计算快照时「UNKNOWN vs 现算」未选死，三份要求互斥，按线框现算则架构做不到 | 附件 1 架构：「v1 可在 Action 里不算 `/view`，请求时若没有快照则显示 UNKNOWN，**或**仅对白名单预计算。」附件 1 线框 7：已画 `NO` / `Oval out of reach` / 「This is a live reading」。合同 3：「页面只读 `snapshots/`」；合同 9：「不要…把 Python 引擎在 Vercel Serverless 里重写」；合同 4.5：「无档案远窗：最多 MAYBE + FORECAST_FAR」；合同 8：「`/view` 远窗不 GO」 | Codex 要么在请求时重写/挪动引擎（禁、不可测、伤以后 SEO），要么永远 UNKNOWN（线框撒谎，4.5 与验收无法在页面上成立）。「仅预计算白名单」对 `/view` 无意义：白名单走的是 `/forecast/[slug]` | **冻结为：无该点快照 → 只渲染 UNKNOWN（南纬另用不可用态），禁止请求时现算、禁止 Serverless 重写引擎。** FORECAST_FAR / 远窗不 GO 放在 `engine/snapshot.py` 单测。线框必须补 UNKNOWN 态；现有 Springfield `NO` 只能标成「若已有快照」的示意，不能当默认实现 |

无其它「漏页」或「把禁止功能画回线框」的严重项。`/map`、登录、账号、地点百科、百分数、WAIT 未画入。首页反 IP 未画成按定位改主答案。严重项就是这条实现不了的数据路径。

### 中等

| id | 问题 | 证据 | 影响 | 建议 |
|---|---|---|---|---|
| M1 | Find place / 跳转未吸收合同别名，也未冻结 `/view` 查询串 | 附件 1 壳：「白名单 → `/forecast/[slug]`，否则 `/view`」。合同 2：Boston→`massachusetts` 等吸收表；其余点 → `/view?lat=&lng=&name=`（小数点 3 位）；南纬拒绝 | 搜 Boston 会进 `/view` 而不是钱页；无 lat/lng 的 `/view` 可无穷 URL；南纬可能被拿去算 GO | 吸收表写进 Find place；命中规则写死；坐标规范化；南纬拒绝，不算 GO |
| M2 | 非白名单 `/forecast/[slug]`：404 vs 内部改写未选 | 合同 2：「其它 slug → 404 或内部改写到 `/view`，**不要**生成可抓取空壳」。附件 1 只定义了搜索跳转，没定义直打 URL | 动态段可能打出空壳钱页；开索引后伤 SEO；改写若无坐标则与 `/view` 契约不合 | **只留一种：非 Wave 1 slug 一律 404。** 不要内部改写、不要 SSG 空壳。`generateStaticParams` 仅 15 个 slug |
| M3 | `/view` 顶栏被裁掉，与全站壳打架 | 附件 1 线框 7：仅字标 + Find place。合同 4.1：顶栏字标 + Tonight / Near me / Guides + Find place | Codex 会做两套壳；`/view` 不像同一产品，也不符合「全站壳」 | `/view` 用同一顶栏/页脚；可用一句「live reading, not a full local guide」降权，不删导航 |
| M4 | 线框无 Title；合同第 5 节是勘误后的冻结 Title | 合同 5：首页 Title 为 `Northern Lights Tonight: US City and State Aurora Forecast`，「**不要**用带 Live / Near You 的旧句」。附件 1 只画 H1 | 只看线框会沿用 stub/旧 Title，验收第 8 节直接失败 | 本包声明：Title/OG **以合同第 5 节为准**，线框只约束版面。首页 OG 泛句、不写某城 |
| M5 | 结论卡字段与「答案段 = 卡」不完整 | 合同 4.3 卡：status、一句人话、Best window、Main issue、Look north、**Confidence**、Updated、Share；答案段示例含 Main issue。附件 1 桌面卡：`Look north · Medium · Updated`（Medium 未标注）；答案段无 Main issue。手机首屏更砍成 `Clouds · North · Share` | 15 个钱页卡结构漂移；Confidence 可能被丢掉；答案段与卡不是同一事实 | 字段名单以合同 4.3 为准；`Medium` 必须标成 Confidence；答案段补 Main issue；手机可折行，不可删字段语义 |
| M6 | 桌面模块顺序与合同线性顺序不一致 | 附件 1 州页：右栏第一屏就是 Nearby + Best time · How to。合同 4.3：Nearby 为第 6、FAQ 第 7、指南第 8，且「布局以线框为准、模块顺序以页面结构为准」 | Codex 不知主栏/右栏谁是顺序真源；SEO 正文块可能把 Nearby 提前、把 Why/小时轴挤下 | 写死：第一屏 = H1 + 答案段 + 卡（+ 桌面右栏可放 Nearby 链）；主栏仍按合同 1→8。右栏不得替代小时轴/Why |
| M7 | 检索数据范围窄于合同，near-me / Find place 大量找不到点 | 附件 1：「15 城 + 常用 ZIP 足够」。合同 7：「Wave 1 + **美国主要城市** lat/lng/tz」；ZIP「公开 ZIP→坐标**或**有限映射」 | 常见城市进不了 `/view?lat=&lng=`，只能让用户改输入，工具页名存实亡 | 静态 `us-places.json`（主要城市 + Wave 1 别名）+ ZIP 映射；找不到 → 可改输入，禁止 500，禁止为此建库表 |
| M8 | 15 个 slug 未映射到线框 4 套模板 | 附件 1 页表拆成州 / 城 / alaska / fairbanks，示例只有 colorado、chicago、alaska、fairbanks。合同：`travel_plus_tonight` 仅 alaska、fairbanks；Chicago 无州内其它点；Oregon 首屏 Baker City | Seattle 可能被做成州页；Oregon 可能取 max/Portland；模板数量与合同第 10 节「两套模板」也不对齐 | 冻结映射：`chicago`/`seattle`/`fairbanks` 走城模板（fairbanks 另加 When to come）；其余州模板；`alaska`/`fairbanks` 开 travel 段；代表点一律档案 `primary_verdict_point`，Oregon = Baker City |
| M9 | Fairbanks Nearby 画成「只回 Alaska」，与档案 3–5 条要求不符 | 附件 1 §5：「Nearby 回 Alaska」。合同 6：`fairbanks` → alaska, minnesota, maine（至少 3） | 只画一条会做成单链，违反 nearby 3–5 且只链 Wave 1 | Nearby 只渲染 `wave1.json` 的 3–5 个 slug；线框「回 Alaska」是其中一条，不是唯一一条 |
| M10 | 架构未带上合同已冻结的索引/语义约束，附图单独看会漏 | 合同：本轮全站 noindex、`/view` noindex,follow、`/near-me?*` noindex、`robots.txt` 仍 Disallow、`seo_indexable=false`、不提交 sitemap；地点页 WebPage+FAQPage+BreadcrumbList；`dateModified` 仅 status/窗口/主障碍变化才改。附件 1 只写「本轮全站 noindex」和 SSR 读 JSON | 漏 robots/query noindex/JSON-LD/dateModified；或每 20 分钟空跳 dateModified | 架构节加 5 行约束即可，不要另做「SEO 系统」。以合同 5、7、8 为准 |

### 轻微（不挡定稿，不为它们再开一轮）

| id | 问题 | 证据 | 影响 | 建议 |
|---|---|---|---|---|
| L1 | 指南 / Where / methodology 线框没画全站壳 | 附件 1 §8–11 直接从 H1 起 | 可能漏顶栏 Find place | 套 §0 壳 |
| L2 | 指南 URL 写成省略号 | `/guides/where-to-see-...` vs 合同完整 slug | 若照抄会成错路径 | 用合同第 2 节完整路径 |
| L3 | 合同说「两套模板」，线框是四变体 | 合同 10.3 vs 附件 1 §2–5 | 措辞噪音 | 两套底模 + `travel_plus_tonight` 开关 |
| L4 | GHA 推送目标在合同里仍留了「或 snapshots 分支」 | 合同 3「优先直接 push `main`」；附件 1 只写 commit 触发 Vercel | 双分支部署不确定 | 只 push `main`，消息 `chore: refresh aurora snapshots` |
| L5 | Where 的 MAYBE/NO 画成名串，未画行链接 | 附件 1 §8 vs 合同 4.6「行进 forecast」 | 可能做成纯文本 | 每行都链 `/forecast/[slug]` |
| L6 | Alaska / Fairbanks 只写「主句不得相同」，无线框并排例句 | 附件 1 §4–5 | 仍可能套同一句 | 实现时 alaska 卡必须带 `statewide, headline: Fairbanks Interior` |
| L7 | 首页「IP 可填搜索框」只在架构文字、未进线框 | 附件 1 存储表 vs 首页图 | 可能漏做或做成 SSR | 仅客户端填框，可改；不进 HTML 主答案 |
| L8 | `/near-me?*` 一律 noindex 未在线框标注 | 合同 2 vs 附件 1 §6 | query 落地页若被留下可能忘 meta | 跳走为主；残留 query 也 noindex |

---

## 3. 文档打架清单

1. **`/view` 数据（S1，真冲突）**  
   线框 = 现算结论（Springfield `NO` + live reading）  
   架构 = 无快照 UNKNOWN **或** 只预计算白名单（白名单根本不该走 `/view`）  
   合同 = 只读 `snapshots/` + 禁止 Serverless 重写引擎 + 无档案远窗 FORECAST_FAR + 验收「远窗不 GO」

2. **`/view` 壳**  
   线框裁顶栏 vs 合同 4.1 全站壳。

3. **Title / OG**  
   线框不写 Title vs 合同第 5 节冻结 Title（并明确作废 Live / Near You）。不是写错，是缺了真源；与「勘误」并排时，Codex 会猜。

4. **结论卡 / 答案段**  
   合同：Confidence 独立字段，答案段含 Main issue。  
   线框：桌面用无标签 `Medium`，答案段无 Main issue，手机首屏再砍字段。

5. **Nearby 位置**  
   线框桌面右栏进第一屏 vs 合同 4.3 线性第 6 块。合同自己还写「布局以线框、顺序以页面结构」——两源并置。

6. **地点检索范围**  
   架构「15 城 + 常用 ZIP」vs 合同「美国主要城市 + ZIP 数据集/有限映射」。

7. **非法 forecast slug**  
   合同「404 **或** 改写」未决 vs 线框只定义搜索「否则 `/view`」。直打 `/forecast/boston` 无定义。

8. **noindex 粒度**  
   附件 1「全站 noindex」vs 合同 `/view` 为 `noindex,follow`、`/near-me?*` 单列。方向一致，粒度打架。

9. **模板数量措辞**  
   合同第 10 节「两套模板」vs 线框州 / 城 / Alaska / Fairbanks 四套。

10. **指南 slug**  
    线框省略号 vs 合同完整 slug。

11. **Fairbanks Nearby**  
    线框「回 Alaska」vs 合同 nearby 3–5 条。

12. **「live reading」文案 vs 只读快照**  
    无快照时若 UNKNOWN，线框那句「This is a live reading」在默认路径上是假话，必须随 S1 改。

以上 1 必须先改文档再实现；2–7 交给 Codex 前写进冻结条款；8–12 在实现合同已有条文时，声明「冲突以合同冻结条款为准」即可，不要再发明第三套 URL。

---

## 4. 冻结后再交给 Codex 的最多 3 件事

**1. `/view` 无快照：只 UNKNOWN，禁止现算。**  
请求路径不得打 NOAA / Open-Meteo，不得在 Vercel 跑或改写 `engine/snapshot.py`。南纬：独立「不可用」文案，不算 GO。线框补 UNKNOWN + Try again；Springfield `NO` 仅表示「若有快照」。合同 4.5 的 FORECAST_FAR、验收「远窗不 GO」= 引擎单测，不依赖线上为任意坐标现算。不要为 ZIP/坐标开表。

**2. 路由只留一条。**  
- Find place / near-me 吸收表（Boston→massachusetts 等）命中 → `/forecast/[slug]`  
- 美国北半球非白名单 → `/view?lat=&lng=&name=`（三位小数）  
- 南纬 → 拒绝，不生成可算 GO 的 view  
- Wave 1 以外的 `/forecast/[slug]` → **404**（不要内部改写、不要空壳）  
静态地点表按合同：Wave 1 + 美国主要城市 + ZIP 映射；找不到让用户改输入。

**3. 文案与壳以合同覆盖线框缺省。**  
Title/OG = 合同第 5 节；`/view` 用第 4.1 节全站壳；结论卡字段与「答案段和卡同一事实」= 合同 4.3（含 Confidence、Main issue）。线框只决定空间顺序与钱页手机第一屏（H1 + 段 + 卡，不滚动可见）。15 slug 的模板映射按上面 M8。Alaska 卡主句必须含 `statewide, headline: Fairbanks Interior`，不得与 Fairbanks 今晚主句相同。

冻这三件后，附件 1 可以当排版附图，附件 2 当实现合同，一并给 Codex。不要再加第 4 个「全面复审」项。

---

## 5. 应保持禁止的

下列合同非目标，本包也未要求做；审计明确 **保持禁止**，不要用「补全架构」当借口加回来：

- 登录、账号、订阅、邮件、session、OAuth、识别用户的 Cookie  
- 用户库；Postgres / Redis / Supabase / 为每个 ZIP 建库表  
- `/map`、地图页、首页地图、把 LCP 交给地图  
- `/login`、`/account`、`/places/*`、后台管理  
- 广告；百分概率；`WAIT`；模型现写原因句或「欢迎来到 [City]」  
- 按 IP/GPS **改** SSR HTML、H1、主答案、OG、JSON-LD、结论卡（GPS 仅点击后用于跳 URL；IP 最多客户端填搜索框）  
- 浏览器直打 NOAA；把 Python 引擎搬进 Vercel Serverless 重写成不可测逻辑  
- 为 Boston / Minneapolis / northern-michigan / 任意 ZIP 建索引页；一词一页；日期事件页  
- 本轮开收录：改 `robots.txt` 放行、提交 sitemap、把 `seo_indexable` 改为 true  
- 结论卡导购（酒店 / 团购 / 订 tour）；未核实停车场  
- 俄罗斯内容、南半球 tonight、北欧本地语言 tonight 页  

v2 才允许再谈：开索引、快照进 KV/SQLite、历史校准。v1 继续：JSON 快照 + `地点档案/wave1.json` + Next SSR + GHA 每 20 分钟写 `snapshots/`。
