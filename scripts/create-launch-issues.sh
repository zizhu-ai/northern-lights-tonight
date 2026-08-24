#!/usr/bin/env bash
#
# 上线体检问题清单 — 一次性建 issue 脚本（2026-08-24）
#
#   用法：  gh auth status && ./scripts/create-launch-issues.sh
#   预演：  DRY_RUN=1 ./scripts/create-launch-issues.sh
#   看正文：DRY_RUN=1 SHOW_BODY=1 ./scripts/create-launch-issues.sh | less
#
# 已存在同名 issue 会跳过，可以安全重跑。
#
set -euo pipefail

DRY_RUN="${DRY_RUN:-0}"

ensure_label() {
  local name="$1" color="$2" description="$3"
  if [[ "$DRY_RUN" == "1" ]]; then
    printf 'label  %s\n' "$name"
    return
  fi
  gh label create "$name" --color "$color" --description "$description" 2>/dev/null \
    || gh label edit "$name" --color "$color" --description "$description" >/dev/null
}

create_issue() {
  local title="$1" labels="$2" body="$3"

  # gh 的 --search 是模糊匹配，所以再用 jq 做一次精确标题比对
  local existing
  existing="$(gh issue list --state all --search "$title" --json number,title \
    --jq ".[] | select(.title == \"$title\") | .number" 2>/dev/null | head -1)"

  if [[ -n "$existing" ]]; then
    printf 'skip   #%s  %s\n' "$existing" "$title"
    return
  fi

  if [[ "$DRY_RUN" == "1" ]]; then
    printf 'create [%s]  %s\n' "$labels" "$title"
    [[ "${SHOW_BODY:-0}" == "1" ]] && printf -- '---\n%s\n---\n\n' "$body"
    return
  fi

  gh issue create --title "$title" --label "$labels" --body "$body" \
    | sed 's/^/create /'
}

printf '== 准备标签 ==\n'
ensure_label "P0"             "b60205" "上线前必须闭环"
ensure_label "P1"             "d93f0b" "上线后第一周"
ensure_label "P2"             "fbca04" "可排期，不阻塞上线"
ensure_label "security"       "5319e7" "安全与隐私"
ensure_label "seo"            "0e8a16" "搜索与元数据"
ensure_label "ops"            "1d76db" "部署、监控与运维"
ensure_label "engine"         "006b75" "判断引擎与数据管道"
ensure_label "launch-blocker" "000000" "阻塞上线"

printf '\n== 建 issue ==\n'

# ---------------------------------------------------------------- P0

create_issue \
  "P0 确认 BLOB_READ_WRITE_TOKEN 已配置在生产环境" \
  "P0,ops,launch-blocker" \
"零代码改动，但很可能是上线前性价比最高的一条。

