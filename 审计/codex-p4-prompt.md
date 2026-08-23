You are implementing ONLY Part 4: `/`, `/near-me`, `/view`, `/guides/where-to-see-northern-lights`, and a real 404.

Read:
- `需求｜v1-Codex实现.md` §2, §4.2, §4.4, §4.5, §4.6, §5 titles, §8 related checklist
- `content/ui-copy.json` `content/guides/where-to-see-northern-lights.md`
- existing `app/page.tsx`, `lib/snapshots.ts`, `lib/place-search.ts`, `components/*`
- `CODEX-HANDOFF.md`

## Must
1. **Home `/`**
   - Title/H1 from §5 (no Live / Near You).
   - Same HTML for everyone. No IP. Lead from `home.lead`.
   - Search + Use my location using existing Find place logic (can reuse component or a form that uses `findPlace` / GPS same rules). Submit jumps away; does not change this page H1.
   - Tonight in the US: **all 15** Wave 1 rows in SSR HTML (status, name, window, link `/forecast/[slug]`). Sort GO→MAYBE→NO allowed. Mobile cards OK via CSS; data still in HTML.
   - What time / How to read from ui-copy. Link Where / Best time / How to / methodology.
   - robots noindex. Do not change `app/robots.ts` Disallow.

2. **`/near-me`**
   - H1/Title §5. Copy from `near_me.*`. No user-city MAYBE on this HTML.
   - Same search/GPS; on success **redirect** to forecast or view. Querystring near-me URLs stay noindex if they exist (prefer POST/client jump so `/near-me?*` is unused; if searchParams appear, metadata noindex).
   - Wave 1 links list OK.

3. **`/view`**
   - Full site chrome already in layout.
   - Read `searchParams` lat, lng, name. Round display to 3 decimals.
   - `lat < 0`: UNAVAILABLE card (`south` copy), no hours, not GO.
   - Else: **no snapshot files for arbitrary coords in v1** → UNKNOWN + Try again, `view.unknown_main_issue`. Do not compute aurora. Do not call NOAA.
   - Nearby: 1–2 closest Wave 1 slugs by haversine to dossier headline coords.
   - Title `Northern Lights Tonight Near [Name]`; H1 `Tonight near {Name}`.
   - robots: noindex, **follow** (page metadata must override layout follow:false).

4. **Where guide**
   - URL `/guides/where-to-see-northern-lights`
   - Title/H1 §5.
   - Top: 15 snapshot rows grouped GO/MAYBE/NO, links to forecast. Omit empty groups. Do not invent GO.
   - Body: **only reader markdown** after frontmatter in `content/guides/where-to-see-northern-lights.md`. Do not render `do_not_render` / tonight_list instructions.
   - Quiet night: lower half still shows.

5. **404**
   - `app/not-found.tsx` using `not_found.*`. If you can detect boston slug, use boston copy + link massachusetts; else generic + Find place.

## Do not
- Implement best-time / how-to / methodology article pages (Part 5). Links to them may 404 until then.
- Open indexing, rewrite engine, commit/push, invent copy.

## Done when
`npx tsc --noEmit` passes. Print files changed.
