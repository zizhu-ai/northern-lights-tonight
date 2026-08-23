你是实现审计员。只审 **Part 2**：全站壳 + Find place + VerdictCard。不要审未实现的 forecast 页。

只读：
- `app/layout.tsx` `app/globals.css` `app/page.tsx` `app/robots.ts`
- `components/site-chrome.tsx` `components/find-place.tsx` `components/verdict-card.tsx` `components/share-button.tsx`
- `lib/place-search.ts`
- `content/ui-copy.json`
- `需求｜v1-Codex实现.md` §4.1、§4.3 卡字段、§11 匹配顺序、冻结 2–4 条

核对：
1. 无登录；robots 仍 Disallow /；无 IP 预填；GPS 只在点击后。
2. Find place：空/ZIP/别名/slug；3 位小数 view；南纬走 /view；失败留在层内；不调外部地理编码。
3. VerdictCard：四态+UNAVAILABLE 文案来自 ui-copy；alaskaKicker 在人话上方；stale 用 stale_main_issue；status 在 SSR HTML。
4. 皮肤浅页+夜卡 token，无地图/粒子/百分数。

分级同上一轮：严重=违反红线；中等=两个执行者让本部分验收失败。轻微最多 5，不挡。

结论只能是「0 严重 0 中等。Part 2 通过，可继续下一部分。」或列出剩余 S/M。

禁止改文件。中文。
