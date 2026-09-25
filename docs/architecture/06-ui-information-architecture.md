# UI Information Architecture

## Principle

Each top-level page answers one user question. Capture stays effortless; reflection surfaces do not compete with the input box.

| Hash route | User question | Owns |
|---|---|---|
| `#capture` | What do I want to add? | Text/voice/file/URL capture, processing feedback, AI review |
| `#identity` | What do I know now? | Confirmed Concepts, Knowledge State, evidence-grounded chat |
| `#growth` | How am I changing? | Week/month/year recap and supporting Evidence |
| `#library` | What did I save, and how was it organized? | Unchanged originals, structured AI notes and backup controls |

## Navigation contract

- All destinations are deep-linkable and browser back/forward compatible.
- The active destination uses `aria-current="page"`; navigation remains visible at 375px.
- Top-level content has one `h1`; internal panels begin at `h2` or semantic section labels.
- Async state stays local to its page. Growth period changes do not reload Identity.
- Capture draft state remains mounted only while on Capture in the current implementation; cross-page draft persistence is a future enhancement.

## Page ownership

`KnowledgeIdentityPrototype.jsx` currently owns shared server state and route selection. Page modules receive only the data/actions they need. If pages grow, extract `CapturePage`, `IdentityPage`, and `GrowthPage` into separate files without moving product logic into them.

## Knowledge and Library views

- Identity lists confirmed Concepts and their Evidence count. Relation inference and the Next recommendation surface are intentionally outside the MVP.
- Library groups records by source. `Original` is read-only and opens immutable artifact bytes when a file exists; extracted text is only a readable preview.
- Both note views use the product's normal sans-serif reading typography: 16px body text, 1.7-1.75 line height and a maximum 72-character measure.
- `AI note` is a standalone study note: it states the source's definitions, principles, processes, responsibilities, distinctions, examples and practical details instead of describing what the source is about. It visually highlights `[[Concept]]` markers and never replaces or mutates the Original.
- Tabs use native buttons with `role="tab"`, visible selected state and keyboard focus; long source text scrolls inside its reader rather than expanding the entire page.

## Responsive behavior

- Desktop: centered four-item navigation and wide content canvas.
- Tablet: Identity becomes one column; secondary panels remain two columns where space permits.
- Mobile: all four navigation labels remain reachable, panels stack, period controls share the available width, and interactive controls remain at least 44px high.
- Motion respects `prefers-reduced-motion`.
