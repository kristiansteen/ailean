# Ailean — Unit Test Summary

_Added 2026-09-07._

## What was tested

The lead-capture flow (`POST /api/v1/leads` in `backend/server.js`) was the only
piece of real logic in the Ailean backend. Its inline steps were extracted into
pure, side-effect-free functions in **`backend/lib/leads.js`** so each can be
tested in isolation. `server.js` now calls those functions instead of inlining
the logic — behaviour is unchanged.

| Unit | Responsibility |
|---|---|
| `validateLeadInput(body)` | Reject payloads missing name, email, or a non-empty `selectedDocuments` array |
| `firstNameOf(name)` | First token of a full name, with fallback |
| `buildLead(body, now)` | Shape the stored lead record (clock injected for determinism) |
| `renderWelcomeEmail(template, firstName)` | Substitute the `{{first_name}}` placeholder |
| `resolveAttachments(docs, dir, fs)` | Map requested filenames to Resend attachments; report missing ones (fs injected) |

## How to run

```bash
cd backend && npm test
```

Uses the built-in Node test runner (`node --test`) — no new dependencies.

## Outcome

```
tests 21
pass  21
fail  0
```

All 21 tests pass. `server.js` boots cleanly after the refactor and
`node -c server.js` is clean.

## Notes / follow-ups

- Coverage is the pure logic only, per request. The Express wiring, the
  `leads.json` read/write, and the live Resend call are not exercised.
- `buildLead` now derives `id` and `created_at` from a single timestamp
  (previously two separate `Date` reads a few microseconds apart) — no
  practical difference.
