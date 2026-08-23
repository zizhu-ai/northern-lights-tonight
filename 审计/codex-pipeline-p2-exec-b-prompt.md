你是本仓库的执行工程师。已冻结的二期实施简报 `设计简报增补｜数据管道二期-20260823.md`（交叉审计定稿）是最高依据。**本任务只做阶段 B：把纯计算引擎迁到 TypeScript 并与 Python goldens 对齐。不切流、不改运行时读取路径。**

阶段 A 已完成并通过实现审计：`engine/snapshot.py` 已拆出纯 `compute_bundle(now, ovation_envelope, kp_envelope, cloud_envelopes, dossiers)`；`engine/fixtures/` 14 案 goldens（raw + expected）已录入；`python3 -m unittest engine.test_compute` 18 绿。

# 阶段 B 范围（按简报 §3.4 第 1–2 步）

1. **新建 `lib/aurora-engine/`**：把 Python compute 迁为纯 TS（无 IO）。覆盖简报点名的全部：astro（太阳高度/月亮）、`ovation_at`/`ovation_reach`、`kp_at`/`kp_reach`、`cloud_block_at`（继续输出 `"socked"`）、`classify_window`、`rollup`、`apply_midlat_confidence`、`night_slots`、`snapshot_point`/`snapshot_location`、`_answer` 与序列化。行为以 Python goldens 为准，**禁止「顺手修好」任何 quirks**（含 DST、排序、`answer_sentence` 字符串格式，简报 §9.11）。
2. **Parity 测试**：零新依赖。用 Node 22 已支持的 type-stripping（`node --experimental-strip-types`）或现有 `tsc` 编译后跑 `node:test`——二选一，禁止新增 jest/vitest/tsx 等任何包。读 `engine/fixtures/` 的同一批 case，调 TS engine，按简报 §7.2 字段清单 + `answer_sentence`（执行备注 5）逐字段比对 15 地点。
3. **已知陷阱（阶段A审计轻微3）**：`best_window_elapsed` 的 `now` 离 raw 约 39h，OVATION 必然 stale_90——parity 通过不得依赖「两边都过期」混过；实现时确认该 case 下 TS 与 Python 走同一条过期路径，逐字段一致即可，不要为它改 fixture（fixture 已冻结）。

# 硬约束

- **不改** `lib/snapshots.ts`、`app/`、`components/`、`engine/`、`snapshots/`、workflow、`package.json`（本阶段零依赖新增）。只允许新增 `lib/aurora-engine/**` 和 parity 测试文件（放 `lib/aurora-engine/*.test.ts` 或 `scripts/aurora-engine-parity.mjs`）。
- 禁止 commit/push/建分支。文件随写随落盘。
- 页面/运行时不许 import `lib/aurora-engine`（切流是阶段 C）。
- 本机 `next dev` 拉不动 Google Fonts，与本阶段无关；本阶段不需要起 next 服务。

# 自验（必须真实跑，贴证据）

1. parity 全绿：14 case × 15 地点全字段，贴 runner 输出（含每 case 通过计数）。
2. `npm run build` 仍 0 退出（新目录被 tsc 收编后不得破坏构建；若 parity 用 type-stripping 与 tsc 冲突，解决冲突并把方法写进报告）。
3. `git status --short` 中除 `lib/aurora-engine/`、parity 脚本、`tsconfig.tsbuildinfo` 外无其他改动。

# 交付

执行报告**直接打印到 stdout 作为最终回答**：新增文件清单、parity 方法与输出摘录、遇到的 Python↔TS 语义坑（浮点/时区/字符串格式）及对应处理、`npm run build` 结果。最后单独一行 `阶段B完成` 或 `阶段B未完成：<原因>`。
