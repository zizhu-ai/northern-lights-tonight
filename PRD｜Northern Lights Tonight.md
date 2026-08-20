# PRD｜Northern Lights Tonight  
## 美国本地极光可见性判断工具与 pSEO 内容站

**文档版本：** v1.0  
**制定日期：** 2026-08-20  
**产品阶段：** TEST_MVP  
**首发市场：** 美国英语市场  
**核心关键词：** `northern lights tonight`  
**商业模式：** 免费工具 + 展示广告；旅行联盟内容作为后续补充  
**预计开发周期：** 5–7 天  
**预计稳定维护：** 每月 4–10 小时

---

# 一、执行摘要

本产品不是订阅制极光预报 SaaS，而是一个围绕以下任务构建的 SEO 工具站：

> **告诉某个地点的用户：今晚能不能看到极光、什么时间最好、阻碍因素是什么，以及是否值得出门。**

产品以实时判断工具为核心，通过三类页面获取搜索流量：

1. **实时工具页**：覆盖 `northern lights tonight`、`can I see the northern lights tonight`、`what time`、`near me` 等查询；
2. **地域 pSEO 页**：覆盖 `northern lights colorado`、`northern lights seattle tonight` 等州和城市查询；
3. **常青内容页**：覆盖 `best time to see northern lights`、`how to see northern lights` 等长期需求。

首版不做付费订阅、不做原生 App、不做复杂地图、不批量索引数千个城市。首发应控制在：

- 1 个核心实时工具页；
- 1 个 Near Me 页面；
- 16 个州/城市页面；
- 2–3 个常青指南；
- 其余城市支持动态查询，但默认 `noindex`。

核心增长逻辑不是直接竞争高难度主词，而是先通过低难度地域词取得排名和链接，再逐步提高主词竞争力。

---

# 二、数据审计与机会判断

## 2.1 数据质量

上传文件共 1,301 行，包含 1 行表头和 1,300 行关键词数据；所有数据行的快照日期均为 `20260718`。

经过规范化和精确去重后：

| 指标 | 结果 |
|---|---:|
| 原始关键词行数 | 1,300 |
| 唯一关键词 | 830 |
| 重复行 | 470 |
| 重复率 | 36.2% |
| 重复数据是否存在指标冲突 | 未发现 |
| KD 中位数 | 39 |
| 搜索量中位数 | 720 |
| CPC 中位数 | $0 |
| 意图代码为 0 的关键词 | 760 |
| 数据快照 | 2026-07-18 |

因此：

> **不能直接累加 1,300 行搜索量，也不能把去重后的约 297 万搜索量当作市场规模。**

原因包括：

- 同一关键词被重复导出多次；
- 大量同义词由同一页面承接；
- `aurora`、`northern lights` 等头部词重叠严重；
- 包含 Space Weather、Solar Flare、NWS 等邻近但不同意图；
- 搜索量受到极光事件脉冲影响；
- 仅有一个数据快照，无法判断长期趋势。

---

## 2.2 主词需求真实，但不适合作为唯一入口

核心词及相关头部词包括：

| 关键词 | 搜索量 | KD | CPC |
|---|---:|---:|---:|
| northern lights tonight | 135,000 | 42 | $1.70 |
| northern lights forecast | 60,500 | 53 | $1.11 |
| northern lights forecast tonight | 14,800 | 54 | $0.89 |
| aurora forecast tonight | 12,100 | 54 | $0.89 |
| what time will the northern lights be visible tonight | 8,100 | 45 | $0.60 |
| best time to see northern lights tonight | 8,100 | 32 | $0 |
| can I see the northern lights tonight | 6,600 | 41 | $1.26 |
| what time is the northern lights tonight | 5,400 | 21 | $0 |

这些词并不是八个独立需求，而是同一个用户决策流程的不同表达：

1. 今晚有没有极光；
2. 我这里能不能看到；
3. 几点最好；
4. 应该去哪里；
5. 天气是否允许。

主词自身搜索量高，但 KD 处于中等水平；`forecast`、`map`、`tracker` 等泛词的难度更高。主词应由核心工具页承接，但不应成为冷启动时唯一依赖的流量来源。

---

## 2.3 地域词是最值得优先进入的部分

通过州、城市、地区和国家实体识别，共发现约：

| 地域词指标 | 内部计算结果 |
|---|---:|
| 地域相关唯一关键词 | 约 252 |
| 去重搜索量合计 | 约 371,700 |
| KD 中位数 | 23 |
| KD＜30 的地域词 | 约 190 |
| KD＜30 占比 | 约 75% |

地域词整体难度明显低于泛实时词。

代表性机会包括：

