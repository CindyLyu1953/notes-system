---
status: accepted
---

# AI proposes Actions; only the executor changes Knowledge Identity

Knowledge Identity uses a Graph / Node / Action pipeline in which AI Nodes return structured proposals and never directly mutate product state. A single ActionExecutor performs every accepted write, because evidence validation, auditability, selective confirmation, and future persistence must remain consistent even as prompts and model providers change; the MVP uses plain Python orchestration and deliberately defers LangGraph until durable pause/resume or complex control flow is required.

