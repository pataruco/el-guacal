# 14. Visual Design System and Design Tokens

## Status

Accepted

## Context

The web app originally used an ad-hoc palette of Industrial Navy, orange
and accent red, defined as SCSS variables in
`apps/web/app/styles/settings/_settings.colors.scss`. There was no
design token layer, no documented type scale, no consistent radii or
elevation language, and no recorded accessibility baseline. Each new
component reinvented its own spacing, border treatment and focus
indicator, which slowed delivery and left visible inconsistencies
across the header, the map sidebar, the store cards and the forms.

El Guacal is a locator for Venezuelan products serving the diaspora.
The product personality we want to project is civic utility — trusted,
legible, unmistakably Venezuelan, comfortable at small touch targets on
a phone outdoors. The map surface is the main event; chrome around the
map should stay calm and get out of the way, and the primary action
("Add a store", "Open", "Directions") should pull the eye without
fighting the map for attention.

We also need to meet a real accessibility bar. The product will be used
by older relatives and by people in low-light conditions on mobile
data, and we want the design system to guarantee WCAG 2.2 AAA for text
and 1.4.11 for non-text UI, measured, not assumed.

Several forks were open when we started this work: whether to use a
neutral utility palette or lean into the Venezuelan flag; whether
primary should be yellow or blue; whether to adopt an Apple-Maps soft
aesthetic or a GOV.UK Design System sensibility; whether to keep SCSS
as the single source of truth or to introduce a tokens layer; which
type family to use and how to deliver it; and how to structure the
focus indicator so it keeps working on every surface in the palette.
This ADR records the decisions we made and the reasoning behind them.

## Decision

We adopt a layered design system for the web app, rooted in a single
`tokens.css` file that uses CSS custom properties and CSS cascade
layers as the primary distribution mechanism. SCSS is retained for
component partials, mixins and ITCSS composition, but all design
decisions (colour, type, spacing, radii, elevation, motion) live as
CSS custom properties, not SCSS variables, so they can be consumed
from any component and inspected in the browser.

The visual direction is GOV.UK Design System sensibility with the
Venezuelan flag palette on a pure white surface. Concretely:

