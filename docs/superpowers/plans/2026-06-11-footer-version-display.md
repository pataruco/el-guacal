# Footer Version Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display web and API semver versions in the footer's right-hand side, each linking to the corresponding GitHub release tag page. Both values are baked at web build time.

**Architecture:** A shared helper reads `apps/web/package.json` and `apps/server/Cargo.toml` at config-evaluation time. Both `vite.config.ts` and `apps/web/config/vitest.config.ts` import the helper and wire two `define` globals — `__WEB_VERSION__` and `__API_VERSION__` — substituted as string literals into the bundle and into transformed test code. The footer component reads the globals and renders two anchor tags.

**Tech Stack:** Vite 7, Vitest 4, React 19, React Router 7, TypeScript (ESM, `verbatimModuleSyntax`), Sass modules.

**Deviation from spec:** The spec listed 5 touched files. This plan adds ONE more (`apps/web/config/versions.ts`) because Vitest's config does not inherit `define` from `vite.config.ts`. The shared helper avoids duplicating the read logic in two configs.

---

### Task 1: Wire build-time version constants

**Files:**
- Create: `apps/web/config/versions.ts`
- Modify: `apps/web/vite.config.ts`
- Modify: `apps/web/config/vitest.config.ts`
- Create: `apps/web/app/globals.d.ts`

- [ ] **Step 1: Create the shared version-reader module**

Create `apps/web/config/versions.ts`:

```ts
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, '..');
const SERVER_ROOT = path.resolve(__dirname, '..', '..', 'server');

interface PackageJson {
  version?: string;
}

export function readWebVersion(): string {
  const pkgPath = path.join(WEB_ROOT, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as PackageJson;
  if (!pkg.version) {
    throw new Error(`Expected a "version" field in ${pkgPath}`);
  }
  return pkg.version;
}

export function readApiVersion(): string {
  const cargoPath = path.join(SERVER_ROOT, 'Cargo.toml');
  const cargo = readFileSync(cargoPath, 'utf8');
  const match = cargo.match(/^version\s*=\s*"([^"]+)"/m);
  if (!match) {
    throw new Error(
      `Expected a top-level 'version = "..."' line in ${cargoPath}`,
    );
  }
  return match[1];
}
```

- [ ] **Step 2: Wire `define` in `vite.config.ts`**

Modify `apps/web/vite.config.ts` (full new content):

```ts
import path from 'node:path';
import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { readApiVersion, readWebVersion } from './config/versions';

export default defineConfig({
  plugins: [reactRouter(), tsconfigPaths()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'app'),
    },
  },
  define: {
    __WEB_VERSION__: JSON.stringify(readWebVersion()),
    __API_VERSION__: JSON.stringify(readApiVersion()),
  },
  server: {
    proxy: {
      '/graphql': {
        changeOrigin: true,
        target: 'http://localhost:8080',
      },
    },
  },
});
```

Note the `JSON.stringify` calls: Vite's `define` does a verbatim text substitution, so passing a bare string `"0.11.0"` would insert the unquoted token `0.11.0` (a malformed expression). `JSON.stringify` produces the quoted literal `"0.11.0"`.

- [ ] **Step 3: Wire `define` in `vitest.config.ts`**

Modify `apps/web/config/vitest.config.ts` (full new content):

```ts
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { readApiVersion, readWebVersion } from './versions';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // @ts-expect-error
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '..', 'app'),
    },
  },
  define: {
    __WEB_VERSION__: JSON.stringify(readWebVersion()),
    __API_VERSION__: JSON.stringify(readApiVersion()),
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

- [ ] **Step 4: Create ambient declarations for the globals**

Create `apps/web/app/globals.d.ts`:

```ts
declare const __WEB_VERSION__: string;
declare const __API_VERSION__: string;
```

(Picked up automatically by `tsconfig.app.json` because `include: ["app"]` covers the entire app directory.)

- [ ] **Step 5: Verify types compile cleanly**

Run:
```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no output, exit code 0.

- [ ] **Step 6: Smoke-verify Vite substitutes the values at runtime**

Temporarily add a `console.log` to the footer to confirm the build-time substitution works end-to-end. This will be removed before commit.

Edit `apps/web/app/components/footer/index.tsx` and add at the top of the `Footer` function body (before the return):

