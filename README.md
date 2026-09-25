# Knowledge Identity frontend prototype

Design documentation:

- [Engineering handbook](./docs/architecture/README.md)
- [AI workflow](./docs/knowledge-identity-ai-workflow.md)
- [Domain language](./CONTEXT.md)
- [Architecture decision: evidence-first Action pipeline](./docs/adr/0001-evidence-first-action-pipeline.md)

This branch is an evidence-backed personal knowledge identity prototype. It keeps the original Notes System visual language—academic blue, wisdom-gold accents, translucent top navigation, compact cards, and the existing spacing system—while replacing the product behavior.

## Run

```bash
npm install
cp .env.example .env.local
npm run prototype
```

In local development, Vite proxies same-origin `/api` requests to `http://127.0.0.1:8000`; set `VITE_API_BASE_URL` only for a deployed API. If the backend is unavailable, the UI shows an explicit offline message and keeps a genuine empty state; it never substitutes seed data or a fictional profile. No sign-in is required for this single-user prototype.

## Product surface

- One effortless capture box for text, links, voice transcription, drag-and-drop, and file selection
- Real PDF/TXT/Markdown upload with immutable local storage, extraction status, retry, and page/section provenance
- Public URL capture with cleaned article text, immutable snapshots, and SSRF/size/timeout controls
- Separate deep-linkable Capture, Identity, Next, and Growth pages; Growth supports week/month/year windows
- Automatic input-type inference instead of asking the user to organize before capture
- Edit or reject individual AI-proposed concepts, states, and connections before they change the identity
- Visible extraction provenance: configured AI model or local fallback
- Living knowledge graph and knowledge-state overview
- Week/month/year growth recap and next-knowledge recommendation
- Grounded chat over the user's knowledge identity
- Temporary in-product implementation checklist for development visibility

The build checklist is rendered near the bottom of the Capture page. Remove `src/features/development/` and its render/import before a public launch.

## Prototype question

Does a product centered on a visible, evidence-backed knowledge identity feel more valuable than a traditional notes dashboard while remaining familiar to Notes System users?
