# User control and launch safeguards

## What works locally

The Library page is the control surface for Inputs, Concepts, Notes, and backups. Each item can be expanded, reviewed, and edited in place. Duplicate Concepts can be merged without losing Evidence. The latest mutation can be undone while the backend process remains running.

Backup export downloads one versioned JSON document containing the complete knowledge state. Restore validates that document against the public schema before replacing the current state; the replacement can be undone during the same backend session.

## Safety rules

- Editing an Input updates its direct, non-artifact Evidence excerpt.
- Merging Concepts moves Evidence, relations, Input links, Note links, and learning events to the retained Concept.
- Invalid IDs return `404`; invalid merges return `422`.
- Undo retains the latest 20 in-process checkpoints. Restarting the backend clears this undo history, so download a backup before large edits.
- Permanent deletion is intentionally unavailable before authentication and per-user isolation exist. An unauthenticated delete-all route would put every local record at risk.

## Operational safeguards

The API exposes `GET /health`, logs request method/path/status/duration, adds `X-Process-Time-Ms`, rejects oversized bodies, and applies an in-memory per-IP request limit. Configure the latter with `RATE_LIMIT_PER_MINUTE`.

Generation cost is bounded by source count, upload limits, extraction timeouts, and opt-in AI flags. GitHub Actions run backend tests + knowledge evals and frontend lint + build on pushes and pull requests.

## Still needs an owner decision

Authentication, per-user database keys, authenticated retention/deletion, production hosting, secret storage, and production CORS cannot be safely finalized from local code alone. Choose the auth and hosting providers first; then the state key currently named `single-user` must become the authenticated user ID across state, artifacts, jobs, search documents, and rate limits.

## Local user guide

1. Capture: type, speak, paste a public URL, or attach a supported file; then review AI proposals.
2. Knowledge: inspect the map and ask questions grounded in your sources.
3. Next: take the single recommended next step.
4. Growth: switch Week, Month, or Year to review changes.
5. Library: open records to edit them; download or restore a backup; undo the latest change when needed.
