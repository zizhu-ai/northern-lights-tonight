# 独立审计报告：Northern Lights Tonight（v1 开工包）

审计基准日：2026-08-20。只依据本包摘录，未跑站、未查 SERP、未看仓库。不签字「已对齐」。

---

## 1. 结论（能否按此开工）

**不能按此开工，包括不能把「先做引擎快照」当成已冻结合同。**  
范围写「已对齐，作为开工依据」，但与页面、引擎、档案互相打架，且仍把未废止的 PRD 当上级；州页首屏算法、暮光窗、首页 IP 三件事各自两套规则，无法同时实现。  
Wave 1 十五个 slug 全部 `seo_indexable=false`，且至少部分档案未达到范围自己定的 index 门槛；钱页此时开 HTML/收录，等于把 UNKNOWN 壳和互吃 URL 送给 Google。  
首页若按范围做「IP 预填」且进 SSR，会直接打穿页面文档的获客底线（爬虫与无 Cookie 用户同一份 HTML、主词页不得变成某城）。  
**先出废止表 + 冻结 §4 的三件事，引擎才能做可验收快照；在此之前铺页面或开 sitemap 是获客自杀。**

---

## 2. 问题表

### 严重（伤排名 / 误导用户 / 矛盾到无法实现）

| id | 问题 | 证据（文档名 + 短引） | 影响 | 建议 |
|---|---|---|---|---|
| S1 | 州页首屏两套算法 | 范围 §3.1：「结论以『州内今晚相对最好』为主」。引擎 §8：「首屏 status = `primary_verdict_point` 的 status」。引擎还禁止「用丹佛代表科罗拉多」。 | 无法实现。Denver GO / Fort Collins MAYBE 时，范围要 Denver，引擎要档案锁死的 Fort Collins。用户按首屏出门会去错城；州页与城页关系也不稳定。 | **冻结为一条规则：** 首屏 = 预指定观测代表点（写明名字），禁止每晚动态「取最好」；「相对最好」只允许出现在代表点对比模块，不得改 H1/结论卡。 |
| S2 | 航海暮光窗：SKIP 还是 MAYBE | 引擎 §3：「太阳高度 > −12° 的窗口：**不参与** GO/MAYBE/NO，标记 `SKIP_NOT_DARK`」。同节表：−12°～−6°「**不能 GO**」。§5 MAYBE：「或 −12°～−6° 过渡夜（若某窗未 SKIP）」。硬门控 5 又说进来了也不作为观测窗。 | 无法实现。下午/傍晚首屏、`NOT_DARK_YET`、极昼 `NEVER_DARK` 的归并依赖这扇窗是否计入。两套代码会做出两种「今晚」。 | **删掉 §5 的暮光 MAYBE 分支。** >−12° 一律 SKIP；整段 >−12° 才 `NO + NEVER_DARK`。未黑但后半夜有窗：整晚归并后半夜，原因码可用 `NOT_DARK_YET`，状态仍是后半夜的 GO/MAYBE/NO。 |
| S3 | 首页 / near-me 的 IP 默认 vs 爬虫同一份 HTML | 范围 §6：「IP 粗默认」；定位规则 2：「首页 / near-me：IP 可预填城市」。页面优先级 2：「Googlebot 与无 Cookie 用户看到同一份 HTML（禁止用 IP/GPS 给爬虫另一套结论）」。页面 §2：「禁止：首页 SSR 成『Denver MAYBE』」。线框：「无 IP 结论卡」。 | 伤排名 + 误导。IP 进 SSR → 主词页日更乱跳、与 15 个钱页互吃、近似 cloaking。用户任务已写死「首页 SSR 不得按 IP 改成某城」。 | **废止范围的「IP 默认结论」。** 允许的只有：客户端在搜索框预填（不进首屏 HTML/H1/OG/JSON-LD）；Check / GPS 只跳 `/forecast/[slug]` 或 `/view`。`/near-me` 的 HTML 不得出现「你在某城」。 |
| S4 | 档案未达自身 index 合同，范围却当开工依据 | 范围 §3.3：缺 `nearby_slugs` 等四项之一「**不得 index**」，且 nearby 要 3–5 个。档案摘要：colorado nearby 仅 utah；seattle nearby 仅 oregon、`parent=null`。范围文首：「状态：已对齐，作为开工依据」。15 个均为 `seo_indexable=false`。 | 伤排名。引擎做出快照也开不了 colorado/seattle 收录；首页还被要求 HTML 链出全部 Wave 1。钱页缺邻接集群，doorway 风险上升。 | 未补齐 nearby（3–5）、`parent_slug`、单值 `aurora_zone`、互异常青/FAQ 前，**禁止** `seo_indexable=true`，也禁止把范围标成开工依据。 |
| S5 | 「任意坐标可算今晚」与引擎远窗死绑档案 | 范围 §1：计算层「任意坐标能否出 GO/MAYBE/NO」。引擎 §4.1 远窗：「用预报 Kp **+ 档案门槛** `typical_kp_*`」。§5 GO 还依赖 `aurora_zone = oval`。`/view` 无档案。 | 无法实现。ZIP/长尾 `/view` 在 OVATION 近窗之外只能瞎编门槛或整晚 UNKNOWN；与「搜索必有、临时点也给结论」冲突。中纬钱页用户下午搜 tonight，近窗极短，后半夜全是远窗。 | 冻结 v1：`/view` 与无档案点 **只跑近窗 OVATION + 云 + 天黑**；远窗无门槛则整晚最多 `MAYBE + FORECAST_FAR + low`，禁止用临时磁纬冒充 `typical_kp_*`。白名单点才启用档案远窗。 |
| S6 | PRD 仍是上级，条款未废止 | 范围：「上级文档：`PRD｜Northern Lights Tonight.md`」。PRD 对照：首发 16 城、`/map` P1、`/places/alaska`、45/30/15/10 加权、70+ 才 GO、未入夜 WAIT、首页须覆盖地图。引擎：「不用加权总分」「WAIT 不是独立状态」。页面：「不做 `/map`」「不另开 `/places/alaska`」。 | 无法实现。两套产品。有人按 PRD 会做地图、WAIT、16 城、加权；按 v1 则全禁。 | **立即出一页废止表：** PRD 上列条款对 v1 无效；v1 上级只剩范围/引擎/页面/档案。未废止前禁止开工。 |
| S7 | Alaska 与 Fairbanks 首屏同源，钱页互吃 | 档案：alaska `primary_verdict_point=fairbanks`，二者都是 `travel_plus_tonight`、都进 Wave 1。页面 §5：地点 H1 都是 “Can You See … in [Place] Tonight?”。引擎 §8：州页首屏 = 代表点 status。 | 伤排名。`/forecast/alaska` 与 `/forecast/fairbanks` 的今晚卡、窗口、障碍会经常一字不差；alaska tonight / fairbanks aurora 对打。 | 州页今晚卡必须带限定语 “statewide, headline: Fairbanks Interior”，常青块只写季节/分区/旅行，**禁止**与 Fairbanks 共用同一句窗口/主障碍；`cannibalization_pair` 写进档案并做 Title 差（Alaska=travel+regions，Fairbanks=tonight city）。做不到就 Wave 1 先丢掉其中一个索引。 |

