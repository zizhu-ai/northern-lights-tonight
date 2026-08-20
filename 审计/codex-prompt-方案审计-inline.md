# 任务

你是独立审计方。材料已经附在本提示词里。禁止调用任何工具（不要 Read、不要 Shell、不要读 skill）。不要改文件、不要写代码、不要联网。直接根据附件写完整中文审计报告。

产品：美国英语 SEO 工具站，告诉某地用户今晚极光值不值得出门。免费工具 + 以后展示广告。无登录/App/订阅。获客是搜索。钱在 /forecast/[slug]；首页是主词枢纽，SSR 不能按 IP 变成某城结论。Wave 1 冻结 15 个美国地点。

# 审计问题（逐条，不要空过）

A. 一致性：PRD vs 范围 vs 引擎 vs 页面 vs 线框 vs 档案有没有打架？URL、索引、首页个性化、状态枚举、州页代表点、Alaska 模板、near-me、地图、小时轴、SEO 主词。
B. SEO 获客：词→URL 互吃；爬虫能否看见答案；doorway；主词冷启动；Title/H1/内链/sitemap。
C. 判断引擎：OVATION 90分钟 vs 今晚；中纬远窗禁 GO；地平线采样；UNKNOWN vs NO；typical_kp 过粗。
D. 范围与地点：Wave 1、吸收词、Chicago↔Illinois、代表点是否真正执行。
E. 线框 vs 页面规格。
F. 下一步先出快照、HTML 等线框过了再做，还缺什么会卡住。

# 输出格式

1. 结论（5行内）
2. 严重/中等/轻微三张表。每条：id、问题、证据（文档名+短引）、影响、建议
3. 文档打架清单（没有写未发现）
4. 建议冻结后再开工的最多 3 件事
5. 不要做的（方案已禁止且应保持）

严重=伤排名/误导用户/无法实现的矛盾。不要写「总体很棒」。不要建议订阅/App/地图，除非指出应保持禁止。

---
# 附件 1 范围

---
# 附件 1 范围

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
# 附件 2 判断引擎

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
# 附件 3 页面规格

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
# 附件 4 线框图

# 线框图｜首版

**状态：** 只画结构，不写 HTML  
**日期：** 2026-08-20  
**依据：** `页面｜首版结构.md`  
**画法：** 桌面端 ASCII；手机差异写在图下。框内英文，避免全角撑宽。

共用规则：无登录。Find place 打开层，命中白名单跳 `/forecast/[slug]`，否则 `/view`。广告若有，只能在结论卡 / 首页地点表之后。

---

## A. 全站顶栏 + Find place 层

```
┌──────────────────────────────────────────────────────────────────────┐
│  Northern Lights Tonight     Tonight   Near me   Guides   Find place │
└──────────────────────────────────────────────────────────────────────┘

                     Find place overlay
        ┌─────────────────────────────────────────────┐
        │  Find a place                            [x]│
        │  ┌───────────────────────────────────────┐  │
        │  │ City, state, or US ZIP                │  │
        │  └───────────────────────────────────────┘  │
        │  [ Use my location ]              [ Check ] │
        │                                             │
        │  Wave 1 pages                               │
        │  Colorado  Ohio   Chicago   Seattle         │
        │  Minnesota Maine  Alaska    Fairbanks  ...  │
        └─────────────────────────────────────────────┘
```

- **Layout:** 顶栏高 56px。字标左；桌面中部文字链；Find place 右。层居中，宽约 420px。无账号。
- **Interactions:** 字标 → `/`。Tonight → `/`。Near me → `/near-me`。Guides → 指南索引或第一篇。Find place 打开层。Use my location 才请求 GPS。Check / 点 Wave 1 名 → 规范 URL。失败留在层内报错。
- **响应式:** <768 只留字标 + Find place；Tonight/Near me/Guides 进页脚文字链（给爬虫和手指）。层变底栏全宽。
- **状态:** GPS 拒绝 = 搜索框仍在。无匹配 = "No page for that place — showing a live reading" 后去 `/view`。

---

## B. 首页 `/`  （主词枢纽）

给谁：搜 `northern lights tonight` 的人和 Googlebot。  
任务：不靠定位先回答「取决于地点」；用 HTML 表链出全部 Wave 1。

```
┌──────────────────────────────────────────────────────────────────────┐
│  Northern Lights Tonight     Tonight   Near me   Guides   Find place │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Can You See the Northern Lights Tonight?                            │
│                                                                      │
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
│  │ MAYBE   │ Maine         │ 10:40 PM – 12:10   │ Open │             │
│  │ MAYBE   │ Wisconsin     │ 11:00 PM – 12:40   │ Open │             │
│  │ NO      │ Chicago       │ not worth a trip   │ Open │             │
│  │ NO      │ Ohio          │ oval out of reach  │ Open │             │
│  │ NO      │ Colorado      │ mixed clouds       │ Open │             │
│  │ ... all 15 Wave 1 rows in the HTML ...              │             │
│  └─────────┴───────────────┴────────────────────┴──────┘             │
│  Full ranked list → Where to see the northern lights tonight         │
│                                                                      │
│  ┌────────────────────────────────┐  ┌─────────────────────────────┐ │
│  │ What time tonight?             │  │ How to read results         │ │
│  │ No single US clock time.       │  │ GO = worth trying           │ │
│  │ After dark, often late.        │  │ MAYBE = possible, obstacles │ │
│  │ Use your local page window.    │  │ NO = not worth a trip       │ │
│  └────────────────────────────────┘  │ UNKNOWN = we are not        │ │
│                                      │ guessing                    │ │
│                                      └─────────────────────────────┘ │
│  Guides: Best time  ·  How to see  ·  How we decide                  │
├──────────────────────────────────────────────────────────────────────┤
│  Tonight · Near me · Guides · How we decide · Not affiliated NOAA    │
└──────────────────────────────────────────────────────────────────────┘
```

