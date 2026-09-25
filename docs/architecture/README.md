# Knowledge Identity · Engineering Handbook

> Audience: new joiners and contributors. Status: reflects `knowledge-identity` / `knowledge-identity-backend` as of 2026-09-25.

## 10-minute start

Knowledge Identity turns unstructured evidence into a reviewable, evidence-backed model of what a person is learning. The central rule is: **AI proposes; `ActionExecutor` writes; every derived fact keeps evidence.**

Run two terminals:

```bash
# Backend repository
cd /Users/lyukexin/Desktop/notes_system_play_ground/notes-system-backend
source .venv/bin/activate
uvicorn src.backend.api.main:app --reload
```

```bash
# Frontend repository
cd /Users/lyukexin/Desktop/notes_system_play_ground/notes-system
npm install
npm run prototype
```

Open <http://localhost:5173/notes-system/>. No sign-in is required. Vite proxies `/api` to `http://127.0.0.1:8000`.

## Read in this order

1. [System architecture](./01-system-architecture.md) — boundaries, tech stack, code map.
2. [Capture and AI workflow](./02-capture-and-ai-workflow.md) — the product's critical write path.
3. [Persistence and retrieval](./03-persistence-and-retrieval.md) — PostgreSQL, pgvector, hybrid ranking.
4. [Local development and operations](./04-local-development-and-operations.md) — run, test, diagnose.
5. [Real-world inputs plan](./05-real-world-inputs-plan.md) — recommended next phase.

Product language lives in [`CONTEXT.md`](../../CONTEXT.md); the rationale for the write path lives in [ADR-0001](../adr/0001-evidence-first-action-pipeline.md).

## Non-negotiable invariants

- Preserve the raw user input before deriving knowledge.
- Model output is a proposal, never a direct database mutation.
- Derived Concepts, Relations and Knowledge States must retain Evidence.
- Rejected interpretations do not delete the original Input.
- External AI and embeddings are opt-in and fail safely to local behavior.
- The current slice is deliberately single-user; do not mistake it for launch-ready tenancy or auth.

## Where to change what

| Change | Start here |
|---|---|
| Capture UI or review experience | `frontend: src/features/knowledgeIdentity/KnowledgeIdentityPrototype.jsx` |
| Browser/API contract | `frontend: src/features/knowledgeIdentity/api.js` and `backend: src/backend/api/routes/knowledge_identity.py` |
| AI interpretation | `backend: src/backend/app/ai_extraction.py` |
| Workflow order or write rules | `backend: src/backend/app/knowledge_workflow.py` |
| Product-level behavior | `backend: src/backend/app/knowledge_identity.py` |
| Storage/search implementation | `backend: src/backend/infrastructure/postgres_repository.py` |
| Public data shapes | `backend: src/backend/schemas/knowledge_identity.py` |

`frontend:` means `notes-system`; `backend:` means `notes-system-backend`.
