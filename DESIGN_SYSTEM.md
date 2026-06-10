# AuditLens — Design System

A dark, institutional-trust design language for a high-stakes regulatory tool — the density of a
developer/observability tool with the polish of an executive dashboard. Built from a Google Stitch
**Material 3** token set (accent purple) and implemented with Tailwind in
[`public/index.html`](public/index.html).

> Aesthetic: *"watchful intelligence"* — calm, precise, authoritative. Structural lines and
> purposeful colour coding guide the auditor's eye to compliance drift, never decoration.

## Colour

Anchored in a deep nocturnal navy to reduce eye strain during long monitoring sessions. Depth comes
from **tonal stepping + 1px low-contrast outlines**, not heavy shadows.

| Role | Token | Hex |
|---|---|---|
| Background (L0) | `surface` | `#0C0F1A` |
| Card surface (L1) | `surface-container` | `#141825` |
| In-card / nested (L2) | `surface-container-high` | `#1F2937` |
| Hairline border | `outline-variant` | `#4a4455` |
| Text primary | `on-surface` | `#e8dfee` |
| Text secondary | `on-surface-variant` | `#ccc3d8` |
| Muted | `outline` | `#958da1` |
| **Primary** (brand / interactive) | `primary` | `#d2bbff` |
| Primary container (buttons) | `primary-container` | `#7c3aed` |
| Secondary (links / technical) | `secondary` | `#adc6ff` |

### Semantic — reserved strictly for compliance status

These appear **only** to signal health or risk, never as decoration:

| Meaning | Hex |
|---|---|
| ✅ Compliant / Pass | `#34d399` (success green) |
| ⚠️ At Risk / Warning | `#ffb784` (tertiary orange) |
| ⛔ Violation / Critical | `#ffb4ab` (error red) |

## Typography

**Inter** for everything (max legibility at small sizes for dense tables); **monospace** for trace
IDs, scores, and raw data.

| Style | Size / Line / Weight | Use |
|---|---|---|
| `display-lg` | 48 / 56 / 700 · -0.02em | Headline compliance scores (the big gauge %) |
| `headline-md` | 24 / 32 / 600 | Section + page titles |
| `title-md` | 18 / 24 / 500 | Card titles |
| `body-md` / `body-sm` | 16·14 / 24·20 / 400 | Content |
| `label-caps` | 12 / 16 / 600 · 0.05em · UPPER | Table headers, metadata labels, chips |
| `mono-data` | 13 / 18 / 400 mono | Trace IDs, scores, model params |

## Spacing & layout

4px base unit; 8px-based rhythm. Tokens: `base 4 · xs 8 · sm 12 · md 16 · gutter 20 · lg 24 · xl 32`.
A **12-column fluid grid** for the dashboard (cards span 3/4/6/12).

- **Desktop** 12 cols, 24px margins · **Tablet** 6 cols, 16px · **Mobile** 2 cols, 12px (sidebar
  collapses to a hamburger drawer; the approval bar goes full-width).

## Shape & elevation

- **Soft, professional rounding.** Buttons / inputs / chips `4px`; cards `8–12px`; gauges are perfect
  circles (50%) to contrast the rectangular grid.
- **Elevation = tonal layers + 1px outlines**, not drop shadows. Optional shadow is subtle and
  background-tinted (`0 4px 20px rgba(0,0,0,.5)`). Overlays add a 10% backdrop blur (`glass-card`).

## Components

- **Gauges** — circular SVG progress rings, stroke = semantic colour, `headline`/`display` % in the
  centre. Animated `stroke-dashoffset` on load.
- **Data tables** — high density; `label-caps` headers with a bottom border; subtle row hover
  (`#1F2937`) + a 4px translate micro-interaction.
- **Status chips** — low-saturation background + high-saturation text of the same semantic hue
  (dark-red bg / light-red text for "Violation").
- **Buttons** — Primary: solid `#7c3aed`, white text; Secondary: outlined. Active `scale(0.98)`.
- **ApprovalBar** — fixed bottom bar, primary border glow; the human-in-the-loop gate.
- **Judge Tour** — spotlight overlay (`box-shadow: 0 0 0 9999px` cutout) + stepper card; drives the
  app for hands-free demos (`?tour=auto`).

## Motion

Purposeful and quick. `cubic-bezier(.4,0,.2,1)`, 200–350ms for transitions; 1.2s ease for gauge
fills. Nothing bounces — this is a precision instrument.

## Tokens in code

The full palette, type scale, and spacing live in the Tailwind config at the top of
[`public/index.html`](public/index.html); the original Stitch reference screens are in
`stitch_auditlens_eu_ai_dashboard/`.
