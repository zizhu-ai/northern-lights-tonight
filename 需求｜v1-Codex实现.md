# 需求｜v1 Codex 实现包

**给谁：** Codex（一次性把站做成可部署、仍 noindex 的产品）  
**日期：** 2026-08-20  
**仓库：** https://github.com/zizhu-ai/northern-lights-tonight  
**生产：** https://northern-lights-tonight.vercel.app（已接 GitHub `main`）  
**语言：** 页面全部美式英语。`html lang="en-US"`。

本文件是 **Codex 的实现合同**。细则以引用文档为准，冲突时以本文件「冻结」条款为准。线框只决定空间；Title、路由、`/view` 无快照时的行为以本节为准。

**2026-08-20 线框审计后冻结（三条）：**

1. **`/view` 无该点快照 → 只渲染 UNKNOWN**（南纬用独立「不可用」文案）。禁止请求时现算、禁止在 Vercel 跑 Python 引擎、禁止浏览器打 NOAA。线框里 Springfield `NO` 仅表示「若已有快照」。`FORECAST_FAR` / 远窗不 GO 是引擎单测，不依赖为任意坐标现算。  
2. **路由只留一条：** 吸收表命中 → `/forecast/[slug]`；美国北半球非白名单 → `/view?lat=&lng=&name=`（lat/lng 三位小数）；南纬拒绝、不算 GO；**Wave 1 以外的 `/forecast/[slug]` 一律 404**（不要内部改写、不要 SSG 空壳）。`generateStaticParams` 仅 15 个 slug。  
3. **文案与壳：** Title/OG = 本文第 5 节；`/view` 用第 4.1 节全站壳；结论卡字段 = 第 4.3 节（含 Confidence、Main issue）；答案段与卡同一事实。桌面右栏可放 Nearby 链，但主栏仍按 1→8，右栏不得替代小时轴/Why。

| 文档 | 用途 |
|---|---|
| `范围｜覆盖地点与产品边界.md` | 市场、名单、索引门槛 |
| `判断引擎｜门控规则.md` | 门控算法；已有 `engine/snapshot.py` |
| `页面｜首版结构.md` | SEO 信息架构、Title/H1 |
| `线框图｜首版.md` | 布局 |
| `地点档案/wave1.json` | 15 个地点的字段与英文常青文案 |
| `engine/snapshot.py` | 快照实现，保留并修，不要推倒重写 |

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
- 南纬 → 不生成可算 GO 的页；可 404 或 view 上「not available in the southern hemisphere」
- `/forecast/boston` 等非白名单 slug → **404**

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

- 每 **20 分钟**（及 `workflow_dispatch`）跑 `python3 engine/snapshot.py`
- 若 `snapshots/` 有实质变化则 commit + **只 push `main`**，消息 `chore: refresh aurora snapshots`（不要第二条 snapshots 分支）
- 用 `GITHUB_TOKEN`；配置 `contents: write`
- 失败要在 Actions 里可见，不要静默
- 不要提交 `engine/.cache/`

本地命令保持：`python3 engine/snapshot.py`。

---

## 4. 页面（按线框，替换 stub）

布局以 `线框图｜首版.md` 为准。模块顺序以 `页面｜首版结构.md` 为准。

### 4.1 全站壳

- 顶栏：字标 → `/`；桌面链 Tonight / Near me / Guides；右上 Find place。
- Find place：城市/州/ZIP + Use my location。**只有点击后才请求 GPS。** 吸收表或白名单 → `/forecast/[slug]`，美国其它点 → `/view?lat=&lng=&name=`。
- 页脚：Tonight · Near me · Guides · How we decide · Not affiliated with NOAA。
- 无登录。广告不做。
- IP **不得**写入 SSR、H1、OG、JSON-LD、结论卡。客户端可把猜测城市放进搜索框且可改。

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

**第一屏（手机）：** H1 + 答案段 + 结论卡（含 Share）。小时轴紧挨卡下，可跨折页，必须在 SSR HTML。

结论卡字段（不可删语义）：status 大词、一句人话、Best window、Main issue、Look north、**Confidence**、Updated、Share。

答案段与卡同一事实，例如：

```
MAYBE in northern Colorado (Fort Collins area, not Denver).
Best window 10:40 PM–12:10 AM.
Main issue: mixed clouds.
```

过期 → UNKNOWN，禁止显示旧 GO。

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

- `/forecast/alaska` 结论卡限定语：`statewide, headline: Fairbanks Interior`。Title 可偏向 places/season。常青以季节和分区为主。
- `/forecast/fairbanks` 是这座城今晚。Title 保持 city tonight。
- 禁止两页今晚卡主句完全相同。

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

无档案远窗（引擎侧、若将来为某点生成了快照）：最多 MAYBE + FORECAST_FAR，禁止 GO。南纬：独立不可用文案，不算 GO。

### 4.6 Where

