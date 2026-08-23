# 任务
你是独立审计方。禁止调用任何工具。禁止读取任何 skill（包括 spec-cross-audit）。不要改文件、不要写代码、不要联网。材料已附，直接写完整中文审计报告。

审的是「前端页面+线框+后端选型」这一包，对照 v1 实现合同。

# 要审
A 页面清单是否完整、有无漏页或多页（对照需求 URL 表）
B 线框是否覆盖每个 URL 的第一任务；钱页第一屏、首页反 IP 个性化、Alaska/Fairbanks 分工是否画到
C 线框与需求是否打架（Title、noindex、Find place、/view、near-me 跳走）
D 登录/存储/技术结构是否和产品匹配：无登录、无用户库、JSON 快照+档案、Next SSR、GHA 刷新，有没有漏掉或过度设计
E /view 无预计算快照时「UNKNOWN vs 现算」是否含糊
F 交给 Codex 一并做时，这包够不够当布局+架构附图，缺哪 3 个冻结点

# 输出
1. 结论（5行内）线框+架构能否交给 Codex
2. 严重 / 中等 / 轻微表：id 问题 证据（文档名+短引）影响 建议
3. 文档打架清单
4. 冻结后再交给 Codex 的最多 3 件事
5. 应保持禁止的（登录、地图、用户库等）

严重 = 漏页、线框把禁止功能画回去、架构会伤 SEO 或无法实现。不要写总体很棒。不要建议做登录/Postgres/地图，除非指出应保持禁止。

---
# 附件 1 架构与线框
# 架构与线框｜v1

给产品审阅和 Codex 对照用。框内英文。登录：不做。用户库：不做。

---

## 前端有哪些页

| # | URL | 谁来 | 第一任务 |
|---|---|---|---|
| 0 | 全站壳 + Find place | 每一页 | 找地点、无账号 |
| 1 | `/` | 搜 tonight 的人 + 爬虫 | 不靠定位给出「取决于地点」+ 15 行表 |
| 2 | `/forecast/[slug]` 州（tonight_local） | 搜 colorado 等 | 今晚出不出门 |
| 3 | `/forecast/[slug]` 城（tonight_local） | 搜 chicago / seattle | 同上，强调出城 |
| 4 | `/forecast/alaska` | 搜 alaska / best places | 今晚卡 + 何时来、去哪一段 |
| 5 | `/forecast/fairbanks` | 搜 fairbanks aurora | 这座城今晚 |
| 6 | `/near-me` | 搜 near me / ZIP | 解析地点后跳走 |
| 7 | `/view` | 非白名单坐标 | 给结论，不建百科 |
| 8 | `/guides/where-to-see-...` | 搜 where | 今晚榜 + 常驻 vs 事件 |
| 9 | `/guides/best-time-...` | 搜 best time | 年 / 夜 / 纬度 |
| 10 | `/guides/how-to-see-...` | 搜 how to | 朝北、暗、等、读状态 |
| 11 | `/methodology` | 页脚 | 怎么判定 |

没有：`/map`、`/login`、`/account`、`/places/*`、后台管理。

本轮全站 `noindex`。

---

## 0. 壳 + Find place

```
┌──────────────────────────────────────────────────────────────────────┐
│  Northern Lights Tonight     Tonight   Near me   Guides   Find place │
└──────────────────────────────────────────────────────────────────────┘

        ┌─────────────────────────────────────────────┐
        │  Find a place                            [x]│
        │  ┌───────────────────────────────────────┐  │
        │  │ City, state, or US ZIP                │  │
        │  └───────────────────────────────────────┘  │
        │  [ Use my location ]              [ Check ] │
        │  Colorado  Ohio  Chicago  Seattle  ...      │
        └─────────────────────────────────────────────┘
```

- **Layout:** 顶栏 56px。无账号。层宽约 420px。
- **Interactions:** 字标 `/`。Tonight `/`。Near me `/near-me`。Guides 第一篇指南。Use my location **点击后**才要 GPS。白名单 → `/forecast/[slug]`，否则 `/view`。
- **响应式:** <768 顶栏只留字标 + Find place；链进页脚。层改底栏全宽。
- **状态:** GPS 拒绝仍可搜。

---

## 1. 首页 `/`

