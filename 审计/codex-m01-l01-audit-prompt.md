You are auditing a shortest-path fix. Read-only. Do not edit files, commit, or deploy.

Repo: Northern Lights Tonight (this working tree).
Finding source: `审计/codex-nlt-sim-user3.md` (Codex simulated-user test on production).

# What was supposed to be fixed

**M-01 (medium):** `/forecast/chicago` verdict is `NO` / “Not worth a special trip tonight.” The first “What to do” bullet is evergreen `leave_city_advice` from `地点档案/wave1.json`. It used to start with `Yes. Downtown, the Loop...`, which reads as permission to go out on a NO night.

Expected: that bullet must not open with an unconditional Yes. Conditional/evergreen leaving-town advice is OK (e.g. “If you go out anyway…”). Do not invent a new status-gated module. Do not LLM-rewrite the rest of the dossier.

Same class of opener also existed on Fairbanks (`Yes, even here.`) and Alaska (`yes: get out of Fairbanks glow`). Those sit in the same What to do slot and should not say Yes either. Maine FAQ answer “Yes. Darker…” is NOT in What to do; leaving it is correct.

**L-01 (low):** On 375×667 the sticky header wordmark ellipsized to `Northern Lights Toni…` because `.wordmark` overflow + a 389px `max-width: 142px` on the text span. Expected: full `Northern Lights Tonight` (from `content/ui-copy.json` `chrome.wordmark`), or an explicit short brand in copy — not a CSS ellipsis of the frozen name. Do not add a second wordmark string. Do not hide Find place.

# Read

- `审计/codex-nlt-sim-user3.md` (M-01, L-01)
- `地点档案/wave1.json` chicago / alaska / fairbanks `leave_city_advice`
- `app/forecast/[slug]/page.tsx` What to do list
- `app/globals.css` `.wordmark` and the `max-width: 767px` / `389px` header rules
- `components/site-chrome.tsx`
- `content/ui-copy.json` `chrome.wordmark`
- `需求｜v1-Codex实现.md` freeze: English UI from files, no model-written copy; conclusion card fields unchanged

# Audit questions

Two competent implementers following the finding + freeze must not ship different products.

1. Does Chicago What to do still start with `Yes.`? If the JSON changed but the page hardcodes old text, fail.
2. Did the fix rewrite unrelated dossier fields (FAQs, H1, titles, other cities’ advice)?
3. Is What to do still `dossier.leave_city_advice` (not a new status-specific paragraph invented in the page)?
4. Fairbanks / Alaska What to do: still an unconditional Yes opener, or fixed?
5. L-01: can 375px still ellipsis the frozen wordmark via remaining CSS? Would Find place lose its 44px target?
6. Any freeze break: new login/map/%, robots, request-path compute, IP homepage?

Severity: S = still a wrong go-out reading on a money page. M = finding not actually fixed, or fix creates a new main-path split. L = leftover nits.

# Output

Markdown in Chinese. Quote English UI as-is.

# Codex 实现审计 · M-01 / L-01

- 范围、读过的文件
- 缺陷列表：id / S|M|L / 文件:行 / 两个执行者如何分叉 / 最短修法
- 若 0 严重 0 中等：写明 M-01、L-01 已落地且不扩大范围
- 未读的标未读，禁止假装测过生产部署（Vercel 可能尚未吃到这次 commit）
