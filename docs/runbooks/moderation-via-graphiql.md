# Moderation via GraphiQL Playground

How to review store proposals using the GraphiQL UI until a dedicated moderation dashboard is built.

## Prerequisites

### Server environment

The server needs these environment variables in `apps/server/.env`:

```
GCP_PROJECT_ID=el-guacal
SEED_ADMIN_FIREBASE_UID=<your-firebase-uid>
```

- `GCP_PROJECT_ID` enables Firebase token verification. Without it, the server skips all auth and every request is anonymous.
- `SEED_ADMIN_FIREBASE_UID` promotes that Firebase user to `admin` role on server startup.

After adding or changing these, restart the server.

### Your account

- You must be logged in to the web app with the account matching `SEED_ADMIN_FIREBASE_UID` (or any account with `admin` or `moderator` role).

## 1. Open the playground

- **Local:** http://localhost:8080/graphql
- **Production:** https://el-guacal-api-<hash>.run.app/graphql

## 2. Get your Firebase token

Firebase v9+ stores auth data in IndexedDB, not localStorage. To extract the token:

1. Log in to the web app (http://localhost:5173/en/auth).
2. Open browser DevTools > **Console** (on the **web app** tab, not the GraphiQL tab).
3. Run:

```js
const req = indexedDB.open('firebaseLocalStorageDb');
req.onsuccess = () => {
  const db = req.result;
  const tx = db.transaction('firebaseLocalStorage', 'readonly');
  tx.objectStore('firebaseLocalStorage').getAll().onsuccess = (e) => {
    const token = e.target.result[0]?.value?.stsTokenManager?.accessToken;
    console.log(token);
  };
};
```

4. Right-click the printed string and choose **Copy string contents** (important: do not double-click to select, as the browser may truncate the value with `...` which will break the request).
5. Keep this token for the next step.

> Tokens expire after 1 hour. If you get an "Unauthorized" error, repeat this step on the web app tab to get a fresh token.

## 3. Set the Authorization header

In the GraphiQL playground, click the **Headers** tab (bottom-left, below the query panel) and paste:

```json
{
  "Authorization": "Bearer <paste-your-full-token-here>"
}
```

## 4. View pending proposals

```graphql
query PendingProposals {
  pendingStoreProposals(limit: 50) {
    edges {
      node {
        proposalId
        kind
        status
        proposedName
        proposedAddress
        proposedLocation {
          lat
          lng
        }
        reason
        createdAt
        proposer {
          displayName
          role
          trustScore
        }
        diffAgainstCurrent {
          field
          before
          after
        }
        possibleDuplicates {
          storeId
          name
          address
          location {
            lat
            lng
          }
        }
      }
    }
    hasNextPage
  }
}
```

### What to look for

| Field | Purpose |
|---|---|
| `kind` | `CREATE` = new store, `UPDATE` = edit, `DELETE` = removal |
| `proposedName` / `proposedAddress` | What the contributor submitted |
| `diffAgainstCurrent` | For updates: shows what changed vs. the current store |
| `possibleDuplicates` | For creates: stores within 100m that might be the same |
| `reason` | For deletions: why the contributor wants it removed |
| `proposer.trustScore` | Higher = more previously approved proposals |

## 5. Approve a proposal

Copy the `proposalId` from the query above and run:

```graphql
mutation ApproveProposal {
  reviewStoreProposal(input: {
    proposalId: "<paste-proposal-id-here>"
    decision: APPROVE
    note: "Verified, looks correct"
  }) {
    status
    targetStoreId
    reviewedAt
  }
}
```

What happens on approve:
- **CREATE**: a new store is inserted and appears on the map.
- **UPDATE**: the existing store is updated, its `version` is bumped.
- **DELETE**: the store is removed from the database.
- The contributor's `trustScore` increases by 1.

## 6. Reject a proposal

```graphql
mutation RejectProposal {
  reviewStoreProposal(input: {
    proposalId: "<paste-proposal-id-here>"
    decision: REJECT
    note: "This store already exists as Bodega La Esquina"
  }) {
    status
    reviewedAt
  }
}
```

What happens on reject:
- The proposal is marked `REJECTED`.
- The contributor's `trustScore` decreases by 3.
- The `note` is visible to the contributor on their "My store proposals" page.

## 7. Filter by proposal type

To see only new store proposals:

```graphql
query PendingCreates {
  pendingStoreProposals(kind: CREATE, limit: 20) {
    edges {
      node {
        proposalId
        proposedName
        proposedAddress
        possibleDuplicates {
          name
          address
        }
      }
    }
  }
}
```

Valid `kind` values: `CREATE`, `UPDATE`, `DELETE`.

## 8. Look up a single proposal

```graphql
query SingleProposal {
  storeProposal(id: "<proposal-id>") {
    proposalId
    kind
    status
    proposedName
    proposedAddress
    proposedLocation {
      lat
      lng
    }
    createdAt
    reviewedAt
    reviewNote
    proposer {
      displayName
      trustScore
    }
    reviewedByUser {
      displayName
    }
    diffAgainstCurrent {
      field
      before
      after
    }
  }
}
```

## 9. Manage user roles

To promote a user to moderator (admin-only):

```graphql
mutation PromoteToModerator {
  setUserRole(input: {
    firebaseUid: "<firebase-uid>"
    role: "moderator"
    region: "caracas"
  }) {
    displayName
    role
    region
  }
}
```

Valid roles: `contributor`, `moderator`, `admin`.

## Troubleshooting

### "Unauthorized"

The server couldn't verify your token. Check:
1. `GCP_PROJECT_ID=` is in `apps/server/.env` and the server was restarted.
2. Your token hasn't expired (tokens last 1 hour — grab a fresh one from the web app console).
3. You used **Copy string contents** when copying the token, not a regular select-all which may truncate with `...`.

### "Forbidden: moderator or admin required"

Your token is valid but your account doesn't have the right role. Check:
1. `SEED_ADMIN_FIREBASE_UID` in `apps/server/.env` matches your Firebase UID.
2. The server was restarted after adding it (the seed runs once on startup).
3. You logged into the web app at least once after the server restarted (the upsert runs on each authenticated request).

### "Proposal is not pending"

Already reviewed by another moderator. Re-query to see its current status.

### "Target store version changed since submission"

The store was modified after the proposal was submitted. The proposal is automatically marked `SUPERSEDED`. The contributor will need to re-submit against the current version.

### "Target store no longer exists"

The store was deleted between submission and review. The proposal cannot be approved.