- `northern lights colorado`：12,100，KD 18；
- `northern lights ohio`：9,900，KD 15；
- `northern lights indiana`：6,600，KD 14；
- `northern lights chicago`：9,900，KD 24；
- `northern lights seattle`：3,600，KD 11；
- `northern lights oregon`：4,400，KD 17。 
这说明最合理的 SEO 进入路径是：

> **先拿州和城市长尾词，再通过内链、内容和外链逐步推动首页竞争主词。**

---

## 2.4 需求具有明显事件脉冲

按照趋势列内部归一化计算，在包含 `tonight`、`today`、`now`、`current` 等修饰词的泛实时关键词中，约三分之二的关键词有一半以上趋势权重集中在单个月份。

例如：

- `northern lights tonight` 的趋势为  
  `0 | 7 | 0 | 0 | 2 | 0 | 44 | 0 | 4 | 0 | 0 | 4`；
- `what time is the northern lights tonight` 的趋势峰值达到 100；
- 多个地域词也呈现单月突然暴涨的结构。

因此，Semrush 展示的搜索量不能直接理解为稳定月搜索量。

产品需要采用以下经营假设：

- 平时流量较低；
- 地磁事件发生时流量突然放大；
- 大部分用户是新闻或社交媒体触发后临时搜索；
- 回访率不会像天气产品一样稳定；
- 基础设施必须能承受短时流量峰值；
- 收入应按年度和事件周期计算，不能只看某个高峰月。

---

## 2.5 商业意图较弱

830 个唯一关键词中，760 个的意图代码为 0；CPC 中位数为 0，大部分地域词 CPC 也为 0。

这进一步说明：

- 用户主要寻找答案，而不是购买服务；
- 不应预设用户愿意支付月费；
- 免费工具比订阅产品更符合搜索意图；
- 展示广告比付费墙更自然；
- Alaska、Fairbanks 等旅行场景可承接少量联盟收入。

---

# 三、产品定位

## 3.1 产品一句话

> **A local aurora decision tool that tells you whether the Northern Lights are worth going out for tonight.**

中文解释：

> 根据用户位置、极光活动、云量、黑夜时间、月光和光污染，告诉用户今晚是否值得出门看极光。

---

## 3.2 核心差异化

产品不能只是展示一个 Kp 数值或复制官方预报，而应完成数据到决策的转化：

| 普通预报页 | 本产品 |
|---|---|
| 当前 Kp 是 6 | 今晚 10:30–11:20 值得尝试 |
| 展示极光地图 | 判断极光是否可能到达用户所在地 |
| 显示云量 | 说明云层是否会阻挡观测 |
| 提供全球数据 | 给出本地化结论 |
| 显示虚构精确概率 | 输出 GO / MAYBE / NO / UNKNOWN |
| 数据很多 | 明确告诉用户下一步做什么 |

---

## 3.3 产品形态

产品应被定义为：

> **实时工具 + 地域 pSEO 页面 + 常青观测指南。**

而不是：

- 订阅预报 SaaS；
- 纯内容博客；
- 新闻站；
- 专业空间天气平台；
- 原生移动 App；
- 单纯的 Kp 指数展示器。

---

# 四、目标用户与 Jobs-to-be-Done

## 4.1 核心用户

### 用户 A：事件触发的本地普通用户

**触发场景：**

- 在新闻、Facebook、TikTok 或当地群组看到极光消息；
- 搜索 `northern lights tonight`；
- 不理解 Kp、Bz 或太阳风参数。

**核心任务：**

> 我今晚从当前城市出发，是否值得专门出门看极光？

**需要的答案：**

- 能不能看到；
- 几点最好；
- 云层是否有问题；
- 应该朝哪个方向；
- 是否需要开车离开城区；
- 结论是否可靠。

---

### 用户 B：边缘纬度城市居民

典型城市包括：

- Seattle；
- Chicago；
- Columbus；
- Indianapolis；
- Boston；
- Denver；
- New York City。

这些用户不是稳定的极光爱好者，只有在强事件期间才会搜索。

产品价值在于：

> 在大多数普通夜晚明确告诉用户“不值得出门”，在少数强事件夜晚给出行动窗口。

---

### 用户 C：极光目的地游客

典型地点包括：

- Alaska；
- Fairbanks；
- Northern Michigan；
- Maine；
- Minnesota。

核心任务是：

- 旅行期间哪一天条件最好；
- 什么时间出门；
- 哪里光污染较低；
- 云量是否影响观测。

这一人群可以承接后续的旅游内容和联盟收入，但不是首版商业化重点。

---

# 五、产品目标与非目标

## 5.1 MVP 目标

1. 用户进入页面后 10 秒内得到当地结论；
2. 同时回答“能不能看、几点看、为什么”；
3. 建立可复用的州/城市页面模板；
4. 首批索引 16 个高机会地域页；
5. 通过缓存保证事件流量下的稳定性；
6. 验证地域长尾词是否可以获得排名和点击；
7. 将稳定现金成本控制在每月 $30 以内。

