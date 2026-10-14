# Keel demo: build plan

Keel is a demo B2B platform for the COO or head of operations at a 50 to 500 person company. It brings five tools (Contracts, AI register, Tribunal risk, Account research, Board pack) into one product, tied together by the Horizon on Home. Everything runs in the browser with fictional data.

## Stack

- Next.js 16 (App Router), React 19, TypeScript strict
- Tailwind CSS 4 with the Untitled UI v8 theme (`styles/theme.css`) and primitives pulled from Figma (`styles/primitives.css`)
- Untitled UI React components (vendored by their CLI into `components/ui/untitled`) on React Aria Components
- Untitled UI icons, Zustand with `persist` (`keel-demo-v1`), date-fns (`en-GB`)
- Vitest for `lib/logic`, Playwright for end-to-end and screenshots

## Phases

| # | Phase | Status |
|---|---|---|
| 1 | Project setup, tokens, fonts, theme, base components | Done |
| 2 | App shell: sidebar, top bar, command palette, tray, toasts, tooltips, dialogs, routing, shortcuts | Done |
| 3 | Data model, seed data, store, business logic with unit tests | Done |
| 4 | Home and the Horizon | |
| 5 | Contracts | |
| 6 | AI register | |
| 7 | Tribunal risk | |
| 8 | Account research | |
| 9 | Board pack | |
| 10 | The case for Keel | |
| 11 | Responsive, accessibility, edge-case and dark mode passes | |
| 12 | Playwright tests, build, deploy | |

Phase 3 was committed before phase 2 because the shell's nav badges, alerts and palette read from the store.

## Components

Shell (`components/shell`): `AppShell`, `Sidebar` (static aside on desktop, React Aria drawer below 860px), `TopBar`, `CommandPalette` (combobox and listbox), `Tray` (Activity, Alerts, Ask Keel, Shortcuts), `Toasts`, `KeyboardShortcuts`, `ResetConfirm`, `GlobalModals` (upload, AI wizard), `Logo`, `Providers`.

Shared UI (`components/ui`): `Tooltip` (hover, focus, Escape, hoverable, flips), `HelpTip`, `StatusBadge` (Untitled badge with dot), `ModalDialog`, `Drawer`, `ConfirmDialog` (React Aria modals: focus trap and restore, Escape, backdrop), `PageHeader`, `Card`, `CardHeader`, `Callout`, `HelperBanner`, `Kpi`, `EmptyState`, `ProgressBar`, `Skeleton`, `Spinner`, `Segmented`, `Sparkline`.

Logic (`lib/logic`): `contracts`, `ai`, `tribunal`, `board`, `alerts`, `horizon`, `accounts`, `askKeel`. All pure, all unit tested.

## Decisions and assumptions

- **Brief path.** The brief referenced a local macOS path that is not in this cloud container; the copy in the prompt was used.
- **Reference prototype.** Copy, obligations, clauses, tooltips and edge cases follow the prototype artifact. Where the prototype and the brief disagree, the brief wins (for example "Any high-risk HR cases?" now answers about HR, where the prototype matched it to AI tools).
- **Design tokens.** The v8 Figma file maps gray to its Neutral scale, success to Green, warning to Yellow and error to Red. The Figma brand scale (purple) is swapped for Orange, as the brief asks. See `DESIGN_TOKENS.md`.
- **Untitled UI components.** Pulled with `npx untitledui add` (button, badges, checkbox, input, native select, toggle, tabs, modal, slideout, tooltip). Unused files that came with them (payment icons, avatars, tag inputs) were removed. The tooltip is a small custom component styled to the Untitled tooltip, because the brief needs hoverable, tap-to-toggle and flip behaviour that the React Aria tooltip does not give.
- **Theme key.** The light or dark choice is stored in `keel-theme`, separate from `keel-demo-v1`, so the script in `<head>` can read it before first paint without parsing the workspace.
- **Dates.** Contract dates are stored as ISO dates. If the demo is opened on a later day, every stored date shifts forward by the same number of days so the demo never goes stale. Everything else is stored as a day offset from today, as in the brief's types.
- **AI paperwork.** Each tool stores a paperwork percentage. On first open, the first `round(% x duties)` duties are ticked; from then on the percentage is derived from the ticks.
- **Mark as checked.** On a contract with a renewal date, this clears the low-confidence fields, so its status follows the normal rules. Without a date it refuses with a warning toast.
- **Uploaded contract status.** An upload renews in 118 days with 90 days notice, so its notice falls 28 days out. Once "Annual value" is checked it shows as Notice due, which is correct by the rules.
- **`c2` office lease.** Its notice falls exactly 30 days out, so by the rules it is Notice due on the day the demo loads.
- **Prospect domains** use `.example`, as in the prototype.
- **Board pack due** is the meeting date minus 5 days.
- **Next.js config.** `cacheComponents` and partial prefetching from the scaffold were removed. The app is fully client-rendered after hydration because all data lives in the browser, so they add nothing and complicate `useSearchParams`.

## Deployment

The container has no Vercel CLI login, so `vercel link` and `vercel deploy --prod` are replaced by a Vercel project called `keel-demo` created through the Vercel integration and linked to the GitHub repository. Production builds come from the repository.
