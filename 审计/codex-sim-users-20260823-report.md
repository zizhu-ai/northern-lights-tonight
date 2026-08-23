# 模拟用户测试 · 五用户复验（暮色带上线后）

- 日期：2026-08-23（Asia/Shanghai）
- 生产站：https://aurora-tonight.com
- 工具：Node.js + Playwright Chromium（headless）、curl（仅检查本站首屏 HTML / HTTP 状态）；未使用 Ego Browser、Codex in-app Browser、computer-use、node_repl，也未直接请求 NOAA。
- 视口：390×844、375×667、1440×900、1280×800。
- 隔离方式：U1–U5 各自使用全新的 BrowserContext；U1 单独授予 geolocation 并设置为 41.878, -87.630。
- 截图：均在 /tmp/nlt-codex-sim-20260823/，未写入仓库。

## 五个用户各自发生了什么

### U1 Priya｜手机、Chicago、夜间

- 从 /near-me 点击 “Use my location” 后，GPS 正确导航至 /forecast/chicago。
- 判定词 “UNKNOWN” 位于深色卡片顶部，390×844 首屏内非常醒目。
- Best window：“—”；Main issue：“Source data is too old to treat as live.”
- 首条 What to do：“Downtown, the Loop, and the inner neighborhoods are the wrong place to stand. If you go out anyway on a strong storm, get north into southern Wisconsin or at least far enough from the skyline that the northern horizon is not orange.”
- UNKNOWN 不是死页：正文写明 “We are not guessing.”，并告诉用户页面每 10 分钟检查、会自行更新，同时提供 “How we decide”。
- 首页空提交原文：“Enter a US city, state, or ZIP.”
- 首页输入 “00000” 原文：“That ZIP is not in our list yet. Try the city name.”
- 两个错误态按钮都只有 “Check” 与 “Use my location”；没有 “Try again” 按钮或类似安慰剂按钮。
- 375×667：wordmark 完整显示 “Northern Lights Tonight”；元素宽 188.95px，clientWidth = scrollWidth = 189px，未裁切。
- 字体：body / H1 / verdict 均为 Inter, “Inter Fallback”, ui-sans-serif, system-ui, sans-serif。
- 控制台错误：无。失败请求：无。
- 截图：
  - /tmp/nlt-codex-sim-20260823/u1-priya-chicago.png
  - /tmp/nlt-codex-sim-20260823/u1-priya-what-to-do.png
  - /tmp/nlt-codex-sim-20260823/u1-priya-empty-error.png
  - /tmp/nlt-codex-sim-20260823/u1-priya-00000-error.png
  - /tmp/nlt-codex-sim-20260823/u1-r2-header-375x667.png

### U2 Maya｜桌面、首页、首次访问

- 1440×900 不滚动时可见：导航、H1 “Can You See the Northern Lights Tonight?”、说明、地点搜索、定位入口，以及跨越暮色带下沿的深色判定卡。
- “UNKNOWN” 字号大、浅蓝色，能瞬间读到。当前并非 live GO/MAYBE/NO；卡片清楚显示 stale 原因与 “Updated 55 minutes ago”。
- Best window：“—”；首页没有 What to do 区块，因此首条 bullet 为 N/A。
- 卡片确实跨带：暮色带底边 y=459.78；卡片 y=395.78–740.56，即上部约 64px 在带内、其余进入下方内容区。
- 暮色带：rgb(31, 56, 117)（#1F3875）；卡片：rgb(10, 19, 34)（#0A1322）。两者明度差和边界都明显，视觉对比成立。
- body / H1 / 大判定词均为 Inter sans 栈。对所有实际渲染元素扫描，没有发现 Times、Georgia 等 serif 字体。
- 向下滚动后的 “Tonight in the US” 行表清晰，但背景是浅灰 rgb(244, 246, 248)，不是要求的白色；见 M-01。
- 控制台错误：无。失败请求：无。
- 截图：
  - /tmp/nlt-codex-sim-20260823/u2-maya-home-fold.png
  - /tmp/nlt-codex-sim-20260823/u2-maya-home-table.png

### U3 Chris｜桌面、州 forecast

#### Colorado｜1440×900

- H1：“Can You See the Northern Lights in Colorado Tonight?”
- headline 文案明确是 “Fort Collins area”；Other points 中包含 “Denver” 与 “Steamboat Springs”。
- 判定：“UNKNOWN”；Best window：“—”；Main issue：“Source data is too old to treat as live.”
- 首条 What to do：“Leave Denver if you are trying at all. You need a dark north horizon, not a city skyline. Do not drive south expecting a better oval — go north or onto the eastern plains with a clear view of the northern sky.”
- H1、大判定词、完整 Best-window 行均在首屏。
- 暮色带底边 y=388.78；Nearby 顶边 y=705.56。Nearby 完全位于带下方，无重叠。

#### Colorado｜1280×800

- 同样满足首屏 H1、判定词、完整 Best-window 行。
- 暮色带底边 y=388.78；Nearby 顶边 y=705.56，仍无重叠。

#### Minnesota｜1440×900

- H1：“Can You See the Northern Lights in Minnesota Tonight?”
- headline 文案明确是 “Duluth area”；Other points 中包含 “Ely” 与 “Minneapolis”。
- 判定：“UNKNOWN”；Best window：“—”；Main issue：“Source data is too old to treat as live.”
- 首条 What to do：“Leave Minneapolis. North toward Duluth and beyond is the correct direction. The Boundary Waters / Ely latitude is the in-state destination on a moderate night.”
- H1、大判定词、完整 Best-window 行均在首屏。
- 暮色带底边 y=388.78；Nearby 顶边 y=705.56。Nearby 完全位于带下方，无重叠。
- 三次打开均使用 Inter sans 栈；控制台错误：无；失败请求：无。
- 截图：
  - /tmp/nlt-codex-sim-20260823/u3-chris-colorado-1440x900.png
  - /tmp/nlt-codex-sim-20260823/u3-chris-colorado-1280x800.png
  - /tmp/nlt-codex-sim-20260823/u3-chris-minnesota-1440x900.png

