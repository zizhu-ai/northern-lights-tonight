# 需求｜v1 Codex 实现包

**给谁：** Codex（一次性把站做成可部署、仍 noindex 的产品）  
**日期：** 2026-08-21  
**仓库：** https://github.com/zizhu-ai/northern-lights-tonight  
**生产：** https://northern-lights-tonight.vercel.app（已接 GitHub `main`）  
**语言：** 页面全部美式英语。`html lang="en-US"`。

本文件是 **Codex 的实现合同**。细则以引用文档为准。线框只决定空间；皮肤只换外观。

**冲突时以上到下为准：**

1. 本文件「冻结」条款（含本节四条、第 2 / 5 / 11 节）  
2. `判断引擎｜门控规则.md` + 现有 `engine/snapshot.py`  
3. `页面｜首版结构.md` 的 IA（Title/H1 以本包第 5 节为准）  
4. `设计｜视觉与UI规范.md`（皮肤；不改 URL / 模块顺序）  
5. `设计｜页面架构线框与后端.md`（交互与数据流）  
6. `地点档案/wave1.json`、`content/ui-copy.json`、`content/guides/*.md`、`data/us-places.json`  
7. `线框图｜首版.md` / `架构与线框｜v1.md`（旧布局草图）  
8. PRD（只作词表背景；下列条款已作废）

**冻结（四条）：**

1. **`/view` 无该点快照 → 只渲染 UNKNOWN**。禁止请求时现算、禁止在 Vercel 跑 Python 引擎、禁止浏览器打 NOAA。线框里 Springfield `NO` 仅表示「若已有快照」。`FORECAST_FAR` / 远窗不 GO 是引擎单测。  
2. **路由只留一条：** 吸收表或 Wave 1 → `/forecast/[slug]`；美国北半球非白名单 → `/view?lat=&lng=&name=`（lat/lng 三位小数）。**`lat < 0` 只进 `/view`，展示 UNAVAILABLE 文案（`content/ui-copy.json` `south`），不算 GO，不 404。** Wave 1 以外的 `/forecast/[slug]` **一律 404**（不要内部改写、不要 SSG 空壳）。`generateStaticParams` 仅 15 个 slug。  
3. **文案与壳：** Title/OG = 第 5 节；`/view` 用第 4.1 节全站壳；结论卡字段 = 第 4.3 节；答案段与卡同一事实。桌面右栏可放 Nearby，主栏仍按 1→8。英文 UI 失败句 = `content/ui-copy.json`，禁止模型另写一套。  
4. **皮肤：** `设计｜视觉与UI规范.md`。浅页 + 夜色结论卡。`视觉稿/` 只审方向，**不要**当生产 HTML 拷进 App Router。

| 文档 | 用途 |
|---|---|
| `范围｜覆盖地点与产品边界.md` | 市场、名单、索引门槛 |
| `判断引擎｜门控规则.md` | 门控算法；已有 `engine/snapshot.py` |
| `页面｜首版结构.md` | SEO 信息架构 |
| `设计｜视觉与UI规范.md` | 颜色 / 字体 / 组件皮肤 |
| `设计｜页面架构线框与后端.md` | 架构图、逐页交互、数据流 |
| `地点档案/wave1.json` | 15 个地点字段与常青英文 |
| `content/ui-copy.json` | 壳、四态人话、失败句 |
| `content/guides/*.md` | Best time / How to / Where 下半 / methodology |
| `data/us-places.json` | 城市 / 别名 / lite ZIP |
| `engine/snapshot.py` | 快照实现，保留并修 |

**PRD** 只作词表背景。v1 **作废：** 16 城、`/map`、`/places/alaska`、加权分、`WAIT`、首页必须有地图、首页按 IP 改主答案。

---

## 0. 一句话与非目标

产品：告诉某个美国地点的用户，今晚极光 **值不值得出门**。  
获客：Google SEO。钱页是 `/forecast/[slug]`。首页是主词枢纽，**不是**某城天气 App。

**v1 不做：** 登录、账号、订阅、邮件、App、地图页、广告、百分概率、一词一页、日期事件页、太阳风暴科普、俄罗斯内容、南半球、北欧本地语言 tonight 页、未核实停车场、为 Boston/Minneapolis/northern-michigan/ZIP 建索引页。

**本轮仍 noindex。** 不要改 `robots.txt` 为允许收录，不要提交 sitemap 到 GSC。`seo_indexable` 保持 `false`。

---

## 1. 仓库里已经有什么

