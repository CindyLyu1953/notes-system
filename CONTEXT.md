# Knowledge Identity

Knowledge Identity describes a person's evolving understanding as evidence-backed Concepts, Knowledge Items, and changes over time. Its language separates what the user supplied from what the system inferred.

## Source and evidence

**Input**:
An immutable piece of material supplied by the user, such as a thought, note, question, project reflection, link, voice recording, or screenshot.
_Avoid_: Document, knowledge

**Evidence**:
A traceable reference from a derived conclusion back to the exact Input that supports it, including a short excerpt when useful.
_Avoid_: Citation when no source Input exists

## Knowledge model

**Concept**:
A durable knowledge subject, discipline, method, framework, tool, or skill that can accumulate learning across many Inputs. A chapter heading, responsibility, step, definition, example, or grouped list is not a Concept.
_Avoid_: Tag, section heading, isolated fact

**Knowledge Item**:
A concrete definition, principle, responsibility, step, distinction, example, or other claim learned about a Concept. Knowledge Items accumulate from Evidence as the user adds Inputs.
_Avoid_: Concept, summary, topic label

**Concept Qualification**:
An explicit semantic assessment of whether a candidate deserves to become a durable Concept. It uses the same nine questions and deterministic score for every subject domain.
_Avoid_: Keyword filter, blacklist, naming rule

**Concept Alignment**:
The placement of a qualified candidate into the existing Knowledge Identity: attach to an existing Concept, create a new Concept, retain it as a Knowledge Item under a parent, or discard it as document structure.
_Avoid_: String matching, tag deduplication

**Knowledge State**:
The system's current evidence-backed assessment of the user's relationship to a Concept: Unknown, Aware, Learning, or Known.
_Avoid_: Score, mastery percentage

**Knowledge Identity**:
The current view of the user's Concepts, their accumulated Knowledge Items, Knowledge States, learning patterns, and supporting Evidence.
_Avoid_: Profile, knowledge base

## Change over time

**Learning Event**:
An immutable record of a meaningful change in the user's knowledge, such as encountering a Concept, adding Knowledge Items, or demonstrating deeper understanding.
_Avoid_: Activity log, notification

**Growth Recap**:
An evidence-backed interpretation of how the user's Knowledge Identity changed over a week, month, or year.
_Avoid_: Analytics report, usage summary

**Knowledge Gap**:
A specific missing distinction, capability, or piece of Evidence that prevents a Concept from advancing to a stronger Knowledge State.
_Avoid_: Weakness, failure
