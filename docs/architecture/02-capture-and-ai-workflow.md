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

Current Actions are `record_input`, `upsert_concept`, `upsert_relation`, `set_knowledge_state`, `create_note`, `record_learning_event`, and input organization. A rejected Concept also rejects dependent state/relation actions.

## Extraction path

`ResilientKnowledgeExtractor` selects the implementation:

- `AI_EXTRACTION_ENABLED=true` + API key: OpenAI structured output validated by Pydantic.
- Disabled, timed out or invalid response: deterministic local extractor.

Each workflow records provider, model, prompt version, response ID, latency and fallback reason. Concept matching uses existing names; Relations require textual support; state changes use observable `mention`, `explanation`, `application` or `reflection` signals.

## Evidence and truth model

- **Event truth:** immutable Inputs and Learning Events describe what happened.
- **Fact truth:** Concepts, Relations and Knowledge States describe the latest interpretation.
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
