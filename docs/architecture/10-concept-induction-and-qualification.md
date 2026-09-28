# Concept induction and qualification

## Purpose

Concept extraction is semantic knowledge modeling, not keyword extraction. The workflow first identifies what the source teaches, then decides which durable containers deserve to exist in the user's long-term Knowledge Identity. There are no domain-specific aliases, suffix rules, or blacklists.

The current implementation asks the model for one structured result containing stages 1–4, then executes stage 5 deterministically in the backend. Keeping one remote call limits latency and cost; the stage outputs remain explicit, inspectable, testable, and stored in workflow Actions.

## End-to-end flow

```text
Raw Input + existing Concepts
        │
        ▼
1. Extract Knowledge Items
        │ concrete claims + source excerpts
        ▼
2. Induce candidate Concepts
        │ group item IDs under durable containers
        ▼
3. Qualify every candidate
        │ eight answers, eight 0–2 scores
        ▼
4. Align with the Knowledge Identity
        │ create | attach_existing | knowledge_item | document_structure
        ▼
5. Backend policy
        │ calculate confidence, enforce gates, route child items
        ▼
User review → persist Concepts, Knowledge Items, Evidence and Note
```

### Stage 1 — Extract Knowledge Items

Read the complete source and extract self-contained definitions, principles, processes, responsibilities, distinctions, examples, and applications. Each item contains `statement`, `kind`, and a faithful supporting `evidence` excerpt. Document-navigation phrases and sentences that only announce a topic are not Knowledge Items.

### Stage 2 — Induce candidate Concepts

Group Knowledge Item IDs under possible long-lived knowledge containers. A candidate should be capable of receiving useful additions from future sources. A heading, isolated fact, responsibility, process step, example, or list of sibling subjects is not promoted merely because it appears prominently.

When a narrow candidate is really content inside a broader candidate, it remains in the result with `alignment=knowledge_item` and a semantic `parent_concept_name`. This preserves its Knowledge Items without creating a noisy Concept.

### Stage 3 — Qualify candidates

The agent must answer every question. Each answer contains a short reason and exactly one score: `0` means no, `1` means partially true or materially uncertain, and `2` means clearly true from the source and domain meaning.

| Field | Required question | Quality dimension |
| --- | --- | --- |
| `identifiable` | Can it independently answer “what is this?” with a domain-specific meaning? | Identifiability |
| `stable_meaning` | Does it have a stable meaning across sources rather than only inside this document? | Semantic stability and specificity |
| `content_richness` | Does this source provide substantive Knowledge Items beyond a passing mention? | Content richness |
| `accumulation_potential` | Could future sources add meaningful knowledge to this same container? | Cross-source reuse potential |
| `structure_independence` | Is it independent of rhetorical structure such as an introduction, goal, summary, conclusion, fundamentals section, or chapter label? | Document-structure independence |
| `parent_independence` | Is it more than a property, responsibility, step, example, or subsection of a broader candidate? | Parent independence and redundancy |
| `context_independence` | Would it remain meaningful if the current document disappeared? | Durability |
| `scope_coherence` | Is it one coherent, bounded subject rather than a vague label, compound list, synonym, or duplicate? | Scope coherence and non-vagueness |

No additional hidden dimensions participate in scoring.

### Score and confidence

```text
quality_score = sum(the eight question scores)       # 0–16
confidence    = quality_score / 16                   # 0.0000–1.0000
```

The backend calculates both values. A model-provided confidence cannot override them.

| Result | Rule | Behaviour |
| --- | --- | --- |
| Qualified | score ≥ 12 and every hard gate passes | Propose the Concept normally |
| Review | score 9–11 and every hard gate passes | Propose it with required user confirmation |
| Knowledge Item | score ≤ 8 or any hard gate fails | Do not create a Concept; route its items to the declared parent when possible |

Hard gates come from the same questions: `identifiable ≥ 1`, `content_richness ≥ 1`, `structure_independence = 2`, `parent_independence ≥ 1`, and `scope_coherence ≥ 1`. A candidate can have a high arithmetic score and still fail if it is clearly a chapter heading. This is intentional and uses no separate heuristic.

### Stage 4 — Align with existing knowledge

The agent compares meaning with all existing Concepts and selects one disposition:

- `attach_existing`: same meaning; provide the exact existing Concept ID;
- `create`: distinct durable Concept;
- `knowledge_item`: content belonging under a named parent candidate;
- `document_structure`: rhetorical scaffolding with no independent knowledge role.

Exact normalized-name matching is only a safe identity fallback when the agent omits a valid existing ID. It is not used to decide conceptual quality.

### Stage 5 — Deterministic backend policy

The qualification module has one interface: candidate in, score/confidence/status out. The workflow then:

1. keeps only qualified or reviewable `create`/`attach_existing` candidates;
2. moves item IDs from rejected or `knowledge_item` candidates to their model-declared parent;
3. proposes Actions for user review;
4. stores each accepted statement as the visible Knowledge Item and its excerpt as Evidence;
5. appends later items to the same Concept while deduplicating identical knowledge from the same Input.

## Observability and evaluation

Workflow Actions retain Knowledge Items and all eight qualification answers, so a poor decision can be inspected without replaying hidden chain-of-thought. Evaluation fixtures must cover a durable Concept, a borderline review, a high-scoring heading that fails a hard gate, parent routing, existing-Concept alignment, and accumulation across Inputs.
