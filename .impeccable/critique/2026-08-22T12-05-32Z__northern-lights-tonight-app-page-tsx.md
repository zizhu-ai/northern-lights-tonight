---
target: 整个产品 UI 视觉（首页 + 全站代表路由）
total_score: 30
p0_count: 1
p1_count: 2
timestamp: 2026-08-22T12-05-32Z
slug: northern-lights-tonight-app-page-tsx
---
# Critique: Northern Lights Tonight — 整站 UI 视觉

Method: dual-agent (A: agent-0 · B: agent-1)
Target: /Users/zizhu/AGI/1-出海AI产品/产品-northern lights tonight/app/page.tsx（+ 全站代表性路由）
Date: 2026-08-22

## Design Health Score: 30/40（Good 区间下沿）

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | "Updated 1679 minutes ago" 不可读；全站 UNKNOWN 时无站点级"数据暂停"信号 |
| 2 | Match System / Real World | 3 | "Headline: Newburyport" 泄露内部词汇；"Look north / North" 标签与值同义反复 |
| 3 | User Control and Freedom | 3 | 手机 sheet 无可见关闭按钮（只能点背板）；"Try again" 不说明会做什么 |
| 4 | Consistency and Standards | 3 | /view 双 "Try again"；撇号混用；规范与实现大面积漂移 |
| 5 | Error Prevention | 3 | stale→UNKNOWN、GPS 拒绝兜底好；/view 无坐标渲染 "0.000, 0.000" + Nearby: Maine |
| 6 | Recognition Rather Than Recall | 4 | 状态词+人话+首页 "How to read" 教学，无需记忆 |
| 7 | Flexibility and Efficiency | 3 | 搜索/GPS/直达 URL 都有；无 recents（隐私取舍，可接受） |
| 8 | Aesthetic and Minimalist Design | 2 | 克制滑向"表达不足"：15 行相同 UNKNOWN 无解释、悬挂 "—"、卡内 meta 冗余 |
| 9 | Error Recovery | 3 | 错误文案指明出路；但 28 小时前的数据上 "Try again" 不可能成功，恢复死循环 |
| 10 | Help and Documentation | 4 | /methodology "gates, in order" 极佳；指南互链；逐地 FAQ |

## Anti-Patterns Verdict

**LLM 评估（A）：** 经典 AI slop 全部缺席（无渐变文字、无玻璃拟态、无 hero 大数字、无 eyebrow、无编号段标、无库存极光图、无粒子）。Archivo 浓缩体"电报戳"胶囊有真性格。**但反向失败**：浅色页面素到像"未换皮肤的线框稿/v0 默认导出"——单一无衬线、ink-on-white、细线、除胶囊外零色彩。规范的人格化决策（Newsreader 衬线 H1「杂志夜报」、海军蓝夜窗、3px 状态色条、16px 圆角）全部未实现，导致唯一被设计过的物件（夜卡）独自扛着全站气质。

**确定性扫描（B）：** CLI 扫描 0 findings（已用含 Inter 的 sanity 文件验证检测器本身工作正常；注意其页面级分析器只对含 `<html>` 的文件生效，对 TSX 只跑行级正则，结论偏窄）。浏览器注入扫描（渲染后 DOM，5 条路由）：首页 `line-length`（导语约 87 字符/行，真阳性、轻微）；`/`、指南、methodology 报 `single-font: only font used is times`——**疑似本机环境伪影**：layout.tsx 用 next/font 加载 Archivo，但渲染页实际落到 Times 默认衬线，极可能是本机 dev 环境拉取 Google Fonts 失败后的兜底；需在有网环境复验，暂不计入产品问题。

**可视化叠加层：** 注入成功，5 张带叠加层截图存于 /tmp/nlt-b/（headless 浏览器内验证，非用户可见标签页）。

## Overall Impression

核心的诚实设计（一个卡片组件、data-status 换肤、过期强制 UNKNOWN）活着，文案是全站设计得最好的东西。但浅色层完全没有执行规范里的人格化方向，整站像「设计系统的骨架」，不是「设计过的产品」；叠加当前全站 UNKNOWN + 28 小时 stale 的数据状态，前门看上去像死站。最大机会：把规范里已经写好的夜窗+衬线人格真正实现，并给"无数据"一个体面的站点级表达。

## What's Working

1. **Verdict-card 纪律** — 一个组件 data-status 换肤，SSR 可读，过期快照强制 UNKNOWN 无 GO 绿残留（verdict-card.tsx:46, tonight-places.tsx:66）。产品的诚实承诺活在像素里。
2. **文案是全站最佳设计** — "We are not guessing." / "Not worth a special trip tonight." / 错误文案自带出路。冻结在 ui-copy.json。
3. **Find-place 工程** — 手机底栏 sheet（非挡结论的模态）、focus trap、Escape、GPS 拒绝兜底文案、44px+ 触控、全局 reduced-motion。

