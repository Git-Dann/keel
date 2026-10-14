# Design tokens

Source: Untitled UI Figma file "❖ Untitled UI Figma – PRO VARIABLES (v8.0)", file key `eE8CjxDnMcBDg7Yj6KfF9Q`. Variables were read with the Figma plugin API from the local collections `_Primitives`, `1. Color modes` (Light mode, Dark mode), `2. Radius` and `3. Spacing`.

In code:

- `styles/primitives.css` holds the primitive scales below as exact hex values, overriding Tailwind's defaults.
- `styles/theme.css` is the Untitled UI v8 theme from their CLI, with brand mapped to orange. Its semantic tokens match the Figma `1. Color modes` collection. Dark mode applies under `:root[data-theme="dark"]`.
- `app/globals.css` adds Keel's layer: fonts, module colours (pointing at primitives) and the focus ring.

## Primitive scales

| Step | Neutral (gray) | Orange (brand) | Yellow (warning) | Red (error) | Green (success) | Blue | Violet | Teal |
|---|---|---|---|---|---|---|---|---|
| 50 | #fafafa | #fff7ed | #fefce8 | #fef2f2 | #f0fdf4 | #eff6ff | #f5f3ff | #f0fdfa |
| 100 | #f5f5f5 | #ffedd5 | #fef9c3 | #fee2e2 | #dcfce7 | #dbeafe | #ede9fe | #ccfbf1 |
| 200 | #e5e5e5 | #fed7aa | #fef08a | #fecaca | #bbf7d0 | #bfdbfe | #ddd6fe | #99f6e4 |
| 300 | #d4d4d4 | #fdba74 | #fde047 | #fca5a5 | #86efac | #93c5fd | #c4b5fd | #5eead4 |
| 400 | #a3a3a3 | #fb923c | #facc15 | #f87171 | #4ade80 | #60a5fa | #a78bfa | #2dd4bf |
| 500 | #737373 | #f97316 | #eab308 | #ef4444 | #22c55e | #3b82f6 | #8b5cf6 | #14b8a6 |
| 600 | #525252 | #ea580c | #ca8a04 | #dc2626 | #16a34a | #2563eb | #7c3aed | #0d9488 |
| 700 | #404040 | #c2410c | #a16207 | #b91c1c | #15803d | #1d4ed8 | #6d28d9 | #0f766e |
| 800 | #262626 | #9a3412 | #854d0e | #991b1b | #166534 | #1e40af | #5b21b6 | #115e59 |
| 900 | #171717 | #7c2d12 | #713f12 | #7f1d1d | #14532d | #1e3a8a | #4c1d95 | #134e4a |
| 950 | #0a0a0a | #431407 | #422006 | #450a0a | #052e16 | #172554 | #2e1065 | #042f2e |

The file's own Brand scale is purple (#7f56d9 at 600). Keel swaps it for Orange, as the brief asks.

## Semantic colours (light / dark)

| Token | Light | Dark |
|---|---|---|
| text-primary | Neutral 900 #171717 | Neutral 50 #fafafa |
| text-secondary | Neutral 700 #404040 | Neutral 300 #d4d4d4 |
| text-tertiary | Neutral 600 #525252 | Neutral 400 #a3a3a3 |
| text-quaternary | Neutral 500 #737373 | Neutral 400 #a3a3a3 |
| text-placeholder | Neutral 500 | Neutral 500 |
| text-brand-secondary | Brand 700 | Neutral 300 |
| text-error-primary | Red 600 | Red 400 |
| text-warning-primary | Yellow 600 | Yellow 400 |
| text-success-primary | Green 600 | Green 400 |
| border-primary | Neutral 300 | Neutral 700 |
| border-secondary | Neutral 200 | Neutral 800 |
| border-brand | Brand 500 | Brand 400 |
| bg-primary | white | Neutral 950 |
| bg-secondary | Neutral 50 | Neutral 900 |
| bg-tertiary | Neutral 100 | Neutral 800 |
| bg-brand-primary | Brand 50 | Brand 500 |
| bg-brand-solid | Brand 600 | Brand 600 |
| bg-brand-solid_hover | Brand 700 | Brand 500 |
| bg-error-primary | Red 50 | Red 950 |
| bg-warning-primary | Yellow 50 | Yellow 950 |
| bg-success-primary | Green 50 | Green 950 |
| fg-quaternary | Neutral 400 | Neutral 500 |
| fg-brand-primary | Brand 600 | Brand 500 |
| focus-ring | Brand 500 | Brand 500 |

