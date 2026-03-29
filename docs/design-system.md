# Industrial Artefact Design System

### 1. Overview & Creative North Star

**Creative North Star: The Urban Cartographer**

Industrial Artefact is a design system that marries the raw, utilitarian aesthetic of city infrastructure with high-end editorial clarity. It rejects the soft, "pill-shaped" friendliness of modern SaaS in favour of sharp corners, bold "Utility Borders," and hard-edged shadows. The system uses intentional asymmetry and heavy ink-weight lines to create a UI that feels like a physical object — a printed map or a stamped metal plaque. It is "Digital Brutalism" refined for a curated, premium experience.

### 2. Colour

The palette is built on high-contrast foundations, utilising amber gold and rich navy for a utilitarian feel. All combinations are verified against WCAG AA and AAA thresholds.

| Token | Value | Usage |
|---|---|---|
| **Primary** | `#e0a500` | Primary action buttons, FABs, prominent icons, active-state borders. Meets WCAG AAA (>7:1) against Rich Navy text. |
| **Background** | `#ffffff` | App background and map base. |
| **Surface** | `#f4f6f9` | Cards, bottom sheets, sidebars, and search inputs. |
| **Text** | `#0a1931` | All primary typography, icons, and button text on Gold. |
| **Muted** | `#3d4d68` | Secondary text, borders, inactive states, and footer copy. Meets WCAG AAA (>7:1) against Surface. |
| **Accent** | `#990000` | Map pins, error states, and destructive actions. |

**Implementation Rules:**

- **The "No-Line" Rule Exception:** The system *mandates* the use of lines as "Utility Borders" (`0.125rem solid #0a1931`).
- **Utility Shadowing:** No soft blurs are permitted. Use hard, offset shadows (`0.25rem 0.25rem 0px #0a1931`) to simulate physical layering.
- **Signature Textures:** Use the Surface colour (`#f4f6f9`) for input areas to distinguish interactive zones without adding unnecessary gradients.
- **Contrast Safety:** Never use Primary (`#e0a500`) as a text colour against Background (`#ffffff`). Use it for borders, fills, and indicators only. Text must always use Text or Muted colours.

### 3. Typography

The system utilises a clean, system-native typographic stack to maintain a utilitarian, performance-first feel.

**Font Stack:**
`system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`

| Style | Size | Weight | Usage |
|---|---|---|---|
| **Heading Large** | `2rem` (32px) | Black (900) | Page titles, hero headings. |
| **Heading** | `1.5rem` (24px) | Bold (700) | Section headings, card titles. |
| **Body** | `1rem` (16px) | Regular (400) | Body copy, descriptions, form labels. |
| **Small** | `0.875rem` (14px) | Regular (400) | Captions, nav links, metadata. |
| **Buttons** | `1rem` (16px) | Semi-Bold (600) | All button labels. |

**Typographic Rules:**

- The "Industrial" look is achieved by pairing high-contrast Navy text against stark White or Gold backgrounds, keeping the tracking tight (`-0.025em` to `-0.05em`) on larger headlines to mimic vintage signage.
- `text-transform: uppercase` is applied to headings, navigation, buttons, and footer text for a stencilled, mechanical feel.
- Always provide `aria-label` attributes on links and buttons with CSS-uppercased text to ensure screen readers announce the correctly-cased words rather than spelling out acronyms.

### 4. Spacing

A rem-based spacing scale provides consistent rhythm across all layouts.

| Token | Value | Pixels |
|---|---|---|
| **XS** | `0.25rem` | 4px |
| **SM** | `0.5rem` | 8px |
| **MD** | `1rem` | 16px |
| **LG** | `1.5rem` | 24px |
| **XL** | `2rem` | 32px |

### 5. Elevation & Depth

Elevation in Industrial Artefact is tactile and mechanical.

- **The Layering Principle:** Components are "bolted" onto the interface rather than floating via light.
- **Standard Elevation:** `0.25rem 0.25rem 0px #0a1931` (4px offset). Used for cards, buttons, and search bars.
- **Active/Pressed State:** `0.0625rem 0.0625rem 0px #0a1931` (1px offset). When pressed, elements physically move `0.1875rem` (3px) down and right to simulate a mechanical button press.
- **The Utility Border:** All elevated elements must have a `0.125rem solid #0a1931` (2px) border.

