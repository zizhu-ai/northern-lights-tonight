你是本仓库的执行工程师。已冻结的二期实施简报 `设计简报增补｜数据管道二期-20260823.md` 是最高依据。**本任务是阶段 C：运行时接线。** 阶段 A（Python 拆分 + fixtures）、阶段 B（`lib/aurora-engine/` TS 引擎 + parity 15/15）已完成并通过审计。

# 阶段 C 范围（简报 §2、§4.4、§6 修改表）

1. **新增 `lib/aurora-sources.ts`**（§2.2）：OVATION / Kp / Open-Meteo 独立 fetch、独立失败；timeout + 有界 retry + jitter；User-Agent；conditional GET（ETag/Last-Modified）；内容 fingerprint；手写运行时 schema 校验（零新依赖）；每源记录 `fetched_at` 与 coverage。Open-Meteo 用 multi-coordinate/batch 或有限并发，**禁止 39 路串行**。
2. **新增 `lib/live-snapshots.ts`**（§2.2/§2.3）：`getSourceEnvelopes()` 用 `unstable_cache`（key 固定 `aurora-source-envelopes-v1`，revalidate 600）+ 模块级 inflight Promise 防击穿；`getAuroraBundle()` 用 React `cache()` 包请求内去重，调用 `lib/aurora-engine` 用当前 `now` 重算 15 地点。Blob LKG：成功且校验通过才写（`@vercel/blob`，`BLOB_READ_WRITE_TOKEN` 缺失时不得崩，直接走无 LKG 路径）；失败读 LKG 并标 `fallback_used`；都不行才读 bundled `snapshots/`（仍受硬限约束，禁止「来自 Git 就永久 live」）。
3. **改 `lib/snapshots.ts`**（§6 + §4.4）：门面三函数改读 `getAuroraBundle()`；`cloud_block` 类型改为 `"clear"|"mixed"|"socked"|null`；`loadLatestWithMeta().source` 闭集字面 `live|lkg|bundled`；`isSnapshotFresh` 不得再影响任何卡片 status（按 §4.4 处理调用方）；保留 `formatUpdatedAt`/`formatWindow`。
4. **改 `app/page.tsx` / `app/forecast/[slug]/page.tsx` / `components/tonight-places.tsx`**（§4.4/§6）：去掉 25min `valid_until` 强制 UNKNOWN 与 `live`/`stale` 门闩；`displayTonightStatus` 只返回引擎 status；paused 仅当 15 个引擎 status 皆 UNKNOWN；degraded 时 Updated 只改 `formatUpdatedAt` 的时间输入为真实 source/fetched 时间，不改文案模板、不改 `data-status`、不改卡片结构。**noindex/robots/metadata 一律不碰。**
5. **改 `app/api/snapshots/latest/route.ts`**（§7.4）：读同一 bundle；`revalidate = 600`；响应头闭集与每源头（X-Snapshot-Generated-At / X-Snapshot-Source: live|lkg|bundled / X-Aurora-Fallback-Used / X-Ovation-Fetched-At / X-Kp-Fetched-At / X-Cloud-Fetched-At / X-Ovation-Health / X-Kp-Health / X-Cloud-Health: ok|degraded|invalid）；JSON 增加每源 `source_time/fetched_at/age_seconds/health/fallback_used/fingerprint`；保留 X-Robots-Tag。
6. **`package.json`/`package-lock.json`**：只加 `@vercel/blob`。可加一个跑 goldens 的 npm script（脚本本身零新依赖）。
7. **不改**：workflow（退役在阶段 E，验收通过前不动）、`content/ui-copy.json`、CSS、guides、`/view`、near-me、`SNAPSHOT_REMOTE_BASE`（留作故障注入）。

# 硬约束

- 禁止 commit/push/建分支。文件随写随落盘。
- 本机 next dev 拉不动 Google Fonts；验证一律 `npm run build && next start`。
- 杀起的服务进程：`lsof -tnP -iTCP:<port> -sTCP:LISTEN | xargs kill`。
- 已知本地测试坑（一期实测）：Next 15 会把运行时重验证的路由响应回写 `.next/server/app/**`，ISR 120s 新鲜窗内不触发再生——换场景测试时必须 `rm -rf .next/cache` 且删掉对应 `.next/server/app/api/snapshots/latest.body/.meta` 再起服务，请求用「连打两次、取第二次」。

# 自验（对应简报 §7.1/7.4/7.6/7.7，必须真实跑并贴证据）

1. `npm run build` 退出 0；`next start` 后 `/`、`/forecast/chicago`、`/forecast/alaska`、`/forecast/fairbanks` 均 200，`/forecast/boston` 404；首页与 forecast 原始 HTML 含 `data-status=` 与 verdict 文本。
2. `node --experimental-strip-types --test lib/aurora-engine/parity.test.ts` 与 `python3 -m unittest engine.test_compute` 仍全绿。
3. §7.4 观测头逐个 curl 验证（live 路径，本机有网）。
4. §7.7 故障注入：用 `SNAPSHOT_REMOTE_BASE` 之外的方式把三源打到不可达（如给 aurora-sources 加仅测试用的 env 覆盖 host，或 /etc/hosts 级别的注入由你选最小方案；若你为测试加了 env 开关，写进报告）。无 Blob token 时应落到 bundled 且页面 200、不全站 UNKNOWN 打穿、不 500。预置 LKG 的场景本地没有 Blob token 做不了的话，如实标注「preview 待验」，不要伪造。
5. §7.6 同源：同一进程内首页 Fairbanks 行与 `/forecast/fairbanks` 与 API `locations[]` 的 status/best_window 一致。
6. `git status --short` 范围核对：只允许 §6 清单内文件 + `lib/` 新文件 + package 两个文件。

# 交付

执行报告**直接打印到 stdout**：文件清单与用途、§7.1/7.4/7.6/7.7 逐条 PASS/FAIL 与证据、取舍与已知偏差。最后单独一行 `阶段C完成` 或 `阶段C未完成：<原因>`。