Vercel Blob 里的 last-known-good 才是真正的安全网；仓库里那份 \`snapshots/latest.json\` 只在 Blob 也拿不到时才会被读到。如果 token 没配在生产环境，LKG 直接失效，每次缓存未命中都会打上游，上游一抖就掉进最脆弱的兜底路径（见 #2）。

代码位置：\`lib/live-snapshots.ts:103\`、\`lib/live-snapshots.ts:120\`。读写异常都被吞掉（\`:114-116\`、\`:131-133\`），所以配错了也不会有任何报错。

**验收：** 部署后请求 \`/api/snapshots/latest\`，确认
- \`X-Snapshot-Source\` 不是 \`bundled\`
- \`X-Aurora-Fallback-Used: false\`"

create_issue \
  "P0 兜底路径会透传陈旧的 NO 结论" \
  "P0,bug,engine,launch-blocker" \
"## 问题

双源失效时走 \`sanitizeBundledBundle\`。大多数行会被正确降级为 UNKNOWN（因为 \`kp.health\` 硬编码为 \`invalid\`，\`lib/live-snapshots.ts:283\`），但 \`explicitNo\` 这条透传例外：

\`\`\`ts
// lib/live-snapshots.ts:306-308
const explicitNo = row.status === \"NO\" && row.main_obstacle === \"AURORA_NO_REACH\";
return explicitNo ? { ...row, updated_at: sourceTime ?? raw.generated_at } : /* UNKNOWN */;
\`\`\`

一条『极光到不了这里』会从任意陈旧的快照里原样透出。平常没事，但一旦赶上大地磁暴——也就是这个网站唯一真正重要的那个夜晚——它会对着科罗拉多的用户说看不到。**恰恰在最不能错的时候错。**

## 为什么不能用『重算』来修

\`snapshots/latest.json\` 存的是**算完的结论**（\`locations[].status\`），不是原始 ovation/kp/clouds 数据，\`readBundledLatest\`（\`:231-247\`）读进来的东西不具备重算条件。要重算得先改快照产物格式，属于大改，上线前不该碰。

## 改法

给透传加绝对年龄上限，约 3 行：

\`\`\`ts
const bundledAgeMs = now.getTime() - Date.parse(raw.generated_at);
const bundledTooOldToAssert =
  !Number.isFinite(bundledAgeMs) || bundledAgeMs > 12 * 60 * 60 * 1000;

const explicitNo =
  !bundledTooOldToAssert &&
  row.status === \"NO\" &&
  row.main_obstacle === \"AURORA_NO_REACH\";
\`\`\`

保留了刚部署后上游短暂抖动的体验（科罗拉多仍显示 NO 而非一片 UNKNOWN），同时掐掉了大地磁暴那晚的风险。因为快照 cron 已停，这个文件实质是『部署时冻结』，所以上限在多数时候等价于一律 UNKNOWN——正是想要的保守行为。

**验收：** 构造一个 \`generated_at\` 超过 12 小时的 bundled 快照，确认原本 \`NO / AURORA_NO_REACH\` 的行降级为 UNKNOWN。"

create_issue \
  "P0 数据管道降级无任何告警" \
  "P0,ops,launch-blocker" \
"遥测其实已经做好了，缺的只是有人去读。\`/api/snapshots/latest\` 已经在吐 \`X-Aurora-Fallback-Used\`、\`X-Ovation-Health\`、\`X-Snapshot-Source\`（\`app/api/snapshots/latest/route.ts:19-30\`），但没有任何东西在消费它们。凌晨两点 NOAA 挂了，只能靠用户来告诉我们。

## 1. 外部探针

UptimeRobot / Better Stack 免费档即可，5 分钟一次。

告警条件**不要**设成『\`fallback_used\` 一为 true 就叫』——LKG 短暂接管是正常降级，会造成告警疲劳。设成**连续 3 次**命中才告警。

建议加一个轻量端点，避免让探针解析 110KB 的完整 bundle：

\`\`\`ts
// app/api/health/route.ts
export async function GET() {
  const { data, source } = await loadLatestWithMeta();
  const unknowns = data.locations.filter((l) => l.status === \"UNKNOWN\").length;
  const degraded = source === \"bundled\" || unknowns === data.locations.length;
  return NextResponse.json(
    { source, unknowns, total: data.locations.length, generated_at: data.generated_at },
    { status: degraded ? 503 : 200, headers: { \"X-Robots-Tag\": \"noindex, nofollow\" } },
  );
}
\`\`\`

返回 503 是关键：任何探针都能直接判 HTTP 状态码，不需要配 JSON 断言规则。\`robots.ts\` 已 disallow \`/api/\`，无需额外处理。

## 2. 错误上报

\`npx @sentry/wizard@latest -i nextjs\`，只开 error、关掉 performance 与 session replay。

\`lib/live-snapshots.ts:114-116\` 和 \`:131-133\` 两处被吞掉的 Blob 异常，应在保持『不让页面挂掉』的前提下补 \`Sentry.captureException\`。"

create_issue \
  "P0 GA4 缺少 Cookie 同意机制" \
  "P0,security,launch-blocker" \
"只要 \`GA_MEASUREMENT_ID\` 一设（\`app/layout.tsx:24-38\`），欧盟/英国流量就会在无 CMP 的情况下落 cookie。上线方案里写了是有意后置，但这是法务口径问题，需要有人正式认领。

## 建议：上线时不设 GA4，改用 Vercel Analytics

理由不是回避合规。这个站真正要看的指标——SEO 自然流量、各州页排名、GO/MAYBE 点击分布——Search Console 加 Vercel Analytics 已经全覆盖，而 Vercel Analytics 不落 cookie，GDPR 下无需 CMP。为一个用不上高级功能的场景背上 CMP 的实现成本和法务风险，不划算。

代码无需改动：\`app/layout.tsx:25-26\` 的 \`if (!gaId) return null\` 已是干净开关，env 不设就完全不输出。装 \`@vercel/analytics\` 加一行 \`<Analytics />\` 即可。

## 若业务上必须用 GA4

- 接入 CMP（Cookiebot / Osano）
- 在 \`app/privacy/page.tsx:47-53\` 的 Analytics 段落补 cookie 说明——不能只在代码里挂着而政策不提"

create_issue \
  "P0 上线前实测 www → apex 重定向" \
  "P0,ops,seo,launch-blocker" \
"\`middleware.ts:13\` 直接放行 \`www.aurora-tonight.com\`：

\`\`\`ts
if (host === PRIMARY_HOST || host === WWW_HOST) {
  return NextResponse.next();
}
\`\`\`

而全站 canonical 指向 apex（\`lib/site.ts:1\`）。这依赖 Vercel 域名侧配置 308。如果那层没配好，www 会以重复内容形式对外可访问，且 canonical 与实际 host 不一致。

**验收：** \`curl -sI https://www.aurora-tonight.com/ | head -1\` 返回 308，Location 指向 apex。

若平台层不可靠，可在 middleware 里补一道（apex 已是 canonical，多一次重定向无害）。"

# ---------------------------------------------------------------- P1

create_issue \
  "P1 SIGNALS_CONFLICT 门控规则从未实现" \
  "P1,bug,engine" \
"⚠️ **这条会改变实际结论输出，必须走 CI 和 golden 测试，不要在上线当天做。**

## 规格

\`判断引擎｜门控规则.md\` 写得很明确：

> 近窗 OVATION 说 \`none\`、远窗 Kp 说能到：视为冲突 → 今晚最多 MAYBE，confidence low，codes 含 \`SIGNALS_CONFLICT\`。不以远窗 GO 盖掉近窗不到。

## 现状

\`SIGNALS_CONFLICT\` 只作为文案字符串存在（\`lib/aurora-engine/index.ts:46\`、\`engine/snapshot.py:42\`），从未被 emit。两个引擎的 rollup 都是『任一窗口 GO 即 GO』：

\`\`\`ts
// lib/aurora-engine/index.ts:384
const status = !hasGo && hasUnknown && !allNone ? \"UNKNOWN\" : hasGo ? \"GO\" : hasMaybe ? \"MAYBE\" : \"NO\";
\`\`\`

Python 对应 \`engine/snapshot.py:485-492\`。

## 改法

窗口的 \`source\` 字段刚好能区分远近（\`\"ovation\"\` 为近窗，\`\"kp\"\` / \`\"kp_forecast\"\` 为远窗，见 \`index.ts:343\`、\`:351\`），判定条件是现成的：

\`\`\`ts
const nearNoReach = scored.some(
  (w) => w.source === \"ovation\" && w.codes.includes(\"AURORA_NO_REACH\"),
);
const farReaches = scored.some(
  (w) => [\"kp\", \"kp_forecast\"].includes(w.source) && w.status === \"GO\",
);
const conflict = nearNoReach && farReaches;
\`\`\`

命中后把 GO 压到 MAYBE、confidence 置 low、codes 推入 \`SIGNALS_CONFLICT\`。

## 约束

- **Python 与 TS 必须同步改**，两边逻辑目前逐行对应
- 需重新生成 golden fixtures
- **必须新增一个专门的冲突 case**（近窗 none + 远窗 Kp 可达），否则对等测试形同虚设
- CI 已就位（见 PR #11），改动会被自动 gate

先确认冲突判定语义是否符合产品预期，再动手。"

create_issue \
  "P1 搜索表单在无 JS 时完全不可用" \
  "P1,bug,accessibility" \
"\`components/place-search-form.tsx:37-38\` 只有 \`preventDefault\`，form 没有 \`action\` / \`method\`，input 没有 \`name\`。无 JS 时提交等于什么都不做——而这是核心转化路径。

## 改法

好消息是 \`lib/place-search.ts\` 是纯函数 + 本地 JSON 字典，**服务端可以原样跑**，不用重写查找逻辑。

加一个只做重定向的 route handler：

\`\`\`ts
// app/api/search/route.ts
export function GET(request: Request) {
  const q = new URL(request.url).searchParams.get(\"q\") ?? \"\";
  const result = findPlace(q);
  if (result.kind === \"error\") return NextResponse.redirect(new URL(\"/near-me\", request.url));
  return NextResponse.redirect(
    new URL(result.kind === \"slug\" ? \`/forecast/\${result.slug}\` : routeForPlace(result.place), request.url),
  );
}
\`\`\`

表单加上原生属性，JS 仍照常拦截（快路径不变）：

\`\`\`tsx
<form className=\"place-search-form\" method=\"get\" action=\"/api/search\" onSubmit={handleSubmit}>
  <input id=\"page-place-search\" name=\"q\" type=\"search\" ... />
\`\`\`

放在 \`/api/\` 下正好被 \`robots.ts\` 排除，不会产生可索引的垃圾 URL。

注意 \`components/find-place.tsx\` 有一份几乎重复的搜索逻辑，一并处理或考虑抽公共 hook。"

create_issue \
  "P1 OG / Twitter 元数据覆盖不全" \
  "P1,seo" \
"\`app/opengraph-image.png\` 本身没问题（1200×630，已被 git 跟踪），缺的是引用。

- 首页 \`app/page.tsx:32-36\` 的 \`openGraph\` 只有 title 和 description，**没有 \`url\` 和 \`images\`**
- \`/near-me\`、三个 guides、\`/methodology\`、\`/privacy\`、\`/terms\` **完全没有 \`openGraph\` 块**
- 全站没有任何 \`twitter\` 元数据，分享卡片会退化成小图

## 改法

在 \`lib/site.ts\` 导出工厂函数，各页调用：

\`\`\`ts
export const ogFor = (path: string, title: string, description: string) => ({
  type: \"website\" as const,
  url: \`\${SITE_URL}\${path}\`,
  title,
  description,
  images: [{ url: \"/opengraph-image.png\", width: 1200, height: 630 }],
});
\`\`\`

顺带全站加上 \`twitter: { card: \"summary_large_image\" }\`。"

create_issue \
  "P1 sitemap 缺少 lastModified" \
  "P1,seo" \
"对一个 10 分钟更新一次的预报站，\`app/sitemap.ts\` 现在连 \`lastModified\` 都没有（\`:17-24\` 只输出裸 URL），等于主动放弃新鲜度信号。

15 个预报页可以直接取 bundle 的 \`generated_at\`：

\`\`\`ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data } = await loadLatestWithMeta();
  const lastModified = new Date(data.generated_at);
  // 预报页用 lastModified；guides / legal 用构建时间
}
\`\`\`

注意这会让 sitemap 变成动态路由，需要配 \`revalidate = 600\` 与其他页面保持一致。"

# ---------------------------------------------------------------- P2

create_issue \
  "P2 合并 PR #10 以正式退役快照 workflow 的 cron" \
  "P2,ops" \
"**这件事已经有人做了，只是 PR 还挂着没合。**

cron 实际已停（最后一次快照提交停在 2026-08-23 11:17），但 \`.github/workflows/refresh-aurora-snapshots.yml\` 在 \`main\` 上仍带着 cron 表达式（\`:5\`）和 \`contents: write\`（\`:12-13\`）。一旦被误启用，就是每 10 分钟一次 push 加一次 Vercel 重新部署。

PR #10 \`chore: retire snapshot refresh scheduler\` 已经完整覆盖：删掉 \`schedule:\` 块、只保留 \`workflow_dispatch\`、\`contents: write\` 降为 \`read\`、移除 push 步骤。

**行动：** 复核并合并 PR #10，不需要另写代码。

135 个提交里 106 个是快照提交、\`.git\` 已 29MB 这件事**不建议处理**——历史重写的风险远大于收益。"

create_issue \
  "P2 文案漂移：硬编码字符串与未使用的 copy key" \
  "P2,documentation" \
"\`content/ui-copy.json\` 号称是 frozen copy 的唯一来源，但存在双向漂移。

## 应该来自 copy 文件却硬编码的

- \`app/page.tsx:45\` 首页 h1 \`\"Can You See the Northern Lights Tonight?\"\`
- \`app/page.tsx:72\` \`\"How to read GO / MAYBE / NO\"\`
- \`app/near-me/page.tsx:22\` h1
- \`app/view/page.tsx:75\` h1、\`:86\` 硬编码的 \`\"Updated —\"\`
- \`components/verdict-card.tsx:79,83,91\` 的 \`\"Best window\"\` / \`\"Main issue\"\` / \`\"Confidence\"\`（只有 \`\"Look toward\"\` 用了 copy）

## 定义了却从未被引用的 key

- \`errors.search_not_us\`（\`lib/place-search.ts\` 没有任何代码路径会触发）
- \`chrome.open\`

\`chrome.try_again\` 原本也在此列，已在 PR #11 的错误页中启用。"

create_issue \
  "P2 npm audit 3 个 high（传递依赖，暂不处理）" \
  "P2,security" \
"\`npm audit\` 报 3 个 high，全是 \`next@15.5.23\` 的传递依赖：

- **postcss** \`<=8.5.22\` — 源码映射相关的 XSS 与任意文件读取
- **sharp** \`<0.35.0\` — libvips CVE

修复路径是 \`next@16.3.2\`，属于跨大版本升级。

## 建议：上线前不动

本站没有用户上传的 CSS 或图片、也没用 \`next/image\`，两个包都只在构建期与 OG 图片管线里出现，实际可利用性接近零。为此在上线前跳大版本，风险远大于收益。

**处理时机：** 等 next 16 稳定后随常规升级一起做，届时需要跑一遍 \`需求｜v1-Codex实现.md\` 第 8 节的验收清单。"

printf '\n完成。\n'