- Next.js 15 App Router，Vercel 项目 `northern-lights-tonight`，push `main` 即生产部署。
- `engine/snapshot.py`：拉 NOAA OVATION、Kp 预报、Open-Meteo 云量，写 `snapshots/<slug>.json` 与 `snapshots/latest.json`。
- 首页 stub：读 latest.json 画 15 行表；全站 `noindex`。
- 15 个 Wave 1 档案在 `地点档案/wave1.json`。

Codex 要做的是 **把 stub 换成线框里的真产品页**，并让快照在线上定时更新。

---

## 2. URL（冻结）

| URL | 索引（本轮） | 说明 |
|---|---|---|
| `/` | noindex | 主词枢纽。SSR 美国 15 地表。**禁止**按 IP/GPS 改 H1/主答案/OG |
| `/forecast/[slug]` | noindex | 仅 Wave 1 这 15 个 slug；其它 slug **一律 404** |
| `/near-me` | noindex | ZIP/城市/定位工具。提交后 **跳走**。`/near-me?*` 一律 noindex |
| `/view` | noindex,follow | 非白名单坐标。无百科套话 |
| `/guides/best-time-to-see-northern-lights` | noindex | 常青 |
| `/guides/how-to-see-northern-lights` | noindex | 常青 |
| `/guides/where-to-see-northern-lights` | noindex | 今晚榜 + 常驻区 vs 事件区 |
| `/methodology` | noindex | 怎么判定 |
| `/map`、`/places/*` | 不存在 | 不要创建 |

Wave 1 slug（仅这些 forecast URL）：

`colorado ohio indiana michigan chicago seattle wisconsin massachusetts maine minnesota illinois oregon utah alaska fairbanks`

吸收（禁止新 URL，搜索这些词落到括号内页）：

- Boston → `massachusetts`
- Minneapolis / Duluth → `minnesota`
- Columbus → `ohio`
- Indianapolis → `indiana`
- Salt Lake City → `utah`
- Northern Michigan → `michigan`

路由（Find place / near-me / 直打 URL 同一套）：

- 吸收表或 Wave 1 slug → `/forecast/[slug]`
- 美国北半球、未建页 → `/view?lat=&lng=&name=`（lat/lng 四舍五入到 3 位小数，同一点同一 URL）
- `lat < 0` → `/view?lat=&lng=&name=`，**UNAVAILABLE** 卡（`content/ui-copy.json` `south`）。不算 GO，不 404。无小时轴。
- `/forecast/boston` → 专用 not-found 页（首屏 HTML 即 `not_found.boston` + Massachusetts CTA，noindex）。其它非白名单 `/forecast/[slug]` → **404**。吸收只发生在 Find place / near-me 提交时，不靠 rewrite。`notFound()` 静态预渲染会吐空错误壳，所以波士顿不用 throw 404。

---

## 3. 引擎与快照（保留现实现）

不要重写算法。以 `判断引擎｜门控规则.md` + 现有 `engine/snapshot.py` 为准。

冻结行为：

1. 状态只有 `GO | MAYBE | NO | UNKNOWN`。没有 `WAIT`。没有百分数。
2. 州页首屏 = `primary_verdict_point`，**禁止**对 sample points 取 max。Oregon 首屏是 **Baker City**，不是 Portland。
3. `urban` = 城市页，或点的 `role=population`。`horizon + urban` 不能 GO。
4. 太阳高度 > −12° → `SKIP_NOT_DARK`，不参与归并。整晚无 ≤−12° 窗 → `NO` + `NEVER_DARK`。
5. 近窗：OVATION 网格（点上 + 地理北 8°）。远窗：有档案才用 `typical_kp_*`。中纬 / `sub_oval` 远窗禁止 GO。无档案远窗禁止 GO，最多 `MAYBE` + `FORECAST_FAR`。
6. 过期快照不得当 live：`now > valid_until` → 页面 `UNKNOWN` + `DATA_STALE`。
7. 原因句只用引擎里的英文模板，禁止模型现写。
8. 浏览器不直打 NOAA。页面只读 `snapshots/`。

### 线上刷新（必须做）

Vercel 构建读仓库里的 JSON，不会自己跑 Python。增加 GitHub Action：

