# Authentication Flow

This document describes how authentication works across the El Guacal web application, from user sign-in through to authenticated GraphQL requests.

## Overview

The app uses **Firebase Authentication** on the frontend and **local JWT verification** on the backend. There is no session cookie or server-side session — the Firebase ID token (a standard JWT) is the sole credential, stored in the browser by Firebase and attached to every API request.

## Architecture

```mermaid
graph TB
    subgraph Browser
        A[auth.tsx] -->|signInWithRedirect / signInWithEmailAndPassword| B[Firebase Auth SDK]
        B -->|onIdTokenChanged| C[root.tsx listener]
        C -->|setAuth / clearAuth| D[Redux Store - auth slice]
        D -->|prepareHeaders reads idToken| E[RTK Query - base.ts]
        E -->|Authorization: Bearer token| F[GraphQL Request]
    end

    subgraph Firebase
        G[Firebase Auth Service]
        H[Google Identity Platform]
    end

    subgraph Server
        I[Axum Router - lib.rs]
        J[FirebaseVerifier - auth/mod.rs]
        K[Google Public Keys]
        L[GraphQL Resolvers]
    end

    B <-->|Authentication| G
    G <-->|Provider delegation| H
    F -->|HTTP POST /graphql| I
    I -->|Extract Bearer token| J
    J -->|Fetch & cache RSA keys| K
    J -->|Inject FirebaseUser| L
```

## Sign-In Flow

### Google Sign-In (Redirect)

```mermaid
sequenceDiagram
    participant U as User
    participant P as auth.tsx
    participant F as Firebase Auth SDK
    participant G as Google Identity Platform

    U->>P: Clicks "Sign in with Google"
    P->>F: signInWithRedirect(auth, googleProvider)
    F->>G: Redirect to Google consent screen
    G->>F: Redirect back with auth code
    Note over P: Page reloads after redirect
    P->>F: getRedirectResult(auth)
    F-->>P: UserCredential (or null)
    Note over P: onIdTokenChanged fires in root.tsx
```

### Email/Password Sign-In

```mermaid
sequenceDiagram
    participant U as User
    participant P as auth.tsx
    participant F as Firebase Auth SDK

    U->>P: Enters email + password, clicks "Sign In"
    P->>F: signInWithEmailAndPassword(auth, email, password)
    F-->>P: UserCredential
    Note over P: onIdTokenChanged fires in root.tsx
```

### Email/Password Sign-Up

```mermaid
sequenceDiagram
    participant U as User
    participant P as auth.tsx
    participant F as Firebase Auth SDK

    U->>P: Enters email + password, clicks "Create Account"
    P->>F: createUserWithEmailAndPassword(auth, email, password)
    F-->>P: UserCredential (new account)
    Note over P: onIdTokenChanged fires in root.tsx
```

## Token Lifecycle

```mermaid
sequenceDiagram
    participant F as Firebase Auth SDK
    participant R as root.tsx
    participant S as Redux Store
    participant A as RTK Query (base.ts)
    participant B as Server

    Note over F: User signs in (any method)
    F->>R: onIdTokenChanged(user)
    R->>R: user.getIdToken()
    R->>S: dispatch(setAuth({ idToken, user }))

    Note over F: ~55 min later (auto-refresh)
    F->>R: onIdTokenChanged(user) — new token
    R->>R: user.getIdToken()
    R->>S: dispatch(setAuth({ idToken, user }))

    Note over A: Any GraphQL mutation/query
    A->>S: getState().auth.idToken
    A->>B: POST /graphql + Authorization: Bearer <token>
```

Key details:

- Firebase ID tokens expire after **1 hour**
- Firebase SDK **auto-refreshes** tokens ~5 minutes before expiry
- `onIdTokenChanged` fires on every refresh, keeping the Redux store current
- Firebase persists sessions in **IndexedDB**, surviving page refreshes and browser restarts

## Server-Side Verification

```mermaid
sequenceDiagram
    participant C as Client
    participant R as Axum Router
    participant V as FirebaseVerifier
    participant G as Google Public Keys Endpoint
    participant Q as GraphQL Resolver

    C->>R: POST /graphql (Authorization: Bearer <token>)
    R->>R: Extract Bearer token from headers

    alt Token present & verifier configured
        R->>V: verify_token(token)
        V->>V: decode_header → extract kid
        V->>G: Fetch RSA public keys (cached 1hr)
        G-->>V: { kid: cert_pem, ... }
        V->>V: Match kid → decode JWT with RS256
        V->>V: Validate audience = GCP_PROJECT_ID
        V->>V: Validate issuer = securetoken.google.com/{project}
        V-->>R: FirebaseUser { uid, email }
        R->>Q: Execute with FirebaseUser in context
    else No token or verifier not configured
        R->>Q: Execute without FirebaseUser in context
        Note over Q: Mutation resolvers check for FirebaseUser<br/>and return "Unauthorized" if missing
    end
```

The server **never calls Firebase** to verify tokens. Instead, it:

1. Decodes the JWT header to get the `kid` (key ID)
2. Fetches Google's public RSA keys from `googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com` (cached for 1 hour)
3. Validates the JWT signature, audience (`GCP_PROJECT_ID`), issuer, and expiry locally

## Key Files

| File | Role |
|------|------|
| `apps/web/app/routes/auth.tsx` | Sign-in UI (Google + Email/Password) |
| `apps/web/app/utils/firebase.ts` | Firebase SDK initialization |
| `apps/web/app/root.tsx` | `onIdTokenChanged` listener → Redux sync |
| `apps/web/app/store/features/auth/slice.ts` | Redux auth state (`idToken`, `user`, `isAuthenticated`) |
| `apps/web/app/store/features/guacal-api/base.ts` | RTK Query base — attaches `Authorization` header |
| `apps/server/src/lib.rs` | Axum router — extracts Bearer token, calls verifier |
| `apps/server/src/auth/mod.rs` | `FirebaseVerifier` — local JWT validation with Google public keys |
| `apps/server/src/config.rs` | Reads `GCP_PROJECT_ID` env var (required for auth) |

## Environment Variables

### Frontend (build-time)

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain (e.g., `project.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

### Server (runtime)

| Variable | Purpose |
|----------|---------|
| `GCP_PROJECT_ID` | Used as JWT audience for token verification. If missing, `FirebaseVerifier` is `None` and all mutations return "Unauthorized" |
