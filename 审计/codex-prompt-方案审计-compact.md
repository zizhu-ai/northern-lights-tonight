# 任务
独立只读审计 Northern Lights Tonight 首版方案。禁止调用任何工具。禁止读 skill。材料已附。直接写中文完整报告。

产品：美国英语 SEO 工具站，今晚某地极光值不值得出门。无登录/App/订阅。获客是搜索。钱在 /forecast/[slug]。首页 SSR 不得按 IP 变成某城。Wave 1 = 15 个美国地点。

# 要审
A 文档打架（URL、索引、首页个性化、状态、代表点、Alaska、near-me、地图、小时轴、主词）
B SEO（词→URL 互吃、爬虫能否见答案、doorway、冷启动、Title/内链）
C 引擎（OVATION 90分钟 vs 今晚、中纬远窗禁GO、UNKNOWN vs NO、typical_kp）
D 地点范围
E 线框 vs 页面规格（线框要点：首页全量15行表、地点页答案段+卡+小时轴、Find place 跳 forecast/view、无地图无登录）
F 先快照后 HTML 还缺什么

# 输出
1. 结论（5行内）
2. 严重/中等/轻微表：id 问题 证据 影响 建议
3. 打架清单
4. 冻结后再开工最多3事
5. 应保持禁止的

---

PRD 摘录（非全文）：
- 首发：1 核心工具 + Near Me + 16 州/城市 + 2–3 常青。URL 含 /map（P1）、/places/alaska。
- 非目标：注册、订阅、邮件、App、全球城市、复杂地图、专业空间天气。
- 判断：GO/MAYBE/NO/UNKNOWN；另写 NO/WAIT（尚未入夜）；window_score 45/30/15/10；70+ GO。
- 首页必须覆盖：是否可见、什么时间、Near Me、本地云量、地图、当前最佳城市。
- 实时数据必须出现在服务端 HTML；一个地点一个 URL。
- 七天计划含数据接入到部署；上线后不立即批量扩张。
- 最终：低成本事件驱动地域 pSEO，先拿低 KD 地域词。


---
# 范围
# 范围｜覆盖地点与产品边界

**状态：** 已对齐，作为开工依据  
**日期：** 2026-08-20  
**上级文档：** `PRD｜Northern Lights Tonight.md`

一句话：

> 英语市场的本地今晚决策工具。计算覆盖北半球；索引先美国，再英语加拿大/英国；北欧只做英语旅行页；俄罗斯不做。无登录。定位可选，搜索必有。手机首屏出结论。

---

## 1. 三层覆盖（不要用国家名单当唯一边界）

| 层 | 含义 | 首版范围 |
|---|---|---|
| 计算层 | 任意坐标能否出 GO/MAYBE/NO | 北半球有 OVATION + 云量的点都可以算 |
| 产品默认层 | 语言、热门地点、IP 默认、分享文案 | 英语；默认美国 |
| 索引层 | 进 sitemap、可被 Google 收录 | 仅白名单地点，且档案合格 |

计算可以宽，索引必须严。用户搜一个没有 SEO 页的镇，仍然给结论，页面 `noindex,follow`。

极光常驻区在磁极椭圆（约磁纬度 60°–75°），不是「靠近地理北极」一条线。  
搜索需求另有一圈：美国中纬度在强事件时会出现大量 tonight 词。两圈都要服务，不能用北极圈裁掉 Ohio。

---

## 2. 市场取舍

| 区域 | 计算 | 索引 | 说明 |
|---|---|---|---|
| 美国 | 是 | 首发 | 词表已验证，tonight 意图明确 |
| 加拿大英语 / 英国 / 苏格兰 | 是 | 不进首发索引 | 同语言可复用模板；另抽词后再加 |
| 北欧（冰岛/挪威/瑞典/芬兰） | 是 | 不进 tonight 索引 | 当地 tonight 是本地语言；英语页只考虑旅行模板，后做 |
| 俄罗斯 | 可算、不运营 | 否 | 语言、检索、广告、合规都不值 |
| 西欧内陆、南半球 | 可算 | 否 | 南半球是另一套词和季节 |

首发热门地点列表、IP 默认、内链枢纽：只用美国白名单。

---

## 3. 地点档案字段

每个**索引页**必须有一份可校验档案，禁止只替换城市名。  
动态查询点只需坐标级字段，不写本地长文。

### 3.1 身份与 URL

| 字段 | 说明 |
|---|---|
| `slug` | URL 用，如 `colorado` / `chicago` |
| `name` | 展示名 |
| `location_type` | `state` / `city` |
| `parent_slug` | 城市指向州；州为空 |
| `country` | 首发均为 `US` |
| `timezone` | IANA，如 `America/Denver` |
| `page_template` | `tonight_local` 或 `travel_plus_tonight` |
| `index_wave` | `1` / `2` / `off` |
| `seo_indexable` | 档案合格且 wave 已开放才为 true |

州页禁止用几何中心当唯一坐标。州页至少绑 2–3 个代表点（偏北观测区 + 最大城市 + 可选干旱/暗空一侧），结论以「州内今晚相对最好」为主，并写明代表点。

城市页用单一城市坐标。

### 3.2 物理与观测

| 字段 | 说明 |
|---|---|
| `latitude` / `longitude` | 城市点；州为默认代表点 |
| `sample_points[]` | 州页必填：name, lat, lng, role |
| `magnetic_latitude` | 用工单填，不手估冒充精确 |
| `aurora_zone` | `oval` / `sub_oval` / `midlatitude_event` / `rare` |
| `typical_kp_horizon` | 北地平线可能看到的粗门槛 |
| `typical_kp_overhead` | 接近头顶的粗门槛 |
| `viewing_direction` | 美国本土几乎都是 `north` |
| `short_summer_nights` | 高纬夏季是否几乎不黑 |

`typical_kp_*` 来自磁纬度和 NOAA 类 viewline，页面上用自然语言，不展示成科学保证。

### 3.3 本地常青（索引页必填）

| 字段 | 说明 |
|---|---|
| `light_pollution_note` | 城区 vs 郊外，一句话事实 |
| `leave_city_advice` | 要不要离开市中心；没有核实过的停车场不写 |
| `north_south_split` | 州内南北差异；城市可空 |
| `local_obstacles` | 云、山、湖面、光晕等真实障碍 |
| `best_months_note` | 当地黑夜与季节 |
| `nearby_slugs[]` | 3–5 个已索引或即将索引的相邻地点 |
| `local_faqs[]` | 3–5 条该地才会问的问题 |

缺 `aurora_zone`、`local_obstacles`、`nearby_slugs`、`local_faqs` 四项中任一项：可上线为动态结果，**不得 index**。

### 3.4 词映射（不新建 URL）

