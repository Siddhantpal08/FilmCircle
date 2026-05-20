---
name: Cinematic Noir
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#e1bfb9'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#a88a85'
  outline-variant: '#59413d'
  surface-tint: '#ffb4a9'
  primary: '#ffb4a9'
  on-primary: '#690001'
  primary-container: '#c0392b'
  on-primary-container: '#ffe5e1'
  inverse-primary: '#b02d21'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
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
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#c0e8ff'
  tertiary-fixed-dim: '#80d0f8'
  on-tertiary-fixed: '#001e2b'
  on-tertiary-fixed-variant: '#004d66'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  display-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  section-gap: 80px
---

## Brand & Style
The design system is anchored in the atmosphere of a darkened theater. It evokes a premium, cinematic experience through extreme high-contrast, generous negative space, and a restrained color palette. The aesthetic combines **Minimalism** with a **High-Contrast** editorial feel, prioritizing the visual weight of film posters and photography over UI chrome. 

The emotional response should be one of "exclusive access"—a quiet, sophisticated environment that disappears to let the content lead. Interaction is deliberate and precise, avoiding clutter to maintain a sense of prestige.

## Colors
The palette is dominated by "The Void" (`#0f0f0f`), creating a seamless backdrop where the edges of the screen feel non-existent.

- **Primary (Crimson):** Used exclusively for high-intent actions, active states, and critical brand moments. It represents the "red carpet" and passion of cinema.
- **Secondary (Surface):** The card background (`#1a1a1a`) provides a subtle lift from the base, creating depth without the need for borders.
- **Typography:** Primary text is pure white for maximum legibility. Secondary text uses a muted gray to de-emphasize metadata and secondary navigation.

## Typography
This design system utilizes **Hanken Grotesk** to achieve a sharp, contemporary, and technical look. The type hierarchy is dramatic; display sizes are intentionally oversized and tightly tracked to mimic film title sequences.

Label styles are frequently set in uppercase with increased letter spacing to provide a professional, architectural feel to metadata. Line heights are generous in body copy to ensure readability against the dark background, preventing "halation" or light bleed from white text.

## Layout & Spacing
The layout follows a **Fixed Grid** model for desktop to maintain the "aspect ratio" feel of a cinematic frame, while transitioning to a fluid model for mobile.

- **Margins:** Desktop margins are wide (64px) to create a focused "stage" for content.
- **Scrollbars:** All scrollbars are globally hidden (`scrollbar-width: none` and `::-webkit-scrollbar { display: none; }`). Navigation is driven by swiping gestures or discreet directional arrows.
- **Rhythm:** A strictly linear vertical rhythm using 8px increments. Section gaps are large (80px+) to ensure distinct separation between content categories without using dividers.

## Elevation & Depth
Elevation is achieved through **Tonal Layers** rather than shadows. 
- **Level 0:** The base background (`#0f0f0f`).
- **Level 1:** Cards and overlays (`#1a1a1a`).
- **Interaction:** On hover or focus, elements do not rise; instead, they receive a Crimson (`#C0392B`) border or an increase in opacity. 

This flat approach maintains the "minimalist" requirement and ensures the UI feels like an integrated part of the screen rather than objects floating above it. Subtle backdrop blurs (10px–20px) may be used on navigation bars to provide a sense of transparency and continuity when scrolling.

## Shapes
The shape language is "Soft" (4px - 12px), striking a balance between the precision of a digital interface and the organic feel of a cinema screen. 

- **Cards:** Use `rounded-lg` (8px) for a modern, refined look.
- **Buttons:** Use `rounded-sm` (4px) to maintain a sharper, more serious profile.
- **Media:** Film posters and thumbnails should keep consistent 4px rounding to avoid looking "bubbly" while softening the harshness of the high-contrast background.

## Components
- **Buttons:** Primary buttons are solid Crimson (`#C0392B`) with white text. Secondary buttons are outlined in Muted Gray or utilize a ghost style. No gradients or shadows allowed.
- **Cards:** Content is housed in `#1a1a1a` containers. Images should fill the top of the card or the entire background. No star ratings are permitted; use a percentage-based "Match" or "Intensity" score in Crimson typography if rating is required.
- **Input Fields:** Minimalist under-line style or dark-filled (`#1a1a1a`) with a Crimson focus bottom-border.
- **Chips/Tags:** Small, uppercase labels with a subtle `#2a2a2a` background.
- **Lists:** Clean, borderless rows separated by 16px of vertical space. 
- **Progress Bars:** Thin 2px lines. The track is Muted Gray, and the fill is Crimson.
- **Navigation:** Top-tier navigation uses "Label-MD" typography. Active states are indicated by a simple Crimson dot below the text rather than an underline.