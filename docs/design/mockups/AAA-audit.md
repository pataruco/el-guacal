# El Guacal · Direction A · WCAG 2.2 AAA audit

Tokens audited: `tokens.css` rev 2 (flag-yellow primary + flag-blue accent
+ darkened flag-red danger, pure-white surface, 2px ink borders, gov.uk
focus pattern).

Measured with `coloraide` using the WCAG 2.1 contrast formula.

## Text pairs — target 7:1 (AAA normal) / 4.5:1 (AAA large)

| Pair                            | Ratio   | Target | Result |
|---------------------------------|---------|--------|--------|
| ink on white                    | 19.67:1 | 7      | PASS   |
| ink-muted on white              | 10.01:1 | 7      | PASS   |
| ink-subtle on white (large)     | 6.00:1  | 4.5    | PASS   |
| ink on yellow primary           | 14.22:1 | 7      | PASS   |
| ink on sunken                   | 17.51:1 | 7      | PASS   |
| blue link on white              | 14.20:1 | 7      | PASS   |
| blue link on yellow (focused)   | 10.26:1 | 7      | PASS   |
| white on danger                 | 10.22:1 | 7      | PASS   |
| white on accent-blue            | 14.20:1 | 7      | PASS   |
| white on success                | 9.46:1  | 7      | PASS   |
| white on warning                | 8.83:1  | 7      | PASS   |
| white on ink                    | 19.67:1 | 7      | PASS   |

## Non-text UI — target 3:1 (1.4.11)

| Pair                            | Ratio   | Target | Result |
|---------------------------------|---------|--------|--------|
| ink border on white             | 19.67:1 | 3      | PASS   |
| ink border on sunken            | 17.51:1 | 3      | PASS   |
| primary vs ink underline        | 14.22:1 | 3      | PASS   |
| focus underline (ink) on white  | 19.67:1 | 3      | PASS   |
| focus fill (primary) on ink     | 14.22:1 | 3      | PASS   |
| focus fill (primary) on danger  | 7.39:1  | 3      | PASS   |
| focus fill (primary) on blue    | 10.26:1 | 3      | PASS   |

## Focus indicator — dual-ring pattern

`:focus-visible` lives in `@layer utilities` so it beats any component
rule that touches `outline` or `box-shadow`. It draws two concentric
rings around the focused element:

1. 3px deep flag-blue ring (inner)
2. 2px ink ring (outer)

Both rings are drawn with ring-shaped `box-shadow` spreads. The rule
does not touch `background-color`, so it composes cleanly with
inputs, ghost buttons, links, or any future component that owns its
background. A transparent `outline` is kept for Windows High Contrast
Mode.

Why blue inner, not yellow: the yellow primary button is the main CTA
and the most-focused control in the app. A yellow inner ring would
fuse with the button fill and leave only the outer ink ring visible —
a weaker, inconsistent focus signal on the most important control.
Deep flag blue gives 10.26:1 against yellow so both rings stay
distinct on the yellow primary button. The trade is that blue fuses
with danger red and warning orange buttons; on those the focus is
carried by the outer ink ring alone. 1.4.11 is still satisfied
everywhere by the outer ink ring at ≥14.22:1 against any surface
adjacent to the white page.

Contrast on every surface in the palette:

| Surface         | Blue ring | Ink ring  | Result                |
|-----------------|-----------|-----------|-----------------------|
| white input     | 14.20:1   | 19.67:1   | both rings visible    |
| sunken button   | 12.64:1   | 17.51:1   | both rings visible    |
| yellow primary  | 10.26:1   | 14.22:1   | both rings visible    |
| danger red      | 1.39:1    | 19.67:1 ¹ | ink outer carries     |
| warning orange  | 1.61:1    | 19.67:1 ¹ | ink outer carries     |
| accent blue     | 1.00:1    | 19.67:1 ¹ | ink outer carries     |
| ink inverse     | 1.39:1    | 19.67:1 ¹ | ink outer carries     |

¹ ink ring contrast measured against the white page it sits on,
which is the adjacent color that matters for 1.4.11.

## Documented mitigation — yellow surfaces on white

`--color-primary` on white is 1.38:1, which fails 1.4.11 as a fill
color on its own. Every yellow surface in the system is wrapped by
a 2px ink border at rest (19.67:1 against white), and by the focus
dual-ring when focused. 1.4.11 is satisfied by the border and the
ring, not the fill. This is the same pattern gov.uk uses for its
yellow CTA.

## Touch targets

`--target-min: 2.75rem` (44px) — WCAG 2.5.5 AAA and 2.5.8 AA.

## Motion

`prefers-reduced-motion: reduce` collapses all three duration tokens
to 0ms.