## Priority Issues

1. **P0 — 前门像死站，时间戳在作证。** 首页 15 行相同 UNKNOWN 无解释；卡脚 "Updated 1679 minutes ago"。修：(a) 时间戳人性化（<60min → "N minutes ago"→"N hours ago"→绝对时间 "Updated Tue 9:14 PM ET"）；(b) 全部 UNKNOWN/stale 时在列表上方渲染一条站点级说明——"Readings paused: source data is stale. We don't guess."——而不是让用户逐行发现。建议命令：/impeccable clarify + /impeccable harden
2. **P1 — 对比度违反规范自己的硬规第 5 条（AA），恰恰都在信任发生的地方。** 按 oklch token 实算：--muted 白底 3.37:1（城市名、窗口、kicker、页脚、隐私行、FAQ 答案，多为 13px）；胶囊 UNKNOWN 3.87 / MAYBE 3.48 / NO 4.05 / GO 4.47；--danger 白底 3.06:1（错误文字！）。夜卡状态词全部达标（6.8–8.6:1）。修：--muted 压到 oklch(0.33) 附近、胶囊墨色加深 10–15%、--danger 改 ~oklch(0.42 0.15 25)。建议命令：/impeccable audit → /impeccable polish
3. **P1 — 字体无视规范的核心人格决策，层级被压平。** 全站无 Newsreader（layout.tsx 只载 Archivo）；H1 无衬线 24px 手机（规范衬线 30px）；区 H2 = 16px 同正文，指南/methodology 读成无差别段落；手机状态词 41.6px（规范 52px）；UNKNOWN 故意比 GO/MAYBE 小（globals.css:522）。修：next/font 载 Newsreader、H1 clamp 上调、四态状态词同号。建议命令：/impeccable typeset
4. **P2 — 规范组件缺失或互相矛盾，两份文档在描述两个产品。** 无 3px 状态色顶条；无桌面粘性 Nearby 右栏（Nearby 埋页底）；卡圆角 6px vs 规范 16px；夜底色绿黑 vs 规范海军 #0C1522；字标 16px 单线方块 vs 规范 22px 双弧；首页行只有地名是链接（~20px 热区）vs 规范整行 44px 热区。修：低成本项直接补齐（状态条、整行热区、圆角），其余要么改实现要么改规范。建议命令：/impeccable polish
5. **P2 — /view 空指针岛。** 裸 /view 渲染 "Tonight near 0.000, 0.000" + Nearby: Maine——西非外海坐标配新英格兰地名。修：无有效坐标 → 渲染 find-place 空态而非卡。建议命令：/impeccable harden

## Persona Red Flags

- **Jordan（首访者）**：落在 /forecast/massachusetts，得 UNKNOWN + "We are not guessing." + Try again；点了重载无变化，没说何时回来。"Updated 1679 minutes ago" 对他无意义；"Look north: North" 在夜里 11 点帮不了他找北，能帮忙的指南链接在三屏之下。
- **Casey（夜里手机单手）**：夜卡一臂可读、触控 44px 好。但周围全白刺眼无夜间考量；sheet 无可见关闭钮；首页行进卡只有 20px 文字链接可点，每个城市下还挂着像 bug 的 "—"。
- **Riley（压力测试）**：/view → 0.000,0.000 + Maine；首页 "Chicago/Chicago""Seattle/Seattle" 地名重复两行；/forecast/boston 礼貌 404（好）但头尾完整让死路像真页面；ZIP 不存在、GPS 拒绝均优雅降级。

## Minor Observations

- layout.tsx 仍带 `robots: noindex` + "Pipeline stub" 描述——上线前必须摘掉。
- 小时轴 SSR、5 行+展开、等宽数字、SKIP 变灰都正确建成——当前数据 stale 无法视觉验证。
- 桌面钱页 680px 栏置于 840px 页中，右侧空白（规范右栏缺失）——1440px 下读着像半成品。
- "Tonight's hours" 直撇号与他处 typographic 撇号混用；焦点环白底 4.34:1 过 3:1 非文本标准；夜卡上焦点环正确。
- 首页移动行：城市名后独立一行孤 "—"，读如渲染 bug。

## Questions to Consider

1. 当 15 行已连续 28 小时 UNKNOWN，首页是干嘛的？诚实的设计是不是站点级"读数暂停"而非十五行虚无？
2. 规范写海军夜窗+Newsreader 衬线；实现是绿黑账本+Archivo 邮戳。两个都自洽但是两个产品——哪份文档在说谎，上线前谁来对齐？
3. 为什么 UNKNOWN 是最小的状态词（globals.css:522）？无数据恰是产品声音最该响的时刻，却被视觉降级。
4. 如果 "Look north: North" 是首访者在决策时刻得到的全部指引，无地图/无指南针的规则是否被遵守到了无用的地步——加一句"怎么找北"的文案值不值得打破规范的沉默？
