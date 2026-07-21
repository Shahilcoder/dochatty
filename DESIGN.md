---
name: Calm Productivity (Evernote-inspired)
theme: light-first
colors:
  # ---- Light theme (primary) ----
  background: '#F5F6F7'
  on-background: '#1D1D1F'
  surface: '#FFFFFF'
  surface-dim: '#F0F1F2'
  surface-bright: '#FFFFFF'
  surface-container-lowest: '#FFFFFF'
  surface-container-low: '#FAFBFB'
  surface-container: '#F5F6F7'
  surface-container-high: '#EEF0F1'
  surface-container-highest: '#E7EAEB'
  surface-variant: '#EEF0F1'
  on-surface: '#1D1D1F'
  on-surface-variant: '#6B7280'
  outline: '#E4E7E9'
  outline-variant: '#EEF0F1'
  inverse-surface: '#252525'
  inverse-on-surface: '#F5F6F7'
  surface-tint: '#00A82D'
  primary: '#00A82D'
  on-primary: '#FFFFFF'
  primary-bright: '#16B04B'
  primary-container: '#E4F6E9'
  on-primary-container: '#00521A'
  primary-hover: '#009127'
  inverse-primary: '#7FE0A0'
  secondary: '#F5A623'
  on-secondary: '#3D2800'
  secondary-container: '#FDEFD3'
  on-secondary-container: '#4A3400'
  tertiary: '#2C8CD8'
  on-tertiary: '#FFFFFF'
  tertiary-container: '#DCEEFB'
  on-tertiary-container: '#0A3A5E'
  error: '#E5484D'
  on-error: '#FFFFFF'
  error-container: '#FDE7E7'
  on-error-container: '#7A1417'
  success: '#00A82D'
  warning: '#F5A623'
  # ---- Dark theme (variant) ----
  dark-background: '#191919'
  dark-on-background: '#EDEDED'
  dark-surface: '#1E1E1E'
  dark-surface-container: '#252525'
  dark-surface-container-high: '#2E2E2E'
  dark-surface-container-highest: '#383838'
  dark-on-surface: '#EDEDED'
  dark-on-surface-variant: '#A0A3A7'
  dark-outline: '#3A3A3A'
  dark-outline-variant: '#2E2E2E'
  dark-primary: '#3DD674'
  dark-on-primary: '#00320F'
  dark-primary-container: '#0F4A24'
  dark-on-primary-container: '#B8F0CB'
  dark-secondary: '#FBBF4D'
  dark-error: '#FF6369'
  # ---- Fixed brand tokens ----
  evernote-green: '#00A82D'
  pure-white: '#FFFFFF'
  ink: '#1D1D1F'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 42px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  title:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  button-text:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
  code:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.5rem
  lg: 0.75rem
  xl: 1rem
  '2xl': 1.5rem
  full: 9999px
shadow:
  sm: '0 1px 2px rgba(29, 29, 31, 0.06)'
  DEFAULT: '0 1px 3px rgba(29, 29, 31, 0.08), 0 1px 2px rgba(29, 29, 31, 0.04)'
  md: '0 4px 12px rgba(29, 29, 31, 0.08)'
  lg: '0 10px 30px rgba(29, 29, 31, 0.10)'
spacing:
  unit: 4px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 48px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  stack-xl: 64px
---

## Brand & Style

This design system establishes a **"Calm Productivity"** identity, inspired by Evernote. The brand personality is clear, trustworthy, and quietly confident — a tool that gets out of your way so you can think. It favors warmth over sterility and clarity over decoration.

The design style is **Clean, Bright, Content-First**. It is built on a light canvas with abundant whitespace, a single confident green accent, understated typography, and gentle depth. It deliberately rejects the high-contrast, neon, dark-mode-first aesthetic in favor of an airy, paper-like surface where the user's documents and answers are the hero. Nothing on the screen competes with the content.

## Colors

The palette is **light-mode-first**, with a full dark variant defined for a user toggle.

- **Canvas / Background:** A soft off-white (`#F5F6F7`) — never pure white for the page itself, so that white surfaces (cards, panels, input fields) lift subtly off it.
- **Surface:** Pure white (`#FFFFFF`) for cards, sidebars, message bubbles, and modals.
- **Primary (Evernote Green):** `#00A82D`, the signature brand green, for primary actions, active states, focus rings, and success indicators. A brighter `#16B04B` is available for hover/emphasis, and `#E4F6E9` as a soft tinted container (selected rows, highlighted citations).
- **Secondary (Amber `#F5A623`):** Reserved for warnings, "processing" states, and gentle attention cues.
- **Tertiary (Blue `#2C8CD8`):** For links and informational accents where green would over-signal action.
- **Text:** Near-black ink (`#1D1D1F`) for primary text, muted gray (`#6B7280`) for secondary text and metadata.
- **Borders:** Hairline neutral (`#E4E7E9`) — borders do most of the structural work; shadows stay subtle.