- 每 **10 分钟**（及 `workflow_dispatch`）跑 `python3 engine/snapshot.py`
- `valid_until = generated_at + 25 分钟`（与 `判断引擎｜门控规则.md` §10、`engine/snapshot.py` 一致）。**不要**用 OVATION Forecast Time + 40 分钟截短文件 TTL。NOAA 过旧只走 `ovation_ok` / 近窗 UNKNOWN，不得把整份快照写成过期
- 读快照的 `/`、`/forecast/[slug]`、Where 页：`revalidate = 600`，让 ISR 按刷新节奏重读 JSON，而不是只在 Vercel 重建时更新
- 若 `snapshots/` 有变化则 commit（**含仅 `generated_at` / `valid_until` 变化**；安静夜也要提交，避免快照老化）+ **只 push `main`**，消息 `chore: refresh aurora snapshots`（不要第二条 snapshots 分支）
- 用 `GITHUB_TOKEN`；配置 `contents: write`
- 失败要在 Actions 里可见，不要静默
- 不要提交 `engine/.cache/`

本地命令保持：`python3 engine/snapshot.py`。

---

## 4. 页面（按线框，替换 stub）

布局以 `线框图｜首版.md` 为准。模块顺序以 `页面｜首版结构.md` 为准。

### 4.1 全站壳

- 顶栏：字标 → `/`；桌面链 Tonight / Near me / Guides；右上 Find place。Guides 进 `/guides/best-time-to-see-northern-lights`（不另开 `/guides` 索引）。
- Find place：城市/州/ZIP + Use my location。**只有点击后才请求 GPS。** 只查 `data/us-places.json`（可客户端过滤，禁止请求时打地理编码 API）。命中 slug → `/forecast/[slug]`；美国表内无 slug → `/view?lat=&lng=&name=`。
- 页脚：Tonight · Near me · Guides · How we decide · Not affiliated with NOAA。
- 无登录。广告不做。
- IP **不得**写入 SSR、H1、OG、JSON-LD、结论卡。**v1 不做 IP 预填搜索框。** 定位只来自用户点击 Use my location。

### 4.2 首页 `/`

所有人同一份 HTML。

- H1：`Can You See the Northern Lights Tonight?`
- Title（本实现包勘误，**不要**用带 Live / Near You 的旧句）：`Northern Lights Tonight: US City and State Aurora Forecast`
- 第一段：取决于地点；用下面的本地页。
- 搜索 + Use my location（跳走，不改本页主内容）。
- **Tonight in the US：** 15 行全在 HTML 里（status、地点名、窗口、链到 `/forecast/[slug]`）。可按 GO→MAYBE→NO 排序，但 15 行都要在文档中。
- What time tonight：没有全美统一时刻；用各地页窗口。
- How to read GO / MAYBE / NO。
- 链到 Where / Best time / How to / methodology。

### 4.3 地点页 `/forecast/[slug]`

钱页。数据 = 该 slug 快照 + `wave1.json` 常青字段。

**第一屏（手机）：** H1 + 结论卡（status 大词 + Best window 必须完整可见）。kicker（州名 + 时区，来自档案，不是模型现写）计入第一屏。答案段紧挨 H1 下、卡上，**允许被折页截断**。小时轴紧挨卡下，可跨折页，必须在 SSR HTML。视口验收见第 8 节。

结论卡字段（不可删语义）：status 大词、一句人话、Best window、Main issue、Look north、**Confidence**、Updated、Share。

答案段与卡同一事实，例如：

```
MAYBE in northern Colorado (Fort Collins area, not Denver).
Best window 10:40 PM–12:10 AM.
Main issue: mixed clouds.
```

过期或无快照 → 卡为 UNKNOWN，禁止显示旧 GO。**仍保留** H1、kicker、`headline_point_name` 与常青/FAQ。只换：status 大词、Best window = `verdict.unknown_window`（`—`）、Main issue = `verdict.stale_main_issue`（无文件时用 `view.unknown_main_issue`）、人话 = `verdict.unknown_human`。答案段过期时仍带代表点名，例如 `UNKNOWN in northern Colorado (Fort Collins area).`

其下顺序：

1. 小时轴（30 分钟；SKIP 显示 not dark yet；默认约 5 行 + Rest of the night）
2. Why this verdict（到达 / 云 / 黑暗 / 月 / 城光 / 数据是否 live）——自然语言，不把格点概率当百分保证
3. What to do（档案 `leave_city_advice` + 朝北 + 等 30–60 分钟 + 手机可能先于肉眼）
4. 州页：Other points（各 sample 的 status）；「更好」只写这里
5. 州页：In this state（`north_south_split` 等）
6. Nearby（只链 Wave 1 已有 slug）
7. Local FAQ（档案 `local_faqs`，FAQPage schema）
8. Best time / How to see