```
┌──────────────────────────────────────────────────────────────────────┐
│  Northern Lights Tonight     Tonight   Near me   Guides   Find place │
├──────────────────────────────────────────────────────────────────────┤
│  Can You See the Northern Lights Tonight?                            │
│  It depends on your location. Check a US city, or read               │
│  tonight's local pages below.                                        │
│                                                                      │
│  ┌────────────────────────────────────┐  ┌────────┐                  │
│  │ City, state, or US ZIP             │  │ Check  │                  │
│  └────────────────────────────────────┘  └────────┘                  │
│  [ Use my location ]                                                 │
│                                                                      │
│  Tonight in the US                                   Updated 6 min   │
│  ┌─────────┬───────────────┬────────────────────┬──────┐             │
│  │ Status  │ Place         │ Best window        │      │             │
│  ├─────────┼───────────────┼────────────────────┼──────┤             │
│  │ GO      │ Fairbanks     │ 11:00 PM – 2:00 AM │ Open │             │
│  │ MAYBE   │ Minnesota     │ 11:30 PM – 1:00 AM │ Open │             │
│  │ NO      │ Chicago       │ not worth a trip   │ Open │             │
│  │ ... all 15 rows in the HTML ...                     │             │
│  └─────────┴───────────────┴────────────────────┴──────┘             │
│  Full ranked list → Where to see tonight                             │
│                                                                      │
│  What time tonight?              How to read GO / MAYBE / NO         │
│  No single US clock.             GO = worth trying                   │
│  After dark, often late.         MAYBE = possible                    │
│                                  NO = not worth a trip               │
├──────────────────────────────────────────────────────────────────────┤
│  Tonight · Near me · Guides · How we decide · Not affiliated NOAA    │
└──────────────────────────────────────────────────────────────────────┘
```

- **Layout:** 内容宽 ~960px。H1 → 搜索 → 全量表（SEO 主体）→ 两列说明 → 页脚。
- **Interactions:** Check/GPS/Open 只跳 forecast 或 view，**不改本页 H1**。
- **响应式:** 表改成可点卡片：状态 + 地名 + 窗口。
- **状态:** 快照失败则 15 行 UNKNOWN，H1 仍在 HTML。

---

## 2. 州地点页 `/forecast/colorado`

```
┌──────────────────────────────────────────────────────────────────────┐
│  Northern Lights Tonight     Tonight   Near me   Guides   Find place │
├──────────────────────────────────────────────┬───────────────────────┤
│  Can You See the Northern Lights             │  Nearby               │
│  in Colorado Tonight?                        │  Utah · Oregon        │
│                                              │  Best time · How to   │
│  MAYBE in northern Colorado                  │                       │
│  (Fort Collins area, not Denver).            │                       │
│  Best window 10:40 PM – 12:10 AM.            │                       │
│                                              │                       │
│  ┌────────────────────────────────────────┐  │                       │
│  │ MAYBE                                  │  │                       │
│  │ Best window   10:40 PM – 12:10 AM      │  │                       │
│  │ Main issue    Clouds are the           │  │                       │
│  │               main uncertainty         │  │                       │
│  │ Look north · Medium · Updated 6 min    │  │                       │
│  │ [ Share ]                              │  │                       │
│  └────────────────────────────────────────┘  │                       │
│  Tonight's hours                             │                       │
│  9:30 PM   —       not dark yet              │                       │
│  10:00 PM  MAYBE   mixed clouds              │                       │
│  10:30 PM  GO      clearer                   │                       │
│  [ Rest of the night ]                       │                       │
│  Why · What to do · Other points             │                       │
│  Fort Collins MAYBE · Denver NO              │                       │
│  In this state · Local FAQ                   │                       │
├──────────────────────────────────────────────┴───────────────────────┤
│  Home · Near me · Best time · How to see                             │
└──────────────────────────────────────────────────────────────────────┘
```

- **Layout:** 主栏 640–680px；右栏 240px。第一屏 = H1 + 答案段 + 卡。
- **Interactions:** Share 复制/系统分享。代表点不新开 URL。
- **响应式:** 右栏下移到 FAQ 上。手机第一屏只保证 H1+段+卡。
- **状态:** GO / MAYBE / NO / UNKNOWN 只换卡。过期 = UNKNOWN。

---

## 3. 城地点页 `/forecast/chicago`

同第 2 页骨架，**没有** Other points / In this state。What to do 强调离开市区。Nearby：Illinois · Indiana · Wisconsin · Michigan。

---

## 4. Alaska `/forecast/alaska`

前半同第 2 页（今晚卡须写 `statewide, headline: Fairbanks Interior`）。其后：

```
│  When to come                                                        │
│  Late August – mid-April. June is usually a darkness no.             │
│                                                                      │
│  Which part of Alaska                                                │
│  Interior (Fairbanks)   best default                      Open →     │
│  Anchorage              compromise                                   │
│  Juneau                 rain, not Kp                                 │
```

结论卡禁止酒店/团购。

---

## 5. Fairbanks `/forecast/fairbanks`

同城页 + When to come。无 Which part 全州表。Nearby 回 Alaska。FAQ：不订 tour。今晚卡主句不得与 Alaska 页相同。

