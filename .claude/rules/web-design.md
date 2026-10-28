---
paths:
  - "apps/web/src/**/*.{tsx,jsx,css}"
---

# Web UI design rules — "Portal Intelligence"

All UI in `apps/web` follows the Portal Intelligence theme: a dark-first, calm "scientific console". It should read easily, show data densely, and use controlled luminescence instead of neon.

## Sources

- Spec: `designs/portal_intelligence/DESIGN.md`.
- Reference screens: `designs/<screen>/code.html` plus `screen.png`. The screens are `characters_explorer` (mobile), `characters_explorer_desktop`, `rick_sanchez_profile` (mobile) and `rick_sanchez_profile_desktop`. Before you build or restyle a screen, open its matching reference.
- The references are Tailwind v3 CDN mockups. Port their layout and class intent, not their markup verbatim, and do not keep their remote image URLs.

## Decisions already made (do not re-litigate)

- **Colors come from the implemented tokens** below, not the slate hexes in the DESIGN.md prose. For example, the canvas is `#0b1326`, not `#0F172A`.
- **Dead status is Rose `#F43F5E`**, per the spec and the mobile screen. The gray "dead" on the desktop explorer is an outlier.
- **Solid primary fills (`#10b981`) take a dark label (`#0b1326`).** The mockups put white on `#10b981`, which is about 2.5:1 contrast and fails WCAG.
- **Dark only.** There is no light theme unless someone asks for one.

## Color tokens

| Token | Hex | Use |
| --- | --- | --- |
| `surface-container-lowest` | `#060e20` | overlay chips on images, deepest wells |
| `background` / `surface` | `#0b1326` | page canvas (under the canvas glow), top bar (`/80`–`/90` + blur) |
| `surface-container-low` | `#131b2e` | sidebar, sub-header band, card meta rows |
| `surface-container` | `#171f33` | cards, inputs, neutral buttons |
| `surface-container-high` | `#222a3d` | hover fill, popovers, image placeholder |
| `surface-container-highest` | `#2d3449` | neutral tier chips |
| `surface-bright` | `#31394d` | rare emphasis surface |
| `on-surface` | `#dae2fd` | primary text |
| `on-surface-variant` | `#bbcabf` | secondary text, labels, icons |
| `outline` | `#86948a` | strong borders (use at `/50`) |
| `outline-variant` | `#334155` | hairline borders, dividers |
| `primary` | `#4edea3` | accent text, icons, links, sparklines |
| `primary-container` | `#10b981` | solid CTA, active nav, selected chip |
| `on-primary-container` | `#0b1326` | label on `primary-container` |
| `secondary` | `#4cd7f6` | cyan highlights, secondary metrics, active filter outline |
| `secondary-container` / `on-secondary-container` | `#004e5c` / `#acedff` | cyan chips |
| `tertiary` / `tertiary-container` | `#c0c1ff` / `#9699ff` | episode codes, technical tags |
| `error` / `error-container` / `on-error-container` | `#ffb4ab` / `#93000a` / `#ffdad6` | threat and failure states |
| `status-alive` | `#10b981` | Alive dot and label |
| `status-dead` | `#f43f5e` | Dead dot and label |
| `status-unknown` | `#f59e0b` | Unknown dot and label |

Status and tier tints are the status color at `/10` for the fill and `/20` for the border, e.g. `bg-status-alive/10 border-status-alive/20 text-status-alive`.

## Tailwind v4 usage

- Tailwind v4 is CSS-first. Define every token above as `--color-<token>` inside `@theme` in `apps/web/src/app/globals.css`. There is no `tailwind.config.*`.
- Components use only the generated utilities: `bg-surface-container`, `text-on-surface-variant`, `border-outline-variant`, `bg-primary-container`, and so on. Never put raw hex values, arbitrary colors (`bg-[#...]`) or Tailwind palette colors (`emerald-500`, `slate-400`, `amber-400`) in components. The mockups do this; don't copy it.

## Typography

Load the fonts with `next/font/google` in `layout.tsx` and expose them through `@theme` as `font-headline`, `font-sans` and `font-mono`:

- **Headlines**: Plus Jakarta Sans, weights 600–700, tight tracking (`-0.02em` at large sizes).
- **Body and labels**: Inter.
- **IDs, dimension codes and telemetry numbers**: JetBrains Mono, or Inter with `tabular-nums` (e.g. `#001`, `C-137`, `0.0034 ρ/sec`).

| Role | Desktop | Mobile |
| --- | --- | --- |
| headline-xl | 40/48 700 | 28/36 700 |
| headline-lg | 32/40 600 | 24/32 600 |
| headline-md | 24/32 600 | — |
| headline-sm | 20/28 600 | — |
| title-md / title-sm | 16/24 600, 14/20 600 (Inter) | — |
| body-lg / md / sm | 16/26, 14/22, 12/18 400 | — |
| label-md / label-sm | 13/18 500, 11/16 600 `0.04em` | — |

