# Participant Lookup handoff — spec + what we built

This **replaces** the earlier `registrationId`-in-fragment + resolve / verify /
mark-booked API design (`PORTAL-INTEGRATION.md` / `CHANGES-FOR-PORTAL.md`,
both removed). There is no callback API any more.

## The spec (from the INQUA team)

> **Redirect to the INQUA Participant Lookup page**
>
> When your button is clicked, redirect the browser (plain navigation —
> `window.location`, an `<a href>`, or a server-side `302`, whichever fits your
> code) to:
>
> `https://inqua.cotrav.co.in/participant?urn=<URN>`
>
> For local testing against the dev instance, use
> `http://localhost:3000/participant?urn=<URN>` instead.
>
> Replace `<URN>` with the participant's URN, URL-encoded (`encodeURIComponent`)
> in case it ever contains characters that aren't URL-safe. That's the entire
> integration on your side — one parameter, one redirect. No auth token, no
> headers, no POST body needed from you.
>
> **What happens after the redirect (already built, live on INQUA's side):**
> their page reads `urn` from the URL, calls the Partner Data Sharing API for
> the participant and their accompanying members, and renders the result —
> valid confirmed URN → details + accompanying members; unknown/not-confirmed →
> "no confirmed participant found"; malformed/missing → "this link isn't
> valid". Nothing on our side needs to poll, wait, or handle a response.
>
> **Test URNs:** `UF410Z` · `IELVG9` · `CEKUOP` · `6504DF` (some may come back
> "not confirmed" — expected, not a bug).

### Amendment

The destination path/format above was corrected after the fact — the query
string `?urn=` became a URL **fragment**:

| in the quote above | actual |
| --- | --- |
| `https://inqua.cotrav.co.in/participant?urn=<URN>` | `https://inqua.cotrav.co.in/stay#urn=<URN>` |
| `http://localhost:3000/participant?urn=<URN>` | `http://localhost:3000/stay#urn=<URN>` |

Nothing else changes — same URN, same one-way redirect, same "no auth token, no
headers, no POST body" contract. The rest of this doc reflects the corrected
`/stay#urn=` form.

## What we built

| | |
| --- | --- |
| `GET /book?registrationId=<id>` | look up that registration's `urn`, then `302` to `/stay#urn=<URN>` |
| `GET /lookup?urn=<urn>` | the same redirect with no registration lookup — for testing any URN directly |
| `PARTICIPANT_BASE_URL` env | `http://localhost:3000` in dev, set to `https://inqua.cotrav.co.in` for the real page |

Everything else from the previous design is gone: no `#registrationId=`
fragment, no bearer key, no `resolve` / `verify` / `mark-booked`, no eligibility
gate before redirecting (INQUA's page reports unknown/not-confirmed itself).

## Sample data

The four confirmed-looking seed registrations carry INQUA's own published test
URNs, so clicking through in the dev app hits the real Partner Data Sharing
lookup with real data:

| registrationId | urn | note |
| --- | --- | --- |
| `INQUA2026-04821` | `UF410Z` | |
| `INQUA2026-00002` | `IELVG9` | |
| `INQUA2026-07777` | `CEKUOP` | |
| `INQUA2026-00003` | `6504DF` | our own record says "cancelled" — irrelevant now, INQUA's page is the source of truth |
| `INQUA2026-00009` | _(none)_ | demonstrates "no URN on file" before one has been issued |

## Verifying it end to end

1. `npm start`, open <http://localhost:4000>.
2. Click **View participant** on any row with a URN → `302` lands on
   `/stay#urn=<URN>` at whatever `PARTICIPANT_BASE_URL` points to.
3. Point `PARTICIPANT_BASE_URL=https://inqua.cotrav.co.in` and repeat to hit the
   real, live page.
4. `INQUA2026-00009` shows "no URN on file" — nothing to redirect with yet.
