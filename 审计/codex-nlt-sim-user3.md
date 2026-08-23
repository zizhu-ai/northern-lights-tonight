# 模拟用户测试 · Northern Lights Tonight

- 日期：2026-08-21 15:40（Asia/Shanghai）
- LIVE URL：https://northern-lights-tonight.vercel.app
- 工具：指定的 headless Google Chrome、puppeteer-core、Python `urllib`
- 视口：375×667、390×844、1280×900、1440×900
- 结果：S=0、M=1、L=1。未修改 repo，未访问 NOAA。

## 六个用户各自发生了什么

### Maya · Denver

动机：快速决定今晚是否值得出门。

路径：`/` → 点击 Colorado → `/forecast/colorado` → 点击 Share。

她看到：

- Status：`NO`
- Best window：`—`
- Main issue：`Aurora activity is not expected to reach Colorado tonight.`
- Headline：`Colorado · MT · Headline: Fort Collins`
- Other points 中有 Denver，状态同为 `NO`
- 没有 `% chance`、地图或过期警告。
- 页面显示 `Updated 15 minutes ago`，未出现 `Source data is too old to treat as live.`

首屏测量通过：

- 375×667：H1 底部 162.9px、状态底部 320px、完整 Best window 单元底部 467.1px。
- 390×844：对应底部为 170.8px、329.8px、476.9px。

截图：[首页 375](/tmp/nlt-codex-sim/maya-home-375.png)、[Colorado 375](/tmp/nlt-codex-sim/maya-colorado-375.png)、[Colorado 390](/tmp/nlt-codex-sim/maya-colorado-390.png)、[Share 后](/tmp/nlt-codex-sim/maya-colorado-share.png)。

### Chris · Boston

动机：输入 Boston 后得到可用的今晚页面。

路径：主页输入 `Boston` → `Check` → `/forecast/massachusetts`。

结果：

- 正确路由至 Massachusetts。
- Status：`NO`
- Best window：`—`
- Main issue：`Aurora activity is not expected to reach Massachusetts tonight.`

随后直接打开 `/forecast/boston`，关闭 JavaScript 检查首 HTML：

- HTTP 200 特殊提示页。
- 首屏包含 `We do not have a dedicated Boston URL.`
- CTA 为 `Massachusetts tonight`
- 没有伪造 Boston forecast。

截图：[Boston 搜索结果](/tmp/nlt-codex-sim/chris-boston-search-result.png)、[Boston 首 HTML](/tmp/nlt-codex-sim/chris-boston-first-html.png)。

额外验证：其余搜索别名 7/7 正确；这些别名的直接 URL 均为 404。

### Priya · phone

动机：通过搜索或 GPS 获取附近结论，并能从错误状态恢复。

`/near-me` 表单结果：

- 空提交：`Enter a US city, state, or ZIP.`
- `00000`：`That ZIP is not in our list yet. Try the city name.`
- `zzzznotaplace`：`No match for that place. Try a city, state, or 5-digit ZIP.`

GPS：

- 授权并设为 41.878,-87.630 后，正确进入 `/forecast/chicago`。
- Status：`NO`
- Best window：`—`
- Main issue：`Aurora activity is not expected to reach Chicago tonight.`
- 没有显示 Wisconsin `GO`。
- 拒绝权限：`Location permission is off. Search a city or ZIP instead.`
- 模拟定位不可用：`Could not read your location. Search a city or ZIP instead.`
- Find place 底部 sheet 发起 GPS 后，点击外部遮罩关闭；延迟回调确实触发，但 URL 留在 Colorado，没有误导航。

卡住点：Chicago 下方行动文案与 `NO` 冲突，见 M-01。

截图：[空提交](/tmp/nlt-codex-sim/priya-empty.png)、[00000](/tmp/nlt-codex-sim/priya-00000.png)、[无匹配](/tmp/nlt-codex-sim/priya-no-match.png)、[Chicago GPS](/tmp/nlt-codex-sim/priya-gps-chicago.png)、[GPS 拒绝](/tmp/nlt-codex-sim/priya-gps-denied.png)、[GPS 不可用](/tmp/nlt-codex-sim/priya-gps-unavailable.png)、[触摸关闭后](/tmp/nlt-codex-sim/priya-delayed-gps-touch-close.png)。

### Tom · Sydney

路径：`/view?lat=-33.869&lng=151.209&name=Sydney`

结果：