---

## 6. `/near-me`

```
┌──────────────────────────────────────────────────────────────────────┐
│  Northern Lights Tonight     Tonight   Near me   Guides   Find place │
├──────────────────────────────────────────────────────────────────────┤
│  Northern Lights Near Me                                             │
│  Aurora is local. A ZIP or city tells us whether the oval            │
│  can reach you, and whether clouds will block it.                    │
│                                                                      │
│  ┌────────────────────────────────────┐  ┌────────┐                  │
│  │ City, state, or US ZIP             │  │ Check  │                  │
│  └────────────────────────────────────┘  └────────┘                  │
│  [ Use my location ]                                                 │
│  We use your location once. We do not store it.                      │
│                                                                      │
│  Why a place is required · Wave 1 page links                         │
└──────────────────────────────────────────────────────────────────────┘
```

- **Interactions:** 提交后跳走。本页不渲染「你在某城 MAYBE」。
- **状态:** GPS 拒绝仍可搜 ZIP。

---

## 7. `/view`（noindex）

```
┌──────────────────────────────────────────────────────────────────────┐
│  Northern Lights Tonight                                  Find place │
├──────────────────────────────────────────────────────────────────────┤
│  Tonight near Springfield, IL                                        │
│  ┌────────────────────────────────────────┐                          │
│  │ NO                                     │                          │
│  │ Not worth a special trip tonight.      │                          │
│  │ Main issue    Oval out of reach        │                          │
│  └────────────────────────────────────────┘                          │
│  This is a live reading, not a full local guide.                     │
│  Nearby: Illinois tonight · Chicago tonight                          │
│  Hours + Why (same modules, no local encyclopedia)                   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 8. Where

```
┌──────────────────────────────────────────────────────────────────────┐
│  Where to See the Northern Lights in the US Tonight                  │
│  Ranked from our live local readings.                                │
│                                                                      │
│  GO       Fairbanks  11:00 PM–2:00 AM     Open                       │
│           Minnesota  11:30 PM–1:00 AM     Open                       │
│  MAYBE    Maine · Wisconsin · Seattle                                │
│  NO       Chicago · Ohio · Colorado                                  │
│                                                                      │
│  Usual destinations (does not vanish on a quiet night)               │
│  Oval most nights     Alaska Interior · northern MN · Maine          │
│  Event nights only    Colorado · Ohio · Illinois                     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 9–11. 指南与 methodology

Best time / How to / How we decide 同一文章壳：

```
┌──────────────────────────────────────────────────────────────────────┐
│  Best Time to See the Northern Lights                                │
│  [ Check tonight's local reading → home ]                            │
│                                                                      │
│  In a year     Aug–April in the north                                │
│  In a night    After dark, often late                                │
│  Depends on    Latitude, clouds, oval                                │
│                                                                      │
│  (article body)                                                      │
│  Example pages: Minnesota · Maine · Colorado · Alaska                │
└──────────────────────────────────────────────────────────────────────┘
```

How to：朝北、暗、等 30–60 分钟、手机 vs 肉眼、怎么读 GO/MAYBE/NO。  
Methodology：门控、无百分数、OVATION vs 后半夜 Kp、代表点、NOAA + Open-Meteo。不嵌整块实时引擎。

---

## 结论卡四态

```
GO       Conditions line up well enough to try.
MAYBE    Not a definite show. Worth a look if you can get a dark north sky.
NO       Not worth a special trip tonight.
UNKNOWN  We are not guessing.  [ Try again ]
```

---

## 手机钱页第一屏

```
┌──────────────────────────────────┐
│ NLT                    Find place│
├──────────────────────────────────┤
│ Can You See the Northern Lights  │
│ in Colorado Tonight?             │
│ MAYBE in northern Colorado       │
│ (Fort Collins area, not Denver). │
│ ┌──────────────────────────────┐ │
│ │ MAYBE  10:40 PM–12:10 AM     │ │
│ │ Clouds · North · [ Share ]   │ │
│ └──────────────────────────────┘ │
│ Tonight's hours  (may be below)  │
└──────────────────────────────────┘
```

---

## 登录？存储？技术结构

### 登录

**不做。** 无账号、无 session、无 OAuth、无 Cookie 识别用户。分享靠 URL + OG。

### 数据存储

**没有用户库，没有 Postgres/Redis/Supabase（v1）。**

| 数据 | 形态 | 谁写 | 谁读 |
|---|---|---|---|
| 地点档案、常青英文、FAQ | `地点档案/wave1.json`（Git） | 人改 PR | Next SSR |
| 今晚结论 | `snapshots/*.json`（Git） | Python 引擎 + GitHub Action 定时 commit | Next SSR |
| 城市/ZIP 检索 | 静态 json（可加 `data/us-places.json`） | 人/脚本生成一次 | Find place / near-me |
| GPS | 浏览器一次性，**不落盘** | 用户点击 | 只用来跳 URL |
| IP | 最多填搜索框 | 客户端 | **不进 SSR** |