---

## 5.2 非目标

MVP 明确不做：

- 用户注册；
- 月度或年度订阅；
- 邮件提醒；
- 原生 App；
- 全球所有城市；
- 复杂的交互式地球地图；
- 专业空间天气分析；
- 历史极光数据库；
- 用户社区；
- 大量新闻文章；
- 一次性索引数千个城市页。

---

# 六、站点信息架构

## 6.1 推荐 URL

```text
/
├── near-me
├── forecast
│   ├── colorado
│   ├── ohio
│   ├── chicago
│   ├── seattle
│   ├── michigan
│   └── ...
├── guides
│   ├── best-time-to-see-northern-lights
│   ├── how-to-see-northern-lights
│   └── where-to-see-northern-lights
├── places
│   └── alaska
└── map
```

---

## 6.2 页面与关键词映射

| 页面 | 核心意图 | 处理方式 |
|---|---|---|
| `/` | northern lights tonight | 核心实时决策工具 |
| `/near-me` | northern lights near me / ZIP code | 定位入口 |
| `/forecast/[location]` | 地域词及地域今晚词 | 州和城市 pSEO 模板 |
| `/guides/best-time-to-see-northern-lights` | 最佳月份、季节、时间 | 常青指南 |
| `/guides/how-to-see-northern-lights` | 如何观测 | 常青指南 |
| `/guides/where-to-see-northern-lights` | 去哪里看 | 地点发现工具与指南 |
| `/places/alaska` | Alaska 最佳观测地点 | 高质量旅行内容 |
| `/map` | aurora map / tracker | P1 工具页 |

---

## 6.3 一个意图集群只建立一个 URL

以下关键词全部由同一个页面承接：

```text
northern lights colorado
colorado northern lights
northern lights colorado tonight
northern lights tonight colorado
can you see the northern lights in colorado tonight
are the northern lights visible in colorado tonight
```

统一对应：

```text
/forecast/colorado
```

不得为每个语序或问句生成独立页面。

同理：

```text
northern lights chicago
aurora borealis chicago
northern lights chicago tonight
northern lights tonight chicago
```

统一对应：

```text
/forecast/chicago
```

---

# 七、首批地域页面

以下“聚类搜索量”为同地点关键词简单去重汇总，只用于比较优先级，不代表可获得流量；“加权 KD”为内部按搜索量加权后的难度。

| 优先级 | 地点 | 类型 | 聚类搜索量 | 加权 KD | 判断 |
|---:|---|---|---:|---:|---|
| P0 | Colorado | 州 | 30,810 | 21 | 最大低难度机会 |
| P0 | Ohio | 州 | 17,150 | 16 | 高量、低难度 |
| P0 | Indiana | 州 | 12,740 | 14 | 非常适合新站测试 |
| P0 | Chicago | 城市 | 17,470 | 22 | 城市意图明确 |
| P0 | Michigan | 州 | 20,530 | 30 | 需求大，适合建立权威性 |
| P0 | Seattle | 城市 | 8,520 | 15 | 城市页机会突出 |
| P0 | Illinois | 州 | 7,380 | 21 | 可与 Chicago 互链 |
| P0 | Oregon | 州 | 6,780 | 18 | 低难度 |
| P0 | Wisconsin | 州 | 7,270 | 22 | 今晚词占比较高 |
| P0 | Massachusetts | 州 | 7,460 | 23 | 强事件型需求 |
| P0 | Maine | 州 | 5,680 | 21 | 观测条件更自然 |
| P0 | Minnesota | 州 | 4,060 | 16 | 难度低、产品匹配高 |
| P0 | Utah | 州 | 7,290 | 22 | 长尾机会较好 |
| P0 | New York City | 城市 | 6,600 | 20 | 低纬度事件型流量 |
| P0 | Alaska | 州 | 87,800 | 36 | 难度较高，但建立主题权威 |
| P0 | Fairbanks | 城市 | 19,790 | 32 | 预报与旅游双重意图 |
| P1 | Washington State | 州 | 3,000 | 19 | 与 Seattle 形成集群 |
| P1 | California | 州 | 6,390 | 25 | 大量事件型查询 |
| P1 | New Jersey | 州 | 2,790 | 17 | 全部为今晚意图 |
| P1 | Boston | 城市 | 1,790 | 20 | 城市今晚词明确 |
| P1 | Dallas | 城市 | 2,400 | 23 | 低纬度事件页测试 |
| P1 | Connecticut | 州 | 2,900 | 20 | 今晚查询集中 |

`Northern Michigan` 单独有较高搜索量，但在确认其 SERP 与 Michigan 州页明显不同前，不应立即建立独立页面，以避免内部竞争。

