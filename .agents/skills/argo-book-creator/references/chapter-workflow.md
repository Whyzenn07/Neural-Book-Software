# Chapter Workflow Reference

This reference covers single-chapter workflows: **Create**, **Review**, and **Revise**.

## 1. Single-Chapter Workflow Modes

### Create Mode
- **Goal**: Convert raw, unstructured, or semi-structured chapter material into a polished, pedagogically sound educational chapter.
- **Process**:
  1. Analyze input material to extract key concepts, core formulas, definitions, and learning objectives.
  2. Determine the optimal pedagogical narrative structure based on subject matter and target audience.
  3. Draft the chapter using original explanations, intuitive analogies, step-by-step worked examples, and targeted practice problems.
  4. Ensure no inline commentary or editorial tags pollute the main chapter text.
  5. Append a comprehensive **Structural & Editorial Report** after the chapter.

### Review Mode
- **Goal**: Evaluate an existing chapter against pedagogical principles, source integrity, clarity, and structural balance.
- **Process**:
  1. Audit for filler, overly rigid or awkward section structures, ambiguous definitions, and formula inconsistencies.
  2. Verify source integrity using the 4-label taxonomy (`SOURCE CONTENT`, `MODEL-ADDED CONTENT`, `EDITORIAL RECOMMENDATION`, `REQUIRES VERIFICATION`).
  3. Provide concrete actionable feedback and propose structural improvements without altering original core facts without authorization.

### Revise Mode
- **Goal**: Apply targeted modifications requested by the user or identified during review while maintaining overall book consistency.
- **Process**:
  1. Incorporate specific feedback into the chapter text cleanly.
  2. Re-verify alignment with `book-state.md` (terminology, notation, style).
  3. Provide an updated chapter deliverable followed by a summary of changes in the editorial report.

---

## 2. Adaptive Structure Selection

Never force a fixed template. Adapt chapter flow according to topic requirements:
- **Conceptual / Theoretical**: Intuition → Definition → Mathematical Formula → Concrete Application → Practice Questions.
- **Technical / Practical**: Real-world Problem → Tool/Code Implementation → Step-by-Step Breakdown → Hands-on Exercise.
- **Historical / Analytical**: Context & Background → Chronological Progression → Key Evidence → Critical Synthesis.

---

## 3. Structural & Editorial Report Format

Every single-chapter deliverable must append the report in the following format:

```markdown
---
# Structural & Editorial Report

## 1. Chapter Architecture Rationale
- **Chosen Structure**: [e.g., Problem -> Code -> Exercise]
- **Justification**: [Why this sequence maximizes student understanding]

## 2. Content & Source Audit
- **Source Integrity Notes**: [Highlights of source coverage]
- **Flagged Items**:
  - `[SOURCE CONTENT]` ...
  - `[MODEL-ADDED CONTENT]` ...
  - `[EDITORIAL RECOMMENDATION]` ...
  - `[REQUIRES VERIFICATION]` ...

## 3. Pedagogical Enhancements Made
- [List of custom analogies, step-by-step examples, or exercises added]
```
