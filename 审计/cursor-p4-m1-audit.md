核完了，四个检查点全部落地。

**status 降级** — `displayStatus` 是唯一出口，快照缺失或 `isSnapshotFresh` 为 false 时一律返回 `UNKNOWN`：

```65:68:components/tonight-places.tsx
function displayStatus(snapshot: SnapshotRow | null): SnapshotRow["status"] {
  if (!snapshot || !isSnapshotFresh(snapshot)) return "UNKNOWN";
  return snapshot.status;
}
```

**窗口降级** — `renderRow` 里 `live` 为假就直接给 `—`，不会调用 `formatWindow` 渲染过期时间；同时 `data-status` 用的也是降级后的值，样式与文案不会打架：

```71:75:components/tonight-places.tsx
  const live = snapshot ? isSnapshotFresh(snapshot) : false;
  const status = displayStatus(snapshot);
  const window = live && snapshot
    ? formatWindow(snapshot.best_window_start, snapshot.best_window_end, dossier.timezone)
    : "—";
```

**分组** — 第 43 行按 `displayStatus(row.snapshot)` 匹配分组，不是原始 `snapshot.status`，过期行会落进 UNKNOWN 组。

**排序** — 第 58–59 行两侧都走 `displayStatus` 再取 `STATUS_ORDER.indexOf`，过期行排到末尾。

新鲜度判定本身也没有漏洞：`isSnapshotFresh` 在 `valid_until` 缺失时返回 false，`Date.parse` 失败时靠 `Number.isFinite` 兜住，不会把无效时间戳当成新鲜。

结论：0 严重 0 中等。Part 4 通过，可继续下一部分。