Section labels and meta keys are micro-labels: 10–11px, uppercase, `tracking-wider`, `font-semibold`, `text-on-surface-variant`.

## Layout and spacing

- Spacing scale: 4 (icon↔text in badges), 8 (chip padding, input vertical padding), 16 (card padding, form gaps), 24 (grid gaps, section↔card gaps), 40 (page-level module gaps).
- Breakpoints:
  - Below 768px: 4 columns, 16px gutters and margins, a bottom tab bar, and a 2-column compact card grid.
  - 768–1024px: 8 columns, 24px gutters, and filters in a bottom sheet.
  - Above 1024px: 12 columns, 24px gutters, 32px margins and a max width of 1440px.
- Desktop shell: a fixed 64px top bar (logo, active-dimension pill, ⌘K search, status and avatar), plus a 256px fixed left sidebar on `surface-container-low` with a "Fluid Status" card pinned at the bottom.

## Shape and elevation

- Radius: 8px (`rounded-lg`) for buttons, inputs, chips and pagination; 16px (`rounded-2xl`) for cards, panels and modals. Use `rounded-full` only for status badges, species chips, avatars and round icon toggles.
- Depth comes from tonal layering plus hairline borders, not big shadows.
  - L0: the `background` canvas plus the canvas glow: a fixed `body::before` layer in `globals.css` with low-alpha `primary`, `secondary` and `tertiary` radial gradients. Page-level wrappers stay transparent; an opaque `bg-background` would hide the glow, so sticky bars use `bg-background/80` + blur.
  - L1: `surface-container` with a `border border-outline-variant` hairline.
  - L2 (popover, sticky header, dropdown): `surface-container-high` with `shadow-[0_10px_25px_-5px_rgb(0_0_0/0.45)]`.
  - L3 (modal): a `bg-background/75 backdrop-blur-sm` scrim.
- Hover: the border shifts toward `primary` (`hover:border-primary/50`), with an optional soft glow (`0 0 20px rgb(16 185 129 / 0.12)`). Elements never translate upward, and there are no neon halos.
- Focus: `focus-visible:border-primary` plus a 3px ring at `primary/20`. Every interactive element has a visible focus state.

## Component recipes

- **Primary button**: 40px tall (44px on mobile), `bg-primary-container text-on-primary-container font-semibold rounded-lg`, and a slightly darker hover (`#059669`).
- **Secondary button**: `bg-surface-container border border-outline/50 text-on-surface`. On hover it uses `bg-surface-container-high` with a `border-secondary` border.
- **Ghost button**: transparent with `text-on-surface-variant`. On hover it uses `text-on-surface` with a `bg-surface-container` fill.
- **Search input**: 44px tall, `bg-surface-container border-outline-variant rounded-lg`, a leading icon in `on-surface-variant`, a placeholder at `on-surface-variant/70`, and a trailing `⌘K` `<kbd>` on desktop.
- **Filter chip**: `bg-surface-container border-outline-variant text-on-surface-variant`. The selected state is either a solid `primary-container` fill (status "All") or a `border-secondary` outline (species and other filters). Counts sit inline in `on-surface-variant`.
- **Status badge**: a 6px dot plus an uppercase label. The meaning never relies on color alone. On images, the badge sits on `bg-surface-container-lowest/80 backdrop-blur-sm`.
- **Character card**:
  - Shell: `surface-container`, a hairline border and 16px radius.
  - Image well: 224px (`h-56`) with a gradient fade from `surface-container` at the bottom. The status badge sits top-left, the mono `#ID` top-right, and a bookmark icon button bottom-right.
  - Body (16–20px padding): headline name with a tier chip; a role line in `body-sm on-surface-variant`; 2 key/value meta rows on `surface-container-low`; then a divider and a mono stat on the left with a `primary` "SCAN BIO →" link on the right.
- **Stat tile**: a micro-label with an icon, a big number in `font-headline`, a unit in the accent color, a 6px progress bar on `surface-container-high`, and a caption in `body-sm`.
- **Icons**: the designs use Material Symbols Outlined (e.g. `cyclone`, `travel_explore`, `radar`, `bookmark_add`). Keep one consistent icon set.

## Current state of the code

`globals.css` (light/lime tokens: `--portal`, `--space`, …) and `layout.tsx` (Geist fonts) predate this system. When you touch them, replace the old tokens and fonts with the ones above and migrate any `bg-portal`/`text-muted`-style utilities you encounter. Don't run the two themes side by side.
