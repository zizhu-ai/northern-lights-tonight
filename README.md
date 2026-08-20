# Northern Lights Tonight

US-English local aurora **GO / MAYBE / NO** tool + state/city SEO pages.

This repo is the product. The public site is **not indexed yet** (`robots.txt` disallows all).

## Status

- Spec frozen. **Implementation contract for Codex:** `需求｜v1-Codex实现.md` (English stub: `CODEX-HANDOFF.md`).
- Snapshot engine: `python3 engine/snapshot.py`
- GitHub → Vercel is live and **noindex** (`https://northern-lights-tonight.vercel.app`).
- Real product HTML (forecast pages, near-me, guides) is the next build, not this stub.

## Develop

```bash
npm install
npm run dev
```

Refresh snapshots:

```bash
npm run snapshot
```
