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
| 4 | Home and the Horizon | Done |
| 5 | Contracts | Done |
| 6 | AI register | Done |
| 7 | Tribunal risk | Done |
| 8 | Account research | Done |
| 9 | Board pack | Done |
| 10 | The case for Keel | Done |
| 11 | Responsive, accessibility, edge-case and dark mode passes | Done |
| 12 | Playwright tests, build, deploy | Done |

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
- **Horizon layout.** The brief's single track with dots stacked on three lanes read as noise with 26 deadlines. The Horizon now has one row per tool, with labels and counts, small plain dots and weekly gridlines. Deadlines behind an open alert get a ring in the tool's colour, explained in a small key. Row labels replace the colour legend. Row labels stay pinned while the track scrolls sideways on phones.
- **Dates.** Contract dates are stored as ISO dates. If the demo is opened on a later day, every stored date shifts forward by the same number of days so the demo never goes stale. Everything else is stored as a day offset from today, as in the brief's types.
- **AI paperwork.** Each tool stores a paperwork percentage. On first open, the first `round(% x duties)` duties are ticked; from then on the percentage is derived from the ticks.
- **Mark as checked.** On a contract with a renewal date, this clears the low-confidence fields, so its status follows the normal rules. Without a date it refuses with a warning toast.
- **Uploaded contract status.** An upload renews in 118 days with 90 days notice, so its notice falls 28 days out. Once "Annual value" is checked it shows as Notice due, which is correct by the rules.
- **`c2` office lease.** Its notice falls exactly 30 days out, so by the rules it is Notice due on the day the demo loads.
- **Prospect domains** use `.example`, as in the prototype.
- **Board pack due** is the meeting date minus 5 days.
- **AI paperwork display.** A seeded tool keeps its register percentage (MoodLens shows 10%) until a duty is ticked, because rounding 10% of three duties ticks none. From the first tick the percentage follows the ticks.
- **Save as not assessed.** The wizard's step-two error says "go back and save it as not assessed", so step one has a "Save as not assessed" link.
- **Reassess.** Opens the wizard at step two with no uses ticked. Back reaches step one, and name, vendor and owner edits are saved with the new tier.
- **Account search.** Only a full name or full domain counts as an exact match. "Orbitex" alone shows suggestions.
- **Toasts on phones** drop in from the top, so they never cover a drawer's sticky footer or the bottom sheet. On larger screens they sit bottom right and move above the open tray.
- **Upload cancel.** Footer buttons are disabled while Keel extracts, as the brief says. Closing the dialog (close button, Escape or backdrop) cancels the extraction and says nothing was added.
- **Contrast.** Primary buttons use orange 700 (hover 800) instead of the brief's orange 600, so white button text is about 5.2:1 and passes AA. This is set once on the `bg-brand-solid` token, so checkbox ticks, the tray count and chat bubbles follow. The logo and favicon stay orange 600. The pitch hero also uses orange 700.
- **Breakpoints** `nav` (860px) and `split` (1080px) are defined in rem so Tailwind orders them after its own breakpoints.
- **Next.js config.** `cacheComponents` and partial prefetching from the scaffold were removed. The app is fully client-rendered after hydration because all data lives in the browser, so they add nothing and complicate `useSearchParams`.

## Deployment

Production: https://keel-demo-tau.vercel.app (Vercel project `keel-demo`, team "Dan's projects", linked to `Git-Dann/keel`). The project was imported in the Vercel dashboard because the build session's Vercel connection could not create projects. Every push redeploys. The Playwright suite passes against the production URL.
