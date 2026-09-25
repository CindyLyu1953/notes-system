# Knowledge intelligence

## Purpose

This layer turns stored evidence into two read experiences: grounded answers and period recaps. It never writes knowledge state. Capture review remains the only path for derived writes.

## Request flow

```text
UI request
  → KnowledgeIdentityPrototype selects evidence
  → repository hybrid search or time/concept window
  → IntelligenceContext (allowlisted input IDs + excerpts/state)
  → structured model output
  → application filters citations against the allowlist
  → typed API response + deterministic fallback on failure
```

The seam is `ResilientKnowledgeIntelligence`. `OpenAIKnowledgeIntelligence` only turns context into typed drafts; it cannot query storage or persist results. Citation enforcement stays in the application layer so changing providers cannot weaken provenance.

## Behaviors

| Experience | Grounding context | Output |
|---|---|---|
| Ask your knowledge | Top hybrid retrieval hits | Answer, explicit knowledge gap, source excerpts |
| Growth | Inputs, concepts, and events inside week/month/year | Headline, narrative, highlights, cited input IDs |
If AI is disabled, unconfigured, times out, or returns invalid output, each path returns a useful deterministic result. The product remains operational and never invents an uncited source.

## Configuration

Add this to `notes-system-backend/.env.local` to enable real generation:

```dotenv
OPENAI_API_KEY=your_api_key
KNOWLEDGE_INTELLIGENCE_ENABLED=true
KNOWLEDGE_INTELLIGENCE_MODEL=gpt-5-mini
```

No second API key is needed. For full semantic retrieval, also keep `EMBEDDING_ENABLED=true`; both features reuse `OPENAI_API_KEY`. Restart the API after changing environment variables. Never put the key in the frontend or commit `.env.local`.

The adapter uses schema-constrained responses because typed output keeps citations and fields predictable. See OpenAI's [Structured Outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs).

## Quality gates

Run locally or in CI:

```bash
cd /Users/lyukexin/Desktop/notes_system_play_ground/notes-system-backend
.venv/bin/python scripts/run_knowledge_evals.py
```

The committed dataset measures extraction concept recall, retrieval mean reciprocal rank, and recall@k with explicit pass thresholds. It is deterministic and does not spend API credits. Add anonymized failure cases over time; do not tune only against happy paths. This follows OpenAI's guidance to use task-specific datasets, automated scoring, thresholds, and continuous evaluation: [Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices).

## Change checklist

- When changing prompts or models, run unit tests and the eval gate.
- When changing retrieval, add a hard query and expected source to the eval dataset.
- When adding generated claims, define their evidence allowlist first.
- Never accept a model-returned citation without validating it against supplied context.