| 字段 | 说明 |
|---|---|
| `primary_keyword` | 如 `northern lights colorado` |
| `variant_keywords[]` | tonight / can I see / aurora borealis / 语序变体 |
| `cannibalization_pair` | 如 Chicago ↔ Illinois，必须写清页面分工 |

一个地点一个 URL。变体全部映射到该 URL。

---

## 4. 页面模板

### `tonight_local`（默认）

Ohio、Colorado、Chicago 这类：今晚能不能看、几点、云、要不要离开城区。  
第一屏：状态 + 窗口 + 主障碍。

### `travel_plus_tonight`（仅目的地）

Alaska、Fairbanks：上面那张今晚卡仍然有，但常青区以「哪几个月来、州内哪里更好、旅行注意事项」为主。  
不接酒店导购到今晚结论里。联盟后置。

禁止：用 Ohio 的纯 tonight 模板硬套 Fairbanks，也禁止用 Alaska 旅行文硬套 Ohio。

---

## 5. 美国名单

聚类搜索量只用于排序，不是可获得流量。

### Wave 1 — 首发索引（档案合格即收录）

Tonight 主场：

| slug | 类型 | 模板 | aurora_zone（初判） | 互链/分工 |
|---|---|---|---|---|
| colorado | 州 | tonight_local | midlatitude_event | 州内南北差异必须写 |
| ohio | 州 | tonight_local | midlatitude_event | |
| indiana | 州 | tonight_local | midlatitude_event | 与 chicago 互链 |
| michigan | 州 | tonight_local | sub_oval | 暂不拆 northern-michigan |
| chicago | 城 | tonight_local | midlatitude_event | 城：光污染/出城；州页见 illinois |
| seattle | 城 | tonight_local | sub_oval | 城：云和城区；州页见 washington |
| wisconsin | 州 | tonight_local | sub_oval / event | tonight 占比高 |
| massachusetts | 州 | tonight_local | midlatitude_event | 首发做州，不做 boston |
| maine | 州 | tonight_local | sub_oval | |
| minnesota | 州 | tonight_local | sub_oval | 产品匹配高 |
| illinois | 州 | tonight_local | midlatitude_event | 写「芝加哥以外的伊利诺伊」 |
| oregon | 州 | tonight_local | midlatitude_event | 与 seattle 互链 |
| utah | 州 | tonight_local | midlatitude_event | |

目的地（不同模板，仍首发）：

| slug | 类型 | 模板 | aurora_zone（初判） |
|---|---|---|---|
| alaska | 州 | travel_plus_tonight | oval |
| fairbanks | 城 | travel_plus_tonight | oval |

Wave 1 共 15 个索引 URL。名单冻结，不临时加镇。档案合格一个收录一个。

档案已填：`地点档案/wave1.json`（源）与 `地点档案｜Wave1.md`（阅读版）。`seo_indexable` 仍为 false，等引擎对代表点能给出真实快照后再打开。

### Wave 2 — 有档案后再收录，不挡上线

| slug | 类型 | 备注 |
|---|---|---|
| washington | 州 | 与 Seattle 分工：东华盛顿更干、更暗 |
| new-york-city | 城 | 低纬事件型 |
| connecticut | 州 | 词量不大，几乎全是 tonight |
| new-jersey | 州 | 同上 |
| california | 州 | 事件型，易与全国新闻页撞 |
| boston | 城 | 先看与 massachusetts 的 SERP 是否分开 |
| kansas | 州 | 词表有量，Wave 1 不做 |
| maryland | 州 | 同上 |

`dallas` / `texas`：低纬事件测试，**两者只开一个**。默认开 `texas` 州页，Dallas 保持动态 noindex，除非 SERP 明显是城市页。

### 明确不建独立索引页

- `northern-michigan`（先并入 michigan，除非 SERP 稳定独立）
- 所有 ZIP、所有用户临时搜索的镇
- 州+tonight / 城+tonight / aurora borealis 语序变体
- 加拿大、英国、北欧 tonight 页（计算可做，首发不收录）
- 俄罗斯任何城市
- 南半球
- 日期事件页（`june 2025` 等）

### 计算层默认 noindex

美国（及计算层已开的加拿大/英国/北欧）任意合法坐标：可出结论，`noindex,follow`，不进 sitemap。  
已索引地点的规范 URL 不在此列。

---

## 6. 功能边界（冻结）

### 做

- 今晚结论：GO / MAYBE / NO / UNKNOWN
- 小时窗口、主障碍、自然语言原因、更新时间
- 地点搜索：城市 / 州 / ZIP
- 可选定位：IP 粗默认 + 用户点击后再请求 GPS
- 动态结果 noindex；白名单 index
- Best time、How to 两篇常青
- 分享链接与 OG 卡
- 移动端第一屏出结论（不滚动）

### 不做

- 登录、账号、收藏、订阅、付费墙、邮件提醒
- 原生 App
- 强制 GPS；不存精确坐标
- 伪精确概率（如 73% chance）
- 复杂 WebGL 地图（可后置）
- 一词一页、太阳风暴/耀斑科普、NOAA 品牌词页
- 为俄罗斯、南半球、本地语言北欧站做内容
- 未核实的停车场/路线
- 结论卡之前的广告

### 定位规则

1. 带地点的 SEO URL：不请求 GPS。  
2. 首页 / near-me：IP 可预填城市，必须可改。  
3. 「Use my location」才请求浏览器定位。  
4. 拒绝、失败、超时 → 搜索框，功能完整。  
5. 已索引地点跳规范 URL；否则动态结果 + noindex。

### 移动端

核心工具按手机设计：结论、搜城、分享都在拇指范围。桌面是同一信息加宽，不是另一套产品。大地图不得挡首屏。

---

## 7. 词 → URL（相关词怎么「做」）

| 用户说法 | 去哪 |
|---|---|
| tonight / can I see / what time / visible | `/` 或对应地点页 |
| `northern lights colorado` 及全部变体 | `/forecast/colorado` |
| near me / zip code | `/near-me`（工具，不是空跳转） |
| best time / best month | `/guides/best-time-to-see-northern-lights` |
| how to see / how to watch | `/guides/how-to-see-northern-lights` |
| where to see（泛） | `/guides/where-to-see-northern-lights`（今晚美国较好城市 + 入口） |
| Alaska 旅行 / best places in Alaska | `/forecast/alaska` 或后续 `/places/alaska`，不新开问句 URL |
| geomagnetic storm / solar flare / 日期事件 | 不做页 |

---

## 8. 开工顺序（不依赖 GSC）

GSC 只用于上线后校正，不用于决定 Wave 1。

