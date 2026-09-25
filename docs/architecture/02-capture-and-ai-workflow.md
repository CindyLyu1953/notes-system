# Capture and AI Workflow

## Contract

Capture accepts free text plus lightweight attachment metadata/content. It returns a pending interpretation before derived facts are committed. Raw evidence survives both commit and rejection.

For uploaded PDF/TXT/Markdown files and captured URLs, clients send only `artifact_id` into Capture. The route hydrates source metadata, extracted text and segments from the server-side artifact store; client-supplied extracted content is not trusted.

```text
capture → preserve Input → extract → propose Actions → review
                                              ├─ commit/edit → execute → persist
                                              └─ reject      → preserve Input only
```

## Responsibilities

| Module | Owns | Must not own |
|---|---|---|
| `KnowledgeCaptureGraph` | Step order and workflow run | Database writes |
| `KnowledgeExtractor` | Structured interpretation | Control flow or persistence |
| `ActionDecisionResolver` | User edits, rejection and dependency cleanup | AI inference |
| `ActionExecutor` | Validated derived-state mutations | Prompting or UI policy |
| Repository | Atomic durable representation | Product decisions |

Current Actions are `record_input`, `upsert_concept`, `set_knowledge_state`, `create_note`, `record_learning_event`, and input organization. A rejected Concept also rejects its dependent state and note/event references.

## Extraction path

`ResilientKnowledgeExtractor` selects the implementation:

- `AI_EXTRACTION_ENABLED=true` + API key: OpenAI structured output validated by Pydantic.
- Disabled for short text: deterministic local extractor.
- Document timeout or invalid response: preserve the Input, propose no derived knowledge, and expose a retry action.

Each workflow records provider, model, prompt version, response ID, latency and fallback reason. Concept matching uses existing names; state changes use observable `mention`, `explanation`, `application` or `reflection` signals.

For substantive documents, extraction scans the complete source and may propose up to 12 Concepts. Selection favors durable knowledge topics, named methods/frameworks, professional responsibilities and transferable skills across distinct sections. Names use the most informative supported granularity (`Project management`, not `Project`; `Program management`, not `Program`), and generic/specific duplicates are prohibited. The source still controls coverage: 6-12 is a target only when the evidence contains that many distinct major topics.

Document extraction uses the shared OpenAI timeout and up to `AI_EXTRACTION_MAX_ATTEMPTS`. A retry reuses the original Input and workflow, so it cannot duplicate the uploaded source. Keyword fallback is intentionally prohibited for attachments because a plausible-looking wrong Concept is less trustworthy than an explicit failure.

The extractor also proposes one complete Markdown `structured_note`. It must stand alone as a study note: state the actual definitions, principles, processes, responsibilities, distinctions, examples and practical details rather than saying what the source “covers.” It stays grounded in the source, covers every extracted Concept and marks the first meaningful occurrence as `[[Concept name]]`. A deterministic evidence-based note is generated if the model omits it. This Note is derived and editable; the original Input and artifact bytes remain unchanged.

Legacy Notes created before `structured_note` are upgraded in memory at load time: their summary becomes the overview, complete stored source text becomes the body, and known Concept names are marked. This compatibility view does not mutate either the original artifact or persisted history; a new capture produces the richer model-authored version.

## Evidence and truth model

- **Event truth:** immutable Inputs and Learning Events describe what happened.
- **Fact truth:** Concepts and Knowledge States describe the latest interpretation.
- Facts may evolve; their Evidence links must remain traceable to Inputs.
- File-derived Concept Evidence also records `artifact_id`, `segment_id` and a human-readable page/section locator.

## Safe extension pattern

When adding a new derived capability:

1. Add/extend the Pydantic schema.
2. Make the extractor propose an Action; never mutate state there.
3. Add validation and execution to `ActionExecutor`.
4. Preserve Evidence IDs and excerpts.
5. Test preview, edited commit, rejection and dependency cleanup.

Primary tests: `backend: tests/test_knowledge_identity.py`. Architectural rationale: [ADR-0001](../adr/0001-evidence-first-action-pipeline.md).