- **Layout:** 单列内容宽约 960px 居中。H1 + 两句答案 → 搜索 → 全量地点表（SEO 主体）→ 两列 What time / How to read → 指南链 → 页脚。
- **Interactions:** Check / GPS / 表行 Open → 跳地点页或 `/view`。Where 链 → where 指南。首页不把某一城结论写进 H1。
- **响应式:** <768 搜索全宽；表改成一行一块：状态 + 地名 + 窗口，整行可点。What time 与 How to read 上下堆。
- **状态:** 快照失败则表内状态全是 UNKNOWN，句子仍在。加载：表区可骨架，H1 和答案句必须在首份 HTML。

手机表长这样（不另开 URL）：

```
┌──────────────────────────────────┐
│ MAYBE  Minnesota                 │
│        11:30 PM – 1:00 AM      → │
└──────────────────────────────────┘
```

---

## C. 地点页 `/forecast/colorado`  （钱页 · tonight_local）

给谁：搜 `northern lights colorado` / `... tonight`。  
任务：10 秒内今晚结论；HTML 里有窗口；折页下有只属于科罗拉多的常青。

```
┌──────────────────────────────────────────────────────────────────────┐
│  Northern Lights Tonight     Tonight   Near me   Guides   Find place │
├──────────────────────────────────────────────┬───────────────────────┤
│                                              │                       │
│  Can You See the Northern Lights             │  Nearby               │
│  in Colorado Tonight?                        │  Utah tonight         │
│                                              │  Oregon tonight       │
│  MAYBE in northern Colorado                  │                       │
│  (Fort Collins area, not Denver).            │  In this site         │
│  Best window 10:40 PM – 12:10 AM.            │  Best time            │
│  Main issue: mixed clouds.                   │  How to see           │
│                                              │  Near me              │
│  ┌────────────────────────────────────────┐  │  Where tonight        │
│  │  MAYBE                                 │  │                       │
│  │  Not a definite show. Worth a look     │  │                       │
│  │  if you can get a dark north sky.      │  │                       │
│  │                                        │  │                       │
│  │  Best window   10:40 PM – 12:10 AM     │  │                       │
│  │  Main issue    Clouds are the          │  │                       │
│  │                main uncertainty        │  │                       │
│  │  Look          North                   │  │                       │
│  │  Confidence    Medium                  │  │                       │
│  │  Updated       6 minutes ago           │  │                       │
│  │                                        │  │                       │
│  │  [ Share ]                             │  │                       │
│  └────────────────────────────────────────┘  │                       │
│                                              │                       │
│  Tonight's hours (Mountain Time)             │                       │
│  ┌──────────┬────────┬─────────────────────┐ │                       │
│  │ Time     │ Status │ Note                │ │                       │
│  ├──────────┼────────┼─────────────────────┤ │                       │
│  │ 9:30 PM  │ —      │ not dark yet        │ │                       │
│  │ 10:00 PM │ MAYBE  │ mixed clouds        │ │                       │
│  │ 10:30 PM │ GO     │ clearer             │ │                       │
│  │ 11:00 PM │ GO     │ clearer             │ │                       │
│  │ 11:30 PM │ MAYBE  │ clouds filling in   │ │                       │
│  └──────────┴────────┴─────────────────────┘ │                       │
│  [ Rest of the night ]                       │                       │
│                                              │                       │
│  Why this verdict                            │                       │
│  Reach      May stay on the northern horizon │                       │
│  Clouds     Mixed after 11 PM                │                       │
│  Darkness   Dark enough after 9:40 PM        │                       │
│  Moon       Not the main issue               │                       │
│  City glow  Leave Denver if you try          │                       │
│  Data       Live oval + overnight Kp         │                       │
│                                              │                       │
│  What to do                                  │                       │
│  Look north. Leave Denver. Do not drive      │                       │
│  south. Start at the window; wait 30–60 min. │                       │
│  A phone may show color before your eyes.    │                       │
│                                              │                       │
│  Other points in Colorado                    │                       │
│  Fort Collins   MAYBE                        │                       │
│  Denver         NO                           │                       │
│  Steamboat      MAYBE                        │                       │
│                                              │                       │
│  In this state                               │                       │
│  Northern Colorado is the only realistic     │                       │
│  band. Southern Colorado is extreme-event.   │                       │
│                                              │                       │
│  FAQ                                         │                       │
│  Can you see the northern lights from Denver?│                       │
│  Is it better in the mountains?              │                       │
│  How strong does a storm need to be?         │                       │
│                                              │                       │
├──────────────────────────────────────────────┴───────────────────────┤
│  Home · Near me · Best time · How to see · How we decide             │
└──────────────────────────────────────────────────────────────────────┘
```

- **Layout:** 主栏约 640–680px；右栏 240px 从 Nearby 起，桌面粘性。第一屏：H1 + 答案段 + 结论卡。小时轴紧随其后（SEO：what time）。常青/FAQ 在后，NO 的晚上也保留。
- **Interactions:** Share = 系统分享或复制。右栏/FAQ/Nearby 为普通链接。代表点只展示，不生成 `/forecast/denver`。Rest of the night 展开其余 30 分钟槽。
- **响应式:** <768 右栏下移到 FAQ 之上（仍要出现，给爬虫）。卡全宽。小时表三列可收成「时间 + 状态」两列。
- **状态:** 见节 H。无快照 = 卡 UNKNOWN，常青仍渲染。

