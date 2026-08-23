# Audit: Northern Lights Tonight visual v2 — ship or block

You are Codex gpt-5.6-sol. Independent design+implementation auditor. Read-only. Do not edit files, commit, or push.

Work from this directory as the product root:

`/Users/zizhu/AGI/1-出海AI产品/产品-northern lights tonight`

## What to read (use tools)

**Proposed visual (the scheme under review):**
- `视觉稿/v2/index.html`
- `视觉稿/v2/tokens.css`
- `视觉稿/v2/home.html`
- `视觉稿/v2/forecast-colorado.html`
- `视觉稿/v2/states.html`
- `视觉稿/v2/shots/home-desktop-fold.png`
- `视觉稿/v2/shots/home-mobile.png`
- `视觉稿/v2/shots/forecast-desktop-fold.png`
- `视觉稿/v2/shots/forecast-mobile.png`
- `视觉稿/v2/shots/states-desktop.png`

**Frozen product constraints (must not be broken by the visual):**
- `架构与线框｜v1.md` (URLs, module order, no login, no map)
- `设计｜视觉与UI规范.md` §2 五条硬规范 and §6 不要做 — treat **information/product rules** as frozen; treat **v1 visual dialect** (Newsreader, Inter, paper/night editorial, aurora mint as brand, uppercase kickers, 3px status stripe, rounded white card shells) as **explicitly rejected**. The user approved a new visual, not a restyle of that dialect.
- `PRD｜Northern Lights Tonight.md` job: local go/maybe/no, window, obstacle, worth going out.

**Current production to judge implementation risk:**
- `app/layout.tsx`
- `app/globals.css`
- `app/page.tsx`
- `app/part4.module.css`
- `app/forecast/[slug]/page.tsx`
- `app/forecast/[slug]/page.module.css`
- `components/verdict-card.tsx`
- `components/site-chrome.tsx`
- `components/tonight-places.tsx`
- `components/tonight-places.module.css`
- `components/place-search-form.tsx`

Do not audit the whole repo. Do not re-litigate the engine or SEO IA.

## Locked design decisions (already confirmed by product)

1. Primary scene: afternoon, indoors, fluorescent/daylight, deciding whether to go out tonight; may screenshot to a group chat. Not night-in-the-field first.
2. Verdict object: a dark visor/fridge slip on a white desk. Not a night-sky window, not an all-light stamp, not a card-free bulletin.
3. Color: restrained. Pure white page. Brand hue is moss/wet-stone (~OKLCH hue 140), not CGI aurora mint. Chromatic color lives on the slip word and GO stamps. Identity must still look trustworthy on a NO night.
4. Type: Archivo only. Status words condensed extra-bold. No Newsreader, no Inter, no Atkinson (slashed zeros broke clock times).
5. No stock aurora photos, no maps, no Kp gauges, no percent rings, no glassmorphism, no gradient text.
6. Status is word + color + shape (stamp), never color alone. NO is gray, not alarm red. Red is for true errors only.
7. SSR: GO/MAYBE/NO/UNKNOWN, window, and main issue must remain in HTML if CSS is off.
8. Touch 44px. Body text contrast ≥ 4.5:1. Large status words ≥ 3:1 on the slip.

## Your job

Decide whether this v2 scheme is safe to implement onto the existing Next.js production app **as the visual system**, without changing URLs, module order, or engine copy.

Look for:

A. **Product/UX breaks** — first screen no longer answers tonight; table/search/share/find-place regress; four-state skeleton breaks; UNKNOWN looks like an error; NO looks like an alarm.
B. **Accessibility** — contrast of moss GO on dark slip, amber MAYBE on dark slip, gray NO on dark slip, muted text on white, placeholder contrast, focus ring, 44px.
C. **Visual integrity** — still category-reflex aurora dashboard, or still 2026 editorial-AI (serif + tracked kickers + paper). Check the screenshots, not just the CSS comments.
D. **Implementation risk** — tokens in `视觉稿/v2/tokens.css` vs `app/globals.css` + CSS modules; font loading; verdict card markup; header mark; light footer vs current dark footer. Flag anything that would silently break production states (stale snapshot, UNAVAILABLE, Alaska kicker, try-again).
E. **Mobile** — at ~390–430px, the slip, Find place, stamps, and Share must remain on-canvas. Headless Chrome in this environment has a 500px floor; judge the HTML/CSS, not a cropped 390 screenshot.

## Output format (markdown, 中文)

```
# 结论
PASS | PASS_WITH_NITS | BLOCK
一句话原因。

# 严重
- ... 或「无」

# 中等
- ... 或「无」

# 轻微
- ... 或「无」

# 执行时必须守住
3–6 条落地约束（给实现者，不是新设计）。

# 不要改
列出本次视觉落地禁止动的产品规则。
```

Rules:
- **BLOCK** if any 严重 issue, or if implementing v2 would violate frozen IA / SSR / four-state skeleton.
- **PASS_WITH_NITS** if only 轻微, or 中等 that can be fixed during implementation without changing the visual contract.
- **PASS** if 0 严重 0 中等.
- Do not invent work. Do not ask to restore Newsreader/Inter or aurora mint as brand.
- Cite file paths and, when useful, screenshot filenames.
- No preamble, no tool log, no “as an AI”.