### 中等

| id | 问题 | 证据 | 影响 | 建议 |
|---|---|---|---|---|
| M1 | 首页 Title 抢 near-me、并自称 Live | 页面 §9：`/` Title = “Northern Lights Tonight: **Live** Aurora Forecast **Near You**”。`/near-me` Title = “Northern Lights **Near Me**…”。引擎快照默认 `generated_at + 10 分钟`，不是 live。 | 主词页与 `/near-me` 互吃；「Near You」暗示定位，和「首页不得某城化」对着干；Live 对过期/UNKNOWN 是误导。 | `/` Title 去掉 Near You / Live，改成地点无关的 tonight forecast。Live 只留在地点页的 Updated 字段。 |
| M2 | 首页全量表 vs Where 今晚榜，双份实时页 | 页面 §6 首页必须全量 15 行状态+窗口；§7 Where「上半：今晚榜（可与首页表同源）」，且 Where 是规范「去哪」URL。 | 两张可索引表同学数据，where / tonight 意图糊在一起，稀释钱页内链权重。 | 首页表只保留状态+短窗口+链；Where 才是完整榜+分区解释。Title/H1 已分，**正文不要再各写一遍同等粒度的今晚列表。** |
| M3 | `/places/alaska` 范围留口、页面封死 | 范围 §7：「`/forecast/alaska` **或后续** `/places/alaska`」。页面 §1：「不另开 `/places/alaska`」。 | v1 IA 不唯一；有人会先做第二 URL。 | v1 冻结：不存在 `/places/*`。旅行意图全部进 `/forecast/alaska`。 |
| M4 | 范围自己漏掉 Where / methodology 开工步 | 范围 §6「做」只列 Best time、How to；§8 步骤 5「两篇指南 + `/near-me`」。范围 §7 与页面把 Where、`/methodology` 当索引页。 | 开工清单会漏两个索引 URL，或上线时再补造成结构抖动。 | 把 Where、methodology 写入 v1 URL 冻结表；步骤改为引擎 → 快照 → 钱页模板 → 枢纽页（/、Where、near-me）→ 两篇指南 → methodology。 |
| M5 | 南半球「可算」vs「不做」 | 范围 §2 表：南半球「可算 / 否索引」。范围一句话与 §1 计算层：北半球。引擎 §13：「南半球」明确不做。 | 计算边界不清；`/view` 南纬会不会出结论。 | v1 计算层 **北半球 only**；南纬直接拒绝并 noindex，不要「可算」。 |
| M6 | `wisconsin.aurora_zone = sub_oval / event` 不是枚举 | 范围 Wave 1 表该格；引擎枚举只有 `oval / sub_oval / midlatitude_event / rare`，且远窗能否 GO 全靠这个值。 | 远窗规则无法落地；同一夜可能被实现成 MAYBE 或 GO。 | 改成单值（建议 `sub_oval`，偏严）。禁止用斜杠双区。 |
| M7 | Seattle 城州分工在 Wave 1 不存在 | 范围：seattle「州页见 washington」；washington 在 Wave 2。档案：`parent=null`，nearby 仅 oregon。页面：地点页必须链「父级州或子城」。 | 西雅图页会吞 washington 词；Wave 2 开州页时二次互吃。oregon↔seattle 互链也不对称。 | 要么 Wave 1 把 `washington` 做成薄州页（至少 parent 目标存在），要么 seattle 档案写明「v1 无州页」并在 FAQ/Title 避开 statewide 词；nearby 补到 3–5。 |
| M8 | 州代表点选成人口城，引擎几乎不让 GO | 档案：ohio=`cleveland`，oregon=`portland`（`role` 必为 urban）。引擎：`horizon + urban` 最高 MAYBE。范围要求代表点含「偏北观测区」。 | 州钱页在中纬事件夜首屏长期 MAYBE/NO，摘要弱；与「相对最好」更冲突。 | 每个州 `primary_verdict_point` 必须是观测点而非最大城；最大城只进对比列。Ohio 不要用 Cleveland 当首屏。 |
| M9 | 中纬钱页的 GO 窗口极窄，与 tonight 获客不匹配 | 引擎：近窗 = 窗中点 ≤ OVATION Forecast Time **+30 分钟**；中纬/sub_oval 远窗禁止 GO。Wave 1 大半是 `midlatitude_event`。 | 用户下午搜 “northern lights ohio tonight”，即使当晚有强事件，首屏也几乎只能 MAYBE+low+`FORECAST_FAR`。snippet 长期软、转化差。策略偏严可以，但必须当产品限制写进页面，不能口头「今晚决策工具」。 | 页面固定句：中纬远窗只说 “overnight outlook, not a go-now”。不要在 Title 承诺 Visibility 像 nowcast。验收时用「下午 16:00 打开 Ohio 强 Kp 夜」作用例，避免被实现成 GO。 |
| M10 | ZIP / 非白名单地名如何落到 URL 未定义 | 范围：搜索城市/州/ZIP；已索引跳规范 URL，否则动态 noindex。页面：`/near-me` 提交跳走；`/view` 接临时坐标；Find place「命中白名单跳 forecast」。线框同。 | 同 ZIP 可被做成 `/forecast/ohio`、`/view?zip=`、`/near-me?lat=` 三套。参数页若可抓，doorway。Minneapolis→minnesota、Boston→massachusetts 的吸收规则只在档案摘要，不在路由合同。 | 写死路由：白名单 slug → `/forecast/*`；其余 → `/view` noindex（规范化坐标/ZIP 查询，避免无穷 URL）；吸收表（Boston/Minneapolis/Northern Michigan）做 301 或内部别名，禁止新索引壳。`/near-me?*` 一律 noindex。 |
| M11 | `dateModified` = 快照时间（约 10 分钟一跳） | 页面 §2/§8：`dateModified` / Updated 用快照时间。引擎 §10：默认 10 分钟过期。 | 安静夜无信息变化仍狂改时间，浪费 crawl、新鲜度信号变噪；事件夜才有用。 | 索引页 `dateModified` 仅在 status/窗口/主障碍变化时更新；爬虫 HTML 仍带 Updated，但 JSON-LD 不要每 10 分钟跳。 |
| M12 | 手机「首屏不滚动出结论」与地点页模块量冲突 | 范围 §6：「移动端第一屏出结论（不滚动）」。线框：H1+答案段+卡。页面还要求小时轴「必须在 HTML，紧挨结论卡」，只说轴不必挤进 100vh。 | 小屏 H1+段+卡已经顶满；再塞轴会破「不滚动」。实现会二选一。 | 冻结：100vh 内只保证 H1 + 一句答案 + 结论卡；小时轴可在首屏下，但仍 SSR、仍高于常青。 |
| M13 | 常青互异未举证，doorway 条款无法验收 | 页面 §5：「模块数据必须因地点而变。否则 Google 当 doorway」。范围 §3.3 常青必填。档案摘要只暴露 nearby/variants/parent，未给出 15 份 `local_faqs` / obstacles 互异证明。oregon `variant_keywords` 仅 2 条。 | 模板一开，15 页只换地名——这是页面自己写的死亡条件。 | 开工前抽检 15 份常青：障碍/出城/FAQ/南北差不得复用。oregon 变体补到与其它州同级。缺则该 slug 保持 noindex。 |
| M14 | 计算层 URL 形态与「noindex,follow 任意坐标」未设计 | 范围 §5：「任意合法坐标：可出结论，`noindex,follow`，不进 sitemap」。页面只有 `/view`。 | `/view?lat=` 无限参数、重复坐标、与 forecast 近重复。 | `/view` 单一路径 + 规范化 query；canonical 指最近州页（若有）或自指并 noindex；禁止 `/forecast/未白名单slug`。 |