```tsx
console.log('versions', { web: __WEB_VERSION__, api: __API_VERSION__ });
```

Run:
```bash
cd apps/web && moon run web:dev
```

Open the app in a browser, look at the DevTools console. Expected output: `versions { web: "1.18.0", api: "0.11.0" }` (the literal strings should appear — proving Vite substituted them at build time).

Then revert the temporary edit:
```bash
git restore apps/web/app/components/footer/index.tsx
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/config/versions.ts apps/web/vite.config.ts apps/web/config/vitest.config.ts apps/web/app/globals.d.ts
git commit -m "feat(web): bake API and web versions as build-time globals

Add a shared config/versions.ts helper that reads
apps/web/package.json (JSON.parse) and apps/server/Cargo.toml
(regex). Wire both into Vite and Vitest define maps, exposed as
__WEB_VERSION__ and __API_VERSION__. globals.d.ts declares the
ambient types for the TS compiler.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Render version block in footer (TDD)

**Files:**
- Create: `apps/web/app/components/footer/__tests__/index.test.tsx`
- Modify: `apps/web/app/components/footer/index.tsx`

- [ ] **Step 1: Write the failing render test**

Create `apps/web/app/components/footer/__tests__/index.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import Footer from '../index';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router', () => ({
  Link: ({ to, children, ...rest }: { to: string; children: ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useParams: () => ({ locale: 'en' }),
}));