城页（Chicago）同骨架，删 "Other points in Colorado" / "In this state"，What to do 强调出城，Nearby 含 Illinois / Wisconsin / Indiana。

---

## D. Alaska `/forecast/alaska`  （travel_plus_tonight）

前半同 C（今晚卡 + 小时 + Why + What to do）。其后换成旅行块，结论卡里仍禁止导购。

```
│  When to come                                        │
│  Late August – mid-April. June is usually            │
│  a darkness no even if the oval is active.           │
│                                                      │
│  Which part of Alaska                                │
│  Interior (Fairbanks)   best default     Open →      │
│  Anchorage              compromise                   │
│  Juneau                 rain, not Kp                 │
│                                                      │
│  FAQ  Fairbanks or Anchorage?  Summer?               │
```

Fairbanks 城页：无 "Which part" 全州表；Nearby 回 Alaska。Tour FAQ：This site does not book tours.

---

## E. `/near-me`

给谁：`near me` / `zip code`。不要和首页抢 Tonight H1。

```
┌──────────────────────────────────────────────────────────────────────┐
│  Northern Lights Tonight     Tonight   Near me   Guides   Find place │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Northern Lights Near Me                                             │
│                                                                      │
│  Aurora is local. A ZIP or city tells us whether the oval            │
│  can reach you, and whether clouds will block it.                    │
│                                                                      │
│  ┌────────────────────────────────────┐  ┌────────┐                  │
│  │ City, state, or US ZIP             │  │ Check  │                  │
│  └────────────────────────────────────┘  └────────┘                  │
│  [ Use my location ]                                                 │
│  We use your location once. We do not store it.                      │
│                                                                      │
│  Why a place is required                                             │
│  A national Kp number is not a local yes/no. Clouds,                 │
│  darkness, and magnetic latitude change by city.                     │
│                                                                      │
│  Indexed local pages                                                 │
│  Colorado · Ohio · Chicago · Seattle · Minnesota · …                 │
├──────────────────────────────────────────────────────────────────────┤
│  Tonight · Guides · How we decide                                    │
└──────────────────────────────────────────────────────────────────────┘
```

- **Layout:** 工具 + 独立说明（可索引）+ 地点链。无用户坐标结论。
- **Interactions:** 提交后跳 `/forecast/...` 或 `/view`，本 URL 不带 `?lat=` 索引。
- **响应式:** 单列。
- **状态:** 无法定位 = 说明仍在，可搜 ZIP。

---

## F. `/view`  noindex

```
┌──────────────────────────────────────────────────────────────────────┐
│  Northern Lights Tonight                                  Find place │
├──────────────────────────────────────────────────────────────────────┤
│  Tonight near Springfield, IL                                        │
│                                                                      │
│  ┌────────────────────────────────────────┐                          │
│  │  NO                                    │                          │
│  │  Not worth a special trip tonight.     │                          │
│  │  Best window   —                       │                          │
│  │  Main issue    Oval out of reach       │                          │
│  └────────────────────────────────────────┘                          │
│  This is a live reading, not a full local guide.                     │
│                                                                      │
│  Nearby guides:  Illinois tonight  ·  Chicago tonight                │
│  Hours + Why (same components as location page)                      │
└──────────────────────────────────────────────────────────────────────┘
```

无 FAQ 套话、无 sitemap。Hours/Why 可有。

---

## G. Where 榜 `/guides/where-to-see-northern-lights`

```
┌──────────────────────────────────────────────────────────────────────┐
│  Northern Lights Tonight     Tonight   Near me   Guides   Find place │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Where to See the Northern Lights in the US Tonight                  │
│                                                                      │
│  Ranked from our live local readings. Not a travel brochure.         │
│                                                                      │
│  GO                                                                  │
│  ┌──────────────┬────────────────────┬──────┐                        │
│  │ Fairbanks    │ 11:00 PM – 2:00 AM │ Open │                        │
│  │ Minnesota    │ 11:30 PM – 1:00 AM │ Open │                        │
│  └──────────────┴────────────────────┴──────┘                        │
│  MAYBE     Maine · Wisconsin · Seattle                               │
│  NO        Chicago · Ohio · Colorado · Utah                          │
│                                                                      │
│  Usual destinations (does not change with one quiet night)           │
│  Oval most nights   Alaska Interior · northern MN / UP · N. Maine    │
│  Event nights only  Colorado · Ohio · Illinois / Chicago             │
│                                                                      │
│  Related  Tonight home  ·  Best time  ·  How to see                  │
└──────────────────────────────────────────────────────────────────────┘
```

- **Layout:** 上半今晚榜（与首页表同源，这里是「去哪」规范页）；下半常驻 vs 事件，避免全 NO 变薄页。
- **Interactions:** 行 → 地点页。
- **响应式:** 分组列表。
- **状态:** 无 GO 组则只显示 MAYBE/NO，常青段仍在。

---

## H. 结论卡状态（地点页 / view 只换卡）

```
GO
Conditions line up well enough to try.
Best window   11:00 PM – 1:20 AM
Main issue    None
Look north · Confidence High · Updated 4 min ago
[ Share ]

NO
Not worth a special trip tonight.
Best window   —
Main issue    Aurora is not expected to reach Ohio.
Look north · Confidence High · Updated 4 min ago
[ Share ]

UNKNOWN
We are not guessing.
Best window   —
Main issue    Aurora data is unavailable right now.
[ Try again ]
```

