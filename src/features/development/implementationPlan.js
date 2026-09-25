export const implementationPhases = [
  {
    title: "Foundation",
    status: "complete",
    items: [
      ["complete", "Effortless text, voice, and attachment capture"],
      ["complete", "Evidence-first action workflow with human review"],
      ["complete", "Structured AI extraction with a local fallback"],
    ],
  },
  {
    title: "Phase 4 · Persistence & retrieval",
    status: "complete",
    items: [
      ["complete", "PostgreSQL state persistence and automatic migrations"],
      ["complete", "Indexed full-text retrieval across inputs, notes, and concepts"],
      ["complete", "Remove seed data and the hard-coded personal profile"],
      ["complete", "Add embeddings with pgvector"],
      ["complete", "Combine keyword and semantic results with hybrid ranking"],
    ],
  },
  {
    title: "Real-world inputs",
    status: "in-progress",
    items: [
      ["complete", "Persist immutable PDF, TXT, and Markdown source artifacts"],
      ["complete", "Extract text with page or section-level evidence locators"],
      ["complete", "Show upload, extraction, failure, and retry states"],
      ["next", "OCR screenshots and images"],
      ["next", "Fetch and clean web links"],
      ["next", "Durable audio upload and transcription"],
      ["next", "Replace local artifact and in-process job adapters for deployment"],
    ],
  },
  {
    title: "Knowledge intelligence",
    status: "planned",
    items: [
      ["next", "Retrieval-grounded LLM answers with source citations"],
      ["next", "Evidence-backed weekly recap generation"],
      ["next", "Personalized Next Knowledge recommendations"],
      ["next", "Extraction and retrieval evaluation suite"],
    ],
  },
  {
    title: "Control & trust",
    status: "planned",
    items: [
      ["next", "Input, note, and concept detail views"],
      ["next", "Edit, merge, delete, and undo"],
      ["next", "Import, export, backup, and restore"],
    ],
  },
  {
    title: "Launch readiness",
    status: "planned",
    items: [
      ["next", "Authentication and per-user data isolation"],
      ["next", "Hosted frontend, API, database, secrets, and CORS"],
      ["next", "Monitoring, rate limits, cost controls, and CI/CD"],
      ["next", "Privacy, retention, and account deletion flows"],
    ],
  },
];