`travel_plus_tonight`（`alaska`、`fairbanks`）：1–3 相同；然后 When to come、Which part of Alaska（仅州页），禁止在结论卡里导购。Tour FAQ：This site does not book tours.

**Alaska vs Fairbanks 必须分工（防互吃）：**

- `/forecast/alaska` 在结论卡人话**上方**渲染 `verdict.alaska_kicker`（`Statewide · headline: Fairbanks Interior`）。Title 见第 5 节例外行。常青以季节和分区为主。
- `/forecast/fairbanks` **不渲染**该 kicker。Title 保持 city tonight。
- 两页人话仍用 `verdict.*_human` 常量；**分工靠 kicker 有无，不靠另写主句。**

Oregon 结论卡用 Baker City，并列出 Portland / Bend。

Chicago 无「州内其它点」块；Nearby 含 illinois / indiana / wisconsin / michigan。

### 4.4 `/near-me`

H1：`Northern Lights Near Me`（不要用 Can You See Tonight）。  
说明：极光是本地的；ZIP 怎么用；定位只用一次、不存储。  
提交后跳 forecast 或 view。本页 HTML 不得出现「你在某城今晚 MAYBE」。

### 4.5 `/view`

全站壳与 4.1 相同（含 Tonight / Near me / Guides），不要裁成只有 Find place。

H1：`Tonight near {Name}`。有快照：结论卡 + 小时 + Why。无 FAQ 套话。链最近 Wave 1 州/城。

**无该坐标快照：只渲染 UNKNOWN + Try again，禁止现算。** 不要写「This is a live reading」当默认句；有快照时可以说 live reading, not a full local guide。

无档案远窗（引擎侧、若将来为某点生成了快照）：最多 MAYBE + FORECAST_FAR，禁止 GO。

**南纬（`lat < 0`）：** 同一 `/view` 路由，展示 `UNAVAILABLE`（不是引擎第五态）。人话与 Main issue 用 `content/ui-copy.json` 的 `south`。不算 GO，不 404，不画小时轴。

### 4.6 Where

上半：今晚 15 点分组榜（GO / MAYBE / NO），行进 forecast；由快照渲染，对应 where md 的 `tonight_list`，**不要**把 frontmatter / `do_not_render` 印到页面。  
下半常青：该 md frontmatter 之后的读者正文。安静夜全 NO 时下半仍在。

### 4.7 两篇指南 + methodology

指南顶部「Check tonight」链 `/`，不嵌整块实时引擎。**正文按仓库定稿，禁止模型另写：**

| URL | 文件 |
|---|---|
| `/guides/best-time-to-see-northern-lights` | `content/guides/best-time-to-see-northern-lights.md` |
| `/guides/how-to-see-northern-lights` | `content/guides/how-to-see-northern-lights.md` |
| `/guides/where-to-see-northern-lights` | 上半分组榜由快照渲染（见该 md frontmatter `tonight_list`）。**读者正文** = frontmatter 之后的段落；frontmatter 指令与 `do_not_render` 行**不进 HTML** |
| `/methodology` | `content/guides/methodology.md` |

---

## 5. Title / OG（本包为准）

| 页 | Title | H1 |
|---|---|---|
| `/` | Northern Lights Tonight: US City and State Aurora Forecast | Can You See the Northern Lights Tonight? |
| `/near-me` | Northern Lights Near Me: Forecast by City or ZIP | Northern Lights Near Me |
| `/forecast/[Place]` | Northern Lights in [Place] Tonight: Visibility & Best Time | Can You See the Northern Lights in [Place] Tonight? |
| `/forecast/alaska`（例外） | Northern Lights in Alaska: Best Places, Season & Tonight | Can You See the Northern Lights in Alaska Tonight? |
| `/forecast/fairbanks`（例外） | Northern Lights in Fairbanks Tonight: Visibility & Best Time | Can You See the Northern Lights in Fairbanks Tonight? |
| Where | Where to See the Northern Lights in the US Tonight | Where to See the Northern Lights in the US Tonight |
| Best time | Best Time to See the Northern Lights | Best Time to See the Northern Lights |
| How to | How to See the Northern Lights | How to See the Northern Lights |
| `/methodology` | How We Decide If You Should Go Out | How We Decide |
| `/view` | Northern Lights Tonight Near [Name] | Tonight near [Name] |