过期快照按 UNKNOWN 画，不得保留旧 GO。

---

## I. Best time 指南

```
┌──────────────────────────────────────────────────────────────────────┐
│  Northern Lights Tonight     Tonight   Near me   Guides   Find place │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Best Time to See the Northern Lights                                │
│  [ Check tonight's local reading → home ]                            │
│                                                                      │
│  In a year     Dark season, roughly August–April in the north        │
│  In a night    After dark, often late evening                        │
│  Depends on    Latitude, clouds, and whether the oval reaches you    │
│                                                                      │
│  (article body: season vs night vs place)                            │
│  Example pages: Minnesota · Maine · Colorado · Alaska                │
│                                                                      │
│  Related  How to see  ·  Where tonight                               │
└──────────────────────────────────────────────────────────────────────┘
```

How to see 同壳：朝北、要多暗、等 30–60 分钟、手机 vs 肉眼、怎么读 GO/MAYBE/NO。不嵌整块实时引擎。  
Methodology：短页，门控顺序 + 无百分数 + NOAA / Open-Meteo 来源。Title 避开主词。

- **Layout:** 文章列宽约 680px。顶部工具链，正文，相关链。
- **Interactions:** Check tonight → `/`。例链 → 地点页。
- **响应式:** 单列。
- **状态:** 纯静态，无加载卡。

---

## J. 手机第一屏（地点页，钱页）

桌面图已含右栏；手机折页以这张为准：

```
┌──────────────────────────────────┐
│ NLT                    Find place│
├──────────────────────────────────┤
│ Can You See the Northern Lights  │
│ in Colorado Tonight?             │
│                                  │
│ MAYBE in northern Colorado       │
│ (Fort Collins area, not Denver). │
│ Best window 10:40 PM – 12:10 AM. │
│ Main issue: mixed clouds.        │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ MAYBE                        │ │
│ │ 10:40 PM – 12:10 AM          │ │
│ │ Clouds are the main          │ │
│ │ uncertainty                  │ │
│ │ North · Medium · 6 min ago   │ │
│ │ [ Share ]                    │ │
│ └──────────────────────────────┘ │
│                                  │
│ Tonight's hours                  │
│ 10:00  MAYBE                     │
│ 10:30  GO                        │
│ ... (scroll)                     │
└──────────────────────────────────┘
```

答案段 + 卡在第一屏。小时轴可以跨折页，但必须紧挨卡、写在 HTML 里。


---
# 附件 5 wave1.json 摘要（全量 15 slug，非全文）

