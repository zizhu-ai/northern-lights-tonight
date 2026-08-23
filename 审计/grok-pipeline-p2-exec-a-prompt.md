你是本仓库的执行工程师。已冻结的二期实施简报 `设计简报增补｜数据管道二期-20260823.md`（交叉审计 0S/0M 定稿）是最高依据。**本任务只做阶段 A：Python 侧拆分 + golden fixtures。不碰任何 TypeScript，不碰 app/、lib/、components/、workflow。**

# 阶段 A 范围（严格按简报 §3.1–§3.3）

1. **拆 `engine/snapshot.py`**（可拆成多个文件，但 CLI 入口保持 `python3 engine/snapshot.py`）：
   - fetch 与 pure compute 分离。compute 主函数签名等价于 `compute_bundle(now, ovation_envelope, kp_envelope, cloud_envelopes, dossiers) -> bundle`：不读网、不写文件、不读 `engine/.cache`。
   - OVATION 与 Kp 改**独立 try**（现状是同一个 try，OVATION 失败 Kp 不拉）。
   - fetch 失败如实记录；CLI 退出码：有源失败 → 非零（简报 §3.1）。workflow 对非零退出的处理不在本阶段改。
   - CLI `main()`：fetch → compute → 写 `snapshots/`，产出与拆分前逐字段一致。`--offline` 保留（读 cache，供 fixture 再生）。
2. **Golden fixtures**（简报 §3.2/§3.3）：目录 `engine/fixtures/<case>/`，每 case 固定 `now` + raw OVATION/Kp/Open-Meteo（39 点）+ `expected/latest.json` 与 `expected/<slug>.json`（由拆分后的 Python compute 生成，一经录入手改禁止）。最低 14 个 case 见简报 §3.3 表格，一个不能少；`happy_fresh` 与 `best_window_elapsed` 必须同一份 raw 两份 now。
3. **`engine/test_compute.py`**（stdlib `unittest`）：对每个 case 调 compute 与 expected 逐字段比对（15 地点全字段，字段清单见简报 §7.2 + 执行备注 5 补 `answer_sentence`）。
4. **`engine/README.md`** 更新为拆分后的结构与「fixture 再生方法」。

# 行为纪律

- **拆分不得改变任何输出**：goldens 锁的是拆分前 Python 的当前输出（含已有的 quirks，如 `cloud_block: "socked"`）。禁止「顺手修好」任何门控逻辑。先为拆分前代码生成基线输出，拆分后证明逐字节一致，再录入 fixtures。
- 简报「执行备注」5 条已知悉。
- 禁止 commit/push/建分支。禁止改 `snapshots/` 现有文件（fixtures 放 `engine/fixtures/`， regenerate 时才允许重跑 CLI 验证写出一致，但最终 `git status snapshots/` 必须干净）。
- 文件随写随落盘，不要攒到最后一次性写。

# 自验（必须真实跑，报告贴证据）

1. `python3 engine/snapshot.py --offline`（或等价路径）跑通。
2. `python3 -m unittest engine/test_compute.py -v` 全绿，贴结尾统计。
3. 拆分前后对同一份 cache 输入的 `snapshots/latest.json` 逐字节 diff 为空（方法自选，贴命令与结果）。
4. `git status --short` 中 `snapshots/` 无改动。

# 交付

完整执行报告**直接打印到 stdout 作为最终回答**（不要用 Write 写报告文件）：改动文件清单 + 每条的用途、fixture case 清单、自验 1–4 的证据摘录、遇到的问题与取舍。最后单独一行写 `阶段A完成` 或 `阶段A未完成：<原因>`。
