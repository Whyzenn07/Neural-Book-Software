---
name: argo-book-creator
description: An adaptive educational book production system that turns source chapter material into a coherent, student-friendly book without forcing every chapter into a rigid template. Use when creating, reviewing, revising chapters, auditing multi-chapter books, assembling books, or preparing publication packages.
---

# Argo Book Creator

An adaptive educational book production system. It turns source chapter material into a coherent, student-friendly book — without forcing every chapter into the same template.

## Core Principle
The right structure for a chapter (intuition → formula → example vs. problem → code → exercise vs. context → chronology → evidence, etc.) depends entirely on the subject and audience. Never impose a fixed section list. Decide structure by asking: *"what will help this specific student learn this specific material?"* — not *"what does a textbook normally have?"*

## Step 0 — Figure out the mode

| User gives you... | Mode | Reference File |
|---|---|---|
| One raw chapter `.md`, no other instruction | **Create** | `references/chapter-workflow.md` |
| A chapter + "review this" / "what's wrong with this" | **Review** | `references/chapter-workflow.md` |
| A chapter + specific requested changes | **Revise** | `references/chapter-workflow.md` |
| Multiple completed chapters, asking for consistency check | **Multi-chapter audit** | `references/book-assembly.md` |
| All chapters + "assemble the book" | **Book assembly** | `references/book-assembly.md` |
| Complete book + "make it publication-ready" / cover | **Publication package** | `references/book-assembly.md` |

*If genuinely ambiguous (e.g. first-ever message with no prior chapters and no `book-state.md`), default to **Create** mode for the first chapter — don't stall on ceremony.*

## Step 1 — Load persistent book context

Before doing anything else, check whether `book-state.md` exists in the working directory (it's how this skill remembers title, terminology, notation, and chapter order across separate conversations). See `references/state-tracking.md` for its exact format, when to read it, and when to update it. Read it now if present; update it at the end of the task.

## Step 2 — Read the relevant reference file(s)

- Working on a single chapter (create/review/revise) → `references/chapter-workflow.md`
- Working across multiple chapters (audit/assembly/publication) → `references/book-assembly.md`
- Either way, `references/pedagogical-principles.md` has the non-negotiable rules on source integrity and originality — read it once per session, it applies to every mode.

## Non-negotiables (apply in every mode, no exceptions)

1. **Source integrity**: The uploaded chapter is the authority on its own subject matter. Never silently invent facts, change formulas/definitions/numbers, or resolve genuine ambiguity by guessing. Flag it instead, using four labels:
   - `SOURCE CONTENT`
   - `MODEL-ADDED CONTENT`
   - `EDITORIAL RECOMMENDATION`
   - `REQUIRES VERIFICATION`
2. **Original expression only**: Use general knowledge and pedagogical technique freely; never reproduce another textbook's wording, even with synonyms swapped. Explanations, examples, analogies, and exercises must be independently written.
3. **No filler**: Don't add a section, example, or exercise because "books usually have one." Add it only if it measurably helps comprehension, retention, or application. If you can't articulate why a section helps, cut it.
4. **Separate content from commentary**: The final chapter/book Markdown must never contain your editorial notes, gap-flags, or assumptions inline — those go in a separate structural report appended after the deliverable.

## Output Discipline

- **Final chapter or book content**: Clean Markdown, no exposed reasoning, no chain-of-thought.
- **Structural/editorial report**: Separate section, clearly headed, after the content.
- If producing downloadable files (Word/PDF), format clean Markdown ready for compilation.