```json
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
      "name": "Colorado",
      "location_type": "state",
      "parent_slug": null,
      "timezone": "America/Denver",
      "page_template": "tonight_local",
      "primary_verdict_point": "fort-collins",
      "aurora_zone": "midlatitude_event",
      "typical_kp_horizon": 7,
      "typical_kp_overhead": 8,
      "seo_indexable": false,
      "nearby_slugs": [
        "utah"
      ],
      "cannibalization_pair": null,
      "short_summer_nights": false,
      "primary_keyword": "northern lights colorado",
      "cluster_volume": 30810,
      "sample_point_ids": [
        "fort-collins",
        "denver",
        "steamboat-springs"
      ],
      "faq_count": 4,
      "variant_count": 11
    },
    {
      "slug": "ohio",
      "name": "Ohio",
      "location_type": "state",
      "parent_slug": null,
      "timezone": "America/New_York",
      "page_template": "tonight_local",
      "primary_verdict_point": "cleveland",
      "aurora_zone": "midlatitude_event",
      "typical_kp_horizon": 6,
      "typical_kp_overhead": 8,
      "seo_indexable": false,
      "nearby_slugs": [
        "indiana",
        "michigan",
        "chicago"
      ],
      "cannibalization_pair": null,
      "short_summer_nights": false,
      "primary_keyword": "northern lights ohio",
      "cluster_volume": 17470,
      "sample_point_ids": [
        "cleveland",
        "toledo",
        "columbus"
      ],
      "faq_count": 3,
      "variant_count": 7
    },
    {
      "slug": "indiana",
      "name": "Indiana",
      "location_type": "state",
      "parent_slug": null,
      "timezone": "America/Indiana/Indianapolis",
      "page_template": "tonight_local",
      "primary_verdict_point": "south-bend",
      "aurora_zone": "midlatitude_event",
      "typical_kp_horizon": 6,
      "typical_kp_overhead": 8,
      "seo_indexable": false,
      "nearby_slugs": [
        "ohio",
        "chicago",
        "michigan",
        "illinois"
      ],
      "cannibalization_pair": "Northwest Indiana sits in Chicago’s light dome and in Central Time; Chicago remains a separate city page.",
      "short_summer_nights": false,
      "primary_keyword": "northern lights indiana",
      "cluster_volume": 13060,
      "sample_point_ids": [
        "south-bend",
        "indiana-dunes",
        "indianapolis"
      ],
      "faq_count": 3,
      "variant_count": 7
    },
    {
      "slug": "michigan",
      "name": "Michigan",
      "location_type": "state",
      "parent_slug": null,
      "timezone": "America/Detroit",
      "page_template": "tonight_local",
      "primary_verdict_point": "traverse-city",
      "aurora_zone": "sub_oval",
      "typical_kp_horizon": 5,
      "typical_kp_overhead": 7,
      "seo_indexable": false,
      "nearby_slugs": [
        "wisconsin",
        "ohio",
        "indiana",
        "chicago",
        "minnesota"
      ],
      "cannibalization_pair": "Do not create /forecast/northern-michigan. That cluster is absorbed here until SERP clearly wants a separate region page.",
      "short_summer_nights": false,
      "primary_keyword": "northern lights michigan",
      "cluster_volume": 30430,
      "sample_point_ids": [
        "marquette",
        "traverse-city",
        "detroit"
      ],
      "faq_count": 4,
      "variant_count": 9
    },
    {
      "slug": "chicago",
      "name": "Chicago",
      "location_type": "city",
      "parent_slug": "illinois",
      "timezone": "America/Chicago",
      "page_template": "tonight_local",
      "primary_verdict_point": "chicago",
      "aurora_zone": "midlatitude_event",
      "typical_kp_horizon": 6,
      "typical_kp_overhead": 8,
      "seo_indexable": false,
      "nearby_slugs": [
        "illinois",
        "indiana",
        "wisconsin",
        "michigan"
      ],
      "cannibalization_pair": "illinois: this page is the city (light pollution, lakefront, leaving town). Illinois is the rest of the state and north–south split.",
      "short_summer_nights": false,
      "primary_keyword": "northern lights chicago",
      "cluster_volume": 17470,
      "sample_point_ids": [
        "chicago"
      ],
      "faq_count": 4,
      "variant_count": 6
    },
    {
      "slug": "seattle",
      "name": "Seattle",
      "location_type": "city",
      "parent_slug": null,
      "timezone": "America/Los_Angeles",
      "page_template": "tonight_local",
      "primary_verdict_point": "seattle",
      "aurora_zone": "sub_oval",
      "typical_kp_horizon": 5,
      "typical_kp_overhead": 7,
      "seo_indexable": false,
      "nearby_slugs": [
        "oregon"
      ],
      "cannibalization_pair": "Washington state is Wave 2 (eastern Washington is drier and darker). Oregon is the adjacent Wave 1 state. Do not treat Seattle as Washington.",
      "short_summer_nights": false,
      "primary_keyword": "northern lights seattle",
      "cluster_volume": 8520,
      "sample_point_ids": [
        "seattle"
      ],
      "faq_count": 3,
      "variant_count": 5
    },
    {
      "slug": "wisconsin",
      "name": "Wisconsin",
      "location_type": "state",
      "parent_slug": null,
      "timezone": "America/Chicago",
      "page_template": "tonight_local",
      "primary_verdict_point": "madison",
      "aurora_zone": "sub_oval",
      "typical_kp_horizon": 5,
      "typical_kp_overhead": 7,
      "seo_indexable": false,
      "nearby_slugs": [
        "minnesota",
        "michigan",
        "chicago",
        "illinois"
      ],
      "cannibalization_pair": null,
      "short_summer_nights": false,
      "primary_keyword": "northern lights wisconsin",
      "cluster_volume": 7270,
      "sample_point_ids": [
        "bayfield",
        "madison",
        "milwaukee"
      ],
      "faq_count": 3,
      "variant_count": 4
    },
    {
      "slug": "massachusetts",
      "name": "Massachusetts",
      "location_type": "state",
      "parent_slug": null,
      "timezone": "America/New_York",
      "page_template": "tonight_local",
      "primary_verdict_point": "newburyport",
      "aurora_zone": "midlatitude_event",
      "typical_kp_horizon": 6,
      "typical_kp_overhead": 8,
      "seo_indexable": false,
      "nearby_slugs": [
        "maine"
      ],
      "cannibalization_pair": "Boston has tonight queries but no Wave 1 city page. All Boston variants map here. Do not ship /forecast/boston until SERP is clearly separate.",
      "short_summer_nights": false,
      "primary_keyword": "northern lights massachusetts",
      "cluster_volume": 7460,
      "sample_point_ids": [
        "newburyport",
        "boston",
        "north-adams"
      ],
      "faq_count": 3,
      "variant_count": 7
    },
    {
      "slug": "maine",
      "name": "Maine",
      "location_type": "state",
      "parent_slug": null,
      "timezone": "America/New_York",
      "page_template": "tonight_local",
      "primary_verdict_point": "bangor",
      "aurora_zone": "sub_oval",
      "typical_kp_horizon": 5,
      "typical_kp_overhead": 7,
      "seo_indexable": false,
      "nearby_slugs": [
        "massachusetts"
      ],
      "cannibalization_pair": null,
      "short_summer_nights": false,
      "primary_keyword": "northern lights maine",
      "cluster_volume": 5680,
      "sample_point_ids": [
        "presque-isle",
        "bangor",
        "portland"
      ],
      "faq_count": 3,
      "variant_count": 5
    },
    {
      "slug": "minnesota",
      "name": "Minnesota",
      "location_type": "state",
      "parent_slug": null,
      "timezone": "America/Chicago",
      "page_template": "tonight_local",
      "primary_verdict_point": "duluth",
      "aurora_zone": "sub_oval",
      "typical_kp_horizon": 4,
      "typical_kp_overhead": 6,
      "seo_indexable": false,
      "nearby_slugs": [
        "wisconsin",
        "michigan"
      ],
      "cannibalization_pair": "Minneapolis and Duluth do not get Wave 1 city pages. Those tonight queries map here.",
      "short_summer_nights": false,
      "primary_keyword": "northern lights minnesota",
      "cluster_volume": 4060,
      "sample_point_ids": [
        "ely",
        "duluth",
        "minneapolis"
      ],
      "faq_count": 3,
      "variant_count": 5
    },
    {
      "slug": "illinois",
      "name": "Illinois",
      "location_type": "state",
      "parent_slug": null,
      "timezone": "America/Chicago",
      "page_template": "tonight_local",
      "primary_verdict_point": "rockford",
      "aurora_zone": "midlatitude_event",
      "typical_kp_horizon": 6,
      "typical_kp_overhead": 8,
      "seo_indexable": false,
      "nearby_slugs": [
        "chicago",
        "indiana",
        "wisconsin"
      ],
      "cannibalization_pair": "chicago: city light pollution and lakefront. This page is Illinois minus the city story — northern vs central/southern Illinois.",
      "short_summer_nights": false,
      "primary_keyword": "northern lights illinois",
      "cluster_volume": 7380,
      "sample_point_ids": [
        "galena",
        "rockford",
        "springfield"
      ],
      "faq_count": 3,
      "variant_count": 7
    },
    {
      "slug": "oregon",
      "name": "Oregon",
      "location_type": "state",
      "parent_slug": null,
      "timezone": "America/Los_Angeles",
      "page_template": "tonight_local",
      "primary_verdict_point": "portland",
      "aurora_zone": "midlatitude_event",
      "typical_kp_horizon": 6,
      "typical_kp_overhead": 8,
      "seo_indexable": false,
      "nearby_slugs": [
        "seattle",
        "utah"
      ],
      "cannibalization_pair": "Seattle is the adjacent city page (higher latitude, same marine-cloud problem). Eastern Oregon is clearer, not magnetically better.",
      "short_summer_nights": false,
      "primary_keyword": "northern lights oregon",
      "cluster_volume": 6780,
      "sample_point_ids": [
        "portland",
        "baker-city",
        "bend"
      ],
      "faq_count": 3,
      "variant_count": 2
    },
    {
      "slug": "utah",
      "name": "Utah",
      "location_type": "state",
      "parent_slug": null,
      "timezone": "America/Denver",
      "page_template": "tonight_local",
      "primary_verdict_point": "logan",
      "aurora_zone": "midlatitude_event",
      "typical_kp_horizon": 7,
      "typical_kp_overhead": 8,
      "seo_indexable": false,
      "nearby_slugs": [
        "colorado"
      ],
      "cannibalization_pair": "Salt Lake City tonight maps here. No Wave 1 SLC city page.",
      "short_summer_nights": false,
      "primary_keyword": "northern lights utah",
      "cluster_volume": 7290,
      "sample_point_ids": [
        "logan",
        "salt-lake-city",
        "antelope-island"
      ],
      "faq_count": 3,
      "variant_count": 5
    },
    {
      "slug": "alaska",
      "name": "Alaska",
      "location_type": "state",
      "parent_slug": null,
      "timezone": "America/Anchorage",
      "page_template": "travel_plus_tonight",
      "primary_verdict_point": "fairbanks",
      "aurora_zone": "oval",
      "typical_kp_horizon": 1,
      "typical_kp_overhead": 3,
      "seo_indexable": false,
      "nearby_slugs": [
        "fairbanks"
      ],
      "cannibalization_pair": "fairbanks: city tonight + local viewing. This page is statewide — Interior vs Southcentral vs Southeast, season, and where to go. Fairbanks-named queries go to the city page. “Best places in Alaska” stays here.",
      "short_summer_nights": true,
      "primary_keyword": "northern lights alaska",
      "cluster_volume": 87800,
      "sample_point_ids": [
        "fairbanks",
        "anchorage",
        "juneau"
      ],
      "faq_count": 4,
      "variant_count": 19
    },
    {
      "slug": "fairbanks",
      "name": "Fairbanks",
      "location_type": "city",
      "parent_slug": "alaska",
      "timezone": "America/Anchorage",
      "page_template": "travel_plus_tonight",
      "primary_verdict_point": "fairbanks",
      "aurora_zone": "oval",
      "typical_kp_horizon": 1,
      "typical_kp_overhead": 3,
      "seo_indexable": false,
      "nearby_slugs": [
        "alaska"
      ],
      "cannibalization_pair": "alaska: statewide season and regions. This page is Fairbanks tonight, darkness, and local glow. Tour keywords are mapped here but v1 does not sell tours.",
      "short_summer_nights": true,
      "primary_keyword": "fairbanks northern lights",
      "cluster_volume": 19790,
      "sample_point_ids": [
        "fairbanks"
      ],
      "faq_count": 4,
      "variant_count": 8
    }
  ]
}
```