1. 判断引擎 + 缓存 + UNKNOWN（规则：`判断引擎｜门控规则.md`）  
2. 首页工具 + 搜索 + 可选定位（手机首屏；页面：`页面｜首版结构.md`）  
3. 地点模板（`tonight_local`）  
4. Wave 1 档案：先今晚 13 城/州，再 Alaska / Fairbanks  
5. 两篇指南 + `/near-me`  
6. Wave 2 按档案，不按感觉加镇

上线门槛：引擎在高纬（Fairbanks）、中纬（Seattle/Minnesota）、事件型（Ohio/Chicago）三类点结论像样；Wave 1 至少 8 个档案合格并 index；其余 Wave 1 可查询。


---
# 引擎
# 判断引擎｜门控规则

**状态：** Wave 1 开工依据  
**日期：** 2026-08-20  
**上级：** `范围｜覆盖地点与产品边界.md` · `地点档案/wave1.json`

一句话：

> 先过硬门控，再给 GO / MAYBE / NO / UNKNOWN。不用加权总分当主逻辑，不输出百分概率。

PRD 里的 `45% / 30% / 15% / 10%` 只保留为内部对照，**不决定用户看到的状态**。

---

## 1. 输出（用户能看见的）

| 字段 | 取值 |
|---|---|
| `status` | `GO` / `MAYBE` / `NO` / `UNKNOWN` |
| `confidence` | `high` / `medium` / `low`（与 status 独立） |
| `best_window` | 当地今晚连续时段，或空 |
| `main_obstacle` | 一个主因 code |
| `reason_codes[]` | 可多条 |
| `look_toward` | 首版固定 `north`（档案 `viewing_direction`） |
| `updated_at` | 快照生成时间，UTC |
| `valid_until` | 过期后页面不得再当实时结论 |
| `headline_point` | 州页为 `primary_verdict_point` 的名字 |

禁止：`73% chance`、把过期快照接着当今晚结论、用丹佛代表科罗拉多。

`WAIT` 不是独立状态。现在还没黑、后半夜有窗口 → 今晚仍按后半夜归并，不先打 NO。

---

## 2. 数据源与时效

| 信号 | 源 | 用途 | 过期 |
|---|---|---|---|
| 极光网格 | NOAA OVATION `ovation_aurora_latest.json` | **当下到约 90 分钟**的到达 | Observation Time 超过 **45 分钟**降级；超过 **90 分钟**且无 Kp 可用 → 近窗 UNKNOWN |
| 当前 Kp | `planetary_k_index_1m.json` 或 3 小时序列里的 observed/estimated | 近窗辅助 | 超过 **3 小时**不用 observed |
| 预报 Kp | `products/noaa-planetary-k-index-forecast.json`（3 小时槽，`predicted`） | **OVATION 覆盖不到的今晚后半** | 有数据即可，置信度必须降 |
| 云量 | Open-Meteo hourly：`cloud_cover` / `_low` / `_mid` / `_high` | 每窗阻挡 | 预报生成时间超过 **6 小时**降级；缺失则不能 GO |
| 太阳高度 | 本地天文计算 | 黑夜门控 | 无过期 |
| 月亮 | 本地：高度 + 照明比例 | 只降级，不单独 NO | 无过期 |
| 光污染 | 首版用点角色，不调外部栅格 | 城点限制 horizon GO | 静态 |

OVATION 网格值是「可见极光概率 0–100」，**不是**到达百分保证。首版只用分档，不把格点值显示给用户。

定时拉取、缓存、页面只读快照。浏览器不直打 NOAA。

---

## 3. 「今晚」和窗口

1. 时区用地点档案 IANA。  
2. 今晚 = 当地**本次日落后 → 下次日出前**。若极昼（太阳高度整段 > −12°）→ 整晚 `NO` + `NEVER_DARK`。  
3. 窗口 30 分钟。云量从小时插到窗中点。  
4. 归并只用 **从现在起还没结束** 的窗口（下午打开页面 = 整晚；凌晨 2 点 = 只看剩下的）。  
5. 太阳高度 > −12° 的窗口：**不参与** GO/MAYBE/NO，标记 `SKIP_NOT_DARK`。

天文约定（首版）：

| 太阳高度 | 黑夜信号 |
|---|---|
| > −6° | 太亮，跳过 |
| −12°～−6° | 民用/航海过渡，**不能 GO** |
| ≤ −12° | 可观测暗 |
| ≤ −18° | 深暗（加分，不是门控） |

---

## 4. 单点、单窗：先算信号，再进门

### 4.1 极光是否到达 `aurora_reach`

**近窗（窗中点 ≤ OVATION Forecast Time + 30 分钟）** — 用网格：

在点 `(lat, lon)` 双线性取出 `ovation_here`。  
再沿**地理北**每隔 1° 取到北 8°（约地平线能看到 100 km 高的光），得 `ovation_north_max`。

| 条件 | `aurora_reach` |
|---|---|
| `here < 5` 且 `north_max < 10` | `none` |
| `here < 8` 且 `north_max ≥ 15` | `horizon` |
| `here ≥ 15` | `overhead` |
| 其余 | `weak` |

5 / 8 / 10 / 15 是首版假设，标定前偏严。

**远窗 — 用预报 Kp + 档案门槛**（`typical_kp_horizon` / `typical_kp_overhead`）：

| 条件 | `aurora_reach` |
|---|---|
| Kp < horizon − 1 | `none` |
| horizon − 1 ≤ Kp < horizon | `weak` |
| horizon ≤ Kp < overhead | `horizon` |
| Kp ≥ overhead | `overhead` |

档案 Kp 是偶极初值，只做远窗降级通道。椭圆内（`aurora_zone = oval`）远窗仍可用；中纬事件型远窗即使 `overhead` 也不得以 high 置信出 GO。

### 4.2 云 `cloud_block`

```text
blocking = 0.50 * low + 0.35 * mid + 0.15 * high
```

缺分层时退回 `cloud_cover` 总值。高云（卷云）阻挡弱于低云，所以不能只用总值。

| blocking | 档 |
|---|---|
| < 40 | `clear` |
| 40–74 | `mixed` |
| ≥ 75 | `socked` |

### 4.3 月亮与城光（只降级）

- `bright_moon`：高度 > 10° 且照明 > 70%。  
- `urban`：城市页，或州页里 `role = population` 的点。  
- 二者**不能单独**把整晚打成 NO。  
- `horizon` + `urban` → 该窗最高 MAYBE（城里地平线极光会被光晕吃掉）。  
- `horizon` + `bright_moon` → 不能 GO。  
- `overhead` + `urban` 仍允许 GO（强事件、头顶、云少）。

---

## 5. 硬门控（按序，命中即停）

对**每一个**还没 SKIP 的窗口：