外部源（不存用户，只缓存原始预报）：NOAA OVATION、NOAA Kp、Open-Meteo。缓存目录 `engine/.cache/` 不进 Git。

### 技术选型（已部分落地，v1 沿用）

| 层 | 选型 | 理由 |
|---|---|---|
| 站点 | Next.js 15 App Router + TS，Vercel | SSR 把结论写进 HTML，SEO 刚需；仓库已接好 |
| 判断引擎 | Python 3 `engine/snapshot.py` | 天文 + 网格插值已写好，不在 Serverless 里重写 |
| 定时 | GitHub Action 每 20 分钟跑引擎，commit snapshots，触发 Vercel | 公开数据、文件即库，不必养数据库 |
| 检索 | 静态地点表 + 可选 ZIP 表 | 15 城 + 常用 ZIP 足够；不做用户画像 |
| 分析 | 以后再加（本轮可不上） | 不做账号体系 |

### 结构

```
NOAA OVATION + Kp          Open-Meteo clouds
         \                    /
          Python snapshot engine
          (local or GitHub Action)
                    |
            snapshots/*.json   (Git, no user data)
            地点档案/wave1.json (Git, editorial)
                    |
           Next.js server render
                    |
     HTML pages  (noindex this round)
                    |
              Vercel CDN
```

请求路径：用户打开 `/forecast/colorado` → 服务器读 `snapshots/colorado.json` + 档案 → 输出 HTML。浏览器不请求 NOAA。

`/view`：若无现成快照，可用构建时没有的点；v1 可在 Action 里不算 `/view`，请求时若没有快照则显示 UNKNOWN，或仅对白名单预计算。不要为每个 ZIP 开库表。

---

## 和「要不要数据库」的界限

要数据库的典型理由：用户、收藏、历史准确率、百万动态城市。v1 都没有。  
15 个钱页 + 一份 latest.json，文件足够。等开索引、要历史校准再考虑把快照写入 KV/SQLite，那是 v2。


---
# 附件 2 需求 v1 Codex 实现

# 需求｜v1 Codex 实现包

**给谁：** Codex（一次性把站做成可部署、仍 noindex 的产品）  
**日期：** 2026-08-20  
**仓库：** https://github.com/zizhu-ai/northern-lights-tonight  
**生产：** https://northern-lights-tonight.vercel.app（已接 GitHub `main`）  
**语言：** 页面全部美式英语。`html lang="en-US"`。

本文件是 **Codex 的实现合同**。细则以引用文档为准，冲突时以本文件「冻结」条款为准。

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
| `/forecast/[slug]` | noindex | 仅 Wave 1 这 15 个 slug；其它 slug → 404 或内部改写到 `/view`，**不要**生成可抓取空壳 |
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

路由：白名单 → `/forecast/[slug]`；其余美国北半球点 → `/view?lat=&lng=&name=`（规范化到小数点 3 位，避免无穷 URL）；南纬拒绝。

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
- 若 `snapshots/` 有实质变化则 commit + push `main`（或只 push snapshots 分支再部署；优先直接 push `main`，消息 `chore: refresh aurora snapshots`）
- 用 `GITHUB_TOKEN`；配置 `contents: write`
- 失败要在 Actions 里可见，不要静默
- 不要提交 `engine/.cache/`

本地命令保持：`python3 engine/snapshot.py`。

---

## 4. 页面（按线框，替换 stub）

布局以 `线框图｜首版.md` 为准。模块顺序以 `页面｜首版结构.md` 为准。

### 4.1 全站壳

- 顶栏：字标 → `/`；桌面链 Tonight / Near me / Guides；右上 Find place。
- Find place：城市/州/ZIP + Use my location。**只有点击后才请求 GPS。** 命中白名单 → `/forecast/...`，否则 `/view`。
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

答案段与卡同一事实，例如：

```
MAYBE in northern Colorado (Fort Collins area, not Denver).
Best window 10:40 PM–12:10 AM.
Main issue: mixed clouds.
```

结论卡字段：status 大词、一句人话、Best window、Main issue、Look north、Confidence、Updated、Share。  
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

`Tonight near {Name}`。结论卡 + 小时 + Why。一句：live reading, not a full local guide。链最近 Wave 1 州/城。无 FAQ 套话。

无档案远窗：最多 MAYBE + FORECAST_FAR。南纬：明确不可用，不要算 GO。

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
- [ ] `/view` noindex，无套话百科
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