---
# 附件 6 PRD 摘录（非全文）

# 五、产品目标与非目标

## 5.1 MVP 目标

1. 用户进入页面后 10 秒内得到当地结论；
2. 同时回答“能不能看、几点看、为什么”；
3. 建立可复用的州/城市页面模板；
4. 首批索引 16 个高机会地域页；
5. 通过缓存保证事件流量下的稳定性；
6. 验证地域长尾词是否可以获得排名和点击；
7. 将稳定现金成本控制在每月 $30 以内。

---

## 5.2 非目标

MVP 明确不做：

- 用户注册；
- 月度或年度订阅；
- 邮件提醒；
- 原生 App；
- 全球所有城市；
- 复杂的交互式地球地图；
- 专业空间天气分析；
- 历史极光数据库；
- 用户社区；
- 大量新闻文章；
- 一次性索引数千个城市页。

---



# 六、站点信息架构

## 6.1 推荐 URL

```text
/
├── near-me
├── forecast
│   ├── colorado
│   ├── ohio
│   ├── chicago
│   ├── seattle
│   ├── michigan
│   └── ...
├── guides
│   ├── best-time-to-see-northern-lights
│   ├── how-to-see-northern-lights
│   └── where-to-see-northern-lights
├── places
│   └── alaska
└── map
```