- HTTP 200，不是 404。
- Status：`UNAVAILABLE`，不是 `GO`。
- Best window：`—`
- Main issue：`Southern hemisphere`
- 提示：`This reading is for the northern hemisphere. We do not score southern-hemisphere skies.`
- 顶部品牌、Find place 和页尾导航均存在。
- 网络面板只观察到站内 RSC 预取，没有外部 forecast/NOAA 请求。

截图：[Sydney 390](/tmp/nlt-codex-sim/tom-sydney-390.png)、[顶部 chrome](/tmp/nlt-codex-sim/tom-header-clip.png)。

### Lena · Alaska / Fairbanks / Oregon

Alaska：

- Title：`Northern Lights in Alaska: Best Places, Season & Tonight`
- Status：`GO`
- Best window：`2:15 AM–3:15 AM AKT`
- Main issue：`Any display would likely stay low on the northern horizon.`
- 包含 `Statewide · headline: Fairbanks Interior`

Fairbanks：

- Title：`Northern Lights in Fairbanks Tonight: Visibility & Best Time`
- Status：`MAYBE`
- Best window：`12:45 AM–3:15 AM AKT`
- Main issue 同上。
- 不包含 statewide kicker。

Oregon：

- Status：`NO`
- Best window：`—`
- Main issue：`Aurora activity is not expected to reach Oregon tonight.`
- Headline 是 `Baker City`，不是 Portland。

截图：[Alaska](/tmp/nlt-codex-sim/lena-alaska-1280.png)、[Fairbanks](/tmp/nlt-codex-sim/lena-fairbanks-1280.png)、[Oregon](/tmp/nlt-codex-sim/lena-oregon-1280.png)。

### Owen · methodology / guide

主页：

- Title：`Northern Lights Tonight: US City and State Aurora Forecast`
- H1：`Can You See the Northern Lights Tonight?`
- Title/H1 均没有 `Live` 或 `Near You`。
- 首 HTML 含全部 15 个固定地点入口；两组模拟 IP 得到相同 H1 和入口集合。
- 没有 IP 城市 verdict、登录入口、广告 iframe。
- `lang="en-US"`，页面为浅色，forecast verdict card 为深色。

打开：

- 页尾 `/methodology`，H1 为 `How We Decide`
- Guide `/guides/best-time-to-see-northern-lights`
- 两页均为英文，无登录。

截图：[主页](/tmp/nlt-codex-sim/owen-home-1440.png)、[Methodology](/tmp/nlt-codex-sim/owen-methodology-1440.png)、[Guide](/tmp/nlt-codex-sim/owen-guide-best-time-1440.png)。

HTTP 护栏也符合：Wave 1 全部 200；普通未知 slug、直接别名、`/map`、`/login`、`/sitemap.xml` 均 404；robots 内容为 `User-Agent: *` 和 `Disallow: /`，没有 Sitemap 指令。

## 缺陷列表

| ID | 级别 | 用户 | URL | Repro | Actual | Expected |
|---|---|---|---|---|---|---|
| M-01 | M | Priya | `/forecast/chicago` | GPS 定位 Chicago，看到 `NO` 后下滚至 “What to do” | 行动段开头是 `Yes. Downtown, the Loop...`，与今晚的 `NO` / `Not worth a special trip tonight.` 冲突 | `NO` 页面不应出现无条件 `Yes.`；应明确为 “If you go out anyway…” 等条件式文案。[截图](/tmp/nlt-codex-sim/priya-chicago-what-to-do.png) |
| L-01 | L | Maya | `/forecast/colorado` | 375×667 打开页面 | 顶部品牌被截成 `Northern Lights Toni…` | 显示完整 `Northern Lights Tonight`，或使用明确的移动端短品牌名。[截图](/tmp/nlt-codex-sim/maya-colorado-375.png) |

## 未测与环境限制

- 无法在 LIVE 环境移除服务端 snapshot，因此没有实际制造“无 snapshot”状态；只验证了 Sydney 南半球路径及当前 snapshot 页面。
- 未读取 snapshot 的 `valid_until`；只验证当前 Colorado 页面没有 stale 文案。
- Share 已点击，但 headless Chrome 无法展示操作系统分享面板，因此不对最终系统分享成功与否评分。
- 浏览器侧未观察到外部计算请求；服务端内部是否执行 request-path aurora compute 无法仅靠黑盒浏览器完全证明。
- 没有测试未列出的内容页或异常坐标组合。

## 一句话

美国用户在已测主路径上能明确决定今晚是否出门，但 Chicago 的 `NO` 页面随后又说 `Yes.`，这处决策文案必须修正。