---

# 八、核心功能需求

## 8.1 位置选择

### 功能要求

用户可以通过以下方式选择位置：

1. 浏览器定位；
2. 输入城市；
3. 输入州；
4. 输入美国 ZIP Code；
5. 从热门地点列表选择。

### 交互要求

- 不强制授权定位；
- 用户拒绝定位时正常使用；
- 自动识别当地时区；
- 搜索结果优先显示美国地点；
- 已建立 SEO 页面的地点跳转到规范 URL；
- 未建立 SEO 页面的地点生成动态结果，但默认 `noindex`。

### 验收标准

- 城市搜索响应小于 300ms；
- 定位结果跳转到对应地点页；
- 同名城市必须显示州名；
- ZIP Code 能转换为近似坐标和时区；
- 不保存精确用户位置。

---

## 8.2 今晚判断卡片

页面第一屏必须出现：

```text
Northern Lights in Seattle Tonight

MAYBE

Best window: 10:40 PM–11:30 PM
Main obstacle: 62% cloud cover
Look toward: North
Confidence: Medium
Updated 6 minutes ago
```

### 状态定义

| 状态 | 含义 |
|---|---|
| GO | 条件足够好，值得尝试 |
| MAYBE | 极光可能到达，但存在云量、光污染或模型不确定性 |
| NO | 当前条件不足，不值得专门出门 |
| UNKNOWN | 关键数据缺失、过期或相互冲突 |

不得在没有历史校准的情况下输出：

```text
You have a 73% chance of seeing the aurora.
```

这种概率会制造虚假的科学精确性。

---

## 8.3 小时级观测窗口

页面需要展示从当地日落后到日出前的时间轴。

每个 30 分钟时间段显示：

- 极光活动；
- 云量；
- 是否完全入夜；
- 月光影响；
- 综合状态；
- 该时间段是否推荐。

示例：

| 时间 | 极光 | 云量 | 黑夜 | 判断 |
|---|---:|---:|---|---|
| 9:30 PM | 弱 | 18% | 否 | 等待 |
| 10:00 PM | 中 | 22% | 是 | MAYBE |
| 10:30 PM | 强 | 16% | 是 | GO |
| 11:00 PM | 强 | 30% | 是 | GO |
| 11:30 PM | 中 | 58% | 是 | MAYBE |

---

## 8.4 判断依据

用户必须可以看到结论为什么产生。

至少展示：

- Aurora activity；
- Kp 或等效地磁活动信号；
- Cloud cover；
- Darkness；
- Moon condition；
- Light pollution；
- Data freshness。

每个信号使用自然语言解释，不只显示专业数值。

示例：

> Aurora activity is strong enough to reach parts of Washington, but Seattle’s cloud cover may block the view.

---

## 8.5 本地行动建议

每个地点页面至少回答：

- 应该朝哪个方向看；
- 是否需要离开市中心；
- 什么时候开始观察；
- 应该等待多久；
- 手机是否可能比肉眼更容易拍到；
- 附近是否有条件更好的地点页面。

MVP 不强制提供具体停车场或驾驶路线，除非数据经过人工核实。

---

## 8.6 分享与事件传播

用户可以生成可分享的当前状态：

```text
Seattle Aurora Forecast: MAYBE
Best window tonight: 10:40–11:30 PM
```

支持：

- 复制链接；
- 分享至 X、Facebook、Reddit；
- Open Graph 卡片展示地点、状态和时间窗口。

事件型流量具有明显社交传播属性，因此分享功能比账号系统更重要。

---

# 九、判断引擎

## 9.1 输入信号

| 信号 | 作用 |
|---|---|
| 用户经纬度 | 本地化计算 |
| 时区 | 显示当地时间 |
| 极光活动网格 | 判断极光是否可能到达 |
| Kp 或地磁活动 | 作为辅助活动信号 |
| 小时级云量 | 判断天空可见性 |
| 天文黑夜 | 判断天空是否足够暗 |
| 月相与月亮高度 | 修正观测条件 |
| 光污染等级 | 修正肉眼可见性 |
| 数据更新时间 | 决定置信度 |

---

## 9.2 判断流程

### 第一步：关键条件门控

出现以下任意情况时，不进入普通评分：

```text
关键数据过期或缺失 → UNKNOWN
当地尚未进入黑夜 → NO / WAIT
极光活动明显无法到达当地 → NO
整晚云量持续高于设定阈值 → NO
```

### 第二步：逐时间段评分

对今晚每个 30 分钟窗口计算：

```text
window_score =
  aurora_reach_score × 45%
  + clear_sky_score × 30%
  + light_pollution_score × 15%
  + moon_condition_score × 10%
```

### 第三步：生成结果

