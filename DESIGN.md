---
name: Cyber-Growth Aesthetic
colors:
  surface: '#1a0b2e'
  surface-dim: '#1a0b2e'
  surface-bright: '#413257'
  surface-container-lowest: '#150629'
  surface-container-low: '#231437'
  surface-container: '#27183b'
  surface-container-high: '#322346'
  surface-container-highest: '#3d2e52'
  on-surface: '#eddcff'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#eddcff'
  inverse-on-surface: '#38294d'
  outline: '#8c90a0'
  outline-variant: '#424754'
  surface-tint: '#afc6ff'
  primary: '#afc6ff'
  on-primary: '#002d6d'
  primary-container: '#548dff'
  on-primary-container: '#002760'
  inverse-primary: '#0058c9'
  secondary: '#f9bd37'
  on-secondary: '#412d00'
  secondary-container: '#cb9400'
  on-secondary-container: '#473100'
  tertiary: '#49e256'
  on-tertiary: '#003909'
  tertiary-container: '#00a82d'
  on-tertiary-container: '#003207'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#afc6ff'
  on-primary-fixed: '#001944'
  on-primary-fixed-variant: '#00429a'
  secondary-fixed: '#ffdea4'
  secondary-fixed-dim: '#f9bd37'
  on-secondary-fixed: '#261900'
  on-secondary-fixed-variant: '#5d4200'
  tertiary-fixed: '#71ff75'
  tertiary-fixed-dim: '#49e256'
  on-tertiary-fixed: '#002203'
  on-tertiary-fixed-variant: '#005311'
  background: '#1a0b2e'
  on-background: '#eddcff'
  surface-variant: '#3d2e52'
  void-black: '#0D0518'
  surface-purple: '#26153D'
  pure-white: '#FFFFFF'
  neon-blue: '#3D82FF'
  growth-green: '#28CA41'
  warning-amber: '#F4B832'
typography:
  display-pixel:
    fontFamily: Press Start 2P
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.05em
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 64px
    fontWeight: '700'
    lineHeight: 72px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  body-lg:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-pixel:
    fontFamily: Pixelify Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.1em
  button-text:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system establishes a "Cyber-SaaS" identity, blending high-performance AI automation with a nostalgic, retro-gaming digital aesthetic. The brand personality is hyper-modern, energetic, and data-driven, yet approachable through familiar 8-bit visual cues.

The design style is **Retro-Future / Modern Tech**. It utilizes deep space backgrounds, vibrant neon accents, and a mix of high-precision typography with low-fidelity pixel elements. This creates a distinctive "Digital Arcade" feel that signals speed, growth, and the frontier of artificial intelligence. It rejects corporate blandness in favor of high-contrast, impactful visuals that demand attention in a crowded tech landscape.

## Colors

The palette is anchored in a dark-mode-first architecture. The core background is **Void Black** and **Deep Purple**, providing a high-contrast foundation for vibrant functional accents. 

- **Primary (Neon Blue):** Used for primary actions, focus states, and key interactive elements.
- **Secondary (Warning Amber):** Reserved for high-value conversions, scarcity cues, and "level-up" moments.
- **Tertiary (Growth Green):** Dedicated to success metrics, profit margins, and positive AI outcomes.
- **Neutral:** A range of deep purples and high-fidelity whites for text and structural borders.

Gradients should be used sparingly but boldly, typically transitioning from Neon Blue to a deeper violet to simulate digital depth.

## Typography

This design system uses a hierarchical font strategy to balance readability with thematic flavor:

1.  **Space Grotesk (Primary):** The workhorse of the system. Its geometric terminals and modern construction provide the "tech" feel for all headlines, body copy, and UI labels.
2.  **Press Start 2P (Accent):** Used exclusively for small "System Status," "Achievement," or "Game-ified" micro-copy. It should never be used for long-form reading.
3.  **Pixelify Sans (Utility):** Used for data points, counters, and secondary labels to reinforce the retro-digital theme without the extreme width of Press Start 2P.

Keep tracking tight on large headlines to maintain a modern, "squashed" look, but increase tracking for all pixel-font elements to ensure legibility.

## Layout & Spacing

The layout follows a **Fluid-Fixed Hybrid** model. Content is contained within a 1280px central track on desktop, while background elements and decorative "scan-line" textures bleed to the edges.

- **Grid:** A 12-column system is used for desktop, 8-column for tablet, and 4-column for mobile.
- **Rhythm:** An 8px base grid drives all vertical spacing. Component internals (like button padding) use a 4px sub-grid.
- **Safe Zones:** Use generous outer margins (64px+) on desktop to allow the dark background to "breathe," emphasizing the high-contrast content cards.

## Elevation & Depth

This design system avoids traditional soft shadows in favor of **Tonal Layering** and **Neon Glows**.

- **Surface Tiers:** Background is `#0D0518`. Primary containers use `#1A0B2E`. Floating elements or cards use `#26153D`.
- **Inner Glows:** Instead of drop shadows, active cards use a subtle 1px inner border in Neon Blue or a low-opacity outer glow (blur: 15px, color: Primary) to simulate a light-emitting screen.
- **Glassmorphism:** Use backdrop blurs (20px+) on navigation bars and modal overlays with a 10% white tint to create a sense of hardware-interface layering.

## Shapes

The shape language is **Precision Geometric**. 

Elements use **Soft (0.25rem)** corners to maintain a technical, hardware-inspired look while remaining accessible. Large cards or "hero" containers can scale up to **0.75rem (rounded-xl)**, but sharp 90-degree angles are encouraged for decorative line work and scan-line containers to reinforce the 8-bit aesthetic. 

Interactive elements like buttons should never be fully rounded (pills); they must maintain a structured, rectangular presence.

## Components

- **Buttons:** High-contrast blocks. Primary buttons use a solid Neon Blue background with white uppercase text. Hover states should trigger a "glow" effect rather than a color change.
- **Cards:** Defined by a 1px border (`#3D82FF` at 20% opacity). Cards do not use shadows; they rely on a slightly lighter background fill than the canvas.
- **Input Fields:** Dark fill (`#0D0518`) with a bottom-only border that glows Primary Blue when focused. Use Pixelify Sans for placeholder text.
- **Chips/Badges:** Use a "Pixel-Border" style—rectangular with a 1px solid border. Use Tertiary Green for "Live" or "Active" statuses.
- **Lists:** Separated by low-opacity horizontal lines. Icons should be monoline or pixel-art inspired to match the brand.
- **Data Visualizations:** Charts must use the functional palette (Blue, Amber, Green). Area charts should use semi-transparent gradients that "glow" from the baseline.