---

## 6.2 页面与关键词映射

| 页面 | 核心意图 | 处理方式 |
|---|---|---|
| `/` | northern lights tonight | 核心实时决策工具 |
| `/near-me` | northern lights near me / ZIP code | 定位入口 |
| `/forecast/[location]` | 地域词及地域今晚词 | 州和城市 pSEO 模板 |
| `/guides/best-time-to-see-northern-lights` | 最佳月份、季节、时间 | 常青指南 |
| `/guides/how-to-see-northern-lights` | 如何观测 | 常青指南 |
| `/guides/where-to-see-northern-lights` | 去哪里看 | 地点发现工具与指南 |
| `/places/alaska` | Alaska 最佳观测地点 | 高质量旅行内容 |
| `/map` | aurora map / tracker | P1 工具页 |

---

## 6.3 一个意图集群只建立一个 URL

以下关键词全部由同一个页面承接：

```text
northern lights colorado
colorado northern lights
northern lights colorado tonight
northern lights tonight colorado
can you see the northern lights in colorado tonight
are the northern lights visible in colorado tonight
```

统一对应：

```text
/forecast/colorado
```

不得为每个语序或问句生成独立页面。

同理：

```text
northern lights chicago
aurora borealis chicago
northern lights chicago tonight
northern lights tonight chicago
```

统一对应：

```text
/forecast/chicago
```

---



# 八、核心功能需求

## 8.1 位置选择

### 功能要求

用户可以通过以下方式选择位置：

1. 浏览器定位；
2. 输入城市；
3. 输入州；
4. 输入美国 ZIP Code；
5. 从热门地点列表选择。

### 交互要求

- 不强制授权定位；
- 用户拒绝定位时正常使用；
- 自动识别当地时区；
- 搜索结果优先显示美国地点；
- 已建立 SEO 页面的地点跳转到规范 URL；
- 未建立 SEO 页面的地点生成动态结果，但默认 `noindex`。

### 验收标准

- 城市搜索响应小于 300ms；
- 定位结果跳转到对应地点页；
- 同名城市必须显示州名；
- ZIP Code 能转换为近似坐标和时区；
- 不保存精确用户位置。

---

## 8.2 今晚判断卡片

页面第一屏必须出现：

```text
Northern Lights in Seattle Tonight

MAYBE

Best window: 10:40 PM–11:30 PM
Main obstacle: 62% cloud cover
Look toward: North
Confidence: Medium
Updated 6 minutes ago
```

### 状态定义

| 状态 | 含义 |
|---|---|
| GO | 条件足够好，值得尝试 |
| MAYBE | 极光可能到达，但存在云量、光污染或模型不确定性 |
| NO | 当前条件不足，不值得专门出门 |
| UNKNOWN | 关键数据缺失、过期或相互冲突 |

不得在没有历史校准的情况下输出：

```text
You have a 73% chance of seeing the aurora.
```

这种概率会制造虚假的科学精确性。

---

## 8.3 小时级观测窗口

页面需要展示从当地日落后到日出前的时间轴。

每个 30 分钟时间段显示：

- 极光活动；
- 云量；
- 是否完全入夜；
- 月光影响；
- 综合状态；
- 该时间段是否推荐。

示例：

| 时间 | 极光 | 云量 | 黑夜 | 判断 |
|---|---:|---:|---|---|
| 9:30 PM | 弱 | 18% | 否 | 等待 |
| 10:00 PM | 中 | 22% | 是 | MAYBE |
| 10:30 PM | 强 | 16% | 是 | GO |
| 11:00 PM | 强 | 30% | 是 | GO |
| 11:30 PM | 中 | 58% | 是 | MAYBE |

---

## 8.4 判断依据

用户必须可以看到结论为什么产生。

至少展示：

- Aurora activity；
- Kp 或等效地磁活动信号；
- Cloud cover；
- Darkness；
- Moon condition；
- Light pollution；
- Data freshness。

每个信号使用自然语言解释，不只显示专业数值。

示例：

> Aurora activity is strong enough to reach parts of Washington, but Seattle’s cloud cover may block the view.

---

## 8.5 本地行动建议

每个地点页面至少回答：

- 应该朝哪个方向看；
- 是否需要离开市中心；
- 什么时候开始观察；
- 应该等待多久；
- 手机是否可能比肉眼更容易拍到；
- 附近是否有条件更好的地点页面。

MVP 不强制提供具体停车场或驾驶路线，除非数据经过人工核实。

---

## 8.6 分享与事件传播

用户可以生成可分享的当前状态：

```text
Seattle Aurora Forecast: MAYBE
Best window tonight: 10:40–11:30 PM
```

支持：

- 复制链接；
- 分享至 X、Facebook、Reddit；
- Open Graph 卡片展示地点、状态和时间窗口。

事件型流量具有明显社交传播属性，因此分享功能比账号系统更重要。

---



# 九、判断引擎

## 9.1 输入信号

| 信号 | 作用 |
|---|---|
| 用户经纬度 | 本地化计算 |
| 时区 | 显示当地时间 |
| 极光活动网格 | 判断极光是否可能到达 |
| Kp 或地磁活动 | 作为辅助活动信号 |
| 小时级云量 | 判断天空可见性 |
| 天文黑夜 | 判断天空是否足够暗 |
| 月相与月亮高度 | 修正观测条件 |
| 光污染等级 | 修正肉眼可见性 |
| 数据更新时间 | 决定置信度 |

