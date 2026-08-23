# 模拟用户测试 · 三用户复验（上线后）

- 日期：2026-08-21
- 生产 URL：https://northern-lights-tonight.vercel.app
- 工具：指定 Chrome + `/tmp/nlt-qa-tools` 的 `puppeteer-core`；三个隔离 BrowserContext；Boston 首包用 `python3 urllib`
- 视口：390×844、375×667
- Maya：时区 `America/Denver`，页面时间固定为 16:30
- 截图目录：`/tmp/nlt-codex-sim3/`
- 未使用 ego-browser、Codex Browser、源码或 NOAA；未改仓库

测试过程中数据由安全降级的 `UNKNOWN` 刷新为实时 `NO`。以下采用刷新后的最终结果。

## 三个用户各自发生了什么

### Priya · Chicago

- 路径：`/near-me` → 点击 “Use my location” → `/forecast/chicago`
- GPS：41.878, -87.630，已授权
- 最终状态：`NO`
- Best window：`—`
- Main issue：“Aurora activity is not expected to reach Chicago tonight.”
- 第一条 What to do：

  > “Downtown, the Loop, and the inner neighborhoods are the wrong place to stand. If you go out anyway on a strong storm, get north into southern Wisconsin or at least far enough from the skyline that the northern horizon is not orange.”

  不以 “Yes.” 开头，也没有把 `NO` 写成今晚出门许可。M-01 通过。

- 表单交互：

  - 空值 → 点击 “Check” → “Enter a US city, state, or ZIP.”
  - 输入 `00000` → 点击 “Check” → “That ZIP is not in our list yet. Try the city name.”
  - 撤销定位权限 → 点击 “Use my location” → “Location permission is off. Search a city or ZIP instead.”

- 375×667 滚动后粘性顶栏完整显示 “Northern Lights Tonight”。L-01 通过。

截图：[最终 verdict](/tmp/nlt-codex-sim3/priya-chicago-390x844-top-final.png)、[What to do](/tmp/nlt-codex-sim3/priya-chicago-390x844-what-to-do-final-clear.png)、[375 粘性标题](/tmp/nlt-codex-sim3/priya-chicago-375x667-sticky-wordmark.png)、[空值](/tmp/nlt-codex-sim3/priya-empty-submit.png)、[00000](/tmp/nlt-codex-sim3/priya-00000.png)、[拒绝 GPS](/tmp/nlt-codex-sim3/priya-gps-denied.png)。

### Maya · Denver，16:30

- 路径：直接打开 `/`，再打开 `/forecast/colorado`
- 点击：无
- H1：“Can You See the Northern Lights in Colorado Tonight?”
- Headline：“Colorado · MT · Headline: Fort Collins”
- 最终状态：`NO`
- Best window：`—`
- Main issue：“Aurora activity is not expected to reach Colorado tonight.”
- 第一条 What to do：

  > “Leave Denver if you are trying at all. You need a dark north horizon, not a city skyline. Do not drive south expecting a better oval — go north or onto the eastern plains with a clear view of the northern sky.”

- 375×667 无滚动时，H1、大号 `NO`、完整 Best window 标签和值均在视口内。
- 390×844 同样通过。
- “Other points in Colorado” 包含 “Denver” 和 “Steamboat Springs”。
- 实时 `NO` 页面没有 “Source data is too old to treat as live.”
- 两档视口标题均完整显示 “Northern Lights Tonight”。

截图：[375×667，16:30](/tmp/nlt-codex-sim3/maya-colorado-375x667-denver-1630-v2.png)、[390×844，16:30](/tmp/nlt-codex-sim3/maya-colorado-390x844-denver-1630.png)、[What to do / Denver](/tmp/nlt-codex-sim3/maya-colorado-390x844-what-to-do.png)。

### Chris · Boston

- 路径：主页输入 `Boston` → 点击 “Check” → `/forecast/massachusetts`
- 最终状态：`NO`
- Best window：`—`
- Main issue：“Aurora activity is not expected to reach Massachusetts tonight.”
- 第一条 What to do：

  > “Leave Boston. North toward the New Hampshire border or west into the Berkshires beats the harbor. Do not drive to the Cape for aurora.”

- 搜索结果是可用的 Massachusetts tonight 页面。
- 随后直接打开 `/forecast/boston`：
  - HTTP 200
  - 首包 HTML 含 “We do not have a dedicated Boston URL.”
  - 首包 HTML 含 “Massachusetts tonight”
  - 浏览器首屏也直接显示以上内容，没有先出现错误的 forecast。

截图：[Massachusetts 最终 verdict](/tmp/nlt-codex-sim3/chris-massachusetts-390x844-top-final.png)、[Massachusetts What to do](/tmp/nlt-codex-sim3/chris-massachusetts-what-to-do.png)、[Boston 首屏](/tmp/nlt-codex-sim3/chris-forecast-boston-first-paint.png)。

## 缺陷列表

本次打开范围内无可复现缺陷：**S 0 / M 0 / L 0**。

## 未测

- 未打开其他州、市、指南或桌面视口。
- 未测试 Share、其他地点链接及完整小时表交互。
- 未主动获取 NOAA，也未检查源码或仓库实现。

## 一句话

Priya、Maya 和 Chris 最终都能明确决定今晚不值得专程出门；**M-01 与 L-01 均已在生产环境保持修复**。