### 6. Components

- **Buttons:** Rectangular with `0.25rem` (4px) rounding. Primary buttons use Gold fill with a Navy utility border and hard shadow. On press, they translate `0.1875rem` and the shadow collapses to `0.0625rem`.
- **Filter Chips:** Fully rounded (`6.1875rem` / 99px radius) "pills". Features a Navy utility border. Active state is solid Navy with White text.
- **Input Fields:** Surface (`#f4f6f9`) background, Navy utility border, and hard shadow. Text is centred vertically.
- **Navigation Links:** Small text (14px), bold weight, uppercase. Active state indicated by a thicker primary-coloured bottom border (`0.1875rem`), keeping text in the default dark colour for contrast compliance.
- **Floating Action Buttons (FAB):** 56x56px square, Primary Gold fill, Navy border, and hard shadow.
- **Map Pins:** Custom teardrop shapes in Crimson with a Navy stroke and hard shadow offset.

### 7. Interactions — The Mechanical Press

All interactive elements use the "Mechanical Press" mixin. This creates a tactile, physical button-press effect:

1. **Rest state:** Element has full utility shadow (`0.25rem` offset).
2. **Active/Pressed state:** On `:active`, the element translates `0.1875rem` down and right, and the shadow collapses to `0.0625rem`. This creates the illusion of a mechanical button being physically depressed.

No hover animations use opacity fades or scale transforms. Hover states use subtle background-colour shifts only.

### 8. Design Tokens (CSS)

```css
:root {
  /* Colours */
  --color-primary: #e0a500;
  --color-background: #ffffff;
  --color-surface: #f4f6f9;
  --color-text: #0a1931;
  --color-muted: #3d4d68;
  --color-accent: #990000;

  /* Typography */
  --font-stack: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --font-size-base: 1rem;          /* 16px */
  --font-size-small: 0.875rem;     /* 14px */
  --font-size-heading: 1.5rem;     /* 24px */
  --font-size-heading-lg: 2rem;    /* 32px */
  --font-weight-regular: 400;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-black: 900;

  /* Spacing */
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */

  /* Borders & Radii */
  --border-width-utility: 0.125rem;                /* 2px */
  --border-utility: 0.125rem solid #0a1931;
  --radius-standard: 0.25rem;                      /* 4px */
  --radius-pill: 6.1875rem;                        /* 99px */

  /* Elevation */
  --shadow-utility: 0.25rem 0.25rem 0px #0a1931;   /* 4px offset */
  --shadow-active: 0.0625rem 0.0625rem 0px #0a1931; /* 1px offset */
  --press-transform: translate(0.1875rem, 0.1875rem); /* 3px */
}
```

### 9. Accessibility

- All colour combinations meet WCAG AA minimum contrast thresholds. Key pairings meet WCAG AAA (7:1).
- Primary Gold (`#e0a500`) must never be used as text colour against white — it only achieves 2.19:1 contrast. Use it for borders, fills, and visual indicators.
- Muted text (`#3d4d68`) achieves >7:1 against Surface (`#f4f6f9`) for AAA compliance.
- CSS `text-transform: uppercase` text must include `aria-label` on parent interactive elements to prevent screen readers from interpreting words as acronyms.
- Decorative `::before`/`::after` content uses CSS alt text syntax (`content: '—' / ''`) to hide from the accessibility tree.
- Active navigation links use `aria-current="page"` to communicate current location to assistive technology.

### 10. Do's and Don'ts

- **DO:** Use hard corners with a maximum `0.25rem` (4px) radius for all primary actions.
- **DO:** Use the "Utility Shadow" for any element that is interactive.
- **DO:** Maintain WCAG AA contrast ratios at minimum; aim for AAA where possible.
- **DO:** Use `aria-current="page"` on active navigation links.
- **DO:** Use `aria-label` on interactive elements with CSS-uppercased text.
- **DON'T:** Use soft, multi-layered "natural" shadows or blurs.
- **DON'T:** Use rounded corners larger than `0.25rem` except for category "pills".
- **DON'T:** Use Primary Gold as a text colour against white or light backgrounds.
- **DON'T:** Expose decorative pseudo-element content to screen readers.
