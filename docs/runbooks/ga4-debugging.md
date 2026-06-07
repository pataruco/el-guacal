# Debugging Google Analytics 4 (GA4)

How to verify and debug analytics on El Guacal. The site loads **Google Tag
Manager** (`GTM-TKQ877L3`), which in turn fires a Google tag for the GA4
property **`G-TL10KNTQPS`** (stream `https://elguacal.com`).

GA4 runs in **Consent Mode**: until the user accepts the cookie banner, only
cookieless, consent-denied pings are sent. The consent grant is wired in
`apps/web/app/utils/analytics.ts` (`updateConsent`) and must go through the
`gtag('consent', 'update', …)` API — a plain `dataLayer.push({event: ...})` is
ignored by Google's consent state machine.

## Quick reference

| Thing | Value |
| ----- | ----- |
| GTM container | `GTM-TKQ877L3` |
| GA4 Measurement ID | `G-TL10KNTQPS` |
| Stream URL | `https://elguacal.com` |
| Collection endpoint | `https://region1.google-analytics.com/g/collect` |
| Consent code | `apps/web/app/utils/analytics.ts` |
| Cookie banner | `apps/web/app/components/cookie-banner/index.tsx` |

## 1. Verify collection from the live site (no GA login needed)

Watch the network for hits to Google's collection endpoint. Each hit's query
string tells you everything:

| Param | Meaning |
| ----- | ------- |
| `tid=G-TL10KNTQPS` | Target property — must match |
| `en=` | Event name (`page_view`, `scroll`, `user_engagement`, …) |
| `gcs=G100` | Consent: **denied** (cookieless ping) |
| `gcs=G111` | Consent: **granted** (ad_storage + analytics_storage on) |
| `gcu=1` / `gcut=3` | This hit is a consent **update** |
| `npa=0` / `npa=1` | Non-personalised ads off / on |
| `_p` | Page-load id (same value = same page load) |
| `_s` | Hit sequence number within the session |
| HTTP `204` | Google accepted the hit |

A healthy first visit: a `page_view` with `gcs=G100` on load, then — after
clicking **Accept** — a hit with `gcs=G111&gcu=1`, and an `_ga` cookie appears.

### Browser-cache gotcha

Hashed asset filenames (e.g. `analytics-BxliUNAr.js`) bust the asset cache, but
the **HTML** that references them can still be cached. If you tested the site
before a deploy, your session may hold stale HTML pointing at the old chunk and
show old behaviour. Force a fresh load with a cache-busting query param
(`?cb=...`) or a hard reload, and confirm the loaded chunk via
`performance.getEntriesByType('resource')`.

## 2. "Data collection isn't active" but the tag is installed

GA's "tag is already installed" check only detects that GTM/`gtag` is present on
the page — it does **not** confirm a GA4 tag is firing. The banner clears once
GA actually receives data (allow up to 24–48h after real, consent-granted
traffic starts). If hits return `204` in the network tab, collection is working;
the banner is just lagging.

## 3. Consent "Accept" doesn't grant (fixed 2026-06-07)

Symptom: clicking **Accept** sets `localStorage.tracking_consent = "granted"` and
hides the banner, but `gcs` stays `G100`, no `_ga` cookie is set, and
`window.google_tag_data.ics.entries` show no `update`.

Cause: `updateConsent` pushed a custom `{event: 'consent_update'}` object that
nothing consumed. Fix: call `gtag('consent', 'update', {…})`. Verified live —
the real Accept button now produces a `gcs=G111&gcu=1` hit and an `_ga` cookie.

## 4. Returning visitors aren't tracked (fixed 2026-06-07)

Symptom: a visitor who previously accepted (`localStorage.tracking_consent =
"granted"`) loads the site again. The banner stays hidden (correct), but every
hit is `gcs=G100` (denied) and `window.google_tag_data.ics.entries` show no
`update`. So returning, consented visitors are still tracked cookieless-denied.

Cause: consent was only applied in the cookie banner's click handler
(`handleConsent` → `updateConsent`). On a fresh page load Consent Mode resets to
the default (`denied` from the GTM bootstrap), and nothing re-applied the stored
choice. Consent Mode does **not** persist across page loads on its own — the app
must re-send stored consent on every load.

Fix (code, `apps/web/app/components/cookie-banner/index.tsx`): an effect now
calls `updateConsent(consent)` on mount whenever the stored consent (read via
`useLocalStorage`) is `granted`/`denied`. The click handler just sets the stored
value; the same effect applies it, so load and click share one path.

Verified live: a session with `localStorage.tracking_consent = "granted"` loads
with no banner and no click, and the `page_view`/`scroll` hits are `gcs=G111`,
`npa=0`, with `_ga` set and `ics` entries showing `update: true`.

## 5. Counting hits: use Performance Resource Timing, not the network panel

When checking how many `/collect` requests actually fired, count via the
**Performance Resource Timing API**, which records one entry per real fetch:

```js
performance.getEntriesByType('resource')
  .filter(r => /google-analytics\.com\/g\/collect/.test(r.name))
```

Some browser/devtools network views (and the Playwright MCP network list) can
show the **same** request twice — a logging artifact, not a real duplicate. On
2026-06-07 this caused a false "every event fires twice" alarm; the Performance
API showed exactly one `page_view` and one `scroll` per load, and the GTM
container was correctly configured (one Google tag, one
`Initialization - All Pages` trigger, "Once per event"). Patching
`navigator.sendBeacon`/`fetch` after page load does **not** work for counting —
gtag captures those references in a closure at load time.
