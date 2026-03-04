# 7. Frontend Framework and Deployment Strategy

## Status

Accepted

## Context

The frontend needs to be fast, SEO-friendly, and easy to deploy. It also needs a robust routing system and a way to manage complex user interfaces.

## Decision

We have chosen React with React Router v7 as our frontend framework. For deployment, we use Static Site Generation (SSG).

React Router v7 (the successor to Remix) provides a powerful routing system and built-in support for SSG. By generating a static site at build time, we can provide excellent performance and SEO while keeping deployment simple and cost-effective using Firebase Hosting.

## Consequences

- Positive: Excellent performance and SEO due to pre-rendered static pages.
- Positive: Simplified deployment and low hosting costs.
- Positive: Modern and powerful development experience with React and React Router.
- Negative: Requires a build step to generate the static site.
- Negative: Dynamic content still requires client-side fetching after the initial page load.
