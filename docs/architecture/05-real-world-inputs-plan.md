# Real-world Inputs

> Status: PDF/TXT/Markdown, public URL, OCR, audio and deployable ingestion adapters implemented.

## Recommendation

Yes—this should be the next phase. Capture, review, durable storage and retrieval now form a usable core. The largest product gap is getting real material into that core without manual copy/paste.

Deliver in this order:

1. PDF and plain-text documents.
2. Web URLs. ✓
3. Images with OCR. ✓
4. Audio with transcription. ✓

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
ArtifactStore.create/get/read_bytes/update   # implemented
ArtifactIngestion.intake/get/process/retry   # implemented
DurableJobQueue.enqueue/status/retry         # production follow-up
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
- **Artifact adapter:** local filesystem for development, S3-compatible object storage for deployment.
- **Extractor adapters:** PDF, HTML, OpenAI vision OCR and Whisper transcription behind small interfaces.
- **Job adapter:** FastAPI background tasks locally; PostgreSQL queue plus standalone worker in deployment.
- **Normalizer:** creates stable text/segments and Evidence anchors.
- **Existing workflow:** proposes Concepts, States and a structured Note from normalized evidence.

## Safety and reliability requirements

- Validate MIME type and magic bytes; enforce per-type size/page/duration limits.
- Store raw artifacts immutably; derived text is versioned and replaceable.
- Use content hashes for deduplication and idempotent retries.
- URL fetches must block private/link-local networks, cap redirects/bytes/time and retain the fetched snapshot.
- Treat extracted text as untrusted data, never as instructions to the agent.
- Add malware scanning before production object storage.
- Preserve page numbers, OCR regions and audio timestamps so every claim can cite its source.
- Expose `queued → extracting → ready | partial | failed` and a safe retry path.

## Implemented slice: PDF/text

- [x] Multipart intake and artifact metadata schemas.
- [x] Immutable local `ArtifactStore`; memory adapter for tests.
- [x] TXT/Markdown sections and PDF page-by-page extraction.
- [x] Persistent normalized segments and `queued/extracting/ready/failed` status.
- [x] Server-side attachment hydration and page/section Evidence references.
- [x] Upload/extraction/failure/retry states in the existing capture box.
- [ ] Independent chunk-level search documents and embeddings for whole source files.
- [x] PostgreSQL durable queue and standalone worker with retry/stale-lock recovery.

## Implemented slice: public URLs

- [x] A URL pasted by itself is automatically captured before AI preview.
- [x] HTTP adapter allows only public HTTP/HTTPS targets and validates every redirect.
- [x] Private, loopback, link-local and reserved addresses are blocked.
- [x] Fetch timeout, redirect count, response size and content type are bounded.
- [x] Navigation/script/style/footer noise is removed; readable blocks become `web section` Evidence.
- [x] Raw HTML and final redirected URL are retained as immutable provenance.

## Definition of done

- A user can drop a real PDF/TXT/Markdown and leave the screen while the backend process continues.
- The raw artifact, extracted version and provenance are inspectable.
- Retry does not duplicate Inputs, Actions or embeddings.
- Concepts link back to page/segment Evidence; answer-level citation rendering remains follow-up work.
- Corrupt, unsupported and oversized files fail clearly without losing the artifact record.
- Provider/parser failure cannot corrupt Knowledge Identity state.
- Unit tests cover each adapter contract; integration tests cover upload → extraction → review → commit → retrieval.

## Decisions to make before production

Provision an S3-compatible bucket and worker runtime; decide retention policy, encryption/key management, malware scanning and tenant quotas. The adapters are implemented, but infrastructure credentials and policies remain deployment-specific.