### 轻微（不挡，但不要假装没有）

| id | 问题 | 证据 | 影响 | 建议 |
|---|---|---|---|---|
| L1 | 磁纬用偶极、非 AACGM | 档案摘要；范围 §3.2「不手估冒充精确」；引擎「偶极初值，只做远窗降级」。 | 门槛粗，但文档已承认。 | methodology 写一句 dipole，不在页面上展示 Kp 数字。 |
| L2 | `look_toward`「固定 north」又「用档案」 | 引擎 §1。 | 实现时不知以谁为准。 | v1 写死 `north`；档案字段先不读。 |
| L3 | 一句话「再英语加拿大/英国」vs Wave 2 仍是美国 | 范围文首 vs §5 Wave 2 表。 | 排期误读。 | 对外只说：索引下一波仍是美国。 |
| L4 | 小时轴线框不是 30 分钟等间隔 | 引擎窗 30 分钟；线框 9:30/10:00/10:30/11:30。 | 展示可折叠，规则已够。 | 数据仍 30 分钟；UI 可折叠，禁止另算一套窗。 |
| L5 | Indiana 西北角时区已知错 | 引擎 §8：v1 不用 `America/Chicago`。 | 窗口墙钟可能偏 1 小时。 | methodology 与俄亥俄/芝加哥互链处各写一句；不挡。 |

