# 任务
独立只读审计 Northern Lights Tonight 首版方案。禁止加载任何 skill。禁止改文件、禁止写代码、禁止联网。读完下列文件后立刻用中文写完整报告，不要第二轮复核。

先 cat 这些文件（全部在 /tmp/nlt-docs/）：
- scope.md
- engine.md
- pages.md
- wireframes.md
- wave1-summary.json

不要读 PRD 全文。v1 以这 5 份为准。PRD 已知差异仅作对照：首发写 16 城、有 /map 和 /places/alaska、判断用 45/30/15/10 加权分、未入夜写 WAIT、首页要覆盖地图。

产品：美国英语 SEO 工具站，告诉某地今晚极光值不值得出门。无登录/App/订阅。获客是搜索。钱在 /forecast/[slug]。首页 SSR 不得按 IP 变成某城。Wave 1 = 15 个美国地点。

# 要审
A 文档打架：URL、索引、首页个性化、状态枚举、州页代表点、Alaska 模板、near-me、地图、小时轴、主词承接
B SEO：词→URL 互吃、爬虫能否见答案、doorway、主词冷启动、Title/H1/内链/sitemap
C 引擎：OVATION 约 90 分钟 vs 今晚窗口、中纬远窗禁 GO、UNKNOWN vs NO、typical_kp 过粗
D 地点范围与吸收词（Boston、Northern Michigan、Chicago↔Illinois）
E 线框是否漏掉 SEO 强制模块，或把地图/登录/IP 改首页画回去
F 下一步先出快照、HTML 等线框过了再做，还缺什么会卡住

# 输出格式
1. 结论（5 行内）
2. 严重 / 中等 / 轻微三张表。每条：id、问题、证据（文件名+短引）、影响、建议
3. 文档打架清单（没有则写未发现）
4. 冻结后再开工最多 3 件事
5. 应保持禁止的

严重 = 伤排名、误导用户、或矛盾到无法实现。不要写总体很棒。不要建议做订阅/App/地图（除非指出应保持禁止）。
