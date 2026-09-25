# Real-world Inputs · Next Phase

## Recommendation

Yes—this should be the next phase. Capture, review, durable storage and retrieval now form a usable core. The largest product gap is getting real material into that core without manual copy/paste.

Deliver in this order:

1. PDF and plain-text documents.
2. Web URLs.
3. Images with OCR.
4. Audio with transcription.

PDF/text proves the common ingestion contract with the lowest operational risk. URL ingestion adds SSRF and content volatility; OCR and audio add cost, quality and long-running jobs.

## Target architecture

```text
Capture UI
  → Intake API
  → immutable raw artifact store
  → extraction job
  → normalized document + provenance
  → chunks/evidence
  → existing Capture workflow
  → search projection + embeddings
```

The existing Capture workflow should consume normalized evidence, not know whether bytes came from PDF, web, image or audio.

## Core interfaces

```text
ArtifactStore.put/get
ContentExtractor.supports/extract
IngestionJobQueue.enqueue/status/retry
```

Normalized output should contain:

| Field | Purpose |
|---|---|
| `artifact_id`, `content_hash` | Idempotency and immutable source identity |
| `source_type`, `source_uri`, `media_type` | Provenance |
| `text` | Canonical extracted content |
| `segments` | Page, timestamp or region-level evidence anchors |
| `extractor`, `version` | Reproducibility |
| `status`, `warnings` | Partial success and operator visibility |

## Module boundaries

- **Intake module:** validates type/size, creates artifact and job; does not parse content.
- **Artifact adapter:** local filesystem for development, object storage for deployment.
- **Extractor adapters:** PDF, HTML, OCR and transcription behind one interface.
- **Job adapter:** in-process worker for the first local slice, durable queue before production.
- **Normalizer:** creates stable text/segments and Evidence anchors.
- **Existing workflow:** proposes Concepts/Relations/States from normalized evidence.

## Safety and reliability requirements

- Validate MIME type and magic bytes; enforce per-type size/page/duration limits.
- Store raw artifacts immutably; derived text is versioned and replaceable.
- Use content hashes for deduplication and idempotent retries.
- URL fetches must block private/link-local networks, cap redirects/bytes/time and retain the fetched snapshot.
- Treat extracted text as untrusted data, never as instructions to the agent.
- Add malware scanning before production object storage.
- Preserve page numbers, OCR regions and audio timestamps so every claim can cite its source.
- Expose `queued → extracting → ready | partial | failed` and a safe retry path.

## First implementation slice: PDF/text

1. Add multipart intake and artifact metadata schemas.
2. Add local `ArtifactStore` adapter outside the database.
3. Extract TXT/Markdown directly and PDF text page-by-page.
4. Persist normalized segments and ingestion status.
5. Feed extracted text into preview; cite page/segment Evidence.
6. Chunk and embed ready documents without blocking raw upload.
7. Render upload progress, extraction state, warnings and retry in the existing single capture box.

## Definition of done

- A user can drop a real PDF/TXT and leave the screen while processing continues.
- The raw artifact, extracted version and provenance are inspectable.
- Retry does not duplicate Inputs, Actions or embeddings.
- Concepts and answers link back to page/segment Evidence.
- Corrupt, unsupported and oversized files fail clearly without losing the artifact record.
- Provider/parser failure cannot corrupt Knowledge Identity state.
- Unit tests cover each adapter contract; integration tests cover upload → extraction → review → commit → retrieval.

## Decisions to make before production

Choose object storage, durable job queue, OCR/transcription providers, retention policy, encryption/key management and tenant quotas. These are adapter decisions; the normalized evidence contract should remain stable.