describe('Footer', () => {
  it('renders the API version as a link to the server release tag', () => {
    render(<Footer />);

    const apiLink = screen.getByRole('link', { name: /^API \d+\.\d+\.\d+$/ });

    expect(apiLink.getAttribute('href')).toMatch(
      /^https:\/\/github\.com\/pataruco\/el-guacal\/releases\/tag\/server-v\d+\.\d+\.\d+$/,
    );
    expect(apiLink.getAttribute('target')).toBe('_blank');
    expect(apiLink.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('renders the Web version as a link to the web release tag', () => {
    render(<Footer />);

    const webLink = screen.getByRole('link', { name: /^Web \d+\.\d+\.\d+$/ });

    expect(webLink.getAttribute('href')).toMatch(
      /^https:\/\/github\.com\/pataruco\/el-guacal\/releases\/tag\/web-v\d+\.\d+\.\d+$/,
    );
    expect(webLink.getAttribute('target')).toBe('_blank');
    expect(webLink.getAttribute('rel')).toBe('noopener noreferrer');
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run:
```bash
cd apps/web && pnpm test --run app/components/footer
```

Expected: FAIL with `Unable to find an accessible element with the role "link" and name /^API \d+\.\d+\.\d+$/`. (The footer doesn't render the versions block yet.)

- [ ] **Step 3: Add the versions block to the footer**

Modify `apps/web/app/components/footer/index.tsx` (full new content):

```tsx
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import type { ContentLocale } from '@/i18n';
import styles from './index.module.scss';

const REPO_URL = 'https://github.com/pataruco/el-guacal';

const Footer = () => {
  const { locale } = useParams<{ locale: string }>();
  const { t } = useTranslation();
  const currentLocale = (locale as ContentLocale) || 'en';

  return (
    <footer className={styles['c-footer']}>
      <div className={styles['c-footer__container']}>
        <nav>
          <ul>
            <li>
              <a href="mailto:hola@elguacal.com">{t('footer.email')}</a>
            </li>
            <li>
              <Link to={`/${currentLocale}/privacy-policy`}>
                {t('footer.privacyPolicy')}
              </Link>
            </li>
          </ul>
        </nav>
        <div className={styles['c-footer__versions']}>
          <a
            href={`${REPO_URL}/releases/tag/server-v${__API_VERSION__}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            API {__API_VERSION__}
          </a>
          <span aria-hidden="true">|</span>
          <a
            href={`${REPO_URL}/releases/tag/web-v${__WEB_VERSION__}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Web {__WEB_VERSION__}
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
```

Notes:
- `REPO_URL` is a local constant — simpler than threading through config; if you ever need to vary it per environment, lift it later.
- The `|` separator is wrapped in a `<span aria-hidden="true">` so screen readers don't announce "vertical bar" between the two links.
- `__API_VERSION__` and `__WEB_VERSION__` are the build-time globals from Task 1.

- [ ] **Step 4: Run the test and confirm it passes**

Run:
```bash
cd apps/web && pnpm test --run app/components/footer
```

Expected: 2 tests passing.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/components/footer/index.tsx apps/web/app/components/footer/__tests__/index.test.tsx
git commit -m "feat(footer): show API and web semver as release-tag links

Both versions read from build-time __API_VERSION__ /
__WEB_VERSION__ globals. Each renders as an anchor opening the
corresponding GitHub release tag page in a new tab. Separator is
ARIA-hidden so screen readers don't announce 'vertical bar'.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Style the version block to anchor right

**Files:**
- Modify: `apps/web/app/components/footer/index.module.scss`

- [ ] **Step 1: Add the `c-footer__versions` BEM element**

Modify `apps/web/app/components/footer/index.module.scss` — inside the existing `@layer components` block, after the `&__container` block, add the new element. Also update `&__container` to allow wrap + gap.

Full new file content:

```scss
// Footer — restyled to Figma direction. Pairs with the slim,
// full-width header chrome: sunken-surface bar at the bottom with
// a hairline top border (not the prior 2px ink), full-width
// content (no max-width cap), and a soft text link.
//
// Wrapped in `@layer components` so the universal :focus-visible
// rule in @layer utilities beats any box-shadow declarations.
@layer components {
  .c-footer {
    width: 100%;
    padding: var(--space-4) var(--space-5);
    // White surface to match the rest of the page chrome and
    // content. Sunken grey-100 was a gov.uk-era choice that
    // looked like a de-emphasised block, but now reads as an
    // unwanted visual break against the white content surfaces
    // we use everywhere else.
    background-color: var(--color-surface-page);
    border-top: var(--border-width-hairline) solid var(--color-border);
    font-size: var(--text-sm);
    color: var(--color-ink-muted);

    // Full-width content row — same change we made to the header
    // (no max-width cap). Privacy link sits flush-left with the
    // page gutter, matching the header logo column.
    //
    // flex-wrap lets the versions block flow below the nav on
    // narrow viewports instead of overflowing the container.
    &__container {
      width: 100%;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      column-gap: var(--space-4);
      row-gap: var(--space-2);
    }

    ul {
      display: flex;
      column-gap: var(--space-4);
    }

    // Right-anchored version display. `margin-left: auto` pushes
    // it to the right edge on wide screens; on narrow screens the
    // container wraps it to a new line.
    &__versions {
      margin-left: auto;
      display: flex;
      align-items: center;
      column-gap: var(--space-2);
      color: var(--color-ink-muted);
    }

    a {
      color: var(--color-link);
      font-weight: var(--weight-semibold);
      text-decoration: underline;
      text-underline-offset: 0.25rem;
      text-decoration-thickness: 2px;
      padding: var(--space-1) 0;
      transition: color var(--duration-fast) var(--ease-standard);

      &:hover {
        color: var(--color-link-hover);
      }
    }
  }
}
```

Changes from the original:
- `&__container`: added `flex-wrap: wrap`, `column-gap`, `row-gap` to support wrapping on narrow viewports.
- New `&__versions` BEM element with `margin-left: auto` for right-anchoring and small horizontal gap between the links and separator.

Per the CSS-migration rules memory: file is preserved as a single SCSS module, BEM naming maintained (`c-footer__versions`), wrapped in existing `@layer components`.

- [ ] **Step 2: Run the dev server and visually verify**

Run:
```bash
cd apps/web && moon run web:dev
```

Open the app in the browser. On any page:
- Wide viewport: nav on the left, "API X.Y.Z | Web X.Y.Z" anchored right on the same row.
- Narrow viewport (resize to ~400px): versions block wraps to a second row below the nav.
- Both version numbers are underlined blue links (existing `.c-footer a` style).
- Clicking either opens a new tab to a GitHub release tag URL.

- [ ] **Step 3: Run all tests one more time to catch any regression**

Run:
```bash
cd apps/web && pnpm test --run
```

Expected: all tests passing.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/components/footer/index.module.scss
git commit -m "feat(footer): anchor version block to the right with wrap fallback

c-footer__versions uses margin-left: auto on the existing flex
container. flex-wrap on the container lets the versions block
flow below the nav on narrow viewports instead of overflowing.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```
