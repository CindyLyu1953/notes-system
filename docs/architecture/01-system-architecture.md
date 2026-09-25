# System Architecture

## Purpose and scope

The system captures a user's raw material, proposes an interpretation, lets the user correct it, and builds a searchable Knowledge Identity. Today it is a local, single-user product slice—not a multi-tenant production service.

```text
React capture/review UI
        │ JSON/HTTP
        ▼
FastAPI routes
        ▼
KnowledgeIdentityPrototype (application orchestration)
   ┌────┴──────────────┐
   ▼                   ▼
Capture workflow       KnowledgeRepository interface
AI extractor           ├─ Memory adapter
ActionExecutor         └─ PostgreSQL + pgvector adapter
```

## Technology stack

| Layer | Technology | Responsibility |
|---|---|---|
| Web | React 18, Vite 7, CSS | Capture, proposal review, identity visualization |
| API | Python 3.11+, FastAPI, Pydantic v2 | HTTP contracts and validation |
| AI | OpenAI Responses API, structured output | Optional concept/relation/state proposals |
| Data | PostgreSQL 16, psycopg 3 | Durable state and full-text search |
| Semantic retrieval | pgvector, `text-embedding-3-small` | 1536-dimensional vectors and cosine search |
| Source ingestion | FastAPI multipart, urllib, HTMLParser, pypdf | Immutable file/web/media intake and normalized extraction |
| Media AI | OpenAI vision, Whisper transcription | OCR regions and timestamped audio Evidence |
| Deployment ingestion | S3-compatible storage, PostgreSQL queue | Durable artifacts and out-of-process jobs |
| Tests | Python `unittest`, ESLint, Vite build | Behavior, integration and static verification |

## Modules and seams

A **module** hides implementation behind a small **interface**. A **seam** is where an implementation can be replaced without changing its consumer.

| Module | Interface | Current adapters / implementation |
|---|---|---|
| Frontend API | `identityApi` | Browser `fetch` |
| Extraction | `KnowledgeExtractor.extract` | OpenAI, deterministic local fallback |
| Persistence | `KnowledgeRepository.load/save/search` | Memory, PostgreSQL |
| Writes | `KnowledgeWriteStore` | `KnowledgeIdentityPrototype` |
| Embeddings | embedding provider | OpenAI embedding adapter |
| Source artifacts | `ArtifactStore.create/get/read_bytes/update` | Memory test adapter, local filesystem adapter |
| Web fetch | `WebFetcher.fetch` | SSRF-controlled HTTP adapter, fake test adapter |
| Image OCR | `ImageTextExtractor.extract` | OpenAI vision, missing-config fail-closed adapter, fake test adapter |
| Audio transcription | `AudioTranscriber.transcribe` | OpenAI Whisper, missing-config fail-closed adapter, fake test adapter |
| Ingestion jobs | `IngestionJobs.enqueue/claim/complete/fail` | PostgreSQL durable queue |

Keep these interfaces small. Provider SDKs, SQL and model prompting belong behind adapters; product rules belong in the application/workflow modules. This creates depth: callers see a simple operation while retries, validation, ranking and persistence remain hidden.

## Runtime data flow

1. The UI sends an `InputCreate` to preview.
2. The backend stores the raw Input and creates a pending workflow run.
3. Extraction proposes schema-valid Actions with Evidence.
4. The UI accepts, edits or rejects proposals.
5. `ActionDecisionResolver` removes invalid dependencies.
6. `ActionExecutor` is the only writer of derived state.
7. The repository saves a snapshot and refreshes search documents/embeddings.
8. Identity, recap, recommendation, search and chat read the resulting state.

Files and public URLs enter through separate intake adapters, then converge: immutable artifact bytes → background extraction → normalized segments → trusted attachment hydration → the same Capture workflow above.

## Repository map

```text
frontend: src/features/knowledgeIdentity/   product UI and API client
frontend: src/features/development/         temporary implementation checklist
backend:  src/backend/api/routes/           transport layer
backend:  src/backend/app/                  domain/application logic
backend:  src/backend/app/artifact_ingestion.py  artifact intake and extraction module
backend:  src/backend/infrastructure/       PostgreSQL and external adapters
backend:  src/backend/schemas/              public and internal data contracts
backend:  tests/                             unit and PostgreSQL integration tests
```

## Known production gaps

Authentication, per-user isolation, object storage, background jobs, observability, rate limiting, backups and deployment automation are not yet complete. Real-world file ingestion should not bypass these boundaries; it should add adapters behind a normalized input interface.