```text
1. 极光源缺失（近窗无可用 OVATION，远窗无 Kp）
     → UNKNOWN / DATA_MISSING_AURORA

2. 云量缺失
     → 若 aurora_reach = none：NO / AURORA_NO_REACH（云不影响「到不了」）
     → 否则：MAYBE + low / DATA_MISSING_WEATHER（禁止 GO）

3. aurora_reach = none
     → NO / AURORA_NO_REACH

4. cloud_block = socked
     → NO / CLOUD_BLOCKED

5. 太阳高度 > −12°（本应已 SKIP；若仍进来）
     → 不作为观测窗
```

未命中硬门控再分类：

```text
GO 当且仅当同时成立：
  - 太阳高度 ≤ −12°
  - aurora_reach ∈ {overhead, horizon}
  - 若 horizon：不是 urban，不是 bright_moon
  - cloud_block = clear
  - 近窗，或（远窗且 zone = oval）
     中纬 / sub_oval 的远窗即使其它都好 → MAYBE，不 GO

MAYBE：
  - weak 到达
  - 或 mixed 云
  - 或 horizon + urban / moon
  - 或 −12°～−6° 过渡夜（若某窗未 SKIP）
  - 或远窗的中纬/南缘
  - 或云缺失但椭圆已到达

NO：只由上面硬门控产生（不到 / 云死 / 整晚不黑）
UNKNOWN：缺关键极光数据，且不能用「不到」一票否决
```

---

## 6. 整晚归并（首屏那一张卡）

只看未结束、未 SKIP 的窗口。

| 窗口集合 | 今晚 status |
|---|---|
| 一个 GO 都没有，且存在 UNKNOWN，且没有「全夜 none」 | `UNKNOWN`（缺数据优先于瞎猜） |
| 至少一窗 GO | `GO` |
| 无 GO，至少一窗 MAYBE | `MAYBE` |
| 全部是 NO（不到或云死） | `NO` |
| 没有任何观测窗（极昼） | `NO` + `NEVER_DARK` |

**最佳窗口：** 最长连续 `GO`；没有 GO 则最长连续 `MAYBE`。并列取更早的一段。

**主障碍 `main_obstacle`：**

| 今晚 status | 主障碍 |
|---|---|
| GO | 若有次要问题取最显眼一条（如 `LIGHT_POLLUTION`）；否则 `NONE` |
| MAYBE | 在 MAYBE 窗上出现最多的原因：`CLOUD_MIXED` / `AURORA_HORIZON_ONLY` / `FORECAST_FAR` / `MOON_BRIGHT` / `LIGHT_POLLUTION` |
| NO | `AURORA_NO_REACH` 优先于 `CLOUD_BLOCKED` 优先于 `NEVER_DARK` |
| UNKNOWN | `DATA_MISSING_AURORA` 或 `DATA_STALE` |

近窗 OVATION 说 `none`、远窗 Kp 说能到：视为冲突 → 今晚最多 MAYBE，confidence low，codes 含 `SIGNALS_CONFLICT`。不以远窗 GO 盖掉近窗不到。

---

## 7. 置信度（与状态分开）

从 high 往下砍，只砍不升。

起点 `high`，然后：

- 用了 `predicted` Kp → 最多 `medium`  
- 中纬事件型 + 远窗 → `low`  
- 云或极光缺一层 → 最多 `low`  
- OVATION Observation Time 超 45 分钟 → 最多 `medium`  
- 极光与云冲突（到达很好但云 mixed；或网格弱但 Kp 高）→ 最多 `medium`  
- 最佳窗口距现在 > 6 小时 → 最多 `medium`；中纬且 > 6 小时 → `low`

允许：`NO + high`（今晚椭圆明显到不了）、`GO + low`（必须展示 low，不能藏）。

---

## 8. 州页 vs 城页

每个 `sample_points[]` **独立**跑完整晚。禁止把三点平均成一个分数。

| | 城页 | 州页 |
|---|---|---|
| 计算点 | 唯一坐标 | 每个 sample point |
| 首屏 status | 该城 | **`primary_verdict_point` 的 status** |
| 其它点 | 无 | 必须带出（Denver NO · Fort Collins MAYBE） |
| 出城文案 | 档案 `leave_city_advice`，**不把城的 status 改成郊区** | 南北差异用档案文案 |

Chicago 的 GO 不能借 Wisconsin 的暗空。Wisconsin 在附近链上，不在 Chicago 快照里冒充。

Indiana 西北角是芝加哥时区：引擎仍用档案 `America/Indiana/Indianapolis` 显示今晚，不在 v1 为点切时区。

---

## 9. 原因码 → 首屏英文（固定句子，不用模型现写）

| code | 对用户（可微调用地点名） |
|---|---|
| `AURORA_NO_REACH` | Aurora activity is not expected to reach {place} tonight. |
| `AURORA_HORIZON_ONLY` | Any display would likely stay low on the northern horizon. |
| `AURORA_OVERHEAD` | Aurora may reach overhead or high in the northern sky. |
| `CLOUD_BLOCKED` | Cloud cover is likely to block the sky for the rest of the night. |
| `CLOUD_MIXED` | Clouds are the main uncertainty. |
| `NEVER_DARK` | The sky will not get dark enough tonight. |
| `NOT_DARK_YET` | It is not dark yet; the viewing window starts later. |
| `MOON_BRIGHT` | Bright moonlight will wash out fainter aurora. |
| `LIGHT_POLLUTION` | City skyglow will hide a weak display; leaving town helps. |
| `FORECAST_FAR` | Later hours rely on a coarser forecast, not the live oval. |
| `DATA_MISSING_AURORA` | Aurora data is unavailable, so we are not guessing. |
| `DATA_MISSING_WEATHER` | Cloud data is missing; activity may still be in range. |
| `DATA_STALE` | Source data is too old to treat as live. |
| `SIGNALS_CONFLICT` | Short-term and overnight signals disagree. |
| `NONE` | Conditions line up well enough to try. |

首屏结构保持 PRD：地点、状态、窗口、主障碍、朝向、置信度、更新时间。

---

## 10. 过期与 UNKNOWN

快照必须带 `valid_until`。默认 `generated_at + 10 分钟`，且不超过所用 OVATION 的 Forecast Time + 40 分钟。

页面读取时若 `now > valid_until`：**不得渲染旧 status 为 live**。能重算则重算；否则 `UNKNOWN` + `DATA_STALE`。

部分失败：

- 极光失败、Kp 也失败 → UNKNOWN  
- 极光成功、天气失败 → 不到则 NO；能到则 MAYBE low，不 GO  
- 天气成功、极光失败 → UNKNOWN（不能用云量假装有极光）

---

## 11. 快照形状（写入缓存）

