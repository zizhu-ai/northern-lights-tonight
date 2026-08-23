---
target: 方向D暮色带落地后复跑
total_score: 34
p0_count: 0
p1_count: 2
timestamp: 2026-08-22T15-17-47Z
slug: northern-lights-tonight-app-page-tsx
---
# Critique 复跑：方向 D「暮色带」落地后

Method: dual-agent (A: agent-2 · B: agent-3)
Target: /Users/zizhu/AGI/1-出海AI产品/产品-northern lights tonight/app/page.tsx（+ 全站代表路由）
Date: 2026-08-22（grok 执行 + Nearby 右栏修复后，生产构建 localhost:3107）

## Design Health Score: 34/40（Good，基线 30/40）

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | 状态词 52/64px、时间戳人性化、暂停态醒目；但 Try again 是 reload 安慰剂 |
| 2 | Match System / Real World | 4 | 全站人话；GO/MAYBE/NO 在首页自有定义 |
| 3 | User Control and Freedom | 3 | Find-place 补了可见关闭钮；stale 墙除 reload 无出口 |
| 4 | Consistency and Standards | 4 | 一套 token、四态同号、胶囊跨页面一致 |
| 5 | Error Prevention | 3 | GPS 隐私行前置、aria-invalid、slug 白名单防垃圾 URL |
| 6 | Recognition Rather Than Recall | 4 | kicker 带州+时区+代表点；How to read 在首页 |
| 7 | Flexibility and Efficiency | 3 | 搜索/GPS/15 行/桌面粘性 Nearby；无 recents（明确不做） |
| 8 | Aesthetic and Minimalist Design | 3 | 首页真极简；钱页同一句 stale 文案重复最多 8 次 |
| 9 | Error Recovery | 3 | stale 人话解释；Boston 别名软 404（HTTP 200）；Try again 无效 |
| 10 | Help and Documentation | 4 | methodology 极佳；逐地 FAQ；指南互链 |

## Anti-Patterns Verdict

**LLM 评估（A）：** 不再是未换皮肤的线框稿。暮色带绝对平涂 `#1F3875`，无渐变/星星/粒子/玻璃；判定卡跨带悬浮是真构图；顶栏融入带内正确。反目标零违反。气质落在「有观点的公共服务」（yr.no 谱系），正是简报锚点。

**确定性扫描（B）：** CLI 0 findings。浏览器注入：上轮 `single-font: times` 确认为环境伪影，现为 Inter（100%），属简报的有意决策（全 sans），不计问题。`line-length` ~86ch 真阳性：钱页导语 1 处、指南正文 6 处、methodology 5 处（简报 §5 要求正文 ≤68ch）。叠加层 4/5 页渲染成功并截图验证。

## 基线问题核销（全部 resolved）

- 未换皮肤感 → 已解决
- muted 3.37:1 → 6.53–7.07:1
- 胶囊墨 3.48–4.05:1 → 5.68–6.52:1
- danger 3.06:1 → 5.16:1
- H2=正文 → 20/24px 拉开
- UNKNOWN 视觉降级 → 四态同号 52/64px
- 无桌面粘性 Nearby → 已补（且修复了压带 bug）
- 首页 20px 热区 → 整行 44px
- "1679 minutes ago" → 人性化时间戳
- /view 空指针岛 → find-place 空态（已验证）

## 新发现问题（本轮 priority issues）

1. **P1 钱页 stale 文案地毯式重复。** 暂停态下 "Source data is too old to treat as live." 出现在带内答案、卡内 Main issue、Tonight's hours 兜底、Why this verdict 6 行中的 5 行。修：`!live` 时该网格收成一行或折叠，解释只留在卡上。
2. **P1 焦点环在浅底上非文本对比不足。** `--focus: #3cdba0` 白底 1.77:1、纸底 1.64:1（WCAG 1.4.11 要 3:1；夜卡/带上 10.5:1 没问题）。修：浅底 `:focus-visible` 换深绿（如 GO 胶囊墨 `#0d6b4a`，5.7:1），暗底保留 `#3cdba0`。
3. **P2 Try again 是安慰剂。** 静态缓存页（revalidate 600）+ 停跑的管线，reload 永远得到同一页。修：要么真绕缓存，要么改文案承认现实（"We check sources every 10 min — this page updates itself" + methodology 链接）。
4. **P2 /forecast/boston 软 404。** 路由返回 HTTP 200 渲染 "Page not found" 内容；上线摘 noindex 后是 soft-404 信号。修：保留吸收 UI 但返回真 404 状态，或 301 到 /forecast/massachusetts。
5. **P3 瘦版带未实现。** 简报 §6 要钱页瘦版带；实现沿用首页 `min-height: calc(42vh - header)`，桌面答案句和卡之间留死带。修：钱页去掉 min-height 内容自适应，或改简报。

## Persona Red Flags

- **Jordan：** 暂停没有「何时回来」的预期管理——"Readings paused" 无 we re-check every N min，首访者不知道是几分钟还是几个月。
- **Casey：** 热区全达标（44px 整行、整卡链接）。但夜里 11 点下半页白纸对暗适应眼睛是手电——暗色需求比计划更靠前。Try again 恰在拇指期待的「刷新答案」位置却无效。
- **Riley：** Boston 软 404（200）、Try again 无效，均实锤。/view 空指针岛已修、垃圾 slug 正确硬 404，记功。

## Minor Observations

- "Look / North" 同义反复仍在（简报 §8.8 要求合并，未做）。
- 桌面行 hover `#fff` on `#f4f6f8` ≈ 1.06:1，几乎不可见。
- 小时表发丝线 1.25:1 承担分组功能，偏弱。
- 首页桌面行第三列（window）暂停时为空字符串，胶囊漂浮过右。
- 手机顶部无 Tonight/Near me/Guides（沿用旧规范决策），长页略迷失。
- 时间戳天级别老化可考虑 "last Wednesday" 式表达。

## Questions to Consider

1. 管线停着的时候，诚实控件是删除按钮说「我们会回来」，还是留着 reload？
2. UNKNOWN 可能是上线后最多被看到的状态，钱页重复最多的一句话为什么是道歉而不是一个可执行的下一步？
3. 产品按设计在夜里用，但答案下半页是白纸—— quiet paper 是下午 3 点的材料，还是也适合夜里 11 点？
4. NO 现在和 GO 同号同尊严——情感拉平是诚实还是信号损失？
