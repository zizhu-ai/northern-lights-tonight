# Aurora 数据管线可靠性审计

**日期：**2026-08-23  
**角色：**独立架构复核  
**结论：**选 **option 1（解耦 deploy 与 data）**，但不是只把同一个 GitHub cron 的产物换个地方存。建议改成“**服务器端统一缓存原始上游数据 + ISR 使用当前时间重算全站 snapshot bundle + last-known-good 降级**”。同时吸收 option 2 中正确的部分：失效判定必须按 OVATION、Kp、cloud 各自的时间语义，不再用 `generated_at + 25 min` 一刀切。

## 一、代码核实与事实修正

### 1. 当前数据流确实是“一次数据更新 = 一次代码发布”

- `.github/workflows/refresh-aurora-snapshots.yml:3-38` 以 `*/10 * * * *` 调度，运行 `python3 engine/snapshot.py`，然后把 `snapshots/` commit 并 push 到 `main`。没有 `concurrency`、timeout、retry 或健康门禁。
- `engine/snapshot.py:785-798` 写入 15 个 location JSON 和 `latest.json`；当前仓库共 16 个 snapshot JSON。
- `lib/snapshots.ts:62-80` 不是 TypeScript 静态 `import` JSON，而是在 build/ISR render 时用 `readFile(process.cwd()/snapshots/...)` 读文件。但 Vercel 某一 deployment 的文件系统是那次构建的产物，所以运行效果上仍然是“数据被烘进 deployment”；ISR 不会看到之后 Git 上的新 JSON。
- `app/page.tsx:24-25` 和 `app/forecast/[slug]/page.tsx:59-64` 都是 `force-static` + `revalidate = 600`。首页从 `latest.json` 取数，location 页从单个 JSON 取数。verdict 确实在 Server Component 渲染的 HTML 中，不依赖客户端 JavaScript。严格说“每个页面都显示 verdict”不准确：本次代码路径覆盖的是首页和 15 个 forecast pages，guides/methodology 等静态页不走这个 verdict 读取路径。

### 2. 25 分钟语义的准确描述

