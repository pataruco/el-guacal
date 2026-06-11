# Footer version display

**Date:** 2026-06-11
**Status:** Approved, ready for implementation plan
**Related work:** [`project_low_zoom_map_brainstorm`](/Users/pataruco/.claude/projects/-Users-pataruco-dev-el-guacal/memory/project_low_zoom_map_brainstorm.md) (concurrent server release `0.11.0` made the absence of in-app version display feel acute)

## Context

The codebase uses release-please with `apps/web` and `apps/server` as **independent packages** (separate `package-name`, `release-type`, and changelog). The two version trains move at different rates — at time of writing, web is on `1.18.0` and server is on `0.11.0`. After deploying to prod, there is no in-app surface to confirm "what version is actually running".

The footer at `apps/web/app/components/footer/index.tsx` currently shows only a left-aligned nav (email link + privacy policy). The right side is empty.

## Goals

1. Display both versions in the footer's right-hand side: `API 0.11.0  |  Web 1.18.0`.
2. Each version is a clickable link to its corresponding GitHub release tag page.
3. Both values are read at **web build time** — accepting that the server-version display can lag actual deployed reality between web releases.

## Non-goals

- No live runtime fetch of the server version (e.g., GraphQL `version` field). Deferred — see "Future considerations".
- No locale-aware label translation. "API" and "Web" are loanwords in Spanish; the i18n indirection adds noise without semantic gain.
- No git SHA, build timestamp, or other extended metadata. Semver alone.
- No anchor into a specific CHANGELOG.md section. The release-tag page mirrors the CHANGELOG content.
- No changes to `apps/server` or to the GraphQL schema.

## Architecture

Build-time bake using Vite's `define` mechanism:

1. `vite.config.ts` reads `apps/web/package.json` (JSON parse → `version`) and `apps/server/Cargo.toml` (regex match on `^version = "X.Y.Z"`).
2. Both values are wired into Vite's `define`, exposing two global constants: `__WEB_VERSION__` and `__API_VERSION__`.
3. A new ambient `globals.d.ts` declares the constants so TypeScript accepts them.
4. The footer component reads the globals and renders two anchor tags, one per version.

No new npm dependencies. No new build steps. No generated files.

## Files touched

| File                                                              | Change                                                                                                                                              |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/vite.config.ts`                                         | Add a block that reads both source files at config evaluation time. Throw if either read fails. Wire `define: { __WEB_VERSION__, __API_VERSION__ }` |
| `apps/web/app/globals.d.ts` _(new)_                               | `declare const __WEB_VERSION__: string;`<br>`declare const __API_VERSION__: string;`                                                                |
| `apps/web/app/components/footer/index.tsx`                        | Add right-side block with two `<a>` elements linking to GitHub release tag pages                                                                    |
| `apps/web/app/components/footer/index.module.scss`                | Add `c-footer__versions` BEM element with `margin-left: auto`. Wrap in existing `@layer components`                                                 |
| `apps/web/app/components/footer/__tests__/index.test.tsx` _(new)_ | Vitest render test asserting both version strings + correct `href`s appear                                                                          |

## Data flow

**Build time (every `vite dev` and `vite build`):**

```
apps/web/package.json     →  JSON.parse  →  "1.18.0"  →  __WEB_VERSION__
apps/server/Cargo.toml    →  regex       →  "0.11.0"  →  __API_VERSION__
```

Vite substitutes the constants as **string literals** into the emitted bundle. The footer JSX:

```tsx
<a
  href={`https://github.com/pataruco/el-guacal/releases/tag/server-v${__API_VERSION__}`}
  target="_blank"
  rel="noopener noreferrer"
>
  API {__API_VERSION__}
</a>
```

compiles (effectively) to:

```tsx
<a
  href="https://github.com/pataruco/el-guacal/releases/tag/server-v0.11.0"
  target="_blank"
  rel="noopener noreferrer"
>
  API 0.11.0
</a>
```

**Runtime:** nothing. The values are literal strings in the bundle.

## Behaviour

Rendered output, right side of footer:

```
API 0.11.0  |  Web 1.18.0
```

- Each version is a link.
- Links open in a new tab (`target="_blank" rel="noopener noreferrer"`).
- Separator `|` is a static element between the two links.
- Labels (`API`, `Web`) are hardcoded English — not i18n-keyed.
- The repo owner/name (`pataruco/el-guacal`) is hardcoded in the footer URL template.

### Responsive

The footer's `c-footer__container` already uses `display: flex; align-items: center`. The new `c-footer__versions` element gets `margin-left: auto` to anchor right. On narrow viewports the container is allowed to wrap so the versions block flows below the nav rather than overflowing horizontally.

### Visual style

Versions use `--color-ink-muted` (already in the footer's text color cascade) and the existing link styling from `.c-footer a` (semibold, underlined, blue hover). No new design tokens.

## Error handling

**Build-time failures (intentionally loud):**

- If `apps/web/package.json` has no `version` field → throw, build fails.
- If `apps/server/Cargo.toml` regex match fails (e.g., `version` line moved, removed, or reformatted) → throw, build fails.
- Both throws include the offending file path and a hint about what was expected.

**Runtime failures:** none possible. Values are baked literals; no fetch, no decode, no I/O.

**Click-time edge case:** if release-please hasn't yet created the release tag for a freshly-bumped version, the link 404s on GitHub. Acceptable — manual visit to the repo's release page resolves it.

## Testing

**Vitest render test (`__tests__/index.test.tsx`):**

1. Render the footer with a wrapping `MemoryRouter` and i18n provider (the component uses `useTranslation` and `useParams`).
2. Assert `screen.getByText(/API \d+\.\d+\.\d+/)` and `screen.getByText(/Web \d+\.\d+\.\d+/)` exist.
3. Assert the two `<a>` elements have `href` matching `https://github.com/pataruco/el-guacal/releases/tag/server-v\d+\.\d+\.\d+` and `.../tag/web-v\d+\.\d+\.\d+` respectively.
4. Assert both have `target="_blank"` and `rel="noopener noreferrer"`.

Vite's `define` is honoured under Vitest using the same `vite.config.ts`, so the test sees the real baked values.

**No other test layers needed.** The vite-config throws ARE the build-time test for source-file changes. The footer is small enough that a render test fully covers it.

## Out of scope, future considerations

- **Live runtime fetch of server version** — if/when the lag between server deploys and web deploys becomes a measured problem, swap the build-time bake for a small GraphQL query field. Footer code only needs the variable swapped for a hook return.
- **Localised labels** — if the project ever needs `Servidor` etc., add i18n keys for `footer.versions.api` and `footer.versions.web`. Low-cost migration.
- **Git SHA suffix** — if support debugging needs it later, append a 7-char short SHA. Same build-time mechanism, one more read from `git rev-parse --short HEAD` in the vite config.
- **Anchor into CHANGELOG section** — if the release tag page UX disappoints, build-time parse the CHANGELOG to extract release dates and construct heading slugs.
