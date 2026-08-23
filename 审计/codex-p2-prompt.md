You are implementing ONLY Part 2 of the frozen v1 contract in this Next.js 15 App Router + TypeScript repo.

Read:
- `需求｜v1-Codex实现.md` §4.1 全站壳, §4.3 结论卡字段, §11 Find place 匹配顺序, §5 titles only if you touch metadata
- `设计｜视觉与UI规范.md` tokens and component rules (light page + dark verdict card)
- `content/ui-copy.json` — use these English strings, do not rewrite
- `data/us-places.json` — only lookup source
- `CODEX-HANDOFF.md`
- Current `app/layout.tsx`, `app/page.tsx`, `app/robots.ts`

## Goal
Shared chrome + Find place routing + VerdictCard. Do **not** build `/forecast/[slug]`, `/near-me`, `/view`, or guide pages yet. Keep the homepage stub content inside the new shell so we can see chrome.

## Must implement
1. **Tokens / CSS** matching 设计｜视觉与UI规范.md (ink/paper/night/aurora/maybe/no/unknown). Inter + Newsreader via `next/font`. No aurora photos, maps, particles, percent rings.
2. **Root layout shell**
   - `html lang="en-US"`
   - Sticky header 56px: wordmark → `/`, desktop Tonight `/` · Near me `/near-me` · Guides `/guides/best-time-to-see-northern-lights`, Find place button
   - Mobile: wordmark + Find place only; nav links in footer
   - Footer dark: Tonight · Near me · Guides · How we decide `/methodology` · Not affiliated with NOAA
   - No login. No ads.
   - Metadata robots still noindex. Do not change `app/robots.ts` Disallow `/`.
   - Do **not** IP-prefill. GPS only after click.
3. **Find place overlay**
   - Client island. Input placeholder and errors from `ui-copy.json`
   - Match: empty → `search_empty`; 5-digit ZIP exact; else aliases → name/slug → keys
   - If `slug` set → navigate `/forecast/{slug}`
   - Else US place with lat>=0 → `/view?lat=&lng=&name=` (lat/lng 3 decimal places)
   - `lat < 0` → `/view?lat=&lng=&name=` (UNAVAILABLE handled in Part 4; still navigate)
   - No match → stay in overlay, show `search_no_match` or `zip_not_found`
   - Use my location: geolocation **only on click**; on success nearest place in table (haversine ok); on deny/fail stay and show `gps_denied` / `gps_unavailable`
   - No live geocoder API. No request-path NOAA.
4. **VerdictCard** reusable server-friendly component
   - Fields: status word, human sentence from `verdict.*_human`, Best window, Main issue, Look north, Confidence (High/Medium/Low), Updated, Share
   - Variants: GO | MAYBE | NO | UNKNOWN | UNAVAILABLE (`south` copy)
   - Optional `alaskaKicker` prop; when true render `verdict.alaska_kicker` **above** the human sentence
   - Stale: status UNKNOWN, window `unknown_window`, main issue `stale_main_issue`
   - Share: client small button; copy `share.template` or no-op if unused on stub
   - Status is visible in HTML without JS (the card body is SSR)

## Allowed paths
`app/layout.tsx`, `app/globals.css` (create), `app/page.tsx` (wrap stub in shell only), `lib/**`, `components/**`, `package.json` only if next/font already covered (it is via next). Prefer CSS modules or globals.css. Do not add a CSS-in-JS library.

## Do not
- Implement forecast/near-me/view/guide routes
- Open indexing
- Rewrite engine
- Copy `视觉稿/*.html` into the App Router
- Git commit or push
- Invent English copy

## Done when
- `npx tsc --noEmit` passes, or `npm run build` if tsc is not configured for this
- Layout shows shell on `/`
- Print files changed

Keep the patch as small as Part 2 needs.
