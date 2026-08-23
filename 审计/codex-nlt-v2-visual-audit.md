# 结论

PASS_WITH_NITS

视觉方向可上线：已脱离极光仪表盘和旧编辑腔，四态可信且核心文字对比充足；但静态稿不能直接移植，落地时必须修正无障碍和生产状态映射。

# 严重

- 无

# 中等

- 部分交互未达到 44px：Find place 与 Share/Try again 均为 `36px`，页脚文字链接、FAQ summary 也没有可靠的 44px 热区。见 `视觉稿/v2/tokens.css`。
- 输入框和白底按钮的 `--line-strong` 对白仅约 `1.99:1`；不足以清楚标识控件边界。全局 moss 焦点环在深色 slip 上仅约 `1.58:1`，Share/Try again 的键盘焦点不够可见。其余关键对比通过：GO `12.36:1`、MAYBE `7.73:1`、NO/UNKNOWN `9.79:1`；muted/placeholder 对白约 `9.91:1`。
- 静态 HTML 不能作为生产 DOM 模板：主页桌面只有 8 行、手机只有 4 行；forecast 的 Nearby 仅存在于桌面 rail，而移动端直接隐藏。直接照搬会丢失“15 行均在 HTML”及移动端 Nearby。`<tr onclick>` 也不能进入生产，应保留可键盘操作的真实链接。
- 四态稿未覆盖生产分支。现有组件还承担 stale 强制 UNKNOWN、UNAVAILABLE、Alaska kicker；同时 UNKNOWN 当前会同时渲染 Try again 和 Share，而 v2 要求以 Try again 替换 Share。落地时不能只换 CSS。
- token、选择器和字体不是一一替换关系。v2 的 `--primary/--bg/--radius-slip` 与生产的 `--aurora/--paper/--radius-card` 不兼容；生产 CSS Modules 仍大量引用 Newsreader。直接覆盖 `:root` 会产生未定义变量或残留 serif。

# 轻微

- 无

# 执行时必须守住

- 把 v2 当视觉系统迁移，不复制静态稿的数据和 DOM；保留全部地点行、现有 URL、模块顺序及移动端 Nearby。
- stale 必须去掉旧状态色并显示 UNKNOWN；UNAVAILABLE 保持冷静的未知系视觉；保留 Alaska kicker；UNKNOWN 只显示 Try again。
- 用 `next/font` 加载 Archivo 及所需 `wdth` 轴，并清理所有 Newsreader、Inter、Georgia 可见回退。
- token 与所有 CSS Modules 原子迁移，或先提供兼容别名；同步完成浅色页脚、moss 标志和现有组件类名映射。
- 所有交互热区至少 44px；白底控件边界、深色 slip 焦点环至少 `3:1`。不要降低目前已通过的正文、placeholder 和状态词对比。
- GO/MAYBE/NO/UNKNOWN、窗口和主障碍继续由服务端写进 HTML；客户端只负责分享、重试等交互。

# 不要改

- 不改 `/`、`/forecast/[slug]`、`/near-me`、`/view`、指南和 methodology 的 URL 或 SEO IA。
- 不改首页与地点页的冻结模块顺序；首页仍是 H1 → 搜索 → 全量地点 → 说明。
- 不改引擎文案、四态含义、窗口、主障碍和过期快照转 UNKNOWN 的规则。
- 不加登录、账号、用户库、地图、Kp 仪表、百分环或虚构概率。
- 不加库存极光图、玻璃拟态、渐变文字或装饰性极光。
- NO 不用红；UNKNOWN 不做错误页；红色只用于真实错误。