### U4 Tom｜手机、Boston 搜索

- 首页输入 “Boston” 后直接导航至 /forecast/massachusetts，不是 absorption copy，也不是 /forecast/boston。
- Massachusetts 页 headline 为 “Newburyport area”，Other points 列出 “Boston”；What to do 首句从 “Leave Boston.” 开始。
- 该页判定为 “UNKNOWN”；Best window “—”；原因仍是 stale source data，并提供自动更新说明与方法页入口。
- Massachusetts 页首条 What to do：“Leave Boston. North toward the New Hampshire border or west into the Berkshires beats the harbor. Do not drive to the Cape for aurora.”
- 搜索结果页与 404 页的 body / H1 都是 Inter sans 栈。
- 独立 curl GET /forecast/boston 返回 HTTP/2 404。
- 浏览器渲染 404 页标题 “Page not found”，正文 “We do not have a dedicated Boston URL.”，有可用下一步链接 “Massachusetts tonight”；页头也可回首页。
- 唯一控制台错误是打开该 404 URL 时浏览器记录的预期 “Failed to load resource: the server responded with a status of 404 ()”；Playwright requestfailed 为 0。
- 截图：
  - /tmp/nlt-codex-sim-20260823/u4-tom-boston-search.png
  - /tmp/nlt-codex-sim-20260823/u4-tom-boston-404.png

### U5 Elena｜手机、长文阅读

- /guides/how-to-see-northern-lights：H1 30px/700，H2 20px/700，层级清楚；正文 16px/24px，实际宽 358px，约 45 字符/行，无横向溢出。
- /methodology：相同的 H1/H2 层级与 16px/24px 正文；实际宽 358px，约 45 字符/行，无横向溢出。
- 两个阅读页都没有 verdict card、Best-window 行或 What to do 区块，这三项均为 N/A。
- 两页正文容器 computed max-width 为 686.375px，约等于设计中的 68ch；在 390px 手机上由左右 16px padding 收窄。
- 两页 body / H1 / 正文均为 Inter sans 栈。方法页的 “/view” 行内代码使用 monospace，但没有 serif 字体。
- 没有断行异常、横向滚动或不可读的超宽段落。
- 控制台错误：无。失败请求：无。
- 截图：
  - /tmp/nlt-codex-sim-20260823/u5-elena-guide.png
  - /tmp/nlt-codex-sim-20260823/u5-elena-methodology.png

## 缺陷列表

| id | 严重度 | who | URL | repro | actual | expected | screenshot |
|---|---|---|---|---|---|---|---|
| M-01 | M | U2 Maya | / | 1440×900 打开首页，向下看 “Tonight in the US” 行表区域；读取 computed background | section 为 transparent，透出 body 的 rgb(244, 246, 248)（#F4F6F8），目视为浅灰 | 暮色带以下的表格/行表区域应为白色背景 | /tmp/nlt-codex-sim-20260823/u2-maya-home-table.png |

未发现 S；未发现其他 M/L。

## 回归核对

| 项目 | 结果 | 证据 |
|---|---|---|
| R1：NO 的首条 What to do 不以 “Yes.” 开头 | **PASS（本次已打开页面无反例；NO 分支未触发）** | Chicago / Colorado / Minnesota / Massachusetts 的首条分别以 “Downtown”、“Leave Denver”、“Leave Minneapolis”、“Leave Boston” 开头；本次所有卡片实际状态均为 UNKNOWN。 |
| R2：375×667 sticky header 完整 wordmark | **PASS** | 完整文本 “Northern Lights Tonight”；box right=204.95 小于 viewport 375；clientWidth = scrollWidth = 189。截图 u1-r2-header-375x667.png。 |
| R3：live GO/MAYBE/NO 不显示 stale 文案 | **PASS（当前生产未触发 live 分支，未见反例）** | 所有实际打开的卡片都是 UNKNOWN；stale 文案只出现在 UNKNOWN 卡。没有打开到 GO/MAYBE/NO，故不能扩大为对 live 分支的完整覆盖。 |
| Nearby 不压暮色带 | **PASS** | Colorado 1440/1280 与 Minnesota 1440：band bottom=388.78，Nearby top=705.56。 |
| Boston 真 404 | **PASS** | curl GET /forecast/boston 返回 HTTP/2 404；浏览器也渲染 404 页面。 |
| 无 “Try again” 安慰剂 | **PASS** | 空值和 “00000” 错误态按钮均只有 “Check”、“Use my location”。 |

## 未测

- 没有实际遇到 GO、MAYBE 或 NO；因此 R1 的“NO 专属分支”和 R3 的“live GO/MAYBE/NO 专属分支”未被运行时状态触发。这里只报告实际打开到的页面，未伪造或篡改生产数据。
- 没有测试清单外的州、市、ZIP、浏览器、平板、超宽屏、键盘/读屏器流程。
- 没有测试环境光传感器；只按指定手机截图目视判断夜间可辨性。
- 没有直接取 NOAA，也没有检查源数据为何 stale。

## 一句话

五条真实用户路径都能看懂“当前不能可靠下结论，稍后自动更新”的下一步，关键回归守住了，暮色带和跨带卡片在真实屏幕上成立；但此刻所有实测判定页均为 UNKNOWN，用户拿不到今夜 GO/MAYBE/NO，且首页表格区的浅灰背景不符合“白底”规格。