**Dark variant:** Surfaces are warm charcoal (`#1E1E1E` / `#252525`), **never pure black**. The green brightens to `#3DD674` to hold contrast against the dark surface. Text softens to `#EDEDED`. Borders drop to `#3A3A3A`.

Gradients are used sparingly, if at all — this system trusts flat, honest color.

## Typography

The system uses **one humanist sans-serif, Inter**, across the entire hierarchy, expressing structure through weight and size rather than mixing typefaces. This keeps the interface calm and highly legible.

1. **Inter (Primary):** All headlines, titles, body copy, labels, and UI. Headlines are bold (700) with tight negative tracking for a modern, composed feel; body copy is regular (400) at a comfortable 16px/24px with a generous measure.
2. **JetBrains Mono (Utility):** Used **only** for citation chips, source locations (page numbers, paragraph indices), and inline code. The monospace treatment gives citations a precise, "receipt-like" credibility — reinforcing that every answer is grounded in a real source location.

Avoid decorative or display faces entirely. Let content read cleanly; the personality comes from spacing and the green accent, not from typographic novelty.

## Layout & Spacing

The layout is **calm and roomy**, with a centered content track and wide margins that let the canvas breathe.

- **Container:** Content sits within a 1200px max-width track on desktop.
- **Grid:** 12-column on desktop, 8-column tablet, 4-column mobile.
- **Rhythm:** A 4px base unit drives all spacing; vertical section rhythm steps in multiples of 8 (8 / 16 / 32 / 64).
- **Margins:** 48px+ outer margins on desktop, 20px on mobile.
- **App shell:** A typical Evernote-style layout — a light left sidebar (navigation / document list) against the white content area, separated by a hairline border rather than heavy chrome.

## Elevation & Depth

Unlike the previous system, this design **embraces soft, natural shadows** in the Evernote manner — but keeps them restrained.

- **Surface tiers:** Canvas (`#F5F6F7`) → white cards (`#FFFFFF`, hairline border + faint shadow) → floating menus/modals (stronger `shadow-md`/`lg`).
- **Shadows:** Low-spread, low-opacity, tinted with the ink color (never black). Cards rest with `shadow-sm`; menus, popovers, and dialogs use `shadow-md`/`shadow-lg`. Depth signals hierarchy, not drama.
- **Focus:** Interactive elements gain a 2px green focus ring (`#00A82D` at reduced opacity) — the primary affordance for keyboard and accessibility.
- **No glassmorphism, no neon glows.** Clarity over spectacle.

## Shapes

The shape language is **Soft & Friendly**.

- Standard controls (buttons, inputs, cards) use `0.5rem` (8px) rounding.
- Larger containers and modals scale to `0.75rem`–`1rem`.
- Chips, tags, and status pills are **fully rounded** (`rounded-full`) — a friendly, approachable touch consistent with Evernote's tag styling.
- Corners are never sharp; there is no hard-edged decorative line work. The whole system reads as smooth and calm.

## Components

- **Buttons:** Primary buttons use a solid Evernote-green fill (`#00A82D`) with white text and 8px corners. Hover deepens the green slightly and adds a subtle lift (`shadow-sm` → `shadow-md`, no color inversion). Secondary buttons are white with a hairline border and ink text. Tertiary/ghost buttons are text-only with a green hover tint.
- **Cards:** White fill on the off-white canvas, 1px `#E4E7E9` border, 12px radius, and a faint `shadow-sm`. Hover may raise elevation gently. Cards rely on whitespace, not dividers, to separate content.
- **Input Fields:** White fill with a full 1px neutral border and 8px radius. On focus, the border turns green and a soft green focus ring appears. Placeholder text is muted gray in Inter (not mono).
- **Chips / Badges:** Fully-rounded pills. Status chips use tinted backgrounds (green `#E4F6E9` for "Live/Active/Success", amber for "Processing", red tint for errors) with matching text.
- **Citation Chips (signature component):** The trust element of the app. A pill with a soft green tint, a green left accent, the document name in Inter, and the location (page / heading / paragraph) in **JetBrains Mono**. Clicking reveals the exact source chunk. This component earns the extra typographic contrast — it is where the design says "this answer is real."
- **Lists:** Rows separated by generous padding and, where needed, a single hairline `#EEF0F1` divider. Icons are monoline (stroke-based), 20–24px, calm and consistent.
- **Navigation / Sidebar:** Light surface with the active item marked by a green-tinted container (`#E4F6E9`) and green text/icon. No heavy backgrounds.
- **Chat surface:** User messages in a light green-tinted bubble; assistant answers on plain white with citation chips inline. The reading experience stays document-like and uncluttered.
