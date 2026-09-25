# Media Ingestion and Deployment

## Runtime contract

The browser always follows one interface: upload → receive `artifact_id` → poll status → submit ready artifact to Capture. Local and deployed modes differ only behind seams.

```text
API intake → ArtifactStore.create → IngestionJobs.enqueue
                                      ↓
                              standalone worker
                                      ↓
ArtifactIngestion.process → OCR / transcription → ArtifactStore.update
```

## Media extraction

| Input | Adapter | Evidence locator | Configuration |
|---|---|---|---|
| PNG/JPEG/WebP/GIF | OpenAI vision input | `image region N` | `OCR_MODEL=gpt-5-mini` |
| FLAC/MP3/MP4/M4A/OGG/WAV/WebM | OpenAI transcription | `MM:SS–MM:SS` | `TRANSCRIPTION_MODEL=whisper-1` |

Media extraction is opt-in because source bytes leave the deployment. Set `MEDIA_EXTRACTION_ENABLED=true` and `OPENAI_API_KEY`. Missing configuration fails closed and keeps the raw artifact available for retry.

The vision prompt requests faithful transcription only and explicitly treats text inside images as untrusted content. Audio uses verbose segment timestamps. See the official OpenAI documentation for [vision inputs](https://developers.openai.com/api/docs/guides/images-vision) and [transcription](https://developers.openai.com/api/reference/cli/resources/audio/subresources/transcriptions/methods/create).

## Deployment adapters

### S3-compatible ArtifactStore

Set `ARTIFACT_STORE=s3`, `S3_BUCKET`, and optional endpoint/region values. Each artifact uses:

```text
{prefix}/{artifact_id}/source         immutable original bytes
{prefix}/{artifact_id}/metadata.json  replaceable extraction state
```

Use bucket encryption, private ACLs, versioning/lifecycle rules and least-privilege credentials. The API and worker need read/write access only to the configured prefix.

### PostgreSQL IngestionJobs

Set `INGESTION_QUEUE=postgres`. Migration `0003_ingestion_jobs.sql` creates the queue. Workers claim with `FOR UPDATE SKIP LOCKED`, retry with exponential delay, stop after `INGESTION_MAX_ATTEMPTS`, and reclaim processing locks older than five minutes.

Run at least one worker separately from the API:

```bash
PYTHONPATH=. .venv/bin/python scripts/run_ingestion_worker.py
```

Processing is at-least-once. Artifact updates are idempotent by `artifact_id`; queue uniqueness prevents simultaneous active jobs for one artifact.

## Operational checks

- Alert on queued age, failed jobs, provider latency/error rate and S3 failures.
- Keep API and worker configuration identical; deploy migration before switching the queue.
- Scale workers horizontally; `SKIP LOCKED` prevents duplicate claims.
- Rotate provider/S3 credentials and never expose them to the frontend.
- Add malware scanning and per-tenant quotas before public launch.
