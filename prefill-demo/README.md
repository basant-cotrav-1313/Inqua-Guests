# Registration → INQUA Participant Lookup handoff

The entire integration is a **one-way redirect**. No token, no API, no bearer
key, nothing calls back to us. INQUA's `/stay` page reads `urn` from the URL
fragment itself and looks the participant up via their own Partner Data Sharing
API.

```
GET /book?registrationId=INQUA2026-04821
        │
        ▼  look up that registration's urn
302 → ${PARTICIPANT_BASE_URL}/stay#urn=<URN>
```

## Run

```sh
npm install            # mongoose
npm start               # node server.js — connects to MongoDB, seeds if empty
npm run seed             # wipe + reload the sample data
```

Listens on **:4000**. Needs a MongoDB reachable at `MONGODB_URI`
(default `mongodb://127.0.0.1:27017/inqua_booking_handoff`).

### Env vars

| var                    | default                                           | meaning |
| ---------------------- | -------------------------------------------------- | ------- |
| `PORT`                 | `4000`                                             | this app's port |
| `MONGODB_URI`           | `mongodb://127.0.0.1:27017/inqua_booking_handoff` | MongoDB connection string |
| `PARTICIPANT_BASE_URL`  | `http://localhost:3000`                            | Participant Lookup origin; prod = `https://inqua.cotrav.co.in` |

## Collection

**`registrations`** — `registrationId` (unique), `urn` (the id INQUA's page
expects — absent if none has been issued yet), `firstName` / `lastName` (display
only, on our own registrations page), `status` (display only — it no longer
gates the redirect; INQUA's page itself reports unknown / not-confirmed URNs).

## Routes

### `GET /book?registrationId=…` — the button
Looks up the registration; `404` if unknown. `400` "No URN on file" if the
registration has no `urn` yet. Otherwise `302` →
`${PARTICIPANT_BASE_URL}/stay#urn=<URN>` (URN URL-encoded). No
confirmed/paid gate — the destination page handles that.

### `GET /lookup?urn=…` — direct passthrough
Same redirect, skipping the registration lookup entirely — exactly the shape of
the real integration (one param in, one redirect out). `400` if `urn` is missing.

### `GET /debug`
Dumps the `registrations` collection — demo aid, remove before shipping.

## Files

| file          | role |
| ------------- | ---- |
| `server.js`   | HTTP layer + the two redirect routes |
| `db.js`       | Mongoose connection, schema, data access, seed |
| `seed.js`     | `npm run seed` — reset to sample data |
| `index.html`  | registrations list + URN lookup box + INQUA's test-URN links |
| `PARTICIPANT-LOOKUP.md` | the spec this implements, for reference |

## Acceptance

1. `npm start`, open <http://localhost:4000>.
2. Click **View participant** on `INQUA2026-04821` → `302` to
   `http://localhost:3000/stay#urn=UF410Z` (point `PARTICIPANT_BASE_URL`
   at `https://inqua.cotrav.co.in` to hit the real page).
3. `INQUA2026-00009` (no `urn` yet) shows "no URN on file" instead of a button.
4. **Look up any URN directly** box, or the four "INQUA's published test URNs"
   links, exercise the redirect without needing a stored registration.
