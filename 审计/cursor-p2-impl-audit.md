已读完 Part 2 全部实现文件与需求 §4.1 / §4.3 / §11 / 冻结四条，逐条核对结果如下。

## 核对结论

**1. 红线（无登录 / robots / IP / GPS）— 通过**
- 全仓无任何 auth、session、登录组件；`package.json` 只有 next / react。
- `app/robots.ts` 返回 `disallow: "/"` 且 `sitemap: undefined`，`public/` 为空（无冲突的静态 robots.txt），`vercel.json` 无 rewrite/headers 干扰，`layout.tsx` 另加 `robots: { index:false, follow:false }`。
- 无 middleware、无 `headers()`、无 `x-vercel-ip*` / `geo` 读取，搜索框 `value={query}` 初值为空字符串，不存在 IP 预填。
- `navigator.geolocation.getCurrentPosition` 只出现在 `handleLocation` 里，唯一调用点是 Use my location 的 `onClick`（`components/find-place.tsx:77`、`components/find-place.tsx:177`），无挂载即定位。

**2. Find place 匹配与路由 — 通过**
`lib/place-search.ts:39` 的顺序与 §11 完全一致：空 → `search_empty`；`^\d{5}$` → ZIP 精确（未命中 `zip_not_found`）；否则 aliases → 有 slug 的 Wave 1 名/slug → 其它 `places.keys`（未命中 `search_no_match`）。boston/duluth/slc 等吸收词走 aliases，产出的是 `/forecast/massachusetts` 一类白名单 slug，不会造出 `/forecast/boston`。无 slug 的点走 `viewRoute`，`lat`/`lng` 一律 `toFixed(3)`，同点同 URL，`name` 取表里的 `name`。GPS 成功先 `roundCoordinate` 到 3 位，`lat < 0` 直接进 `/view` 而不做最近点匹配（`components/find-place.tsx:92`）。失败路径只 `setError`，不 `close()`、不跳转，错误句全部取自 `content/ui-copy.json` 的 `errors.*`。`place-search.ts` 与 `find-place.tsx` 内没有任何 `fetch`，只读打包进来的 `data/us-places.json`，请求路径上无地理编码调用。ZIP `99701` 命中 Alaska（表内先于 Fairbanks），符合执行备注允许的 tie-break。

**3. VerdictCard — 通过**
四态人话全部来自 `copy.verdict.*_human`，UNAVAILABLE 用 `copy.south.human` + `copy.south.main_issue`（`components/verdict-card.tsx:19`）。`alaskaKicker` 渲染在 `verdict-card__human` 之上、大词之下（`components/verdict-card.tsx:63`），与 §4.3「人话上方」一致，且 stale 时仍保留。`stale` 时 `displayStatus` 强制为 UNKNOWN、Best window 换 `unknown_window`、Main issue 用 `stale_main_issue`，无快照（非 stale 的 UNKNOWN）则回落 `view.unknown_main_issue`，不会残留旧 GO。组件是服务端组件（无 `"use client"`），大词直接出现在 SSR HTML；只有 Share 按钮是客户端组件。卡字段八项齐全：大词、人话、Best window、Main issue、Look north、Confidence、Updated、Share。

**4. 皮肤 — 通过**
`app/globals.css:1` 的 token 与 `设计｜视觉与UI规范.md` 色表逐个对得上（ink `#122033`、paper `#F3F5F7`、night `#0C1522`、aurora `#3CDBA0` 等）。html/body 浅底，`.verdict-card` 夜色 + 3px 状态色条 + 规范里那条 `0 12px 40px rgb(12 21 34 / 28%)` 阴影；状态词 52→64、H1 30→40、顶栏 56、可点元素 44 最小高、圆角 16/12/999 都对。Inter + Newsreader 两套字体已在 layout 注入。全仓无 canvas、无粒子、无地图库、无百分数或 Kp 仪表，`prefers-reduced-motion` 已全局关动效。

## 轻微（5 条，不挡）

1. 设计规范「UNKNOWN 的 Share 换成 Try again」未实现，`ShareButton` 恒显 Share，`ui-copy.chrome.try_again` 目前无人引用。做 `/view` 时需要给 `VerdictCard` 补一个 prop，属于回头改组件的成本。
2. 定位进行中关闭面板不会取消请求：`close()` 不复位 `locating`，回调仍会 `router.push`，用户已经关掉浮层几秒后仍可能被跳走。
3. UNAVAILABLE 大词用的是 props 传入的字面量而非 `copy.south.display_status`（值相同）；另外 `stale && UNAVAILABLE` 会被改写成 UNKNOWN，南纬无快照场景实际触发不到。
4. `errors.search_not_us` 无人使用，非美国城市（如 toronto）落到 `search_no_match`。§11 没要求区分，可接受。
5. `layout.tsx` 全站 `follow: false`，与 §2 里 `/view` 的 `noindex,follow` 不一致，做 `/view` 时要用页面级 metadata 覆盖；卡内 `Best window` / `Main issue` 等字段标签是硬编码英文，不在 ui-copy 冻结表范围内，可接受。

**0 严重 0 中等。Part 2 通过，可继续下一部分。**
