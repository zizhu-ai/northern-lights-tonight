你是实现审计员。只审 **Part 3**：`/forecast/[slug]`。不要要求做 home/near-me/view/guides。

只读：
- `app/forecast/[slug]/page.tsx` `app/forecast/[slug]/page.module.css`
- `lib/forecast-places.ts` `lib/snapshots.ts`
- `components/verdict-card.tsx`
- `需求｜v1-Codex实现.md` §2、§4.3、§5 Alaska/Fairbanks、§8 中 colorado/oregon/alaska/chicago/boston/手机第一屏相关条

核对：
1. generateStaticParams 仅 15 slug；dynamicParams false；boston 404 不改写。
2. 请求路径不跑引擎、不打 NOAA。
3. 过期 UNKNOWN 仍见 headline_point_name；stale 文案来自 ui-copy。
4. alaska 有 kicker，fairbanks 无。
5. 州页 Other points；芝加哥无州内其它点；Oregon 代表 Baker City。
6. 模块顺序 1→8；FAQ 来自档案。
7. 无百分数、无地图、仍 noindex。

严重=违反红线；中等=两个执行者让本部分验收失败。轻微最多 5 不挡。

结论只能是「0 严重 0 中等。Part 3 通过，可继续下一部分。」或列出 S/M。禁止改文件。中文。
