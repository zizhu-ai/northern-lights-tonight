# 数据管道一期实施报告（2026-08-23）

结论：**PASS**。冻结 Spec 的代码范围已实施，用户指定的 1–6 项验收全部通过。未创建分支，未 commit/push，未新增 npm 依赖，未执行 §3.5 ops 步骤。

## 改动文件

- `lib/snapshots.ts` — 新增 remote/bundled 并行读取、有效性检查、`generated_at` fresher-wins 选源与 `loadLatestWithMeta()`；原有导出和 freshness/UNKNOWN 逻辑保持不变。
- `app/api/snapshots/latest/route.ts` — 改为 `revalidate = 120`，增加 `X-Snapshot-Source` 和 `X-Snapshot-Generated-At` 响应头。
- `.github/workflows/refresh-aurora-snapshots.yml` — cron 改为 `7-57/10`，增加 concurrency group 与 8 分钟 job timeout。
- `审计/codex-pipeline-p1-impl-20260823.md` — 用户明确要求的本实施/验收报告（交付物例外）。

## 验收 1–6

### 1. `npm run build` — PASS

命令：`npm run build`

```text
✓ Compiled successfully in 721ms
Linting and checking validity of types ...
✓ Generating static pages (28/28)
Route (app)                                      Size  First Load JS  Revalidate  Expire
├ ○ /api/snapshots/latest                       131 B         103 kB          2m      1y
├ ● /forecast/[slug]                          1.02 kB         107 kB          2m      1y
```

补充：故障注入环境下的 `SNAPSHOT_REMOTE_BASE=https://127.0.0.1:1 npm run build` 也通过：

```text
✓ Compiled successfully in 675ms
✓ Generating static pages (28/28)
```

### 2. `next start` 首页与 Chicago — PASS

服务启动：

```text
> next start -p 3000
✓ Ready in 231ms
```

HTTP 证据：

```text
HOME_STATUS=200
CHICAGO_STATUS=200
```

### 3. 远端故障注入与 bundled fallback — PASS

启动命令：`SNAPSHOT_REMOTE_BASE=https://127.0.0.1:1 npm run start -- -p 3001`

```text
✓ Ready in 229ms
FAULT_HOME_STATUS=200
FAULT_CHICAGO_STATUS=200
x-snapshot-source: bundled
x-snapshot-generated-at: 2026-08-22T15:58:43.940055+00:00
```

请求后轮询服务 stdout/stderr 无新输出，无未捕获错误。

### 4. Boston 404 语义 — PASS

```text
BOSTON_STATUS=404
BOSTON_404_MARKER=Page not found
```

### 5. 过期 bundled 仍为 UNKNOWN — PASS

故障注入下，临时将 `snapshots/chicago.json` 的 `valid_until` 改为 `2000-01-01T00:00:00+00:00`，重建并重启后：

```text
FAULT_CHICAGO_STATUS=200
CHICAGO_UNKNOWN_COUNT=1
CHICAGO_STALE_MESSAGE_COUNT=14
```

原始 HTML 同时包含 `>UNKNOWN<` 和 `Source data is too old to treat as live.`。测试后执行 `git checkout -- snapshots/`，恢复证据：

```text
BEFORE_SHA256=1ee6871bf955b0cdf296e3d8456bda09a375b0c554e1cd38975a04f867565b3b
RESTORED_SHA256=1ee6871bf955b0cdf296e3d8456bda09a375b0c554e1cd38975a04f867565b3b
SNAPSHOT_DIFF_COUNT=0
```

### 6. 首页 SSR 标记 — PASS

`curl` 获取的首页原始 HTML：

```text
HOME_DATA_STATUS_COUNT=16
FAULT_HOME_DATA_STATUS_COUNT=16
```

正常与故障注入两种环境均含 `data-status=`。

## 补充的 Spec 核对

- fresher-wins：正常环境 API 返回 `x-snapshot-source: remote` 与 `2026-08-23T02:14:23.411437+00:00`，晚于 bundled `latest.json` 的 `2026-08-22T15:58:43.940055+00:00`。
- API：`HTTP/1.1 200 OK`，同时含 `x-robots-tag: noindex, nofollow`、`x-snapshot-source` 和 `x-snapshot-generated-at`。
- 范围：`git diff --name-only` 仅有 3 个 Spec 实施文件；`snapshots/` 无 diff；报告是明确要求的交付物。
- 进程清理：`PORT 3000 CLEAN`、`PORT 3001 CLEAN`。
- 未执行需线上/运维环境的 §5.8、§5.9 和 §3.5，符合本次边界。

## 实施备注

首次 build 曾捕获通用选源函数缺少 `generated_at` 泛型约束的 TypeScript 错误；补上最小约束后，上述最终 build 和故障注入 build 均通过。

Execution report:
- Status: complete
- Changed: `lib/snapshots.ts`, `app/api/snapshots/latest/route.ts`, `.github/workflows/refresh-aurora-snapshots.yml`, and this requested report
- Validation: acceptance items 1–6 passed; normal/fault API source headers also verified
- Scope: no implementation deviation; report is the user-requested delivery artifact exception
- Acceptance: passed
- Remaining risk: online-only deployment freshness and external scheduler checks remain for the later ops step