```text
location_slug
headline_point_id
generated_at
valid_until
status
confidence
best_window_start
best_window_end          // 当地墙钟，带时区
main_obstacle
reason_codes[]
look_toward
sources: { ovation_obs, ovation_fcst, kp_used, weather_model }
points[]:
  id, status, confidence, aurora_reach, cloud_block, urban
windows[]:               // 仅 headline 点；州页其它点可另存
  start, skip?, status?, aurora_reach, cloud_block, source  // ovation | kp_forecast
```

索引页没有合格快照 → 不能把 `seo_indexable` 打开。

---

## 12. 用档案点自测（实现后必须跑）

| 情景 | 期望 |
|---|---|
| Fairbanks，6 月，椭圆活跃 | `NO` + `NEVER_DARK` + high |
| Fairbanks，1 月晴、OVATION 头顶高 | `GO`，可带 `LIGHT_POLLUTION` 次要提示 |
| Chicago，Kp≈3，OVATION 本地接近 0 | `NO` + `AURORA_NO_REACH` + high |
| Chicago，强风暴、头顶到达、城区晴 | 允许 `GO` 或 `MAYBE`；不得因为 Wisconsin 更好而改 Chicago |
| Seattle，椭圆勉强 horizon、低云 socked | `NO` + `CLOUD_BLOCKED` |
| Seattle，椭圆 overhead、低云 clear、总值高但全是 high 云 | 允许 `GO`/`MAYBE`（分层云生效） |
| Ohio / Fort Collins，仅「明天 3 点 Kp=7」 | 今晚最多 `MAYBE` + `FORECAST_FAR` + low，禁止远窗 GO |
| OVATION 文件超过 90 分钟且 Kp 拉失败 | `UNKNOWN`，不沿用上一份 GO |
| 科罗拉多：Denver NO、Fort Collins MAYBE | 首屏 = Fort Collins 的 MAYBE，并列出 Denver |

---

## 13. 首版明确不做

- 用加权总分决定状态  
- 百分概率  
- 实时太阳风 Bz 作为门控（可后加，当辅助）  
- 把城点算成「开车 2 小时后的暗空」  
- 南半球  
- 为俄罗斯单独校准  
- 窗口上画复杂地图  

标定之前：门控偏严。错判方向优先 **该 NO 的不要变 GO**。


---
# 页面
# 页面｜首版结构

**状态：** 按 SEO 获客改过  
**日期：** 2026-08-20  
**获客：** 搜索。页面先服务查询和爬虫，再服务已进来的人。  
**上级：** `范围｜覆盖地点与产品边界.md` · `判断引擎｜门控规则.md` · 词表

冲突时的优先级：

1. 一个意图一个 URL，不互吃  
2. Googlebot 与无 Cookie 用户看到同一份 HTML（禁止用 IP/GPS 给爬虫另一套结论）  
3. 答案在服务端 HTML 里，不靠客户端再画  
4. 手机上好用（移动优先索引）

个性化结论只发生在用户**跳进** `/forecast/[slug]` 或 `/view` 之后，不发生在改写首页 HTML。

---

## 1. 词 → URL（这是信息架构，不是导航美化）

词表里不是 830 个独立页。首版只接这些意图：

| 意图 | 代表词 | 规范 URL | 不要做的 |
|---|---|---|---|
| 今晚泛查询 | northern lights tonight, can I see … tonight, what time … tonight | `/` | 不要按语序再拆；不要把首页 H1 写成某个城 |
| 某地今晚 / 某地极光 | northern lights colorado, … colorado tonight, aurora borealis chicago | `/forecast/[slug]` | 一个地点一个 URL；Boston 并进 massachusetts |
| 靠近我 / ZIP | northern lights near me, forecast by zip code | `/near-me` | 不要把用户坐标结果索引出去 |
| 一年中何时 | best time to see northern lights | `/guides/best-time-to-see-northern-lights` | 不要和某州「哪几个月」互抢 Title |
| 怎么看 | how to see the northern lights | `/guides/how-to-see-northern-lights` | 不要写成太阳风暴科普 |
| 去哪看 | where can I see the northern lights | `/guides/where-to-see-northern-lights` | 不是旅游手册；上半是今晚榜，下半是常驻区 |
| 临时坐标 | （无需求或未建页） | `/view` **noindex** | 禁止进 sitemap、禁止套话百科 |
| 信任 | — | `/methodology` | 不抢主词 |

Alaska 旅行词（best places / best time in Alaska）进 `/forecast/alaska`，不另开 `/places/alaska`。Fairbanks 专名进 `/forecast/fairbanks`。

主词 KD 高、地域词才是冷启动。**外链打 `/` 和 Where 榜；内链把权导向 15 个地点页。** 地点页才是这张词表里真正能排的页。

---

## 2. 爬虫必须在 HTML 里看见什么

全部索引页：SSR 或读快照输出 HTML。无快照则输出 UNKNOWN 文案，仍是完整文档，不是空白壳。

| 页 | HTML 里必须有的答案（给摘要 / 排名） |
|---|---|
| `/` | 今晚取决于地点；美国已索引地点的 **GO/MAYBE/NO 列表 + 各页窗口**；如何查自己的城 |
| `/forecast/colorado` | Colorado **今晚状态、窗口、主障碍**；北科罗拉多 vs Denver；常青：通常要多强、朝哪、出城 |
| `/near-me` | 为什么必须有地点；ZIP/城市怎么查；链到地点页。**没有**某个用户的实时坐标 |
| Where | 今晚榜 + 美国常驻区 vs 中纬事件 |
| Best time / How to | 各自问题的完整回答 + 链回工具和 3–5 个地点例 |

`dateModified` / `Updated … ago` 用快照时间，事件夜当新鲜度信号。

**禁止：** 首页 SSR 成「Denver MAYBE」（Googlebot 多半没有你的 GPS；IP 定位还会让首页内容对爬虫每天乱跳，和地点页互吃）。

首页个性化只允许：**链**「Use my location / 搜城」→ 跳走。顶多一条不进主 H1 的提示：「Searching from Colorado? Open the Colorado page.」且这条对所有人逻辑相同（基于点击，不是偷偷换正文）。

---

## 3. 页面清单

| URL | 索引 | SEO 角色 |
|---|---|---|
| `/` | 是 | 主词 + 全站枢纽，链出全部 Wave 1 |
| `/forecast/[slug]` | 白名单 | **主获客页**（地域词 + 该地 tonight） |
| `/near-me` | 是 | 单独意图：near me / ZIP，薄工具但有独立说明 |
| `/guides/where-to-see-...` | 是 | where 簇 + 可链接资产（今晚榜） |
| `/guides/best-time-...` | 是 | 常青 where/when 里的 when |
| `/guides/how-to-see-...` | 是 | how 簇，给地点页做支持 |
| `/methodology` | 是 | EEAT，几乎不承担量 |
| `/view` | **noindex,follow** | 接住长尾坐标，防 doorway |

