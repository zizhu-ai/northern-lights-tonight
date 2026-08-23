You are implementing ONLY Part 5: evergreen guide pages and methodology.

Read:
- `需求｜v1-Codex实现.md` §4.7, §5 titles
- `content/guides/best-time-to-see-northern-lights.md`
- `content/guides/how-to-see-northern-lights.md`
- `content/guides/methodology.md`
- existing `app/guides/where-to-see-northern-lights/page.tsx` (reuse patterns)

## Must
1. Routes:
   - `/guides/best-time-to-see-northern-lights`
   - `/guides/how-to-see-northern-lights`
   - `/methodology` (file is `content/guides/methodology.md`)
2. Title/H1 from each file frontmatter AND §5 table (they match).
3. Render **reader body only** (after `---` frontmatter). Do not invent paragraphs. Preserve links.
4. Top “Check tonight” already in the markdown; keep it.
5. Article JSON-LD for guides; methodology can be WebPage. robots noindex.
6. No extra CSS framework. Reuse `app/part4.module.css` or a small article class.
7. Do not add remark/rehype unless already in package.json (it is not). A tiny local markdown renderer is OK.

## Do not
- Change engine, robots Disallow, forecast, commit/push
- Open indexing
- Rewrite English

## Done when
`npx tsc --noEmit` passes. Print files changed.
