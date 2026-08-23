对照冻结 spec 做只读实现审计。先读 skill 约定，再并行打开 spec、diff、改动全文和实现者自验报告。接下来对照 spec 读三份被改全文，并核对调用方与 ISR 相关行为。已核对选源分支、ENOENT 契约、ISR 叠加和自验证据链。下面是只读实现审计报告。

---

**0 严重 / 0 中等 / 3 轻微。**

对照冻结 spec（§3.2–3.4、§3.6、§4、§5.1–5.6）与 `/tmp/pipeline-p1.diff`：三文件改动落在清单内；选源规则 1–4、fresher-wins（`>=` → 相等用 remote）、remote 全失败吞成 `null`、bundled `ENOENT` 原样抛出、`loadForecastSnapshot` 的 `null` 契约、API `revalidate = 120` + 两个观测头 + `loadLatestWithMeta`、workflow cron/concurrency/timeout 均与 spec 一致。`isSnapshotFresh` 未改。未发现会把错误数据/错误状态送上线、或让合格实现栽在 §5.1–5.6 上的缺陷。

---

### 轻微

**1.** `lib/snapshots.ts:79-80`（交互：未改的 `app/page.tsx` `revalidate = 600`、`app/forecast/[slug]/page.tsx:61`）

**问题：** spec §3.6 的心智模型是「页面 ISR 600s + `fetch next.revalidate` 120s」叠 raw CDN ≈5min，最坏约 17 分钟。Next.js 15 对同一路由取 **min(segment revalidate, fetch revalidate)**。实现者自验里的 `next build` 已打印 `/forecast/[slug]` 与 `/api/snapshots/latest` 的 Revalidate 为 **2m**，不是 10m。页面源码仍写着 600，运行时 ISR 被压成 120s。

**为何是轻微：** 与 §3.6 的叠加叙述不完全同构，但方向是更勤刷新，不会送出更旧/错误快照，也不会让 §5.1–5.6 失败。实现按 §3.2 字面写了 `next: { revalidate: 120 }`，且未改页面文件，符合 §4。

**最短修法：** 不改。若运维上必须钉死页面 600s，才把 remote `fetch` 放进 `unstable_cache(..., { revalidate: 120 })` 并去掉 fetch 自己的 `next.revalidate`（那会偏离 §3.2 的字面 API）。

---

**2.** `lib/snapshots.ts:96-100`、`lib/snapshots.ts:124`（调用方 `loadForecastSnapshot`：`150-160`）

**问题：** bundled 与 remote 共用同一 `validate`。bundled 文件存在但缺/无法 `Date.parse` 的 `generated_at`（或 `latest.json` 的 `locations` 非数组）时，`readBundledSnapshot` 抛 generic `Error`，不是 `ENOENT`。remote 再不可用时：`loadLatest` 抛错；`loadForecastSnapshot` 不会收成 `null`，而是 500。spec 规则 1 写的是 remote 无效 → **用 bundled**；规则 3 的 `null` 契约只覆盖 ENOENT。

**为何是轻微：** 引擎写入的 bundled 必有合法 `generated_at` + `locations` 数组；§5 用的 chicago/latest 都过校验。两个维护者只在「损坏的 bundled」这条未写明路径上才会写出「当 fallback 用」vs「当硬错误抛」。

**最短修法：** bundled 校验失败当成 `bundledData = null`，**只有** `readFile` 的 `ENOENT` 再 `throw`。非本期必需。

---

**3.** 实现者报告「补充核对」段 vs spec §5.3（代码：`lib/snapshots.ts:114-122`）

**问题：** §5.3 要求改本地 `snapshots/latest.json` 的 `generated_at` 为更旧，起服务后首页 `Updated` 仍跟 remote。自验没有改 bundled，只用「当前 remote 时间戳晚于 bundled + `X-Snapshot-Source: remote`」代替。未覆盖「bundled 更新 → 应选 bundled」侧。

**为何是轻微：** 这是验收证据不完整，不是实现 bug。代码确有 `Date.parse(remote) >= Date.parse(bundled)`，相等走 remote，否则走 bundled；与规则 2 一致。合格实现按 §5.3 原文跑应当 PASS。

**最短修法：** 补一次把 bundled `generated_at` 拨旧（再拨新）看首页 `Updated` / API 头。不改产品代码。

---

### 范围核对（不记缺陷）

| 项 | 结果 |
| --- | --- |
| §3.2 规则 1 | `fetchSnapshot` 非 2xx / 超时 / `json()` 失败 / `generated_at` 非法 → `null` → 用 bundled |
| §3.2 规则 2 | `>=`，相等 remote |
| §3.2 规则 3–4 | `Promise.allSettled`；`fetchSnapshot` 不 reject（失败即 `null`）；bundled `ENOENT` 原样 throw；`loadForecastSnapshot` 只把 `code === "ENOENT"` 收成 `null` |
| `loadLatest` `locations` | `isSnapshotBundle`：`Array.isArray(locations)` |
| `isSnapshotFresh` | diff 未碰 |
| §3.3 | 去掉 `force-static`；`export const revalidate = 120`；`X-Snapshot-Source` / `X-Snapshot-Generated-At`；`loadLatest()` 签名不变 |
| §3.4 | cron `7-57/10 * * * *`；workflow 级 `concurrency.group` + `cancel-in-progress: false`；`timeout-minutes: 8`；其余步骤未改 |
| §4 | diff 仅三文件；`审计/codex-pipeline-p1-impl-20260823.md` 是交付物，不在产品 diff 里 |
| §3.5 / §5.7–5.9 | 本期非代码，自验标明未跑，符合边界 |
| `Promise.allSettled` | remote 实际只有 fulfilled+value / fulfilled+null；bundled 只有 fulfilled+data / rejected。缺 bundled 且 remote 有效时仍能选 remote（若用 `Promise.all` 会在 ENOENT 上把 remote 一起丢掉） |
| YAML | 结构合法：`on` / `concurrency` / `permissions` / `jobs.refresh` |

### §5.1–5.6 证据 vs 代码

| 条 | 自验 | 与代码 |
| --- | --- | --- |
| 5.1 build + 首页/Chicago | PASS | 入口未改，bundled 可兜底 |
| 5.2 故障注入 200 + bundled | PASS（API 头 `bundled`） | `SNAPSHOT_REMOTE_BASE` + `catch → null` |
| 5.3 fresher-wins | 弱替代（见轻微 3） | 比较逻辑在 |
| 5.4 Boston 404 | PASS | `app/forecast/boston/page.tsx` 恒 `notFound()`（spec 执行备注 1） |
| 5.5 过期 bundled → UNKNOWN | PASS 且 sha256 还原 | `isSnapshotFresh` 未改 |
| 5.6 首页 HTML `data-status=` | PASS（16 处，含故障注入） | 页面未改 |

---

**0 严重 0 中等，实现审计通过。**