---

## 3. 打架清单（只列仍同时有效的文本）

| # | A 说 | B 说 | 必须留下哪句 |
|---|---|---|---|
| 1 | 范围：州页结论 = 州内今晚相对最好 | 引擎：首屏 = `primary_verdict_point` | 引擎。对比模块才能说「哪点更好」。 |
| 2 | 引擎 §3：>−12° SKIP、不参与状态 | 引擎 §5：−12°～−6° 可 MAYBE | SKIP。删 MAYBE 暮光。 |
| 3 | 范围：首页/near-me IP 可预填城市；产品默认层「IP 默认」 | 页面/线框/审计约束：首页 SSR 不得变成某城；爬虫与无 Cookie 同一 HTML | 页面。IP 不得进 SSR 正文。 |
| 4 | 范围上级 = PRD（16 城、/map、WAIT、加权、首页地图、/places/alaska） | 范围/引擎/页面 v1 正文相反 | 废止 PRD 上列条款，否则没有「上级」。 |
| 5 | 范围 §7：阿拉斯加可后续 `/places/alaska` | 页面：不另开 `/places/alaska` | 页面。v1 无 `/places`。 |
| 6 | 范围 §2：南半球可算 | 范围 §1 + 引擎：北半球 / 南半球不做 | 北半球 only。 |
| 7 | 范围 §6/§8：常青指南只有两篇，开工不含 Where | 范围 §7 + 页面：Where、methodology 是索引页 | 页面 URL 表。改开工顺序。 |
| 8 | 范围一句话：手机首屏出结论（易被读成首页也给本地结论） | 页面：首页「取决于地点」+ 全量表，本地结论只在跳进 forecast/view 之后 | 页面。范围一句话改成「钱页手机首屏出结论」。 |
| 9 | 范围 seattle → 见 washington 州页 | 档案 parent=null；washington 不在 Wave 1 | 补州页或删「见 washington」。 |
| 10 | 范围 nearby 3–5，缺则不得 index | 档案 colorado/seattle 各 1 个 nearby | 档案服从范围门槛，不要改门槛迁就档案。 |
| 11 | 页面 Title：首页 Live + Near You | 页面自己禁止首页某城化；引擎 10 分钟快照 | 改 Title。 |
| 12 | 范围计算层任意点 GO/MAYBE/NO | 引擎远窗依赖档案 `typical_kp_*` 与 `aurora_zone` | 无档案点禁用远窗 GO。 |
| 13 | PRD：未入夜 WAIT | 引擎：WAIT 不是状态 | 引擎。 |
| 14 | PRD：加权 45/30/15/10、70+GO | 引擎：百分比不决定用户状态 | 引擎。 |
| 15 | 档案 alaska 首屏点 = fairbanks | 页面：两 URL 都是今晚问句钱页 | 必须做内容分工，否则删一个索引。 |