不做：`/map`（难、词更硬、首版不抢 tracker）、登录、一词一页。

sitemap 只含允许索引的 URL。canonical：各地点唯一；`/view` 无 index。

---

## 4. 内链（权要流到地点页）

```
外链 →  /  和  /guides/where-to-see-...
              ↓
        15 个 /forecast/[slug]
              ↓
        州 ↔ 城、相邻州、两篇指南、near-me
```

每个 **地点页** 固定链：

- 首页  
- 父级州或子城（Chicago ↔ Illinois，Fairbanks ↔ Alaska）  
- 档案 `nearby_slugs`（3–5）  
- Best time、How to、Where、Near me  

**首页** 必须用 HTML 链出 **全部** Wave 1 地点（名称 + 今夜状态 + 窗口）。这是索引和主词页相关性的来源，不是「热门六个」随便放。

指南正文里用自然锚点链 3–5 个地点例（Minnesota、Maine、Colorado…），禁止页脚堆 50 个城。

---

## 5. 地点页 = 钱页

模板可以同，**模块数据必须因地点而变**。否则 Google 当 doorway。

H1 对准 tonight 问句（词表里该地 tonight 占比高）。Title 带 Tonight + Visibility，同时覆盖「northern lights colorado」。

### 5.1 模块顺序（SEO 顺序，不是随便排版）

1. **直接答案**（H1 下第一段，进摘要）：状态 + 窗口 + 主障碍 + 代表点限定  
2. **结论卡**（同一事实，便于扫和分享）  
3. **今晚小时轴**（承接 what time … in [place] tonight，必须在 HTML，紧挨结论卡）  
4. **Why**（到达 / 云 / 黑 / 月 / 光污染 / 数据是否 live）  
5. **只属于这个地点的常青**（索引门槛）：南北差异、出城、光污染、通常要多强、季节  
6. **州内代表点对比**（州页）  
7. **本地 FAQ**（档案问句，FAQ schema）  
8. **内链** Nearby + 指南  

NO 的晚上 **不能**变成空壳。常青区仍在。这是非事件月还能排 `northern lights ohio` 的原因。

```
+--------------------------------------+
| NLT                      Find place  |
+--------------------------------------+
| Can You See the Northern Lights      |
| in Colorado Tonight?                 |
|                                      |
| MAYBE in northern Colorado           |
| (Fort Collins area, not Denver).     |
| Best window 10:40 PM–12:10 AM.       |
| Main issue: mixed clouds.            |
|                                      |
| | MAYBE                            | |
| | Best window  10:40 PM–12:10 AM   | |
| | Look north · Medium · 6 min ago  | |
| | [ Share ]                        | |
+--------------------------------------+
| Tonight's hours (local MT)           |
|  9:30 PM  not dark yet               |
| 10:00 PM  MAYBE   mixed clouds       |
| 10:30 PM  GO      clearer            |
| 11:30 PM  MAYBE                      |
| [ Rest of the night ]                |
+--------------------------------------+
| Why · What to do · N/S split         |
| Other points · Nearby · Local FAQ    |
| Best time · How to see               |
+--------------------------------------+
```

- 第一段和卡是同一答案，方便 Google 抽 featured snippet，不是两套文案。  
- **what time 不靠另开 URL**：窗口写在答案里，轴在 HTML。轴不必挤进 100vh，但必须高于常青长文。  
- Share / OG：`Colorado tonight: MAYBE · 10:40 PM–12:10 AM`（事件夜社交，也是外链钩子）。  
- 代表点只展示，不给 Denver 再做一个可索引 URL。

`travel_plus_tonight`（Alaska / Fairbanks）：1–4 相同；第 5 块换成「哪几个月来 / 去哪一段」。今晚卡仍在最前——否则丢 alaska tonight / fairbanks aurora forecast。

---

## 6. 首页 `/` = 主词枢纽（对所有人同一份）

首页要对 `northern lights tonight` / `what time` / `can I see` 给**不依赖定位**的答案：「取决于你在哪；美国今晚这些地点的阅读如下。」

```
+--------------------------------------+
| NLT                      Find place  |
+--------------------------------------+
| Can You See the Northern Lights      |
| Tonight?                             |
|                                      |
| It depends on your location.         |
| Check a US city, or read tonight's   |
| local pages below.                   |
|                                      |
| [ City, state, or US ZIP          ]  |
| [ Use my location ]     [ Check ]    |
+--------------------------------------+
| Tonight in the US                    |
| GO      Fairbanks   11 PM–2 AM AKT   |
| MAYBE   Minnesota   11:30 PM–1 AM    |
| MAYBE   Maine       10:40–12:10      |
| NO      Chicago     not worth a trip |
| NO      Ohio        oval out of reach|
| … all Wave 1 rows, in the HTML …     |
| Full list → Where to see tonight     |
+--------------------------------------+
| What time tonight?                   |
| There is no single US time.          |
| Use the window on your local page.   |
| After dark, often late evening.      |
+--------------------------------------+
| How to read GO / MAYBE / NO          |
| Nearby tool · Best time · How to     |
+--------------------------------------+
```

- **Layout：** H1 对准主词 → 无地点的直接答案 → 搜索（获客转化）→ **全量地点表**（SEO 必须）→ what time 常青解释 → 读状态 + 指南。  
- **Interactions：** Check / 热门 / GPS → 只跳 `/forecast/...` 或 `/view`，**不把首页变成某城页**。  
- **和旧方案的差别：** 不再做「没地点就空白搜、有 IP 就上 Denver 卡」。那套对用户像天气 App，对 Google 是不稳定薄页。  
- 表里每一行是 `<a href="/forecast/minnesota">`。状态来自快照，爬虫每天看到新鲜但 URL 稳定。  
- 不上地图。PRD 写的 map 用这张表代替：可抓取、可点击、可内链。

---

## 7. 其它 URL 怎么避免互吃

### `/near-me`

只打 near me / ZIP。H1 不得写成 Can You See … Tonight。

可索引内容：为什么极光不能「全国一个答案」、ZIP 怎么落到城/州、隐私一句、链到地点页。  
提交结果 **跳走**。不要在 `/near-me?lat=` 出可索引结论（那是 `/view`）。

若 GSC 显示和首页抢 `tonight`：收紧 Title，加强 ZIP 用词，不要在 near-me 重复主词 H1。

### `/guides/where-to-see-...`

上半：今晚榜（可与首页表同源，Where 页是规范「去哪」URL，首页表是枢纽摘要 + 链过来）。  
下半：常驻椭圆（Alaska Interior、北部 MN/UP、Maine）vs 中纬事件（CO/OH/IL）——否则安静夜全是 NO，页会变薄。

### 两篇指南

