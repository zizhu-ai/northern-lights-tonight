你是本仓库的高级工程师。任务分两个阶段。**本轮只做阶段一：写实施简报，写完立即停止，不写任何产品代码。**

# 背景（先全部读完再动笔）

- 仓库：`产品-northern lights tonight`（Next.js 15，极光预报站，线上 https://aurora-tonight.com）。
- 一期已上线（PR #8）：页面 ISR 渲染时 remote-first 读快照（`lib/snapshots.ts`），不再依赖部署。见 `设计简报增补｜数据管道一期-20260823.md`。
- 二期的设计依据是这份独立架构复核报告：**`审计/codex-pipeline-options-20260823.md`**，特别是 §四（目标数据流、文件级改动建议、UNKNOWN 三层语义）、§五（配额）、§六（验证方法）、§七（额外的雷）。它是一期简报之外你最重要的输入，逐节读。
- 一期遗留的结构性问题（二期要解决的）：GitHub Actions 仍是唯一数据生产者（调度会停）；`valid_until = generated_at + 25min` 一刀切；engine 抓数失败也正常退出（success ≠ 健康）；每天 ~144 次 commit+deploy；`engine/snapshot.py` 约 800 行 Python 与页面 TS 之间的合同无运行时校验（`cloud_block` 已漂移：`"socked"` vs TS 声明的 `"unknown"`）。

# 阶段一：写二期实施简报

交付方式：**把简报全文作为你的最终回答直接打印到 stdout**（编排者负责落盘为 `设计简报增补｜数据管道二期-20260823.md`）。禁止使用 Write/Edit 工具。用中文写，代码标识符保持英文。结构要求：

1. **目标与非目标**。非目标里明确：不改视觉/文案/路由结构；不动 noindex（上线 gate 另议）；不引入新调度器依赖。
2. **数据流设计**：请求驱动 —— ISR 页面 render 时经 `getAuroraBundle()`（全站单一缓存 key，10 分钟）拉原始上游（OVATION/Kp/Open-Meteo）并用当前 `now` 重算 15 个地点；成功则持久化 last-known-good 到 Vercel Blob；失败则在各源硬限内降级。写清 single-flight/防击穿怎么做。
3. **Python → TS 迁移计划**：先把 `engine/snapshot.py` 拆成 fetch 与 pure compute；用固定原始 fixtures 建 golden tests 锁定 Python 当前输出；再把纯计算迁到 `lib/aurora-engine/` TS，逐 fixture 对齐后切流、退役 Python producer。列出 fixture 覆盖的场景（含跨日、DST、best window 已过、各源缺失）。
4. **按源分级 freshness**：废掉 25min 一刀切。OVATION 沿用现有 45/90 分钟规则；Kp 记录 `fetched_at`/fingerprint 并校验今晚所需 3 小时 slots 仍存在；云量是对今晚的预报，不按 25 分钟作废，超硬限按 `DATA_MISSING_WEATHER` 语义处理（aurora 明确到不了仍可 NO，否则封顶 MAYBE/低 confidence）。
5. **UNKNOWN 新语义**：refresh target（10min，软）/ degraded（last-known-good + 降 confidence + 显示真实 source age）/ hard invalidity（按源硬限）。明确「旧 GO 不得越过安全边界」。
6. **改动文件清单**：逐个文件列出。允许新增依赖仅限 `@vercel/blob`；其余零新增。
7. **验收标准**：逐条可机械判定。吸取一期审计教训：写单侧判定（如「A 不早于 B 超过 X 分钟」而非「之差」）；写清观测入口（API 头/字段）；parity 验收必须覆盖 15 个地点的 status/confidence/reason_codes/best_window 全字段对齐；包含「不产生 snapshot commit/新部署的情况下 `/api/snapshots/latest` 的 generated_at 持续前进 60 分钟」这条核心验收；包含断源故障注入演练（>90 分钟）的通过条件。
8. **上线与回滚**：灰度顺序（先 preview 环境验证 parity 和断源演练，再上生产）、workflow 退役时机、回滚 = revert + 重启一期 workflow。
9. **风险与开放问题**：如实列（Open-Meteo 非商业条款、Vercel Hobby 商业条款、KV vs Blob 选择及理由）。

在简报最后单独一行写：`简报完成，等待审计。本轮不写代码。`

# 硬约束

- 本轮只产出简报文本（stdout）。禁止改任何文件、禁止 commit/push。
- 不要发明 codex 报告里没有的方向；有分歧就在简报「风险与开放问题」里摆出来，不要擅自二选一。
