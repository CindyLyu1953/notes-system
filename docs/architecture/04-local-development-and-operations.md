# Local Development and Operations

## First run

Prerequisites: Node.js/npm, Python 3.11+, PostgreSQL 16 and pgvector.

```bash
# Backend
cd /Users/lyukexin/Desktop/notes_system_play_ground/notes-system-backend
source .venv/bin/activate
pip install -e .
createdb knowledge_identity_playground  # once only
cp .env.example .env.local              # once only; never commit keys
uvicorn src.backend.api.main:app --reload
```

```bash
# Frontend
cd /Users/lyukexin/Desktop/notes_system_play_ground/notes-system
npm install
cp .env.example .env.local  # once only
npm run prototype
```

Open the app at <http://localhost:5173/notes-system/> and API docs at <http://127.0.0.1:8000/docs>.

## Verification

```bash
# Backend unit tests
.venv/bin/python -m unittest tests.test_artifact_ingestion tests.test_web_ingestion \
  tests.test_media_extraction tests.test_s3_artifact_store \
  tests.test_knowledge_identity tests.test_embeddings

# Real PostgreSQL hybrid-search integration
TEST_DATABASE_URL=postgresql://lyukexin@127.0.0.1:5432/knowledge_identity_hybrid_test \
  .venv/bin/python -m unittest tests.test_postgres_hybrid_search

# Frontend
npm run lint
npm run build
```

## Operating modes

| Mode | Settings | Use |
|---|---|---|
| Fully local | no `DATABASE_URL`, AI/embeddings false | Fast tests; data disappears on restart |
| Durable local | `DATABASE_URL` set, AI/embeddings false | Default product development |
| AI extraction | add key, `AI_EXTRACTION_ENABLED=true` | Real structured interpretation |
| Hybrid retrieval | add key, `EMBEDDING_ENABLED=true` | Semantic + keyword search |

AI flags are independent. Enabling either sends the relevant content to the configured external provider.

Real-world input controls:

| Variable | Default | Meaning |
|---|---:|---|
| `ARTIFACT_STORAGE_PATH` | `data/backend/source-assets` | Git-ignored raw snapshots and metadata |
| `ARTIFACT_MAX_BYTES` | 10 MB | Uploaded file limit |
| `WEB_FETCH_MAX_BYTES` | 2 MB | Maximum downloaded URL response |
| `WEB_FETCH_TIMEOUT_SECONDS` | 12 | Per-request URL fetch timeout |
| `MEDIA_EXTRACTION_ENABLED` | `false` | Opt in to external OCR and transcription |
| `ARTIFACT_STORE` | `local` | Use `s3` in deployment |
| `INGESTION_QUEUE` | `local` | Use `postgres` with a standalone worker |

Deployment worker:

```bash
ARTIFACT_STORE=s3 INGESTION_QUEUE=postgres \
  PYTHONPATH=. .venv/bin/python scripts/run_ingestion_worker.py
```

The API and worker must share `DATABASE_URL`, S3 settings, media provider settings and encryption credentials.

## Fast diagnosis

| Symptom | Check |
|---|---|
| Frontend says API unavailable | Backend terminal; use `127.0.0.1:8000`; inspect Vite proxy |
| Data disappears after restart | `DATABASE_URL` is empty or `.env.local` was not loaded |
| Search says keyword only | `EMBEDDING_ENABLED`, API key and embedding trace/logs |
| Vector migration fails | pgvector extension availability and PostgreSQL major version |
| AI uses local fallback | workflow trace: provider, fallback reason, timeout/schema failure |
| CORS failure | add exact frontend origin to `CORS_ALLOW_ORIGINS`; never use `*` |
| URL capture is rejected | Only public HTTP(S) HTML/text is allowed; private/local targets are blocked |
| Image/audio extraction fails | Enable `MEDIA_EXTRACTION_ENABLED` and provide `OPENAI_API_KEY` |
| Artifact stays queued in deployment | Confirm the standalone worker is running and uses the same database/bucket |

Start debugging at the boundary nearest the symptom: browser network → FastAPI route → application module → repository/provider adapter. Do not patch around an adapter failure in UI code.