---

## 9.2 判断流程

### 第一步：关键条件门控

出现以下任意情况时，不进入普通评分：

```text
关键数据过期或缺失 → UNKNOWN
当地尚未进入黑夜 → NO / WAIT
极光活动明显无法到达当地 → NO
整晚云量持续高于设定阈值 → NO
```

### 第二步：逐时间段评分

对今晚每个 30 分钟窗口计算：

```text
window_score =
  aurora_reach_score × 45%
  + clear_sky_score × 30%
  + light_pollution_score × 15%
  + moon_condition_score × 10%
```

### 第三步：生成结果

建议初始阈值：

| 分数 | 状态 |
|---:|---|
| 70–100 | GO |
| 45–69 | MAYBE |
| 0–44 | NO |

这些阈值属于首版产品假设，必须通过真实极光事件和用户反馈校准。

---

## 9.3 置信度

置信度与可见性状态分开计算。

例如：

```text
GO + Low Confidence
NO + High Confidence
MAYBE + Medium Confidence
```

置信度由以下因素决定：

- 数据是否新鲜；
- 预测时间距离当前有多远；
- 不同信号是否一致；
- 是否使用了降级数据；
- 天气预测是否稳定。

---



# 十二、地图与 Near Me

## 12.1 Near Me 页面

数据中存在：

- `northern lights tonight near me`：5,400，KD 42；
- `northern lights forecast by zip code`：4,400，KD 31；
- `northern lights near me`：2,400，KD 26；
- `aurora near me`：3,600，KD 51。

因此 `/near-me` 应在 MVP 中上线。

Near Me 不是独立的数据页面，而是地点解析入口：

```text
用户授权位置
→ 匹配最近城市或地区
→ 跳转到 /forecast/[location]
```

---

## 12.2 地图页面

`northern lights map` 搜索量 8,100、KD 46；`aurora borealis map` 搜索量 6,600、KD 50，相关 tracker 和 tonight map 词也较多。

但地图集群总体难度高于地域词，因此：

- MVP 首页只需要简化地图或可见范围示意；
- 独立 `/map` 页面放入 P1；
- 暂不开发复杂的全球 WebGL 地图；
- 地图不能拖慢核心结果加载。

---



# 十四、SEO 要求

## 14.1 首页

推荐 Title：

```text
Northern Lights Tonight: Live Aurora Forecast Near You
```

推荐 H1：

```text
Can You See the Northern Lights Tonight?
```

首页必须直接覆盖：

- 是否可见；
- 什么时间；
- Near Me；
- 本地云量；
- 地图；
- 当前最佳城市；
- 如何理解结果。

---

## 14.2 地域页

Title 模板：

```text
Northern Lights in [Location] Tonight: Visibility & Best Time
```

H1 模板：

```text
Can You See the Northern Lights in [Location] Tonight?
```

Meta 模板：

```text
Check whether the Northern Lights may be visible in [Location] tonight, including the best viewing time, cloud cover, darkness and local conditions.
```

模板可以统一，但正文、数据和本地模块必须存在实际差异。

---

## 14.3 内部链接

每个地域页至少链接：

- 首页；
- 父级州页面；
- 3–5 个相邻地点；
- Best Time 指南；
- How to See 指南；
- Near Me 工具。

州页面链接到州内城市；城市页面链接回州页面。

---

## 14.4 页面性能

核心页面要求：

- 移动端优先；
- 首屏不加载大型地图；
- 预测结果从缓存读取；
- LCP 目标低于 2.5 秒；
- 实时数据必须出现在服务端 HTML 中；
- 广告不得推迟首屏核心结论；
- 事件流量下避免逐用户实时计算。

---



# 二十一、七天开发计划

| 天数 | 主要工作 |
|---|---|
| Day 1 | 关键词映射、URL、数据模型、首发地点确认 |
| Day 2 | 极光和天气数据接入、缓存、失败处理 |
| Day 3 | 本地时间窗口与判断引擎 |
| Day 4 | 首页、结果卡、小时预测、位置搜索 |
| Day 5 | 地域页模板、首批地点数据、内部链接 |
| Day 6 | Near Me、两篇指南、SEO、埋点 |
| Day 7 | 移动端 QA、数据异常测试、性能和部署 |

上线后不立即批量扩张。

第一轮新增页面必须来自：

- Search Console 已出现的地点查询；
- 已验证的 Semrush 关键词集群；
- 明显不同的 SERP 意图；
- 完整的本地数据和内容。

---



# 二十三、最终产品决策

## 是否做

**做。**

但应作为：

> **低成本、事件驱动、地域 pSEO 优先的工具型 SEO 资产。**

而不是：

> 高留存、高订阅、高壁垒的极光 SaaS。

## 最合理的首版

```text
核心实时工具
+ Near Me
+ 16 个州/城市页
+ Best Time 指南
+ How to See 指南
```

## 最重要的增长原则

> **先拿低 KD 地域词，不要一开始硬打 northern lights tonight。**

## 最重要的产品原则

> **先给结论，再展示数据；不制造虚假精确性。**

## 最重要的 pSEO 原则

> **一个地点一个页面，一个意图一个 URL；没有独立价值的动态地点不进入索引。**

## 最重要的成本原则

> **控制在一周开发、每月低双位数现金成本和每月数小时维护，不因为搜索量看起来很大而扩大工程范围。**