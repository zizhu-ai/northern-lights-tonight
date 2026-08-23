**结论：阶段 C 门闩已拆干净，single-flight / Blob / 三源独立 / 范围均对齐 spec；观测头在 `health=invalid` 且仍有 envelope 时未把 Fetched-At 置空，与 §7.4 明文冲突，1 中等，实现审计不通过。**

## 门闩 / `stale` 残留调用点（专题）

`isSnapshotFresh` **全库 0 处**（函数已从 `lib/snapshots.ts` 删除，`*.ts/tsx` 无任何引用）。不存在「`fresh ? engine : UNKNOWN`」残留。

| 位置 | 现状 | 是否门闩 |
|---|---|---|
| `components/tonight-places.tsx:39-40` `displayTonightStatus` | `return snapshot?.status ?? "UNKNOWN"` | 否。只回引擎 status，符合 §4.4 |
| `components/tonight-places.tsx:43-45` `isSiteReadingsPaused` | 15 行引擎 status 皆 `UNKNOWN` 才 paused | 否。符合 §4.4 |
| `components/tonight-places.tsx:77-88` `renderRow` | `data-status` 来自 `displayTonightStatus`；已去掉 `live && snapshot` | 否 |
| `app/page.tsx:131-145` `HomeVerdict` 正常卡 | `status={snapshot?.status ?? "UNKNOWN"}`；**不再**传 `stale` | 否。degraded 不改 `data-status` |
| `app/forecast/[slug]/page.tsx` `getForecastState` | `status: snapshot?.status ?? "UNKNOWN"`；`ForecastState` 已删 `live`/`stale` | 否 |
| `app/forecast/[slug]/page.tsx` `VerdictCard` | 已去掉 `stale={state.stale}` | 否 |
| **`app/page.tsx:111-120`** | `isSiteReadingsPaused` 时仍写 JSX 布尔 **`stale`**（即 `stale={true}`），并配 `human={copy.verdict.site_stale_human}` | **唯一调用点。** 条件是 15 地点引擎全 `UNKNOWN`，不是 25min TTL。§4.4 允许该 paused；`verdict-card` 属 §6 不改文件，只能沿用现有 `stale` prop |
| `components/verdict-card.tsx:19,46-55,70` | `stale ? "UNKNOWN" : status` 仍会改 `data-status` | **未改文件（§6 禁止碰结构）。** 阶段 C 正常/degraded 路径已不传入；只有上面 paused 会走到 |

`valid_until` 仍出现在类型与引擎序列化（`lib/snapshots.ts:20,63`；引擎 TTL），但页面层已无读取，不再当 freshness 门闩。

## 缺陷逐条

1. **`lib/live-snapshots.ts:83-99` + `app/api/snapshots/latest/route.ts:15-20` — 中等**  
   **问题：** §7.4 明文：源 `invalid` 时 `X-*-Fetched-At` 必须空，且 health 为 `invalid`。`observationFor` 在 envelope 仍在、仅 `isOvationUsable`/`isKpCovered` 失败时仍写出 `fetched_at`；route 原样拷进头。三源全断（无 envelope）路径是空的；**有 LKG/live envelope 但已 hard invalid** 的路径会带 ISO。JSON 闭集字段本身仍齐。  
   **最短修法：** route 里 `health === "invalid"` 则对应 Fetched-At 头发 `""`（JSON 可继续留 `fetched_at` 供深查）。

## 其余核对（不构成中等）

- **single-flight：** `lib/live-snapshots.ts:391-395` key 固定 `aurora-source-envelopes-v1`，`revalidate: 600`；`397-407` 模块级 `inflight` 包住 cache 调用，miss 撞车共用一个 Promise；`474` `getAuroraBundle = cache(...)` 仅请求内去重。符合 §2.3。
- **Blob：** `119-121` 无 token / 未通过 `isValidRawSourceEnvelopes` 直接 return；`114-116`/`131-133` 读失败/写失败不抛；写入的是 raw envelopes（`348-354`），不含派生 verdict。`!ovationUsable && !kpCovered` → bundled（`346`）。符合 §2.4。
- **Open-Meteo / 三源：** `aurora-sources.ts:337-343` `CLOUD_BATCH_SIZE=20` + `Promise.allSettled`，非 39 路串行；`396-401` 三源 `Promise.all` 且各自 `catch → ok:false`，OVATION 失败不挡 Kp。
- **观测头闭集：** `SnapshotSource = "live"|"lkg"|"bundled"`，`SourceHealth = "ok"|"degraded"|"invalid"`；`X-Robots-Tag: noindex, nofollow` 保留；JSON 每源含 `source_time/fetched_at/age_seconds/health/fallback_used/fingerprint`。除上条 invalid 头外，字面值闭集正确。
- **时间语义：** 健康用 `generated_at`；degraded 用 `updated_at`（源 `source_time`/`fetched_at`，`updatedAtForLocation`），未把运输 TTL 当 Updated。
- **范围：** 预计算 diff 仅 `route.ts` / `forecast/[slug]/page.tsx` / `app/page.tsx` / `tonight-places.tsx` / `lib/snapshots.ts` / `package.json`（只加 `@vercel/blob@2.8.0`）+ 允许新增的 `lib/aurora-sources.ts`、`lib/live-snapshots.ts`。workflow / noindex / `robots.ts` / `ui-copy.json` / CSS / `verdict-card.tsx` 结构均未出现在该 diff。

**轻微（不挡，不必为本轮再送审）：** bundled 决议被放进 raw `unstable_cache`，600s 内不再用当前 `now` 重跑 `sanitizeBundledBundle`；`fetchCloud` 未把 Blob 上一份 envelope 传入 conditional GET；`loadLatestWithMeta` 仍 `as unknown as SnapshotBundle`。

未写「0 严重 0 中等，实现审计通过。」——现为 **0 严重 1 中等**。修第 1 条后可再送实现审计第 2 轮。