建议初始阈值：

| 分数 | 状态 |
|---:|---|
| 70–100 | GO |
| 45–69 | MAYBE |
| 0–44 | NO |

这些阈值属于首版产品假设，必须通过真实极光事件和用户反馈校准。

---

## 9.3 置信度

置信度与可见性状态分开计算。

例如：

```text
GO + Low Confidence
NO + High Confidence
MAYBE + Medium Confidence
```

置信度由以下因素决定：

- 数据是否新鲜；
- 预测时间距离当前有多远；
- 不同信号是否一致；
- 是否使用了降级数据；
- 天气预测是否稳定。

---

# 十、地域 pSEO 页面要求

## 10.1 页面第一屏

每个地域页必须包含动态内容：

- 当前状态；
- 最佳时间；
- 当地时间；
- 当前云量；
- 极光是否可能到达；
- 更新时间；
- 手动切换位置入口。

---

## 10.2 常青本地内容

即使今晚状态为 NO，页面仍必须具备长期价值。

州页面至少包含：

- 该州是否通常能看到极光；
- 大致需要多强的地磁活动；
- 该州北部和南部的差异；
- 最佳月份；
- 主要城市列表；
- 当前州内条件较好的城市；
- 州内推荐观测地区。

城市页面至少包含：

- 城市光污染情况；
- 从市中心看见的难度；
- 是否建议向北或远离城区；
- 通常需要的活动强度；
- 附近相关州和城市；
- 本地 FAQ。

---

## 10.3 页面独立价值要求

一个地域页只有在满足以下条件时才能进入索引：

- 有经过验证的搜索需求；
- 有明确的地点实体；
- 有完整实时数据；
- 至少三个模块会因地点不同而变化；
- 有独立的常青本地内容；
- 有父级或相邻地点内链；
- 页面不能只是替换城市名称。

禁止生成：

```text
Can you see the northern lights in [City] tonight?

The northern lights may be visible in [City].
Check the forecast before going out.
```

这类页面缺乏独立价值，容易成为低质量 doorway 页面。

---

## 10.4 索引策略

### 允许索引

满足以下任一条件：

- 地点关键词聚类量 ≥1,000 且加权 KD ≤35；
- 单个关键词量 ≥500 且 KD ≤25；
- 属于建立主题权威所必需的核心目的地；
- 已通过 Search Console 获得持续展示。

### 默认不索引

- 无搜索需求的城市；
- 数据不完整的地点；
- 只有几十搜索量且没有独立内容的地点；
- 由用户临时搜索生成的结果；
- 同义 URL 或语序变体。

### 技术要求

- sitemap 只包含允许索引的页面；
- 每个地点只有一个 canonical URL；
- 动态查询页使用 `noindex,follow`；
- 页面下线后返回 410 或跳转到合理父级；
- 不将数万个动态地点全部提交 sitemap。

---

# 十一、常青内容规划

## 11.1 P0 内容

### 文章一：Best Time to See the Northern Lights

对应关键词集群包括：

- `best time to see northern lights`：5,400，KD 21；
- `best time to see aurora borealis`：2,900，KD 17；
- `when is the best time to view the aurora borealis`：2,400，KD 10；
- `when can you see the northern lights`：2,900，KD 26。

该集群内部去重搜索量约 33,600，难度中位数约 27。

页面必须区分：

- 一年中的最佳季节；
- 一晚中的最佳时间；
- 黑夜长度；
- 云量；
- 太阳活动；
- 地理纬度。

---

### 文章二：How to See the Northern Lights

对应关键词包括：

- `how to see the northern lights`：3,600，KD 17；
- `how to see aurora borealis`：2,900，KD 15；
- `how watch northern lights`：2,400，KD 28；
- `how to view northern lights`：880，KD 19。

内容应回答：

- 去哪里；
- 朝哪个方向；
- 需要多暗；
- 肉眼与手机相机的区别；
- 应等待多久；
- 如何理解当地实时工具。

---

## 11.2 P1 内容

### Where Can I See the Northern Lights?

不应只做普通文章，应做成：

> **当前最值得看极光的美国城市榜单 + 地点发现工具。**

### Best Places to See Aurora in Alaska

关键词：

```text
best places to see aurora in alaska
Volume: 14,800
KD: 28
```

这是数据中最明显的旅行内容机会之一。

该页面可以后续承接：

- 极光团；
- 酒店；
- 租车；
- 摄影活动；
- 旅行规划联盟收入。

---

## 11.3 暂缓内容

首版不优先：

- 什么是极光；
- 太阳风基础知识；
- 太阳耀斑新闻；
- 地磁暴新闻；
- NOAA 导航词；
- Space Weather 品牌词；
- 某个过期日期的极光事件；
- 大量摄影器材导购。