地点 meta 用快照填窗口/主障碍，15 页不得完全相同。Alaska 与 Fairbanks 的 Title **不得**相同。  
OG：地点页与 Where 用实时状态；首页 OG 用泛句，不写某城。v1 OG 图用一张静态夜卡，不必按状态动态生成。  
Share 文案：`content/ui-copy.json` 的 `share.template`。时间格式：en-US 12 小时 + 时区缩写，例 `10:40 PM MT`。Confidence 显示 High / Medium / Low。

---

## 6. 档案 nearby（已写入 json，仍不收录）

`地点档案/wave1.json` 的 `nearby_slugs` 已按表填到 **3–5**，且只能指向 Wave 1 slug。实现时读 json，不要改回 1–2 条、不要发明 `new-york-city`。冻结表：

| slug | nearby（可微调，须 3–5） |
|---|---|
| colorado | utah, oregon, illinois, ohio, minnesota |
| ohio | indiana, michigan, chicago, illinois |
| indiana | ohio, chicago, illinois, michigan |
| michigan | wisconsin, ohio, indiana, chicago, minnesota |
| chicago | illinois, indiana, wisconsin, michigan |
| seattle | oregon, alaska, minnesota, utah |
| wisconsin | minnesota, michigan, chicago, illinois |
| massachusetts | maine, ohio, michigan, minnesota |
| maine | massachusetts, minnesota, michigan, alaska |
| minnesota | wisconsin, michigan, alaska, maine |
| illinois | chicago, indiana, wisconsin, ohio |
| oregon | seattle, utah, colorado, alaska |
| utah | colorado, oregon, illinois, alaska |
| alaska | fairbanks, minnesota, maine, seattle |
| fairbanks | alaska, minnesota, maine |

`massachusetts` 不要发明 `new-york-city`（不在 Wave 1）。

常青英文已在 json 里，页面直接渲染，禁止再用 LLM 生成一套「欢迎来到 [City]」。

---

## 7. 技术约束

- Next.js App Router（已有），TypeScript。
- 结论、15 地表、小时轴必须在 **服务端 HTML**，不能等客户端再画状态。
- `html lang="en-US"`。地点页：WebPage + FAQPage + BreadcrumbList。指南：Article。
- 过期快照：UNKNOWN，不要假装 live。
- `dateModified`：仅当 status / 窗口 / 主障碍变化时更新（不要每 10 分钟空跳）。Updated 文案仍可显示快照时间。
- 移动优先；LCP 不被地图拖死（v1 无地图）。
- 不把 NOAA 密钥化；公开 JSON + Open-Meteo。
- 不要引入登录、数据库（Postgres 非本轮）。快照文件 + 档案 json 足够。
- 地点搜索：只读 `data/us-places.json`（Wave 1 + 别名 + 美国主要城 + lite ZIP）。匹配：小写去标点；5 位 ZIP 精确对 `zips[]`；命中 `slug` → forecast，否则北半球 → `/view`。找不到用 `errors.search_no_match` / `zip_not_found`，**不要 500**，不要请求时调外部地理编码。v1 不收录加拿大/英国检索。
- 测试：至少覆盖引擎文档第 12 节情景（Fairbanks 极昼逻辑已有 `short_summer_nights`；安静中纬 NO；州页 Fort Collins vs Denver 不取 max；`/view` 远窗不 GO）。加少量 vitest/node 单测即可，不要为测而测。

---

## 8. 验收清单（本轮）