- `engine/snapshot.py:25-26, 664-675` 把 `valid_until` 设为脚本运行时间 `generated_at + 25 min`。这是传输/运维 TTL，不是上游产品本身的有效期。
- `lib/snapshots.ts:83-90` 只看 `valid_until`。location 页在 `app/forecast/[slug]/page.tsx:227-253` 将过期 snapshot 改为 `UNKNOWN`；首页表格在 `components/tonight-places.tsx:40-47` 做同样处理，全部 location 为 `UNKNOWN` 时首页进入 sitewide paused 状态。
- 页面不会在 `valid_until` 到点的瞬间主动变 UNKNOWN。ISR 是请求触发的 stale-while-revalidate：到期后首个请求通常先拿旧 HTML，后台再生成新 HTML。因此实际切换时刻不是精确的 25 分钟；在持续有访问的页面上通常还会叠加约 10 分钟再验证窗口和生成延迟，低流量页则可能更晚才被访问触发。[Next.js ISR 文档](https://nextjs.org/docs/app/guides/incremental-static-regeneration)也明确说明了这一行为。
- 页面过期时展示的 `DATA_STALE` 文案是 UI fallback；并非 engine 重新生成了 `main_obstacle = DATA_STALE`。`REASON_COPY` 虽定义该 code，当前 engine 正常路径不会因文件 TTL 把它写进 snapshot。

### 3. 上游不只有 NOAA

- Aurora 信号来自 NOAA SWPC OVATION 和 Kp（`engine/snapshot.py:22-23`）。
- 云量来自 Open-Meteo（`engine/snapshot.py:65-85`），当前 15 个 location 共 39 个 sample point，一次全量运行最多会发 39 个云量请求。
- engine 已有比 25 分钟更符合数据意义的 OVATION 规则：以 `Observation Time` 为准，45 分钟后降 confidence，90 分钟后 near-window 不再使用 OVATION（`engine/snapshot.py:764-771, 321-330`）。统一 25 分钟页面 TTL 在它外面又做了一次更激进、也更不准确的全局否决。

### 4. `latest` API 不是实时备用通道

`app/api/snapshots/latest/route.ts:1-10` 也只读 deployment 内的 `latest.json`，且是 `force-static`，没有 `revalidate`。它是构建期静态 API 产物，不会绕过新部署要求。

### 5. 2026-08-23 事故与官方调度语义一致

GitHub 官方明确说 scheduled events 在高负载时可延迟，负载足够高时甚至可丢弃，并特别提到每小时开头是高负载时段（[GitHub Actions troubleshooting](https://docs.github.com/en/actions/how-tos/troubleshoot-workflows#triggering-event-conditions)）。当前 `*/10` 包含每个整点，且把最多只是“会运行”的 cron 当成了 25 分钟 SLO 的根基，设计前提不成立。

本次复核时的只读生产观测也相互印证：

- 01:55 UTC 首页 HTML 为 `x-vercel-cache: HIT`，显示 sitewide `UNKNOWN` 和 `Updated 1 hour ago`。
- 02:15 UTC `/api/snapshots/latest` 仍返回 `generated_at = 2026-08-23T00:45:41Z`，header 为 `x-vercel-cache: PRERENDER`。
- GitHub run 列表在 00:45 之后直到 02:14 才出现下一次 scheduled run。

## 二、三个选项评估

| 选项 | 可靠性 | 本仓工程复杂度 | 运行成本 / 配额 | SEO | UNKNOWN 语义 |
|---|---|---|---|---|---|
| 1. 解耦 deploy/data | **最好，唯一能去掉 GitHub scheduler + Git push + Vercel build 三重时效依赖的方向**。仍会面临 NOAA/Open-Meteo 超时、Vercel Function/Data Cache/Blob 故障、cache stampede 和错误数据污染；需要 last-known-good、单飞刷新和 hard age guard。 | **中高**。engine 约 800 行 Python，Next render 是 TypeScript；不应在页面里复制两份算法。最稳的实施需要将纯计算核心迁到 server-side TS，用 golden fixtures 与 Python 对齐后退役 Python producer；或建立单一 Python 运行时服务边界。 | 中央 10 分钟缓存后，请求量与现有 cron 同级，不应随 pageview 线性增长。现状每日理论上约 288 次 NOAA 请求 + 5,616 次 Open-Meteo 请求；可通过 multi-coordinate/batching 显著降低后者。Vercel Function/ISR/Blob 会增加用量，但 15 个 location 的规模很小。 | **满足**，前提是 Server Component 在 render 时 `await` 服务器数据，不改成客户端补丁。ISR 生成的首屏 HTML 保留 verdict。 | 最容易把 UNKNOWN 从“发布管线不新鲜”恢复为“没有足够的有效业务证据”。刷新失败不必立刻 UNKNOWN，但超过 hard source age 必须 UNKNOWN/降级，不能永久服务旧 GO。 |
| 2. 只放宽新鲜度 | 可减少这类 80 分钟窗口，但 GitHub scheduler、Git push、Vercel build 仍是实时链路；长延迟、push 冲突、build 失败仍会出问题。如果规则是“NOAA issue time 没变就一直 live”，NOAA 产品冻结时反而会永不过期。 | 看似低，正确做其实是 **中等**：需为每个源增加 `source_time/fetched_at/coverage/fingerprint`，并重算当前剩余时段。 | 基本不变；仍支付高频 GitHub Actions 和 Vercel builds。如果 Vercel 是 Hobby，理想状态每日 144 次 deploy 还高于当前文档所列的 100 deployments/day（[Vercel limits](https://vercel.com/docs/limits)）。 | 不变，仍是 server HTML。 | 可保留 UNKNOWN，但必须有 hard cap。仅改 `valid_until` 会破坏信号：页面可能把几小时前已经过去的 `best_window` 和当时 rollup 当作现在答案。 |
| 3. 现状 | **不可接受**。把第三方 best-effort scheduler 当成一个每 25 分钟必须成功的心跳。任意一环抖动都能让核心产品功能全站失效。 | 无新工作，但长期运维成本高：每天大量 bot commits/builds，事故处理频繁。 | 每日理论上 144 次 Action + commit + deploy，这是用最贵、最慢的单元运输 248 KB 左右 JSON。 | 平时满足 HTML verdict，事故时搜索引擎也会看到全站 UNKNOWN。 | UNKNOWN 被运维噪声污染，用户无法区分 NOAA 真故障和 GitHub 没起 cron。 |

## 三、为什么不推荐“option 2 + 把 TTL 改成 2 小时”作为终态

Snapshot 不是纯粹的上游数据镜像，而是一个使用了当时 `now` 的派生决策：

- `night_slots()` 从脚本当时起生成“剩余夜晚”。
- `rollup()` 只统计当时仍在未来的 windows。
- `best_window`、顶层 status、confidence 和 `answer_sentence` 都是在 snapshot 生成时计算的（`engine/snapshot.py:550-610, 650-725`）。

因此“上游 forecast 仍覆盖 tonight”不等于“旧的派生 verdict 仍正确”。只放宽 `valid_until` 会出现两类错误：最佳时间窗已过仍显示；已经不属于当前决策窗口的云量/极光信号仍影响总 verdict。正确做法是缓存可复用的原始上游数据，然后用当前 `now` 重算派生 snapshot。

## 四、推荐的具体实施方向

### 目标数据流

```text
request / bot
    ↓
Next ISR page (10 min route cache)
    ↓ server-side only
getAuroraBundle() (one shared 10 min cache key for the whole site)
    ├─ refresh raw OVATION + Kp + cloud inputs
    ├─ on success: validate + persist last-known-good raw inputs
    ├─ on fetch error: load last-known-good inputs within source hard limits
    └─ recompute all 15 locations with current `now`
    ↓
Home / forecast metadata / forecast HTML / latest API use the same bundle
```

关键点是“全站一个缓存 key”，而不是 15 个页面各自打 NOAA。第一个需要再生成的页面刷新 bundle，其余页面共享结果。需要设计 single-flight/锁或借助共享 Data Cache 防止同时到期时击穿上游。

### 建议改动的文件/模块

1. **`engine/snapshot.py`**
   - 先拆成“fetch”和“pure compute”，让计算函数接收 `now` 与原始 source envelopes，返回 bundle，不必然写文件。
   - 用固定原始 fixtures 建立 golden tests，锁定 Python 当前输出。
   - 再将纯计算核心迁到 `lib/aurora-engine/` TypeScript，逐 fixture 对齐后才切流。不要长期维护两套分类规则。

2. **新增 `lib/aurora-sources.ts` 和 `lib/live-snapshots.ts`**
   - `aurora-sources.ts` 负责集中抓取、timeout、有界 retry/jitter、schema validation、`fetched_at`、HTTP `ETag`/`Last-Modified`/内容 fingerprint 与 source coverage。
   - `live-snapshots.ts` 用 Next/Vercel 共享 Data Cache（10 分钟）组装全站 bundle，并将最后一份通过验证的原始 source envelopes 存到 Vercel Blob/KV 一类外部持久层。
   - Open-Meteo 要 batch/multi-coordinate，或至少并发且限制并发度；不要把现有 39 个最长 45s 的串行请求原样搬进 Vercel Function。

3. **`lib/snapshots.ts`**
   - `loadLatest()` / `loadForecastSnapshot()` 改为从同一 `getAuroraBundle()` 取数。
   - 保留读已提交 `snapshots/latest.json` 的 fallback，但它只用于 build/cold-start 和外部持久层暂时不可用；同样受 source hard limits 约束，绝不能因为“来自 Git”就永久 live。
   - 用 source health 取代现有单一 `isSnapshotFresh(valid_until)`。

4. **`app/page.tsx`、`app/forecast/[slug]/page.tsx`、`components/tonight-places.tsx`**
   - 保留 `force-static` + `revalidate = 600`；在 Server Component 中 await 统一 bundle，确保 verdict、metadata、JSON-LD 使用同一份数据。
   - 区分 `data_generated_at`、各 source time 和 UI 上的“Updated”；不要再把一次计算时间包装成上游新鲜度。

5. **`app/api/snapshots/latest/route.ts`**
   - 改为读取同一 runtime bundle，并显式设 `revalidate = 600`（或选择明确的 dynamic/cache headers），不再是无再验证的 build artifact。
   - API 返回 `generated_at` 之外，增加每个 source 的 `source_time`、`fetched_at`、`age_seconds`、`health`、`fallback_used`，用于观测。

6. **`.github/workflows/refresh-aurora-snapshots.yml`**
   - 待 runtime 路径通过生产验证后，停止每 10 分钟 commit/deploy。
   - 可保留一个低频、不发布的 synthetic check/手动生成工具，但不再让它担任网站 liveness。

### 新的 UNKNOWN 触发规则

`UNKNOWN` 应表示“无法用仍然适用于当前决策窗口的 aurora 证据得出可负责的结论”，而不是“我们的任务 25 分钟没跑”。

建议把 freshness 分为三层：

- **refresh target（软期限）：**10 分钟。超过就尝试抓新数据，本身不触发 UNKNOWN。
- **degraded window：**上游抓取失败时，在每个源的 hard limit 内使用 last-known-good，降 confidence，并显示真实 source age。
- **hard invalidity：**
  - OVATION：继承现有规则，`Observation Time` >45m 降 confidence，>90m 不允许其驱动 near-window verdict。
  - Kp：JSON 没有可直接使用的整体 issuance field，必须记录我们的 `fetched_at`/fingerprint，并验证当前 tonight 需要的 3-hour `time_tag` slots 仍存在。软/硬年龄要用实际连续观测校准，不要假设“每 10 分钟必变”。
  - Cloud：使用的是对 tonight 的预报值，不需 25 分钟就整份作废。但应记录 `fetched_at` 和模型/时间覆盖；超过硬限后按现有 engine 语义变为 `DATA_MISSING_WEATHER`。这不必然让整个 location UNKNOWN：当 aurora 明确到不了时仍可 NO，否则应封顶为 MAYBE/低 confidence。

如果 aurora 数据缺失或超过 hard limit，现有 `DATA_MISSING_AURORA` / `UNKNOWN` 必须保留。不能为了“不出 UNKNOWN”就展示无期限的旧 `GO`。

## 五、成本、限流与配额

1. **NOAA**：全站统一 cache 后只需每约 10 分钟各拉一次 OVATION 和 Kp，与现有目标频率相同。OVATION payload 约 900 KB，不应被每个 location 重复拉取。需支持 conditional GET、尊重 HTTP cache headers，加明确 User-Agent 与 backoff。
2. **Open-Meteo**：现状理论上 39 请求/轮 × 144 轮/天 = 5,616 请求/天，低于其当前列出的免费非商业 10,000/day，但已经不是可随意放大的余量。而且免费 API 明确只允许非商业用途；如果网站商业化/广告化，需要商业 plan，这是合规问题，不只是限流问题（[Open-Meteo Terms](https://open-meteo.com/en/terms)）。支持 multi-coordinate 的 API 可用于减少 HTTP 次数（[Open-Meteo docs](https://open-meteo.com/en/docs)）。
3. **Vercel**：ISR 使用 Function/Data Cache，Blob/KV 会增加读写。当前规模很小，但应按实际 plan 检查 Function duration、ISR writes 和 Blob/KV 配额。不建议把 Vercel Cron 当成新的唯一心跳：Hobby 当前最高每日一次，Pro 虽支持每分钟，cron 仍是调度器而非数据正确性边界（[Vercel Cron usage and pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)）。

## 六、发布后的生产验证

### 上线前

- 用固定 OVATION/Kp/Open-Meteo fixtures 做 Python 与新 runtime engine 的 golden parity：15 locations 的 status、confidence、reason codes、best window 和 points 全部对齐。
- 用 fake clock 验证 10m、45m、90m、夜间跨日、DST、best window 结束后的重算。
- 注入 OVATION 失败、Kp 失败、部分 cloud 失败、Blob/KV 失败和 malformed JSON；确认 last-known-good 只在 hard limits 内生效，且旧 GO 不会越过安全边界。
- 本地用 `next build && next start` 验证真实 ISR，而不是只在 `next dev` 看结果。

### 生产切流后

1. 在不产生 snapshot commit/新 deployment 的前提下观察 30–60 分钟；`/api/snapshots/latest` 的 `generated_at` 和 source metadata 应持续前进。这是“deploy 已与 data 解耦”的核心验收证据。
2. 对首页和至少 Alaska/中纬度/城市页分别执行 `curl`，在原始 HTML 而非 hydration 后 DOM 中查到 verdict、best window、updated/source age 和 metadata description。
3. 跨过 10 分钟后连续请求两次并检查 Vercel cache headers；因 ISR 是 stale-while-revalidate，不要把第一个 stale response 误判为失败。
4. 检查日志/指标：每个源的 age、fetch latency/error、fallback_used、bundle compute duration、UNKNOWN location count、全站 UNKNOWN 时长、ISR regeneration failure。
5. 在 preview 环境做 >90 分钟断源故障演练：前 10 分钟不因运输失败立刻全站 UNKNOWN；超过各 source hard limit 后必须按规则降级/UNKNOWN，不能继续显示无标识的旧 GO。

## 七、额外必须担心的问题

### P0：当前站点实际不允许 SEO 收录

“SEO 重要”与现有代码直接矛盾：

- `app/layout.tsx:16-21` 全局 `robots: { index: false, follow: false }`。
- `app/page.tsx:27-35` 首页 `index: false`。
- `app/forecast/[slug]/page.tsx:80-90` location 页 `index: false`。
- `app/robots.ts:3-8` 对所有 user agent `disallow: /`。
- engine 还将 bundle 和每个 snapshot 的 `seo_indexable` 恒定写为 `false`。

因此“verdict 在服务器 HTML 中”目前确实满足，但“可被搜索引擎收录”完全不满足。这应单独作为 launch gate，不要与本次管线改造偷偷混在一个 patch 里。

### P0/P1：Workflow `success` 不等于数据健康

- `engine/snapshot.py:756-783` 捕获 aurora/cloud fetch 异常后继续生成并正常退出，workflow 仍可标记 `success`、commit 并 deploy 一份大量 UNKNOWN/降级数据。所以“近期 runs 都 success”不能用于证明 NOAA/Open-Meteo 正常。
- OVATION 和 Kp 在同一个 `try` 中；OVATION 失败时 Kp 根本不会尝试。它们应独立拉取、独立缓存、独立报警。
- GitHub hosted runner 是新环境，`engine/.cache/` 又被 `.gitignore`；现有本地 cache 并不是跨 run 的 last-known-good。

### P1：并发、耗时和 push 冲突

- 39 个 Open-Meteo 请求串行执行，单个 timeout 45s；一次 job 完全可能超过 10 分钟周期。
- workflow 没有 concurrency group。两个 run 重叠时可以互相产生 stale-base/non-fast-forward push 失败。
- 当前每次成功 fetch 都会因 `generated_at` 变化而 commit，即使上游内容没有任何变化；所以它本质上是每轮必部署。

### P1：数据合同与观测不足

- TypeScript `ForecastWindow.cloud_block` 声明为 `"blocked" | "unknown"`，engine 实际输出 `"socked"`。这说明 JSON 只做 type assertion，没有 runtime schema validation。应对外部输入和持久化 bundle 做版本化 schema 校验。
- UI 的 `Updated` 只显示我们的计算时间，用户和运维都看不到 OVATION observation age、Kp coverage 或 cloud fetched age。
- 需要一个独立的 watchdog：不是“job 失败告警”，而是“最后成功 source refresh age、全站 UNKNOWN 比率、当前最新 bundle age”的业务 SLO 告警。watchdog 不能和主刷新路径共享唯一调度器。

## 最终建议

**不接受 status quo，也不把“延长 `valid_until`”当成终态。**

将 option 1 作为主方向：让页面 ISR 依赖一个服务器端、全站共享、可 stale-on-error 的数据缓存；缓存原始 source envelopes，每次 ISR 用当前时间重算 snapshot。已提交 snapshot 只是 cold-start/build fallback。同时用 option 2 的 source-specific freshness 作为安全边界：传输延迟不等于立刻 UNKNOWN，但业务证据超过 hard limit 必须降级或 UNKNOWN。

这个方向同时解决了两个不同问题：

1. 网站的 liveness 不再要求 GitHub 每 25 分钟必须调度、push、build 和部署成功。
2. UNKNOWN 重新成为“无法做可负责的极光判断”的高价值信号，而不是 CI 调度噪声。
