# Energetic Exotics Design System

> **Source of truth:** [energeticexotics.com](https://www.energeticexotics.com/) (Webflow / Relume CSS)  
> **Secondary reference:** [Figma Internal UI Style Guide](https://www.figma.com/design/vjj9rDRMUTzSM9v3Twa49m/Energetic-Exotics--Internal-UI-?node-id=2368-52)  
> **Audit date:** June 2026

This document captures the visual language used on the live website. The dashboard must use these tokens — not the grayscale wireframe palette in `reference/`.

**In code:** tokens live in `src/styles/tokens.css`; components use CSS modules (no Tailwind). User-facing copy is in `src/content/portal.ts`. UI decisions and exceptions are logged in `docs/ui-decisions.md`.

---

## Brand colors

### Primitives

| Token | Value | Usage |
|-------|-------|-------|
| `--color-black` | `#121212` | Primary background, dark surfaces |
| `--color-black-light` | `#1a1a1a` | Secondary background, form inputs |
| `--color-leather` | `#bfa384` | Subheading text, accents, link buttons |
| `--color-leather-darker` | `#b28b5f` | Subheading on light backgrounds |
| `--color-leather-lighter` | `#eaeaea` | Light accent tints |
| `--color-pearl` | `whitesmoke` | Alternate background, body text on dark |
| `--color-titanium` | `#d0d0d0` | Muted borders, dividers |
| `--color-white` | `#ffffff` | Primary button fill on dark UI |
| `--color-error` | `#b42318` | Error text, borders |
| `--color-error-light` | `#fef3f2` | Error background |
| `--color-success` | `#027a48` | Success text, borders |
| `--color-success-light` | `#ecfdf3` | Success background |

### Neutrals

| Token | Value |
|-------|-------|
| `--color-neutral-darkest` | `black` |
| `--color-neutral-darker` | `#363636` |
| `--color-neutral-dark` | `#444444` |
| `--color-neutral` | `#666666` |
| `--color-neutral-light` | `#aaaaaa` |
| `--color-neutral-lighter` | `#cccccc` |
| `--color-neutral-lightest` | `#eeeeee` |

### Semantic (dark theme — dashboard default)

The marketing site is predominantly dark. Dashboard pages should use this mapping:

| Role | Token | Value |
|------|-------|-------|
| Background primary | `--background-primary` | `#121212` |
| Background secondary | `--background-secondary` | `#1a1a1a` |
| Background tertiary | `--background-tertiary` | `#eeeeee` (rare, light panels) |
| Text primary | `--text-primary` | `whitesmoke` |
| Text secondary | `--text-secondary` | `#b2b2b2` |
| Text subheading / accent | `--text-subheading` | `#bfa384` |
| Text alternate | `--text-alternate` | `#ffffff` |
| Border primary | `--border-primary` | `#ffffff` |
| Border secondary | `--border-secondary` | `#363636` |
| Border tertiary | `--border-tertiary` | `#444444` |

### Opacity overlays

Used for scrims, hover states, and overlays:

| Token | Value |
|-------|-------|
| `--opacity-white-5` | `#ffffff0d` |
| `--opacity-white-10` | `#ffffff1a` |
| `--opacity-white-20` | `#fff3` |
| `--opacity-black-10` | `#0000001a` |
| `--opacity-black-20` | `#0003` |
| `--opacity-transparent` | `transparent` |

---

## Typography

### Font families

| Role | Family | Fallback |
|------|--------|----------|
| Headings | `"PP Monument Extended"` | Arial, sans-serif |
| Subheadings | `"Editor's Note"` (Editorsnote) | Arial, sans-serif |
| Body | `"Helvetica Now Var"` / `"Helvetica Now Text"` | Arial, sans-serif |

> **Implementation note:** PP Monument Extended and Editor's Note are licensed brand fonts served via Webflow. For the dashboard, load equivalent webfonts or self-hosted files. Helvetica Now can fall back to system Helvetica / Arial until licensed files are available.

### Heading scale (fluid)

The website uses fluid `clamp()` typography. Base values:

| Breakpoint | Base | Ratio |
|------------|------|-------|
| Mobile (< 768px) | `1.1875rem` (19px) | `1.1` (Minor Second) |
| Desktop (≥ 768px) | `1.3125rem` (21px) | `1.333` (Perfect Fourth) |

Fluid viewport range: `30rem` → `80rem`.

| Level | CSS variable | Characteristics |
|-------|-------------|-----------------|
| Display | `--fluid-display` | Largest hero scale |
| H1 | `--fluid-h1` | Uppercase, weight 700, line-height ~0.9–1.1 |
| H2 | `--fluid-h2` | Uppercase, weight 700, line-height 1.1 |
| H3 | `--fluid-h3` | Uppercase, weight 700 |
| H4 | `--fluid-h4` | Uppercase |
| H5 | `--fluid-h5` | Maps to subheading scale |
| H6 | `--fluid-h6` | Smallest heading |

**Heading style rules:**
- `text-transform: uppercase`
- `font-family: PP Monument Extended`
- `color: var(--text-primary)`
- `font-weight: 700`
- `margin-top: 0; margin-bottom: 0`

### Subheading scale (fluid)

| Breakpoint | Base | Ratio |
|------------|------|-------|
| Mobile | `1.125rem` | `1.1` |
| Desktop | `1.25rem` | `1.2` (Minor Third) |

Used for taglines, italic accent lines, and `.button.is-link` text.  
`font-family: Editor's Note`, `font-style: italic`.

### Body / UI text scale

From Figma style guide (confirmed on website form elements):

| Step | Size | Line height | Weight | Usage |
|------|------|-------------|--------|-------|
| Large | `20px` / `1.25rem` | `1.5` | 400 | Lead paragraphs |
| Medium | `18px` / `1.125rem` | `1.5` | 400–500 | Emphasized body |
| Regular | `16px` / `1rem` | `1.6` | 400 | Form inputs, default body |
| Small | `14px` / `0.875rem` | `1.5` | 400 | Captions, meta |
| Tiny | `12px` / `0.75rem` | `1.5` | 400–600 | Labels, badges |

Website utility classes: `.text-size-medium` = `1.125rem`, color `--text-secondary`.

### Rich text scale

| Breakpoint | Base | Ratio |
|------------|------|-------|
| Mobile | `1.125rem` | `1.1` |
| Desktop | `1.25rem` | `1.25` |

---

## Spacing scale

### Layout

| Token | Value | Usage |
|-------|-------|-------|
| `--padding-global` | `5%` | Horizontal page gutter |
| `--container-max` | `80rem` (1280px) | Content max-width |
| `--container-1440` | `90rem` | Wide layouts |
| `--navbar-height` | `4.5rem` (72px) | Top navigation bar |

### Section padding

| Token | Mobile | Tablet | Desktop |
|-------|--------|--------|---------|
| `--section-48` | `2rem` | `3rem` | — |
| `--section-80` | `3rem` | `4rem` | `5rem` |
| `--section-128` | `4rem` | `6rem` | `8rem` |
| `--section-176` | `6rem` | `8rem` | `11rem` |

### Component spacing

| Context | Value |
|---------|-------|
| Card gap | `2rem` |
| Button padding | `0.75rem 1.5rem` (12px 24px) |
| Button group gap | `1rem` |
| Form field gap | `12px`–`16px` |
| Form input padding | `0.75rem` (12px) |
| Icon button gap | `0.75rem` |
| Tag padding | `4px 8px` (wireframe); `8px 16px` (Figma tags) |

### Dashboard-specific spacing (from wireframe layouts)

| Context | Value |
|---------|-------|
| Page content padding | `24px` mobile → `32px` desktop |
| Card internal padding | `18px 16px` mobile → `24px` desktop |
| List row gap | `12px` |
| Grid gap (2-col) | `16px` |
| Toolbar gap | `12px` |
| Sidebar width | `288px` (Figma filter sidebar) |

---

## Border radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-small` | `0.5rem` (8px) | Inputs, small cards |
| `--radius-medium` | `1rem` (16px) | Cards, panels |
| `--radius-large` | `1.25rem` (20px) | Large cards |
| `--radius-xlarge` | `6.25rem` (100px) | Pill buttons, tags |
| `--radius-pill` | `100px` | Buttons (website `.button`) |

---

## Shadow system

The website uses **minimal shadows**. Depth is created through color contrast and borders, not elevation shadows.

| Context | Shadow |
|---------|--------|
| Default UI | None |
| Cookie / widget overlays | `0 0 0 1px #0000001a, 0 1px 3px #0000001a` |
| Cards | Border only (`1px solid`) — no box-shadow |
| Modals (Figma) | Subtle border, flat background |

**Dashboard rule:** Do not add Material-style elevation. Use borders and background shifts for hierarchy.

---

## Borders & dividers

| Token | Value |
|-------|-------|
| `--stroke-border` | `1px` |
| `--stroke-divider` | `1px` |

| Context | Style |
|---------|-------|
| Form inputs | `1px solid var(--border-secondary)` |
| Buttons (secondary) | `1px solid var(--button-secondary-stroke)` |
| Tags | `1.5px solid var(--text-subheading)` |
| Cards | `1px solid var(--border-secondary)` |
| Dividers | `1px solid var(--border-tertiary)` |

---

## Button variants

Base `.button` styles from website:

```
padding: 0.75rem 1.5rem
border-radius: 100px
font-size: 1rem
font-weight: 500
line-height: 1
transition: border-color 0.2s, color 0.2s, opacity 0.2s, background-color 0.2s
```

### Primary (solid pill)

| State | Background | Text | Border |
|-------|------------|------|--------|
| Default (dark UI) | `#ffffff` | `#121212` | `1px solid black` |
| Hover | `#bfa384` (leather) | `#ffffff` | unchanged |
| Focus | Same as hover + visible focus ring | — | — |
| Disabled | Reduced opacity (~50%) | — | — |

### Secondary (outline pill)

| State | Background | Text | Border |
|-------|------------|------|--------|
| Default | `transparent` | `#ffffff` | `1px solid #ffffff` |
| Hover | `transparent` | `#ffffff` | slight opacity shift |
| Focus | Visible focus ring | — | — |

### Tertiary / Link (`.button.is-link`)

| Property | Value |
|----------|-------|
| Background | `transparent` |
| Border | `none` |
| Padding | `0.75rem 1.5rem` (12px 24px) |
| Font | Editor's Note, italic, `24px` / `1.5rem`, line-height `1.4` |
| Color | `#bfa384` (leather) |
| Decoration | `none` (arrow variants add `←` / `→`) |

### Icon button (`.button.is-icon`)

| Property | Value |
|----------|-------|
| Display | `flex` |
| Gap | `0.75rem` |
| Variants | Icon left, icon right, icon only (circular pill) |

### Button group (`.button-group`)

`display: flex; flex-wrap: wrap; gap: 1rem; align-items: center`

---

## Form components

### Text input (`.form-input`)

Dark theme (dashboard):

| Property | Value |
|----------|-------|
| Background | `#1a1a1a` |
| Border | `1px solid var(--border-secondary)` |
| Border radius | `0.5rem` (8px) |
| Min height | `2.75rem` (44px) — Figma uses 48px |
| Padding | `0.75rem` (12px) |
| Font | Helvetica Now Var, `16px`, line-height `1.6` |
| Text color | `#f5f5f5` |
| Placeholder | `#b2b2b2` |

**States:**

| State | Style |
|-------|-------|
| Default | Border `--border-secondary` |
| Focus | `border-color: #ffffff` |
| Error | Border `--color-error`, text `--color-error` |
| Disabled | Reduced opacity, no pointer events |

### Input variants (Figma → dashboard)

| Variant | Notes |
|---------|-------|
| Default | Single field |
| Left icon | Search, credit card — icon color leather |
| Right icon | Help circle — icon color leather |
| Two icons | Left + right icons |
| Prefix select | USD dropdown + input (split field) |
| URL prefix | `http://` + input (split field) |

### Select (`.form-select`)

Same visual treatment as text input. Chevron indicator on right.

### Textarea (`.form-textarea`)

Same border/background as input. Min-height ~120px. Resizable vertically.

### Checkbox / Radio (`.form-checkbox`, `.form-radio`)

Standard Relume form controls. Leather accent on checked state.

### Label

Uppercase or small caps, `--text-xs` / `14px`, `--text-secondary` color, `margin-bottom: 4px`.

### Field group

`display: grid; gap: 16px` for 2-column layouts; single column on mobile.

---

## Card components

### Standard card

| Property | Value |
|----------|-------|
| Background | `#1a1a1a` or `#121212` |
| Border | `1px solid var(--border-secondary)` |
| Border radius | `0.5rem`–`1rem` |
| Padding | `24px` |
| Shadow | None |

### Card with heading

Section title uses PP Monument Extended, uppercase, `--fluid-h4` or card-level `h2`.

### Success card (submission complete)

Centered content, large checkmark icon, success green accent optional.

### Choice card (dashboard hub)

Full-width tappable card with heading, description, and CTA. Flex column, centered content.

---

## Table styles

No dedicated data table on the marketing site. Derive from Figma list patterns and wireframe `.wf-list`:

| Element | Style |
|---------|-------|
| Row | `1px solid var(--border-secondary)` bottom border |
| Header | Uppercase, `--text-xs`, `--text-secondary`, letter-spacing `0.05em` |
| Cell padding | `12px 16px` |
| Hover row | Background `--opacity-white-5` |
| Actions column | Right-aligned button group |

For admin submissions/drivers lists, use **list rows** (not full HTML tables) on mobile; table layout at `≥900px`.

---

## Navigation styles

### Marketing navbar (reference)

| Property | Value |
|----------|-------|
| Height | `4.5rem` |
| Background | Transparent → gradient to `#121212` |
| Position | Fixed, z-index 9999 |
| Padding | `0 4rem` horizontal |

### Dashboard — Driver portal

| Element | Pattern |
|---------|---------|
| Top bar | Logo left, actions right |
| Back link | Ghost / link button `← Dashboard` |
| Page intro | Accent tagline (leather italic) + H1 |

### Dashboard — Admin portal

| Element | Pattern |
|---------|---------|
| Sidebar | `288px` fixed, dark bg, nav links |
| Sidebar nav link | Block, padding `12px 16px`, active = leather left border or bg shift |
| Top bar | Menu toggle (mobile), page title center/left, alerts badge right |
| Mobile sidebar | Overlay + slide-in drawer |
| Overlay | `--opacity-black-20` scrim |

---

## Interaction states

### Global transition

`transition: border-color 0.2s, color 0.2s, opacity 0.2s, background-color 0.2s`

### Hover

| Component | Hover behavior |
|-----------|----------------|
| Primary button | Background → leather, text → white |
| Secondary button | Subtle opacity or border brightening |
| Link button | Color shift to leather-darker |
| Nav link | Color → leather or bg `--opacity-white-5` |
| List row | Background `--opacity-white-5` |
| Card (clickable) | Border color brightens |

### Focus

| Component | Focus behavior |
|-----------|----------------|
| Inputs | `border-color: #ffffff` |
| Buttons | `outline: 2px solid #bfa384; outline-offset: 2px` |
| Links | `outline: 2px solid #bfa384; outline-offset: 2px` |

Use `:focus-visible` to avoid mouse-click outlines.

### Active / Pressed

`opacity: 0.9` or `transform: scale(0.98)` on buttons (subtle).

### Disabled

`opacity: 0.5; pointer-events: none; cursor: not-allowed`

### Loading

Spinner or skeleton using `--color-neutral-dark` on `--color-black-light` background. Button loading: replace label with spinner, maintain button dimensions.

### Empty states

Centered layout: leather italic subheading, H3 heading, secondary text, primary CTA button.

### Error / Success banners

| Type | Background | Border | Text |
|------|------------|--------|------|
| Error | `#fef3f2` | `#b42318` | `#b42318` |
| Success | `#ecfdf3` | `#027a48` | `#027a48` |
| Info | `#1a1a1a` | `--border-secondary` | `--text-primary` |

---

## Responsive behavior

### Breakpoints

| Name | Min width | Usage |
|------|-----------|-------|
| Mobile | `0` | Single column, stacked nav |
| Mobile landscape | `480px` | — |
| Tablet | `768px` | Typography scale shift, 2-col grids |
| Desktop | `1024px` | Sidebar visible, multi-col forms |
| Wide | `1280px` | Container max reached |
| XL | `1440px` | Full marketing layouts |

### Responsive rules

- Typography switches from mobile → desktop scale at `768px`
- Grids collapse to single column below `768px`
- Admin sidebar becomes drawer below `1024px`
- Button groups wrap on narrow screens
- Form 2-column grids → 1 column on mobile
- Touch targets: minimum `44px` height

---

## CSS custom properties (implementation)

Recommended `src/styles/tokens.css` structure:

```css
:root {
  /* Colors */
  --color-black: #121212;
  --color-black-light: #1a1a1a;
  --color-leather: #bfa384;
  /* ... */

  /* Typography */
  --font-heading: "PP Monument Extended", Arial, sans-serif;
  --font-subheading: "Editor's Note", Arial, sans-serif;
  --font-body: "Helvetica Now Var", Arial, sans-serif;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  /* Radius */
  --radius-sm: 0.5rem;
  --radius-md: 1rem;
  --radius-lg: 1.25rem;
  --radius-pill: 100px;

  /* Transitions */
  --transition-fast: 0.2s ease;
}
```

---

## References

- Website CSS: `energetic-exotics.webflow.shared.*.min.css` (Webflow CDN)
- Figma style guide node: `2368:52`
- Figma buttons: `4179:8867`
- Figma text inputs: `4179:9014`
- Wireframe layouts: `reference/wireframes/` (layout only, not visual styling)
