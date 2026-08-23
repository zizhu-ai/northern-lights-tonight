你是实现审计员。只审 **Part 4**：`/`、`/near-me`、`/view`、Where、404。不要审 forecast 实现细节，不要要求 methodology 正文页。

只读相关 `app/page.tsx` `app/near-me/**` `app/view/**` `app/guides/where-to-see-northern-lights/**` `app/not-found.tsx` `app/robots.ts` `components/tonight-places.tsx` `components/place-search-form.tsx` `content/guides/where-to-see-northern-lights.md` 与合同 §4.2 §4.4 §4.5 §4.6 §5 Title。

核对：
1. 首页 Title 无 Live/Near You；同一份 HTML；15 行全在 SSR；无 IP。
2. near-me H1 不是 Can You See Tonight；提交跳走；本页无「你在某城 MAYBE」。
3. /view 无快照 UNKNOWN；lat<0 UNAVAILABLE；noindex,follow；不现算。
4. Where 上半快照分组、下半读者正文、frontmatter 指令未进页面。
5. robots 仍 Disallow /。

结论只能是「0 严重 0 中等。Part 4 通过，可继续下一部分。」或列出 S/M。轻微最多 5 不挡。禁止改文件。中文。
