# 9. Authentication and Client-Side Hosting

## Status

Accepted

## Context

We need a secure way to authenticate users and a reliable platform to host our static frontend.

## Decision

We have chosen Firebase for both authentication and client-side hosting.

Specifically, we use Firebase Authentication for managing user accounts and sign-in (including Google Sign-In) and Firebase Hosting for serving our static React application.

On the backend, we verify the Firebase ID tokens (JWT) provided by the client to secure our GraphQL mutations.

## Consequences

- Positive: Easy integration with popular sign-in providers like Google.
- Positive: Secure and managed authentication service reduces the risk of security vulnerabilities.
- Positive: Fast and reliable hosting with a built-in global CDN.
- Negative: Adds a dependency on a third-party service (Google Firebase).
- Negative: Requires careful management of Firebase configuration and API keys.