这些内容要么难度较高，要么距离核心产品任务过远。

---

# 十二、地图与 Near Me

## 12.1 Near Me 页面

数据中存在：

- `northern lights tonight near me`：5,400，KD 42；
- `northern lights forecast by zip code`：4,400，KD 31；
- `northern lights near me`：2,400，KD 26；
- `aurora near me`：3,600，KD 51。

因此 `/near-me` 应在 MVP 中上线。

Near Me 不是独立的数据页面，而是地点解析入口：

```text
用户授权位置
→ 匹配最近城市或地区
→ 跳转到 /forecast/[location]
```

---

## 12.2 地图页面

`northern lights map` 搜索量 8,100、KD 46；`aurora borealis map` 搜索量 6,600、KD 50，相关 tracker 和 tonight map 词也较多。

但地图集群总体难度高于地域词，因此：

- MVP 首页只需要简化地图或可见范围示意；
- 独立 `/map` 页面放入 P1；
- 暂不开发复杂的全球 WebGL 地图；
- 地图不能拖慢核心结果加载。

---

# 十三、技术架构

## 13.1 推荐技术栈

```text
Next.js
React
TypeScript
PostgreSQL / Supabase
Vercel 或 Cloudflare
Server Cron
服务端缓存
静态城市与 ZIP Code 数据集
```

---

## 13.2 数据处理原则

禁止浏览器直接为每个用户请求多个官方 API。

推荐流程：

```text
定时任务抓取极光数据
        ↓
缓存原始数据
        ↓
按地点批量计算结果
        ↓
保存地点预测快照
        ↓
页面读取已计算结果
```

优势：

- 降低 API 压力；
- 控制数据一致性；
- 提高事件流量下的稳定性；
- 页面可以快速 SSR；
- 可以保存历史结果用于校准。

---

## 13.3 更新频率

建议初始配置：

| 数据 | 更新频率 |
|---|---:|
| 极光活动 | 5–10 分钟 |
| Kp 与空间天气 | 10–15 分钟 |
| 本地天气 | 20–30 分钟 |
| 黑夜和月亮信息 | 每日或本地计算 |
| 地点结果 | 5–10 分钟 |
| SEO 常青内容 | 按季度检查 |

---

## 13.4 数据表

### locations

```text
id
slug
name
state
country
location_type
latitude
longitude
timezone
magnetic_latitude
light_pollution_score
seo_indexable
seo_priority
```

### forecast_snapshots

```text
location_id
generated_at
valid_from
valid_to
aurora_activity
cloud_cover
darkness_score
moon_score
visibility_score
visibility_status
confidence
best_window_start
best_window_end
reason_codes
data_freshness
```

### keyword_clusters

```text
canonical_page
primary_keyword
secondary_keywords
cluster_volume
weighted_kd
page_type
priority
status
```

### local_content

```text
location_id
summary
typical_visibility
viewing_direction
local_obstacles
nearby_locations
viewing_places
last_reviewed_at
```

---

## 13.5 异常处理

必须覆盖：

- 极光 API 请求失败；
- 天气 API 请求失败；
- 字段结构变化；
- 数据超过有效时间；
- 城市坐标错误；
- 时区错误；
- 地点没有天气数据；
- 极光和天气数据时间不一致。

处理规则：

```text
关键数据缺失 → UNKNOWN
部分非关键数据缺失 → 降低 Confidence
过期结果不得继续显示为实时结果
```

---

# 十四、SEO 要求

## 14.1 首页

推荐 Title：

```text
Northern Lights Tonight: Live Aurora Forecast Near You
```

推荐 H1：

```text
Can You See the Northern Lights Tonight?
```

首页必须直接覆盖：

- 是否可见；
- 什么时间；
- Near Me；
- 本地云量；
- 地图；
- 当前最佳城市；
- 如何理解结果。

---

## 14.2 地域页

Title 模板：

```text
Northern Lights in [Location] Tonight: Visibility & Best Time
```

H1 模板：

```text
Can You See the Northern Lights in [Location] Tonight?
```

Meta 模板：

```text
Check whether the Northern Lights may be visible in [Location] tonight, including the best viewing time, cloud cover, darkness and local conditions.
```

模板可以统一，但正文、数据和本地模块必须存在实际差异。

---

## 14.3 内部链接

每个地域页至少链接：

- 首页；
- 父级州页面；
- 3–5 个相邻地点；
- Best Time 指南；
- How to See 指南；
- Near Me 工具。

州页面链接到州内城市；城市页面链接回州页面。

---

## 14.4 页面性能

核心页面要求：

- 移动端优先；
- 首屏不加载大型地图；
- 预测结果从缓存读取；
- LCP 目标低于 2.5 秒；
- 实时数据必须出现在服务端 HTML 中；
- 广告不得推迟首屏核心结论；
- 事件流量下避免逐用户实时计算。

