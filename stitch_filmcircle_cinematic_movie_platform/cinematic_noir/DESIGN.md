---
name: Cinematic Noir
colors:
  surface: '#121414'
  surface-dim: '#121414'
  surface-bright: '#383939'
  surface-container-lowest: '#0d0e0f'
  surface-container-low: '#1b1c1c'
  surface-container: '#1f2020'
  surface-container-high: '#292a2a'
  surface-container-highest: '#343535'
  on-surface: '#e3e2e2'
  on-surface-variant: '#e1bfb9'
  inverse-surface: '#e3e2e2'
  inverse-on-surface: '#303031'
  outline: '#a88a85'
  outline-variant: '#59413d'
  surface-tint: '#ffb4a9'
  primary: '#ffb4a9'
  on-primary: '#690001'
  primary-container: '#c0392b'
  on-primary-container: '#ffe5e1'
  inverse-primary: '#b02d21'
  secondary: '#ffb4a9'
  on-secondary: '#591c15'
  secondary-container: '#79342b'
  on-secondary-container: '#fe9f91'
  tertiary: '#80d0f8'
  on-tertiary: '#003548'
  tertiary-container: '#007296'
  on-tertiary-container: '#d3eeff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad5'
  primary-fixed-dim: '#ffb4a9'
  on-primary-fixed: '#410000'
  on-primary-fixed-variant: '#8e130c'
  secondary-fixed: '#ffdad5'
  secondary-fixed-dim: '#ffb4a9'
  on-secondary-fixed: '#3c0704'
  on-secondary-fixed-variant: '#763229'
  tertiary-fixed: '#c0e8ff'
  tertiary-fixed-dim: '#80d0f8'
  on-tertiary-fixed: '#001e2b'
  on-tertiary-fixed-variant: '#004d66'
  background: '#121414'
  on-background: '#e3e2e2'
  surface-variant: '#343535'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
  metadata:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base-unit: 8px
  container-margin-desktop: 64px
  container-margin-mobile: 20px
  gutter: 24px
  section-gap: 80px
---

## Brand & Style
The design system is anchored in a high-contrast, premium aesthetic that mirrors the experience of a darkened cinema. It targets film enthusiasts and critics who value a focused, editorial atmosphere over cluttered social platforms.

The style is a blend of **Minimalism** and **Modern** design movements. It prioritizes content (film posters and cinematography) by using a deep charcoal backdrop and stark white typography. The occasional use of Crimson Red serves as a visual "cue," much like a theater's velvet curtains or a "Live" recording light, directing attention to critical actions and branding. The emotional response is one of sophistication, immersion, and exclusivity.

## Colors
The palette is intentionally restricted to maintain a "Noir" atmosphere. 

- **Primary (Crimson Red):** Reserved for high-priority calls to action, brand identifiers, and critical state changes.
- **Background (Deep Charcoal):** A near-black base that prevents the "harshness" of pure black while providing maximum contrast for text and imagery.
- **Surface:** A slightly lighter charcoal (#1A1A1A) used to define containers and cards, creating depth without needing shadows.
- **Neutral:** A muted gray used for secondary information, metadata, and placeholder states to ensure visual hierarchy.

## Typography
The design system utilizes **Inter** exclusively to ensure a clean, modern, and highly legible interface. 

- **Hierarchy:** Dramatic scale shifts between display titles and body text emphasize an editorial feel.
- **Letter Spacing:** Headlines use slight negative tracking for a tighter, more "logo-like" appearance. Labels use expanded tracking and uppercase styling for distinct categorization.
- **Readability:** Body text is kept at a generous line height to ensure long-form reviews are comfortable to read against the dark background.

## Layout & Spacing
The layout follows a **Fixed Grid** model on desktop to maintain a cinematic wide-screen aspect ratio (16:9 influences) and a **Fluid Grid** on mobile.

- **Grid:** A 12-column grid is used for desktop layouts, while a 4-column grid is utilized for mobile.
- **Rhythm:** An 8px linear scale governs all padding and margins. 
- **Negative Space:** Generous section gaps (80px+) are used to separate different film categories or editorial features, preventing the dark interface from feeling cramped.
- **Scrollbars:** All scrollbars are hidden globally to maintain the immersive, full-bleed feel of a movie screen. Navigation is handled via touch swipe or subtle directional arrows.

## Elevation & Depth
In this design system, depth is communicated through **Tonal Layering** rather than traditional shadows.

1.  **Level 0 (Floor):** The Deep Charcoal (#0F0F0F) background.
2.  **Level 1 (Cards/Surfaces):** Surfaces (#1A1A1A) sit directly on the floor. 
3.  **Level 2 (Overlays/Modals):** High-contrast surfaces (#222222) used for interactive elements like menus or pop-ups.

Subtle 1px solid borders in a slightly lighter shade (#2D2D2D) may be used on cards to provide definition where tonal contrast is insufficient. Shadows, if used, are reserved for primary buttons and are rendered as high-spread, low-opacity black blurs to ground the element.

## Shapes
The shape language is **Rounded (Level 2)**. 

- **Standard Elements:** Buttons and input fields use a 0.5rem (8px) radius.
- **Containers:** Cards and film posters use a 1rem (16px) radius to soften the high-contrast edges and create a more approachable, modern feel.
- **Iconography:** Icons should feature rounded caps and corners to match the UI's geometry.

## Components

### Buttons
- **Primary:** Crimson Red (#C0392B) background with White text. High-contrast and bold.
- **Secondary:** Transparent background with a Muted Gray (#888888) outline. Text is White.
- **Tertiary/Ghost:** No background or border. Crimson text for high visibility or White for subtle actions.

### Custom Review Labels (The "Verdict" System)
Instead of stars, the system uses tiered semantic labels:
- **Perfection:** Crimson Red background, bold white text.
- **Go For It:** Deep Gray background, white text.
- **Timepass:** Muted Gray background, black text.
- **Skip:** Transparent with a thin red border.

### Cards
Film cards are the primary vessel for content. They feature a vertical aspect ratio (2:3). Titles and metadata are placed below the image. Hover states (on desktop) should subtly scale the image (1.05x) to create a sense of tactile interaction.

### Input Fields
Darker than the surface (#0A0A0A), featuring a 1px border that turns Crimson Red on focus. Placeholder text uses the Muted Gray color.

### Chips/Tags
Used for genres or actors. Small, pill-shaped elements with #222222 backgrounds and metadata-sized typography.