**Palette.** Primary action is flag yellow (`oklch(89% 0.18 98)`,
≈#FCD116), always paired with ink text and a 2px ink border. Links,
focus indication and information states use deep flag blue
(`oklch(30% 0.15 266)`, ≈#00247D). Destructive actions use a darkened
flag red (`oklch(40% 0.2 27)`, derived from #CF142B) so white text on
the button reaches AAA. Success, warning and info states live in the
same OKLCH family for perceptual consistency. The surface is
`#ffffff`, not an off-white, and structural borders are always 2px
solid ink (`oklch(15% 0.01 260)`, ≈#0b0c0c).

**Typography.** Inter, single family, loaded from Google Fonts as a
true variable font (`wght@100..900`) via a `<link rel="stylesheet">`
in the document `<head>`. In the React Router 7 app this is wired
through the `links()` export in `apps/web/app/root.tsx`, with a
`preconnect` to `fonts.gstatic.com` to remove the DNS + TLS
handshake from the critical path. `display=swap` means first paint
runs on the `system-ui` fallback (SF Pro on Apple, Segoe UI Variable
on Windows 11, Roboto on Android) and Inter swaps in when the file
arrives; there is never a FOIT. Stylistic sets `cv11`, `ss01`,
`ss03` and `cv05` are enabled by default via
`font-feature-settings` on `<html>` to disambiguate 1/l/i and give
cleaner small-size rendering for UI and map pins.

This is a revision of the original decision, which was to self-host
a Latin + Latin Extended subset of Inter Variable via a single
`@font-face` rule. We switched to Google Fonts for setup simplicity
— zero asset pipeline, no subsetting dance, no binary committed to
the repo. The trade-offs are recorded in Consequences below and the
self-hosting path remains available if we need to revert.

**Shape language.** Radii are small (2–4px), borders are 2px solid
ink, elevation is delivered as flat solid box-shadow strips below
interactive elements rather than soft gaussian blur shadows. Buttons
carry a 2px ink "strip" underneath their bottom edge that collapses
on `:active`, which is the GOV.UK button affordance.

**Focus indicator.** A universal `:focus-visible` rule in
`@layer utilities` draws two concentric rings around any focused
element: a 3px deep flag-blue inner ring and a 2px ink outer ring.
The rule is delivered entirely through ring-shaped `box-shadow`
spreads and a transparent `outline` for Windows High Contrast Mode,
so it composes cleanly with any component, including inputs and
ghost buttons that own their own background colour. The blue inner
is chosen specifically so the yellow primary button — the main CTA
and the most-focused control in the app — has two visible rings on
focus. 1.4.11 is satisfied everywhere by the ink outer ring against
the white page (≥14.22:1).

**Accessibility bar.** Every text pair in the system meets WCAG 2.2
AAA (7:1 normal, 4.5:1 large). Every non-text UI pair meets 1.4.11
(3:1), either directly or via a documented mitigation (yellow
surfaces depend on their 2px ink border to provide the boundary —
the same pattern GOV.UK uses for its yellow CTA). Touch targets meet
2.5.5 AAA at 44px. `prefers-reduced-motion` collapses all duration
tokens to 0ms. The full contrast audit lives alongside the mockup at
`docs/design/mockups/AAA-audit.md`.

**Architecture.** CSS cascade layers are declared in
`tokens.css` in the order `@layer reset, tokens, base, components,
utilities`. Tokens live in the `tokens` layer, global element resets
in `reset`, element-level typography in `base`, component styles
(imported per-component via SCSS modules) in `components`, and
universal overrides — currently just `:focus-visible` — in
`utilities`. This ordering guarantees the focus indicator beats any
component rule without needing `!important` or increased selector
specificity. `tokens.css` is imported once from `index.scss` at the
top of the cascade so every SCSS partial and every component module
sees the custom properties.

## Consequences

- Positive: Every component reads the same tokens, so the header,
  map sidebar, store cards, chips and forms can be restyled
  incrementally without a big-bang rewrite.
- Positive: WCAG 2.2 AAA is a measured property of the design
  system, not an aspiration. The audit script and numbers live in
  the repo and can be re-run whenever tokens move.
- Positive: The focus indicator is defined once and works on every
  element in the system, including future components we haven't
  written yet, because it doesn't depend on the element's own
  `background-color`.
- Positive: Identity is distinctly Venezuelan without being
  gimmicky. Yellow primary + blue links + flag red destructive
  carries cultural signal through ordinary utility affordances.
- Positive: The type stack has a real fallback path. If Google
  Fonts is unreachable or blocked, the app renders in
  platform-native variable sans (SF Pro, Segoe UI Variable or
  Roboto), not Times.
- Positive: Loading Inter from Google Fonts removes the asset
  pipeline, the subsetting step and the committed binary from the
  repo. The `links()` export in `root.tsx` is the only moving part.
- Negative: Yellow primary is structurally dependent on its 2px ink
  border to satisfy 1.4.11 against the white page. Any future
  component that uses the yellow fill without the border will look
  broken and fail accessibility. This is documented in
  `AAA-audit.md` and should be enforced by component review.
- Negative: The focus ring is intentionally chunky (5px total
  chrome) and inside a long form it can feel heavy as the user
  tabs between fields. If this becomes a complaint we can reduce
  `--focus-ring-width` from 3px to 2px; the contrast numbers hold.
- Negative: Loading Inter from Google Fonts sends the user's IP
  address to Google on every page load. There is real GDPR
  exposure here — German courts have ruled against Google Fonts
  over CDN served without consent (LG München I, 20.01.2022, Az.
  3 O 17493/20). For a Venezuelan diaspora app with EU users this
  may become a blocker; the mitigation is to revert to
  self-hosting, which was the original decision and remains
  documented in this ADR's revision history.
- Negative: Loading Inter from a third-party origin costs a DNS
  lookup and TLS handshake on first paint. The `preconnect` in
  `root.tsx` mitigates most of this by opening the connection
  early, but it cannot match a same-origin asset. The
  `display=swap` policy means this cost never blocks first paint
  — it only delays the swap from system-ui to Inter.
- Negative: Loading Inter from Google Fonts is incompatible with
  an offline-first service worker. If we later want El Guacal to
  work offline on flaky mobile networks, the font stylesheet
  becomes an uncacheable external dependency and we will need to
  self-host so the service worker can intercept and serve it.
- Negative: Per-origin HTTP cache partitioning (rolled out in all
  major browsers from 2020) means Inter is fetched fresh per site
  — the old "everyone has Google Fonts cached already" argument
  no longer holds. We pay the network cost on first visit
  regardless of whether the user has visited any other site on
  Google Fonts.
- Negative: Two type systems now coexist during migration — the
  old SCSS variables in `_settings.colors.scss` and the new CSS
  custom properties in `tokens.css`. The old variables will be
  deleted once every component has been restyled, but until then
  the repo carries both.
- Negative: The GOV.UK button "strip" shadow means buttons visually
  move 2px on `:active`. Users with vestibular sensitivity may
  notice; `prefers-reduced-motion` disables the transition but
  not the strip collapse itself.
- Revisit: Dark mode. The current tokens are light-only. Adding
  dark mode will require a second set of surface and ink tokens
  and a re-audit of the focus indicator against dark surfaces.
  This is explicitly out of scope for this ADR.
- Revisit: The logo. There is currently a plain text wordmark
  "el guacal" in bold Inter. An actual logo mark is deferred to a
  future ADR.
