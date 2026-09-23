# Knowledge Identity frontend prototype

Design documentation:

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

The frontend attempts to use the local API at `http://127.0.0.1:8000`. If it is unavailable, the complete prototype remains interactive in local demo mode. No sign-in is required for this single-user prototype.

## Product surface

- Free-form capture that organizes input into concepts and evidence-backed notes
- Edit or reject individual AI-proposed concepts, states, and connections before they change the identity
- Living knowledge graph and knowledge-state overview
- Weekly growth recap and next-knowledge recommendation
- Grounded chat over the user's knowledge identity

## Prototype question

Does a product centered on a visible, evidence-backed knowledge identity feel more valuable than a traditional notes dashboard while remaining familiar to Notes System users?
