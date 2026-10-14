# Keel demo

A browser-only demo of Keel: contracts, AI register, tribunal risk, account research and board packs in one product, with the 90-day Horizon on Home. All data is fictional and stays in the browser (`localStorage`, key `keel-demo-v1`).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, strict |
| `npm test` | Vitest unit tests for `lib/logic` |
| `npm run test:e2e` | Playwright end-to-end tests and screenshots (builds and starts the app on port 3100) |

Screenshots of every page at 375, 768 and 1440px in light and dark mode are written to `tests/screenshots/`.

See `PLAN.md` for phases and decisions, and `DESIGN_TOKENS.md` for the Untitled UI tokens pulled from Figma.
