## Part 4 审计结论

**0 严重，1 中等。** 不能直接通过，`components/tonight-places.tsx` 需先修。

### M1 — `/` 与 Where 的今晚榜不判过期，会把过期快照当 live 展示

`TonightPlaces` 直接读 `latest.json` 的 `status` / 窗口渲染，从不看每行的 `valid_until`，也没用 `isSnapshotFresh`：

```23:33:components/tonight-places.tsx
export async function TonightPlaces({ grouped = false }: TonightPlacesProps) {
  const latest = await loadLatest();
  const rows = WAVE_ONE_SLUGS.map((slug): TonightRow | null => {
```

`lib/snapshots.ts` 里 `SnapshotBundle.locations` 的类型甚至没声明 `valid_until`，但 `snapshots/latest.json` 每行都有该字段（colorado 行 `valid_until: 2026-08-20T01:18:00+00:00`）。

现有构建产物就能复现矛盾：同一次构建里，`/` 的 Alaska 行是 `data-status="go">GO`、窗口 `12:45 AM–2:45 AM AKT`，而 `/forecast/alaska` 已经是 `UNKNOWN` + `Source data is too old to treat as live.`。主词枢纽在向用户承诺一个钱页自己都否认的 GO，违反合同 §3 冻结行为 6（`now > valid_until` → UNKNOWN + DATA_STALE）与 §7「过期快照：UNKNOWN，不要假装 live」。Where 上半榜用同一组件，同病。

修法：在 `renderRow` 前按行做 `Date.parse(row.valid_until) >= now` 判定，过期行降级为 `UNKNOWN` + `—`，与 forecast 页 `state.live` 口径一致。

### 五项核对（除 M1 外均通过）

1. **首页**：Title 为 `Northern Lights Tonight: US City and State Aurora Forecast`，无 Live/Near You（`app/page.tsx:10`，构建产物 `<title>` 一致）；`force-static`，全站无 `headers()` / `x-forwarded-for` / IP 地理；`geolocation` 只在 `find-place.tsx:85`、`place-search-form.tsx:55` 的点击回调里；15 行全在预渲染 HTML（`index.html` 中 `/forecast/*` 链接去重后正好 15 条）。通过。
2. **`/near-me`**：H1 `Northern Lights Near Me`、Title 合同一致（`app/near-me/page.tsx:11,20`）；提交走 `router.push` 到 `/forecast/[slug]` 或 `/view`（`place-search-form.tsx:31-45`），本页不渲染任何结论；`near-me.html` 里 grep 不到 `GO/MAYBE/UNKNOWN/verdict-card`。通过。
3. **`/view`**：只渲染 `UNKNOWN`，全程不读 `snapshots/`、不调引擎（`app/view/page.tsx:54-62`）；`lat < 0` → `UNAVAILABLE` + `copy.south.*`，不 404、无小时轴（`:42,56,64-65`）；`robots: { index: false, follow: true }`（`:35`）；壳由 root layout 提供 Tonight / Near me / Guides + 页脚。通过。
4. **Where**：上半 `TonightPlaces grouped` 出 `<h2>GO/MAYBE/NO</h2>` 分组，行链 forecast；下半只取 frontmatter 之后正文（`page.tsx:47`），构建产物里 `do_not_render` / `tonight_list` / `Implementation:` 命中数为 0。分组与正文结构通过（数据新鲜度问题见 M1）。
5. **robots**：`app/robots.ts` 为 `User-Agent: * / Disallow: /`，`sitemap: undefined`，构建产物 `robots.txt.body` 一致。通过。

### 轻微（4 条，不挡）

- `STATUS_ORDER` 含 `UNKNOWN`，Where 可能多出一个合同未列的 `UNKNOWN` 分组标题（`tonight-places.tsx:21`）；空组已省略，可接受。
- `/view` 缺参或参数非法时回落到 `lat=0,lng=0`，H1 变成 `Tonight near 0.000, 0.000`（`app/view/page.tsx:91-98`），不算违约但可给一句更好的兜底。
- `/forecast/boston` 因 `dynamicParams = false` 命中静态 `_not-found.html`，初始 HTML 是 `not_found.generic`；Boston 专属文案与 Massachusetts 链接靠 `usePathname` 在 hydration 后才出现（`components/not-found-content.tsx:13`）。无 JS 时看不到，且可能有 hydration 警告。
- `lib/snapshots.ts` 的 `SnapshotRow` 类型漏了 `valid_until` / `generated_at`，是 M1 能悄悄溜过类型检查的原因，修 M1 时一并补。

未改动任何文件。
