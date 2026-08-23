我把 YAML、合同 §3/§8、`CODEX-HANDOFF.md`、`engine/snapshot.py` 的 TTL 段和门控规则 §10 都对照读完了。

**结论：0 严重 0 中等。Part 1 通过，可继续下一部分。**

## 红线逐条核对

| 红线 | 结果 | 依据 |
| --- | --- | --- |
| 只 push `main` | 过 | `if: github.ref == 'refs/heads/main'` + `git push origin HEAD:main`，仓库只有这一个 workflow，无第二条 snapshots 分支 |
| 每 10 分钟 + 手动 | 过 | `cron: "*/10 * * * *"` 与 `workflow_dispatch` 都在 |
| 失败可见 | 过 | 步骤无 `continue-on-error`、无 `|| true`、无输出重定向；`python3 engine/snapshot.py` 抛异常即步骤红 |
| 不提交 `engine/.cache/` | 过 | 只 `git add snapshots/`，且 `.gitignore` 已含 `engine/.cache/` |
| 含仅 `generated_at` 变化也要 commit | 过 | `snapshot.py` 每次把 `generated_at = now` 写进 15 个 slug + `latest.json`（第 676、792、795 行），`git diff --cached --quiet` 必然非空，安静夜也会提交，消息就是 `chore: refresh aurora snapshots` |
| `GITHUB_TOKEN` + `contents: write` | 过 | workflow 级 `permissions: contents: write`，checkout 用默认 token |
| 本地命令不变 | 过 | 仍是 `python3 engine/snapshot.py`，`ROOT` 由 `__file__` 推导，与 cwd 无关 |

TTL 三处一致：`engine/snapshot.py` 662–667 行 = `generated_at + 25min`，并被 `ovation.fcst + 40min` 封顶；等同 §3 第 124 行与门控规则 §10 第 268 行。引擎是纯标准库（`urllib` / `zoneinfo`），所以 YAML 不装依赖也能在 `ubuntu-latest` 跑通，这点不构成缺口。

## 两个执行者的分叉面

针对「`valid_until` 之内打开 `/forecast/colorado` 不是 `DATA_STALE`」这条验收：YAML 已经是可执行代码而不是描述，cron、TTL、commit 条件、push 目标都被写死，两个合格执行者按它跑出的产物只差 `generated_at` 的时刻。剩下唯一能让这条验收翻车的变量是页面读取快照的时机（构建期静态化 vs 请求期读文件）和 Vercel 重新部署，那属于 Part 2，本轮不判。所以本部分没有中等级分叉。

## 轻微（5 条，声明不挡，不要为这些再开一轮）

1. 没有 `concurrency` 组，也没有 push 前 `pull --rebase` 或一次重试。排队/延迟的定时运行与人工 push 撞车时会 non-fast-forward，该轮快照丢一次（会红，不静默）。
2. GitHub 定时器是 best-effort，25 分钟 TTL 只给了一次半的余量；调度延迟超过 25 分钟时验收第 316 行的「任意时刻」会瞬时不成立。这是合同自身节奏带来的，YAML 改不掉。
3. 引擎对 NOAA / Open-Meteo 抓取失败是 `print(..., stderr)` 后继续、退出码 0（744–785 行），Action 会绿着把快照降级成 `DATA_MISSING_*`。YAML 层面「失败可见」达标，整链偏安静；属既有引擎行为，本轮不动。
4. job 没有 `timeout-minutes`。38 个云点、每次 `urlopen` 超时 45 秒，最坏情况会拖到与下一轮重叠。
5. 每轮约 38 次 Open-Meteo + 2 次 NOAA，×144 轮 ≈ 5.5k 次/天，逼近免费额度一半，Wave 2 扩点前需要重新算。被限流表现为 `DATA_MISSING_WEATHER` 而非 stale，不影响本条验收。

一个事实说明（不算发现）：定时触发只在文件进入默认分支后生效，现在 workflow 还在 `feat/v1-p1-snapshot-refresh` 上，合并到 `main` 前只能靠 `workflow_dispatch` 验证，且在非 main 分支上 dispatch 会跑引擎但按设计跳过 commit。
