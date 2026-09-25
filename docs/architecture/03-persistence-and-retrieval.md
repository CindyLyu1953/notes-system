# Persistence and Retrieval

## Storage model

The application depends only on `KnowledgeRepository.load/save/search`. The PostgreSQL adapter maintains:

- a versioned JSONB snapshot: complete single-user application state;
- a relational search projection: Inputs, Notes and Concepts;
- optional pgvector embeddings alongside keyword-search fields.

This is intentionally optimized for an evolving prototype. Multi-user launch work should introduce user-scoped rows and optimistic concurrency without leaking SQL into application logic.

## Save and embedding lifecycle

```text
application snapshot
  → transactionally save JSONB
  → rebuild/upsert searchable projection
  → compare content hash
  → embed only changed documents
  → retain keyword retrieval if embedding fails
```

`content_hash` makes backfill idempotent. Documents use `text-embedding-3-small`, 1536 dimensions. PostgreSQL uses an HNSW index with cosine distance.

## Hybrid ranking

Keyword and semantic searches produce independent ranked lists. Reciprocal Rank Fusion combines them:

```text
RRF score = Σ 1 / (k + rank), current k = 60
```

Semantic-only candidates below `HYBRID_SEMANTIC_MIN_SCORE` (default `0.2`) are excluded. Responses expose `retrieval`, `keyword_score` and `semantic_score` for diagnosis. If embeddings are disabled or unavailable, search degrades to PostgreSQL full-text retrieval.

## Configuration

| Variable | Default | Meaning |
|---|---:|---|
| `DATABASE_URL` | empty | Empty selects the in-memory adapter |
| `DATABASE_AUTO_MIGRATE` | `true` | Apply ordered SQL migrations at startup |
| `EMBEDDING_ENABLED` | `false` | Opt in to external embeddings |
| `EMBEDDING_MODEL` | `text-embedding-3-small` | Must match stored vector semantics |
| `EMBEDDING_DIMENSIONS` | `1536` | Must match the migration column |
| `EMBEDDING_AUTO_BACKFILL` | `true` | Fill missing/stale vectors on startup |
| `HYBRID_RRF_K` | `60` | RRF rank constant |
| `HYBRID_SEMANTIC_MIN_SCORE` | `0.2` | Semantic similarity floor |

Manual idempotent backfill:

```bash
cd /Users/lyukexin/Desktop/notes_system_play_ground/notes-system-backend
PYTHONPATH=. .venv/bin/python scripts/backfill_embeddings.py
```

## Change checklist

- Change embedding dimensions only with a database migration and re-embedding plan.
- Keep raw persistence successful even when the embedding provider fails.
- Treat ranking changes as product behavior: cover them with PostgreSQL integration tests.
- Keep provider calls behind the embedding interface.

Primary implementation: `backend: src/backend/infrastructure/postgres_repository.py`. Tests: `backend: tests/test_embeddings.py` and `tests/test_postgres_hybrid_search.py`.