---

# 十五、分析埋点

## 15.1 核心事件

```text
page_view
location_search_started
location_selected
geolocation_requested
geolocation_allowed
geolocation_denied
forecast_rendered
forecast_failed
hourly_window_expanded
viewing_advice_expanded
nearby_location_clicked
share_clicked
outbound_place_clicked
```

---

## 15.2 核心指标

### SEO 指标

- 有效索引页数量；
- 有展示的地域页占比；
- Top 10 / Top 20 / Top 50 页面数；
- 非品牌点击量；
- 各地点页 CTR；
- 极光事件日与普通日流量差异；
- 页面之间的关键词蚕食。

### 产品指标

- Forecast Render Success Rate；
- 数据过期率；
- UNKNOWN 状态占比；
- 地点选择完成率；
- 小时窗口展开率；
- 相邻地点点击率；
- 分享率。

### 商业指标

- Page RPM；
- 每次访问页面数；
- 广告可见率；
- 旅行内容出站点击率。

30 天回访不作为第一核心指标，因为需求本身是低频和事件驱动的。

---

# 十六、验证指标

## 16.1 上线后 30 天

- 首批页面至少 80% 被索引；
- 所有地点页能返回正常实时结果；
- 数据过期导致的错误展示低于 1%；
- 至少一半地点页产生非品牌展示；
- 没有严重页面重复或 canonical 错误。

---

## 16.2 上线后 60 天

- 至少 10 个地域页获得自然点击；
- 至少 5 个地域页进入目标词 Top 50；
- 至少 3 个页面进入 Top 20；
- 遇到一次较强极光事件时，网站流量出现明显提升；
- Search Console 出现未覆盖的新地点词。

---

## 16.3 上线后 90 天

满足以下任一条件可继续扩张：

- 5 个以上地域页进入 Top 20；
- 3 个以上地域页进入 Top 10；
- 事件期间获得可观自然流量；
- 新地点长尾词持续产生展示；
- 外链能够自然指向核心工具或数据资产。

---

## 16.4 停止条件

出现以下任意两项，应停止继续增加页面：

- 90 天后没有地域页进入 Top 20；
- 首批页面索引率长期低于 50%；
- 极光事件期间仍无明显流量提升；
- 地域页有展示但几乎没有点击；
- 页面必须依赖大量低质量内容才能获得索引；
- 用户进入后无法理解结果；
- API 和预测准确性导致持续投诉。

停止扩张不代表关闭网站，可以维持低成本运行。

---

# 十七、商业化要求

## 17.1 MVP

MVP 不放付费墙，不建立订阅系统。

广告可以暂缓到：

- 页面体验稳定；
- 自然流量达到可观察规模；
- Core Web Vitals 合格；
- 广告不会遮挡核心判断。

---

## 17.2 广告位置

建议位置：

1. 第一屏结果卡之后；
2. 小时预测和常青内容之间；
3. 文章正文中部；
4. 桌面端侧边栏。

不得：

- 在结果出现前展示全屏广告；
- 用广告遮挡 GO / MAYBE / NO；
- 在事件期间使用过多弹窗；
- 为提高页面浏览量故意拆分结果。

---

## 17.3 后续联盟内容

仅在以下页面尝试：

- Alaska 极光地点；
- Fairbanks 极光旅行；
- 最佳极光目的地；
- 极光拍摄指南；
- 暗空住宿和观测团。

实时地域页不应强行插入旅行导购。

---

# 十八、成本与维护

## 18.1 开发成本

### 一周内可以完成

- 数据接入；
- 缓存；
- 判断引擎；
- 首页工具；
- Near Me；
- 地域模板；
- 16 个首发地点；
- 两篇基础指南；
- SEO 基础设施；
- 分析埋点；
- 部署和监控。

### 一周内不宜强行完成

- 所有本地观测地点人工验证；
- 全球城市；
- 高级地图；
- 历史准确率系统；
- 邮件提醒；
- 原生 App；
- 大规模内容库。

---

## 18.2 月度现金成本

首版假设：

| 项目 | 月成本 |
|---|---:|
| 极光公开数据 | $0 |
| 美国天气数据 | $0 |
| 托管与函数 | $0–10 |
| 数据库 | $0–10 |
| 日志与监控 | $0–10 |
| 地图 | MVP 为 $0 |
| 合计 | **约 $5–30/月** |

事件流量显著增长后，成本可能提高，但仍不属于高 API 成本产品。

---

## 18.3 人工维护

稳定后每月预计：