- [ ] push `main` 后 Vercel 生产更新
- [ ] GitHub Action 能刷新 `snapshots/` 并部署
- [ ] `/` SSR 含 15 行状态+链接，无 IP 某城卡，Title 无 Live/Near You
- [ ] `/forecast/colorado` 首屏含 Fort Collins（H1 或 kicker/`headline_point_name`）；points 含 Denver；过期为 UNKNOWN 但仍见 Fort Collins
- [ ] `/forecast/oregon` 首屏含 Baker City（过期时也要见）
- [ ] `/forecast/alaska` HTML 含 `Statewide · headline: Fairbanks Interior`；`/forecast/fairbanks` HTML **不含**该句
- [ ] `/forecast/chicago` 链回 illinois，不把 Wisconsin 的 GO 写进芝加哥卡
- [ ] `/near-me` 跳转到 forecast 或 view；带 query 的 near-me noindex
- [ ] `/view` noindex,follow；无快照时 UNKNOWN，不现算；南纬不可用；全站壳完整
- [ ] `/forecast/boston` 首屏 HTML 含 Boston 文案与 Massachusetts CTA；其它未知 slug 404
- [ ] 指南与 methodology 可打开，英文可读
- [ ] `robots.txt` 仍 Disallow `/`；无 sitemap 提交
- [ ] 无登录、无 `/map`、无百分数
- [ ] 手机地点页：视口 **375×667 与 390×844**，不滚动即可见 H1、status 大词、Best window 整行；答案段允许被折页截断
- [ ] 快照在 `valid_until` 之内：任意时刻打开 `/forecast/colorado`，结论卡 **不是** `stale_main_issue`（TTL = `generated_at + 25 分钟`，不被 OVATION 产品年龄截到写入当时就过期；NOAA 落后时仍可显示引擎 NO/MAYBE/UNKNOWN）
- [ ] 皮肤为浅页 + 夜卡（Inter + Newsreader）；不是 stub 全黑页
- [ ] `lat < 0` 的 `/view` 为 UNAVAILABLE，不 404、不算 GO
- [ ] 指南与 methodology 正文来自 `content/guides/*.md`，不是模型现写
- [ ] 搜空 / GPS 拒绝 / 未知 ZIP 用 `content/ui-copy.json`，不出现「你在某城今晚 MAYBE」

---

## 9. 不要做（再列一次）

开 Google 收录、买域名、广告、地图、登录、邮件、把 Python 引擎在 Vercel Serverless 里重写成不可测的一坨、为每个 ZIP 建页、用客户端去打 NOAA、把 stub 留着当首页。

---

## 10. 建议动手顺序（可在一个 PR 里，但按序提交更好）

1. Action 定时快照（nearby 已写入 json）+ 引擎小修（若有）  
2. 共用壳 + Find place + 结论卡组件  
3. `/forecast/[slug]` 两套模板  
4. `/`、Where、near-me、view  
5. 指南 + methodology  
6. 对照第 8 节自测后推 `main`

实现时读 `wave1.json`、`content/ui-copy.json`、`content/guides/*.md`、`data/us-places.json` 和视觉规范。不要凭记忆编城市文案，不要另写指南。

---

## 11. 冻结文案与地点表

| 文件 | 冻结什么 |
|---|---|
| `content/ui-copy.json` | 顶栏/页脚、四态人话、`alaska_kicker`、`stale_main_issue`、`unknown_window`、失败句、南纬 UNAVAILABLE、404、Share、时间 locale |
| `content/guides/*.md` | 三篇指南 + methodology 英文正文 |
| `data/us-places.json` | 检索键、ZIP lite、slug vs /view |
| `地点档案/wave1.json` | 常青段、FAQ、`nearby_slugs`、代表点 |

结论卡人话（有快照时）用 `verdict.*_human`。引擎 `main_obstacle_text` / `answer_sentence` 仍来自快照模板，不要再 LLM 润色。

**Find place 匹配顺序：** 空输入 → `search_empty`；5 位数字 → ZIP；否则 aliases → Wave 1 名/slug → 其它 `places.keys`。`slug` 有值跳 forecast；仅坐标跳 view（`name` 用表里的 `name`）。GPS 成功：把 lat/lng 四舍五入到 3 位，在表里找最近的美国点（粗算即可），有 slug 用 slug，否则 view。GPS 失败不跳走。

**404：** `/forecast/boston` 用 `not_found.boston` + 链 `/forecast/massachusetts`（专用静态页，首屏 HTML 就要有 CTA）。其它未知 slug 用 `not_found.generic`。

---

## 执行备注（2026-08-21 定稿，不挡实现）

Cursor Opus 5 1M 第 2 轮：**0 严重 0 中等。定稿，停止审计，不得再开一轮。** 报告：`审计/cursor-opus5-1m-r2-audit.md`。

轻微不改正文、不为这些再送审：

- `设计｜页面架构线框与后端.md` 时序图仍可能写 `cron 20 min` / 「有实质变化才 commit」；以本文件 §3「每 10 分钟、含 generated_at 也提交」为准。
- 同文件 Fairbanks 节若仍写「禁止与 Alaska 卡主句相同」；以本文件 4.3 的 `alaska_kicker` 有无为准。
- 合同里「kicker」一词既指州名+时区，也指 `alaska_kicker`；两处都要渲染，验收字符串不同。
- ZIP `99701` 同挂 Alaska / Fairbanks：匹配顺序未写 tie-break；实现时 Fairbanks 城名优先，纯 ZIP 落到 alaska 也可（不挡）。
- GPS「最近美国点」无距离上限；v1 接受。
