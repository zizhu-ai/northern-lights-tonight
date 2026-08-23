**0 严重 / 0 中等 / 3 轻微。** 阶段 A 的 fetch/compute 拆分、14 案 goldens、§7.2 字段（含 `answer_sentence`）与「compute 无 IO」合同成立；成功路径未见门控/时区/排序被顺手改掉。

---

1. **`engine/snapshot.py:107-112`**  
   **问题：** `fetch_sources` 在拉 OVATION 后立刻 `parse_ovation`，且 `obs is None` 时把 `ovation_raw` 置 `None` 再记错误。拆分前是 fetch 成功即把 raw 交给后续 parse；`obs` 缺失时仍可能带着 `grid` 进入 `snapshot_location`（`ovation_ok=False`）。happy 路径字节不受影响，异常路径与拆分前不完全同构。  
   **级别：** 轻微（非上线漂移；两名维护者会把「校验失败」放在 fetch 还是 compute）。  
   **最短修法：** fetch 只捕获 IO/`json.loads`/非 list 的 Kp；`obs` 缺失与畸形 payload 交给现有 `compute_bundle` 分支。

2. **`engine/test_compute.py:113-129`、`131-135`**  
   **问题：** `happy_fresh`/`best_window_elapsed` 只断言 raw 逐字节相同且 `(status, best_window_*)` 三元组不相等，未断言 §7.3「`best_window_end` 为 null 或不晚于新 `now` 的窗不得当 best、顶层不得仍为已过 GO」。`ovation_age_46m/91m` 只断言 `ovation_ok`，未点名 §3.3 的 45min confidence 上限。14 案全量 `assertEqual` 仍锁字段，语义闩偏弱。  
   **级别：** 轻微（金标全量比较已覆盖输出；缺的是场景意图断言）。  
   **最短修法：** elapsed 对每个 slug 断言 `best_window_end is None` 或严格晚于该 case `now`；46m 另断言 headline `confidence != "high"`。

3. **`engine/regenerate_fixtures.py:26`、`engine/fixtures/best_window_elapsed/case.json:3`**  
   **问题：** elapsed 的 `now` 为 `2026-08-22T18:00:00+00:00`（相对 `happy_fresh` 约 39h 后的下午）。与 happy 同一份 OVATION raw 时，该 `now` 必然 `ovation_stale_90`，且 `night_slots` 会跳到下一夜，而不是「同一夜、原 GO 窗已结束、rollup 只留未结束窗」。字面仍满足「同一 raw、两份 now、结果必须变」。  
   **级别：** 轻微（不与 §3.3 字面冲突；构造过宽，后续 TS parity 可能靠过期 OVATION 混过）。  
   **最短修法：** 把 elapsed 的 `now` 推到原 GO `end` 之后、仍落在同一夜剩余 slots 内（OVATION 仍 ≤90min）。

---

对照合同（无单独开单）：`fetch_sources` 对 OVATION/Kp 独立 `try`；`compute_bundle` 不读网、不写文件、不读 `engine/.cache`；源失败仍 `write_bundle` 后非零退出；§3.3 十四案目录与 `CASES` 一致；`test_happy_and_elapsed_share_raw` 锁同一 raw；`assertEqual` 含 `answer_sentence` 及 §7.2 的 points/windows 字段；`regenerate_expected` 只写 `expected/`，`--initialize` 在 `fixtures/` 已存在时拒绝覆盖 raw；`snapshot.py` 的 `classify_window`/`rollup`/`night_slots`/`snapshot_location` 不在 diff 内。用户已复跑的 18 tests OK 与 `snapshots/` 干净两条，本审计未再跑。拆分前后字节 diff=0 与 offline 写 `/tmp` 无法在仅有拆分后代码下复现，与当前 `main()` 成功路径结构自洽。

**0 严重 0 中等，实现审计通过。**