以上 1/2/3/4/12 不冻结则 **引擎不可编码**；3/11/15 不冻结则 **不要谈收录**。

---

## 4. 冻结后再开工——最多 3 件事

1. **废止 + 规则单页：** PRD 废止表；S1 州页首屏；S2 暮光；S3 IP 不得进 SSR；S5 无档案远窗；wisconsin 单值 zone。没有这一页，禁止写代码。  
2. **只做判断引擎 + 缓存 + 快照形状（引擎 §11）+ 三类点自测（Fairbanks / Seattle-Minnesota / Ohio-Chicago，含引擎 §12 科罗拉多两点对比）。** 输出不得进 sitemap，15 个 `seo_indexable` 保持 false。  
3. **只补档案硬门槛，不写站：** nearby 3–5、parent、cannibalization_pair（尤其 alaska↔fairbanks、chicago↔illinois、seattle 有无州页）、常青/FAQ 互异抽检。不合格 slug 继续 noindex。

**明确不要在本阶段做：** 首页/地点 HTML、开 index、sitemap、指南成稿上线、Where 榜当产品。线框未按 S3/M1/M12 改完之前，HTML 一律视为未过审。

---

## 5. 应保持禁止的

- 登录、账号、收藏、订阅、付费墙、邮件提醒、原生 App。  
- 强制 GPS；存储精确坐标。  
- 首页或 `/near-me` SSR 按 IP/GPS 改 H1、主答案、OG、JSON-LD、今晚卡。  
- 百分概率、加权总分决定 GO/MAYBE/NO；把过期快照渲染为 live。  
- `/map`、复杂 WebGL 挡首屏；一词一页；日期事件页；太阳风暴/耀斑/NOAA 品牌词页。  
- `/places/alaska` 及任何问句新 URL；Boston / Minneapolis / northern-michigan / ZIP / 用户临时镇的索引壳。  
- 索引 `/view` 与 `/near-me` 的坐标结果；sitemap 塞未 `seo_indexable` 的 forecast。  
- 15 个地点只换城市名；常青复制；结论靠客户端再画。  
- 用几何中心或丹佛代表一州；把城点 status 改写成「开两小时暗空」。  
- 俄罗斯运营内容；南半球产品；北欧本地语言 tonight 页。  
- 未核实停车场/路线；H1 到答案之间插广告。  
- 在 Wave 1 名单上临时加镇。  
- 用 GSC 回头改 Wave 1 名单来「决定首发」。

---

**审计意见：** 这包的获客方向（钱在 `/forecast/[slug]`、首页当主词枢纽、不把天气 App 的 IP 卡交给 Google）是对的，但**现在不是可执行 spec**，是三份尚未互相废止的草稿加一份未合格档案。谁按「状态：已对齐」开工，谁负责把互吃首页和 UNKNOWN 州页送进索引。