Badges and callouts use the Untitled `utility-*` tokens, which invert in dark mode (for example `utility-yellow-50` is Yellow 950 in dark mode and `utility-yellow-700` is Yellow 300).

## Keel brand rules

| Use | Token |
|---|---|
| Primary button | bg-brand-solid (Orange 600), hover Orange 700 |
| Focus ring | Orange 500 at 24% opacity, 4px (`--ring-brand`); keyboard focus also gets a 2px Orange 500 outline so it stays visible |
| Selected nav | bg-brand-primary_alt (Orange 50), text-brand-secondary (Orange 700) |
| Warnings | Untitled yellow, never orange |
| Contracts | Orange 500 |
| AI register | Violet 600 |
| Tribunal risk | Red 600 |
| Account research | Blue 600 |
| Board pack | Teal 600 |

## Radius (`2. Radius`)

| Token | px |
|---|---|
| radius-xxs | 2 |
| radius-xs | 4 |
| radius-sm | 6 |
| radius-md | 8 |
| radius-lg | 10 |
| radius-xl | 12 |
| radius-2xl | 16 |
| radius-3xl | 20 |
| radius-4xl | 24 |
| radius-full | 9999 |

## Spacing (`3. Spacing`)

| Token | px |
|---|---|
| spacing-xxs | 2 |
| spacing-xs | 4 |
| spacing-sm | 6 |
| spacing-md | 8 |
| spacing-lg | 12 |
| spacing-xl | 16 |
| spacing-2xl | 20 |
| spacing-3xl | 24 |
| spacing-4xl | 32 |
| spacing-5xl | 40 |
| spacing-6xl | 48 |
| spacing-7xl | 64 |
| spacing-8xl | 80 |
| spacing-9xl | 96 |
| spacing-10xl | 128 |
| spacing-11xl | 160 |

Tailwind's 4px spacing scale lines up with these (`p-2` = spacing-md, `p-4` = spacing-xl and so on).

## Shadows (Effects, light mode)

| Token | Value |
|---|---|
| shadow-xs | 0 1px 2px rgb(0 0 0 / 0.05) |
| shadow-sm | 0 1px 3px rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1) |
| shadow-md | 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.06) |
| shadow-lg | 0 12px 16px -4px rgb(0 0 0 / 0.08), 0 4px 6px -2px rgb(0 0 0 / 0.03), 0 2px 2px -1px rgb(0 0 0 / 0.04) |
| shadow-xl | 0 20px 24px -4px rgb(0 0 0 / 0.08), 0 8px 8px -4px rgb(0 0 0 / 0.03), 0 3px 3px -1.5px rgb(0 0 0 / 0.04) |
| shadow-2xl | 0 24px 48px -12px rgb(0 0 0 / 0.18), 0 4px 4px -2px rgb(0 0 0 / 0.04) |
| shadow-xs-skeuomorphic | shadow-xs plus inset 0 0 0 1px rgb(0 0 0 / 0.18) and inset 0 -2px 0 rgb(0 0 0 / 0.05) |

In dark mode the Figma file sets shadow colours to transparent; the theme keeps borders doing that work.

## Typography

- Body: Inter 400, 500, 600 (Figma `font-family-body`). Text sizes from the file: xs 12/18, sm 14/20, md 16/24, lg 18/28, xl 20/30.
- Headline: Gruppo 400, used only for page titles (44px desktop, 36px mobile), the Home greeting, KPI numbers and pitch headings. Gruppo is Keel's addition, not part of the Untitled file.
