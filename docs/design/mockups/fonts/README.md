# Inter — deprecated self-hosting folder

This folder previously documented how to fetch and subset Inter Variable
for self-hosting. We've since switched to loading Inter from Google
Fonts as a true variable font (`wght@100..900`) via a `<link>` in the
document `<head>`. See ADR 0014 for the reasoning and the revision
history, and `apps/web/app/root.tsx` for the `links()` export that
actually loads the stylesheet.

The self-hosting instructions are retained in the ADR's revision notes
in case we need to revert — for example, if we need the app to work
offline (service worker), if GDPR exposure from transmitting user IPs
to Google becomes a blocker, or if the Core Web Vitals cost of a
third-party font request turns out to matter on the Venezuelan mobile
networks we'll be running on.
