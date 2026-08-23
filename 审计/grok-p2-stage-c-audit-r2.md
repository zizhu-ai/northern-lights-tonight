只核销上轮那条中等：对照 `/tmp/p2-stage-c-r2.diff` 看三源头是否都置空、有没有带出新的 S/M。**结论：上轮唯一中等已核销；`fetchedAtHeader()` 覆盖 OVATION / Kp / Cloud 三源，`health==="invalid"` 时 Fetched-At 为空串，JSON 与 health 头未改，无新的严重/中等。**

1. **`app/api/snapshots/latest/route.ts:6-13,24-26` — 核销通过**  
   三源均走同一辅助函数：`X-Ovation-Fetched-At` / `X-Kp-Fetched-At` / `X-Cloud-Fetched-At`。`health === "invalid"` 返回 `""`，否则 `fetched_at ?? ""`。有 envelope 但已 hard invalid 的路径不再把 ISO 打进头。

2. **未引入新的严重/中等**  
   响应 JSON 仍是完整 `data`（`fetched_at` 可留作深查，与上轮最短修法一致）。`X-*-Health`、`X-Robots-Tag`、`revalidate = 600`、source/fallback 头未改。补丁只动允许清单内的 `route.ts`，不碰门闩、Blob、single-flight、页面 `data-status`。

**0 严重 0 中等，实现审计通过。**
