You are implementing ONLY Part 3: `/forecast/[slug]` money pages.

Read:
- `需求｜v1-Codex实现.md` §2 URL, §4.3, §5 titles (Alaska/Fairbanks exceptions), §7 SSR/JSON-LD, §8 checklist items for colorado/oregon/alaska/fairbanks/chicago/boston 404 / mobile first screen
- `地点档案/wave1.json`
- `content/ui-copy.json`
- `components/verdict-card.tsx` `lib/place-search.ts` `lib/snapshots.ts`
- `设计｜视觉与UI规范.md` first-screen rules
- `CODEX-HANDOFF.md`

## Must
1. `app/forecast/[slug]/page.tsx` (and small helpers under `lib/` or `app/forecast/` as needed).
2. `generateStaticParams` = the 15 Wave 1 slugs only. `dynamicParams = false` so unknown slugs **404**. Do not rewrite `/forecast/boston` to massachusetts.
3. SSR: read `snapshots/{slug}.json` + dossier. Never compute aurora. Never fetch NOAA in the request.
4. If `now > valid_until` or file missing: UNKNOWN card per §4.3 (keep H1, kicker, `headline_point_name`, evergreen). File missing main issue = `view.unknown_main_issue`; stale = `stale_main_issue`. Answer line still includes headline point name.
5. Live snapshot: VerdictCard with engine `main_obstacle_text`, formatted window en-US 12h + tz abbreviation (example `10:40 PM MT`). Human from ui-copy. Confidence mapping already in VerdictCard.
6. **Alaska:** `alaskaKicker={true}` on the card. **Fairbanks:** false. Titles from §5 exceptions.
7. Module order 1→8. State pages (`location_type=state`, not chicago): Other points + In this state. City pages: no those blocks; Chicago nearby from dossier. `travel_plus_tonight`: after 1–3, When to come (`best_months_note`) and Which part (state only — use north_south_split / dossier text; do not invent parking lots). FAQ from `local_faqs` + FAQPage JSON-LD. Nearby only Wave 1 slugs.
8. Hours table from `windows[]`: SKIP → not dark yet; default ~5 rows + Rest of the night (client expand OK, all rows in SSR HTML hidden is OK if present in DOM, or first 5 visible + remaining in details). 30-minute slots.
9. Why: reach / clouds / darkness / moon / city glow / data live — from point fields and reason_codes; English from engine templates / dossier, no new LLM copy.
10. Metadata: Title/H1 §5. robots noindex. WebPage + FAQPage + BreadcrumbList. `html lang` already on layout.
11. Oregon headline Baker City via `primary_verdict_point` / `headline_point_name`. Never max() sample points.
12. Visual: light page, dark card already styled. Mobile: status word + Best window visible in first screen CSS as specified (375/390).

## Do not
- Implement `/`, `/near-me`, `/view`, guides (beyond links)
- Open indexing / change robots
- Git commit/push
- Invent FAQs or parking lots
- Create `/forecast/boston`

## Done when
- `npx tsc --noEmit` passes
- Unknown slug uses notFound()
- Print files changed

Extend `lib/snapshots.ts` if you need a per-slug loader with windows/valid_until/points.