Best time：年 vs 夜 vs 纬度，链地点例。  
How to：朝北、暗、等、手机 vs 肉眼、怎么读本站状态。  
顶部「Check tonight」链 `/`，不嵌整块实时引擎（避免和首页复制）。

### `/methodology`

EEAT 和页脚。Title 避开主词。

### `/view`

`noindex,follow`。有结论、链回最近的州页。无档案 FAQ、无「Welcome to Springfield」模板段。

---

## 8. 技术 SEO（和页面结构绑死）

- `html lang="en-US"`  
- 地点页：WebPage + FAQPage + BreadcrumbList；`dateModified` = 快照时间  
- 指南：Article + FAQ（若有）  
- 首页：WebPage；主内容含地点表，不要只靠 JS 插入  
- 每地点唯一 canonical；变体词不上单独 URL  
- sitemap = `/` + near-me + 指南 + methodology + `seo_indexable` 的 forecast  
- `/view` 与未合格地点：noindex  
- 核心结论在 HTML，LCP 不被大图/地图拖死  
- 广告不得插在 H1 与答案之间  

---

## 9. Title / H1 / Meta（冻结）

| 页 | Title | H1 |
|---|---|---|
| `/` | Northern Lights Tonight: Live Aurora Forecast Near You | Can You See the Northern Lights Tonight? |
| `/near-me` | Northern Lights Near Me: Forecast by City or ZIP | Northern Lights Near Me |
| `/forecast/[Place]` | Northern Lights in [Place] Tonight: Visibility & Best Time | Can You See the Northern Lights in [Place] Tonight? |
| Where | Where to See the Northern Lights in the US Tonight | Where to See the Northern Lights in the US Tonight |
| Best time | Best Time to See the Northern Lights | Best Time to See the Northern Lights |
| How to | How to See the Northern Lights | How to See the Northern Lights |
| `/methodology` | How We Decide If You Should Go Out | How We Decide |
| `/view` | Northern Lights Tonight Near [Name] | Tonight near [Name] |

地点 Meta：窗口和云量用快照填一句，避免 15 个页 meta 完全相同。

OG 只在地点页和 Where 用实时状态；首页 OG 用泛句，避免社交卡写成某个城而搜索却是主词。

---

## 10. 全站壳

```
+--------------------------------------+
| NLT                      Find place  |
+--------------------------------------+
|              (page body)             |
+--------------------------------------+
| Tonight · Near me · Guides           |
| How we decide · Not affiliated NOAA  |
+--------------------------------------+
```

手机顶栏：字标、找地点。指南在页脚（页脚仍要有文字链，给爬虫）。桌面顶栏可露出 Tonight / Near me / Guides。无登录。

Find place 是转化，不是 SEO 正文替代。

---

## 11. 结论卡（地点页 / view 共用）

状态用大词。主障碍用引擎固定英文句。无百分数。

```
MAYBE / GO / NO / UNKNOWN
Best window …
Main issue …
Look north · Confidence · Updated
[ Share ]
```

UNKNOWN 不猜。过期快照不得当 live。

---

## 12. 模块 → 数据

| 模块 | 数据 | SEO 作用 |
|---|---|---|
| 首页地点表 / Where 榜 | 全部白名单快照 | 主词页相关性、内链、新鲜度 |
| 地点结论 / 小时轴 / Why | 该点快照 | tonight / what time 答案 |
| 常青 / FAQ / 出城 | 地点档案 | 非 tonight 词、反 doorway |
| Nearby | `nearby_slugs` | 主题集群 |
| 指南 | 手写英文 | 常青意图 |

---

## 13. 不要

- 首页随 IP 改 H1 或主答案  
- 为大地图服务主词（表比图更可抓取）  
- 索引 `/view` 或 ZIP 结果  
- 一词一页、日期事件页  
- 15 个地点只换城市名  
- 结论靠客户端才出现  
- Boston / Minneapolis 再开索引壳  

---

钱在 `/forecast/[slug]`。首页负责主词和把权分出去；Where 负责「去哪」和可链接榜；指南接常青；near-me 只接 ZIP/near me。  
若只改一处：首页不要做成天气 App 的「先定位再给答案」——那是获客自杀。