上半：今晚 15 点分组榜（GO / MAYBE / NO），行进 forecast。  
下半：常驻（Alaska Interior、northern MN / UP、Maine）vs 事件型（Colorado / Ohio / Illinois）。安静夜全 NO 时下半仍在。

### 4.7 两篇指南 + methodology

指南顶部「Check tonight」链 `/`，不嵌整块实时引擎。正文按 `页面｜首版结构.md` 第 9、I 节。  
methodology：门控顺序、无百分数、OVATION vs 后半夜 Kp、州页代表点、数据来源 NOAA SWPC 与 Open-Meteo。

---

## 5. Title / OG（本包为准）

| 页 | Title | H1 |
|---|---|---|
| `/` | Northern Lights Tonight: US City and State Aurora Forecast | Can You See the Northern Lights Tonight? |
| `/near-me` | Northern Lights Near Me: Forecast by City or ZIP | Northern Lights Near Me |
| `/forecast/[Place]` | Northern Lights in [Place] Tonight: Visibility & Best Time | Can You See the Northern Lights in [Place] Tonight? |
| Where | Where to See the Northern Lights in the US Tonight | Where to See the Northern Lights in the US Tonight |
| Best time | Best Time to See the Northern Lights | Best Time to See the Northern Lights |
| How to | How to See the Northern Lights | How to See the Northern Lights |
| `/methodology` | How We Decide If You Should Go Out | How We Decide |
| `/view` | Northern Lights Tonight Near [Name] | Tonight near [Name] |

地点 meta 用快照填窗口/主障碍，15 页不得完全相同。  
OG：地点页与 Where 用实时状态；首页 OG 用泛句，不写某城。  
Share 文案：`{Place} tonight: {STATUS} · {window}`。

---

## 6. 档案修补（本轮一并做，仍不收录）

在 `地点档案/wave1.json` 把每个地点 `nearby_slugs` 补到 **3–5 个**，且只能指向 Wave 1 slug。建议：

| slug | nearby（可微调，须 3–5） |
|---|---|
| colorado | utah, oregon, illinois, ohio, minnesota |
| ohio | indiana, michigan, chicago, illinois |
| indiana | ohio, chicago, illinois, michigan |
| michigan | wisconsin, ohio, indiana, chicago, minnesota |
| chicago | illinois, indiana, wisconsin, michigan |
| seattle | oregon, alaska, minnesota, utah |
| wisconsin | minnesota, michigan, chicago, illinois |
| massachusetts | maine, new-york 没有则 maine, ohio, michigan, minnesota |
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
- 地点搜索：可用静态城市表（Wave 1 + 美国主要城市 lat/lng/tz）。ZIP：用公开 ZIP→坐标数据集或有限映射；找不到就让用户改输入，不要 500。
- 测试：至少覆盖引擎文档第 12 节情景（Fairbanks 极昼逻辑已有 `short_summer_nights`；安静中纬 NO；州页 Fort Collins vs Denver 不取 max；`/view` 远窗不 GO）。加少量 vitest/node 单测即可，不要为测而测。

---

## 8. 验收清单（本轮）

- [ ] push `main` 后 Vercel 生产更新
- [ ] GitHub Action 能刷新 `snapshots/` 并部署
- [ ] `/` SSR 含 15 行状态+链接，无 IP 某城卡，Title 无 Live/Near You
- [ ] `/forecast/colorado` 首屏 Fort Collins；points 含 Denver；过期显示 UNKNOWN
- [ ] `/forecast/oregon` 首屏 Baker City
- [ ] `/forecast/alaska` 与 `/forecast/fairbanks` 今晚卡主句不同
- [ ] `/forecast/chicago` 链回 illinois，不把 Wisconsin 的 GO 写进芝加哥卡
- [ ] `/near-me` 跳转到 forecast 或 view；带 query 的 near-me noindex
- [ ] `/view` noindex,follow；无快照时 UNKNOWN，不现算；南纬不可用；全站壳完整
- [ ] `/forecast/boston` 等非白名单 slug 404
- [ ] 指南与 methodology 可打开，英文可读
- [ ] `robots.txt` 仍 Disallow `/`；无 sitemap 提交
- [ ] 无登录、无 `/map`、无百分数
- [ ] 手机地点页不滚动也能看到 H1 + 状态卡

---

## 9. 不要做（再列一次）

开 Google 收录、买域名、广告、地图、登录、邮件、把 Python 引擎在 Vercel Serverless 里重写成不可测的一坨、为每个 ZIP 建页、用客户端去打 NOAA、把 stub 留着当首页。

---

## 10. 建议动手顺序（可在一个 PR 里，但按序提交更好）

1. 档案 nearby 3–5；引擎小修（若有）+ Action 定时快照  
2. 共用壳 + Find place + 结论卡组件  
3. `/forecast/[slug]` 两套模板  
4. `/`、Where、near-me、view  
5. 指南 + methodology  
6. 对照第 8 节自测后推 `main`

实现时读线框和 `wave1.json`，不要凭记忆编城市文案。
