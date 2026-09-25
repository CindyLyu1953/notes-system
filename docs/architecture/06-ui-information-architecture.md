# UI Information Architecture

## Principle

Each top-level page answers one user question. Capture stays effortless; reflection surfaces do not compete with the input box.

| Hash route | User question | Owns |
|---|---|---|
| `#capture` | What do I want to add? | Text/voice/file/URL capture, processing feedback, AI review |
| `#identity` | What do I know now? | Knowledge graph, Knowledge State, evidence-grounded chat |
| `#next` | What should I explore next? | One evidence-backed recommendation |
| `#growth` | How am I changing? | Week/month/year recap and supporting Evidence |
| `#library` | What did I save, and how was it organized? | Unchanged sources, structured AI notes, concept maintenance and backup |

## Navigation contract

- All destinations are deep-linkable and browser back/forward compatible.
- The active destination uses `aria-current="page"`; navigation remains visible at 375px.
- Top-level content has one `h1`; internal panels begin at `h2` or semantic section labels.
- Async state stays local to its page. Growth period changes do not reload Identity.
- Capture draft state remains mounted only while on Capture in the current implementation; cross-page draft persistence is a future enhancement.

## Page ownership

`KnowledgeIdentityPrototype.jsx` currently owns shared server state and route selection. Page modules receive only the data/actions they need. If pages grow, extract `CapturePage`, `IdentityPage`, `NextPage`, and `GrowthPage` into separate files without moving product logic into them.

## Knowledge and Library views

- Identity lists every Concept and renders Relations as readable source → type → target statements with rationale, confidence and Evidence count. Lines without labels are intentionally avoided.
- Library groups records by source. `Original` is read-only and opens immutable artifact bytes when a file exists; extracted text is only a readable preview.
- `AI note` is derived from the same source, organized as a complete note, and visually highlights `[[Concept]]` markers. It never replaces or mutates the Original.
- Tabs use native buttons with `role="tab"`, visible selected state and keyboard focus; long source text scrolls inside its reader rather than expanding the entire page.

## Responsive behavior

- Desktop: centered four-item navigation and wide content canvas.
- Tablet: Identity becomes one column; secondary panels remain two columns where space permits.
- Mobile: all four navigation labels remain reachable, panels stack, period controls share the available width, and interactive controls remain at least 44px high.
- Motion respects `prefers-reduced-motion`.