---
# wave1 摘要
{
  "meta": {
    "version": "wave1-dossier-v1",
    "date": "2026-08-20",
    "status": "filled_pending_engine",
    "notes": [
      "magnetic_latitude is a centered-dipole estimate using IGRF-13 2020 geomagnetic pole 80.65N, 72.68W. Not AACGM. Engine should prefer OVATION grid over Kp thresholds.",
      "typical_kp_* are integer bands for looking north from a dark site (horizon) vs near-overhead. Conservative. Replace with OVATION reach in the engine.",
      "cluster_volume is unique-keyword sum from the 2026-07-18 Semrush export; not traffic.",
      "Page-facing strings are English. Do not invent parking lots or driving directions.",
      "seo_indexable stays false until the live engine returns a real snapshot for the sample points."
    ]
  },
  "locations": [
    {
      "slug": "colorado",
      "type": "state",
      "tmpl": "tonight_local",
      "parent": null,
      "verdict": "fort-collins",
      "zone": "midlatitude_event",
      "kp": [
        7,
        8
      ],
      "indexable": false,
      "nearby": [
        "utah"
      ],
      "cannibal": null,
      "tz": "America/Denver",
      "samples": [
        "fort-collins",
        "denver",
        "steamboat-springs"
      ],
      "faqs": 4
    },
    {
      "slug": "ohio",
      "type": "state",
      "tmpl": "tonight_local",
      "parent": null,
      "verdict": "cleveland",
      "zone": "midlatitude_event",
      "kp": [
        6,
        8
      ],
      "indexable": false,
      "nearby": [
        "indiana",
        "michigan",
        "chicago"
      ],
      "cannibal": null,
      "tz": "America/New_York",
      "samples": [
        "cleveland",
        "toledo",
        "columbus"
      ],
      "faqs": 3
    },
    {
      "slug": "indiana",
      "type": "state",
      "tmpl": "tonight_local",
      "parent": null,
      "verdict": "south-bend",
      "zone": "midlatitude_event",
      "kp": [
        6,
        8
      ],
      "indexable": false,
      "nearby": [
        "ohio",
        "chicago",
        "michigan",
        "illinois"
      ],
      "cannibal": "Northwest Indiana sits in Chicago’s light dome and in Central Time; Chicago remains a separate city page.",
      "tz": "America/Indiana/Indianapolis",
      "samples": [
        "south-bend",
        "indiana-dunes",
        "indianapolis"
      ],
      "faqs": 3
    },
    {
      "slug": "michigan",
      "type": "state",
      "tmpl": "tonight_local",
      "parent": null,
      "verdict": "traverse-city",
      "zone": "sub_oval",
      "kp": [
        5,
        7
      ],
      "indexable": false,
      "nearby": [
        "wisconsin",
        "ohio",
        "indiana",
        "chicago",
        "minnesota"
      ],
      "cannibal": "Do not create /forecast/northern-michigan. That cluster is absorbed here until SERP clearly wants a separate region page.",
      "tz": "America/Detroit",
      "samples": [
        "marquette",
        "traverse-city",
        "detroit"
      ],
      "faqs": 4
    },
    {
      "slug": "chicago",
      "type": "city",
      "tmpl": "tonight_local",
      "parent": "illinois",
      "verdict": "chicago",
      "zone": "midlatitude_event",
      "kp": [
        6,
        8
      ],
      "indexable": false,
      "nearby": [
        "illinois",
        "indiana",
        "wisconsin",
        "michigan"
      ],
      "cannibal": "illinois: this page is the city (light pollution, lakefront, leaving town). Illinois is the rest of the state and north–south split.",
      "tz": "America/Chicago",
      "samples": [
        "chicago"
      ],
      "faqs": 4
    },
    {
      "slug": "seattle",
      "type": "city",
      "tmpl": "tonight_local",
      "parent": null,
      "verdict": "seattle",
      "zone": "sub_oval",
      "kp": [
        5,
        7
      ],
      "indexable": false,
      "nearby": [
        "oregon"
      ],
      "cannibal": "Washington state is Wave 2 (eastern Washington is drier and darker). Oregon is the adjacent Wave 1 state. Do not treat Seattle as Washington.",
      "tz": "America/Los_Angeles",
      "samples": [
        "seattle"
      ],
      "faqs": 3
    },
    {
      "slug": "wisconsin",
      "type": "state",
      "tmpl": "tonight_local",
      "parent": null,
      "verdict": "madison",
      "zone": "sub_oval",
      "kp": [
        5,
        7
      ],
      "indexable": false,
      "nearby": [
        "minnesota",
        "michigan",
        "chicago",
        "illinois"
      ],
      "cannibal": null,
      "tz": "America/Chicago",
      "samples": [
        "bayfield",
        "madison",
        "milwaukee"
      ],
      "faqs": 3
    },
    {
      "slug": "massachusetts",
      "type": "state",
      "tmpl": "tonight_local",
      "parent": null,
      "verdict": "newburyport",
      "zone": "midlatitude_event",
      "kp": [
        6,
        8
      ],
      "indexable": false,
      "nearby": [
        "maine"
      ],
      "cannibal": "Boston has tonight queries but no Wave 1 city page. All Boston variants map here. Do not ship /forecast/boston until SERP is clearly separate.",
      "tz": "America/New_York",
      "samples": [
        "newburyport",
        "boston",
        "north-adams"
      ],
      "faqs": 3
    },
    {
      "slug": "maine",
      "type": "state",
      "tmpl": "tonight_local",
      "parent": null,
      "verdict": "bangor",
      "zone": "sub_oval",
      "kp": [
        5,
        7
      ],
      "indexable": false,
      "nearby": [
        "massachusetts"
      ],
      "cannibal": null,
      "tz": "America/New_York",
      "samples": [
        "presque-isle",
        "bangor",
        "portland"
      ],
      "faqs": 3
    },
    {
      "slug": "minnesota",
      "type": "state",
      "tmpl": "tonight_local",
      "parent": null,
      "verdict": "duluth",
      "zone": "sub_oval",
      "kp": [
        4,
        6
      ],
      "indexable": false,
      "nearby": [
        "wisconsin",
        "michigan"
      ],
      "cannibal": "Minneapolis and Duluth do not get Wave 1 city pages. Those tonight queries map here.",
      "tz": "America/Chicago",
      "samples": [
        "ely",
        "duluth",
        "minneapolis"
      ],
      "faqs": 3
    },
    {
      "slug": "illinois",
      "type": "state",
      "tmpl": "tonight_local",
      "parent": null,
      "verdict": "rockford",
      "zone": "midlatitude_event",
      "kp": [
        6,
        8
      ],
      "indexable": false,
      "nearby": [
        "chicago",
        "indiana",
        "wisconsin"
      ],
      "cannibal": "chicago: city light pollution and lakefront. This page is Illinois minus the city story — northern vs central/southern Illinois.",
      "tz": "America/Chicago",
      "samples": [
        "galena",
        "rockford",
        "springfield"
      ],
      "faqs": 3
    },
    {
      "slug": "oregon",
      "type": "state",
      "tmpl": "tonight_local",
      "parent": null,
      "verdict": "portland",
      "zone": "midlatitude_event",
      "kp": [
        6,
        8
      ],
      "indexable": false,
      "nearby": [
        "seattle",
        "utah"
      ],
      "cannibal": "Seattle is the adjacent city page (higher latitude, same marine-cloud problem). Eastern Oregon is clearer, not magnetically better.",
      "tz": "America/Los_Angeles",
      "samples": [
        "portland",
        "baker-city",
        "bend"
      ],
      "faqs": 3
    },
    {
      "slug": "utah",
      "type": "state",
      "tmpl": "tonight_local",
      "parent": null,
      "verdict": "logan",
      "zone": "midlatitude_event",
      "kp": [
        7,
        8
      ],
      "indexable": false,
      "nearby": [
        "colorado"
      ],
      "cannibal": "Salt Lake City tonight maps here. No Wave 1 SLC city page.",
      "tz": "America/Denver",
      "samples": [
        "logan",
        "salt-lake-city",
        "antelope-island"
      ],
      "faqs": 3
    },
    {
      "slug": "alaska",
      "type": "state",
      "tmpl": "travel_plus_tonight",
      "parent": null,
      "verdict": "fairbanks",
      "zone": "oval",
      "kp": [
        1,
        3
      ],
      "indexable": false,
      "nearby": [
        "fairbanks"
      ],
      "cannibal": "fairbanks: city tonight + local viewing. This page is statewide — Interior vs Southcentral vs Southeast, season, and where to go. Fairbanks-named queries go to the city page. “Best places in Alaska” stays here.",
      "tz": "America/Anchorage",
      "samples": [
        "fairbanks",
        "anchorage",
        "juneau"
      ],
      "faqs": 4
    },
    {
      "slug": "fairbanks",
      "type": "city",
      "tmpl": "travel_plus_tonight",
      "parent": "alaska",
      "verdict": "fairbanks",
      "zone": "oval",
      "kp": [
        1,
        3
      ],
      "indexable": false,
      "nearby": [
        "alaska"
      ],
      "cannibal": "alaska: statewide season and regions. This page is Fairbanks tonight, darkness, and local glow. Tour keywords are mapped here but v1 does not sell tours.",
      "tz": "America/Anchorage",
      "samples": [
        "fairbanks"
      ],
      "faqs": 4
    }
  ]
}