| 工作 | 时间 |
|---|---:|
| API 与数据检查 | 1–2 小时 |
| Search Console 检查 | 1–2 小时 |
| 索引和页面合并 | 1–2 小时 |
| 更新重点内容 | 1–3 小时 |
| 外链与合作 | 按增长投入决定 |
| 合计 | **约 4–10 小时/月** |

真正的长期成本主要不是服务器，而是：

- SEO 页面质量；
- 数据准确性；
- 接口变化；
- 外链建设；
- 对新地点机会的筛选。

---

# 十九、外链与可链接资产

不建议逐个为城市页建设外链。

外链应集中指向：

```text
/
 /near-me
 /map
 /guides/where-to-see-northern-lights
```

P1 可以开发以下可链接资产：

- Tonight’s Best Aurora Cities；
- 美国城市极光可见范围表；
- 免费 Aurora Status Widget；
- 可嵌入的城市 GO / MAYBE / NO 徽章；
- 历史极光活动与城市覆盖数据库；
- 极光预报解释图。

推荐外链逻辑：

```text
外链指向核心资产
→ 核心资产链接州页面
→ 州页面链接城市页面
```

而不是：

```text
为几十个城市页分别购买或交换外链
```

---

# 二十、风险与应对

| 风险 | 等级 | 应对 |
|---|---|---|
| 搜索量受单次事件放大 | 高 | 按年度评估，观察真实 GSC 数据 |
| 官方站和搜索摘要截流 | 高 | 提供本地行动结论，而非复制数据 |
| 地域页过度模板化 | 高 | 限制索引数量，增加独立本地模块 |
| 预测误导用户 | 高 | 使用状态与置信度，不给伪精确概率 |
| API 字段变化 | 中 | 数据适配层、schema 校验、异常告警 |
| 极光活动周期下降 | 中 | 增加常青和旅行内容 |
| 事件时流量突然上涨 | 中 | 服务端缓存、批量计算、静态降级 |
| 页面互相蚕食 | 中 | 一个地点一个 URL，一个意图一个页面 |
| 广告收入不足 | 中 | 将其视为低成本 SEO 资产，而非主业务 |

---

# 二十一、七天开发计划

| 天数 | 主要工作 |
|---|---|
| Day 1 | 关键词映射、URL、数据模型、首发地点确认 |
| Day 2 | 极光和天气数据接入、缓存、失败处理 |
| Day 3 | 本地时间窗口与判断引擎 |
| Day 4 | 首页、结果卡、小时预测、位置搜索 |
| Day 5 | 地域页模板、首批地点数据、内部链接 |
| Day 6 | Near Me、两篇指南、SEO、埋点 |
| Day 7 | 移动端 QA、数据异常测试、性能和部署 |

上线后不立即批量扩张。

第一轮新增页面必须来自：

- Search Console 已出现的地点查询；
- 已验证的 Semrush 关键词集群；
- 明显不同的 SERP 意图；
- 完整的本地数据和内容。

---

# 二十二、发布验收清单

- [ ] 首页能够自动或手动选择地点
- [ ] 用户拒绝定位后仍可正常使用
- [ ] 页面显示当地时间而非服务器时间
- [ ] GO / MAYBE / NO / UNKNOWN 逻辑完整
- [ ] 每个结果包含原因和更新时间
- [ ] 关键数据过期时不显示旧结论
- [ ] 小时级窗口能够正常展示
- [ ] 首批 16 个地域页拥有唯一 canonical
- [ ] 动态非 SEO 地点默认 noindex
- [ ] sitemap 只包含允许索引的页面
- [ ] 州页和城市页内部链接正常
- [ ] 首屏不依赖大型地图加载
- [ ] 移动端主要结果无需滚动即可看到
- [ ] Search Console 和分析事件已接入
- [ ] Open Graph 分享卡片正常
- [ ] 至少测试一个高纬度、一个中纬度、一个低纬度城市
- [ ] 模拟 API 失败时页面显示 UNKNOWN
- [ ] 模拟事件流量时缓存正常生效

---

# 二十三、最终产品决策

## 是否做

**做。**

但应作为：

> **低成本、事件驱动、地域 pSEO 优先的工具型 SEO 资产。**

而不是：

> 高留存、高订阅、高壁垒的极光 SaaS。

## 最合理的首版

```text
核心实时工具
+ Near Me
+ 16 个州/城市页
+ Best Time 指南
+ How to See 指南
```

## 最重要的增长原则

> **先拿低 KD 地域词，不要一开始硬打 northern lights tonight。**

## 最重要的产品原则

> **先给结论，再展示数据；不制造虚假精确性。**

## 最重要的 pSEO 原则

> **一个地点一个页面，一个意图一个 URL；没有独立价值的动态地点不进入索引。**

## 最重要的成本原则

> **控制在一周开发、每月低双位数现金成本和每月数小时维护，不因为搜索量看起来很大而扩大工程范围。**