/**
 * Embedded Skills Data (All-in-One Master Directives)
 * Guarantees 100% offline reliability, instant live preview, and single-file Claude upload compliance.
 * Each package contains a root SKILL.md starting with YAML frontmatter (---).
 */
import JSZip from 'jszip'

export const SKILLS_DATA = [
  // ── All-in-One Master Suite ───────────────────────────────────────────────
  {
    id: 'academic-ebook-creator',
    name: 'academic-ebook-creator',
    title: 'Academic E-Book Creator (All-in-One)',
    category: 'Master Engines',
    tag: 'All-in-One Master Suite',
    badgeClass: 'academic',
    command: '/academic-ebook-creator',
    description:
      'Consolidated 3-tier academic publishing engine (incorporating Tier 1 Layout, Tier 2 KaTeX Math & Visuals, and Tier 3 QA Audit in a single upload). Generates complete academic textbooks as final OCR Markdown files using LLM from raw markdown with 100% diagram preservation, centered LaTeX formulas ($$ ... $$), Symbol Key Tables, and structured Markdown pipe-tables (without PDF output).',
    features: [
      'Tier 1: Markdown Layout & 3-Col ToC',
      'Tier 2: Centered KaTeX Math ($$ ... $$)',
      'Tier 2: Symbol Key Tables & Diagram Snapshots',
      'Tier 3: Multi-Dimensional QA Audit',
      'Continuous A4 Page Numbering',
    ],
    skillMd: `---
name: academic-ebook-creator
description: >-
  Comprehensive all-in-one 3-tier academic e-book production and validation engine (Tier 1: Academic Markdown Layout & Structure, Tier 2: Visual Asset & KaTeX Formula Preservation, Tier 3: Multi-Dimensional QA Cross-Check). Use when creating, converting, refining, formatting, or auditing academic textbooks, course modules, LaTeX formulas, exhibits, and tables to generate final OCR markdown files from raw markdown sources using LLM (output is a structured markdown file, not PDF).
---

# Academic E-Book Production & Validation Engine (All-in-One)

An end-to-end academic book synthesis and quality auditing system that transforms raw markdown chapter material and raw OCR text into high-fidelity, student-friendly academic textbooks by generating the final OCR markdown file using LLM (the deliverable is a publication-ready Markdown file, not a PDF) with 100% preservation of diagrams, exhibits, LaTeX formulas, and structured tables in a single automated pipeline.

---

## Complete 3-Tier Production Pipeline

\`\`\`text
Raw Markdown / Raw OCR Chapter Files
               ↓
[TIER 1: Academic Markdown & Layout Synthesizer]
  • Cover page with metadata
  • 3-column Table of Contents (Module, Topic, Page No.)
  • Physical page breaks (<div style="page-break-before: always;"></div>)
  • Semantic heading hierarchy (## 1.1, ### 1.1.1, #### 1.1.1.1)
  • Natural paragraph segmentation (3-5 sentences / ~280 chars)
               ↓
[TIER 2: Visual Asset & Formula Preserver]
  • High-res diagram & figure snapshots (<div align="center"><img src="images/..."/><b>Exhibit X.Y</b></div>)
  • Centered display KaTeX/LaTeX equations ($$ Formula $$)
  • Mandatory Symbol Key Tables (| Symbol | Meaning | Unit |)
  • 5-step worked examples (Given → Formula → Substitution → Calculation → Interpretation)
  • Clean Markdown pipe-tables with alignment indicators
               ↓
[TIER 3: Multi-Dimensional QA Cross-Check]
  • Syllabus Topic Fidelity Audit (100% topic coverage)
  • Layout & Visual clipping audit (zero margin overflow)
  • Mathematical & numerical calculation verification
  • Complete deliverable manifest synthesis (Final OCR Markdown generation)
\`\`\`

---

## TIER 1: Layout, Structure & Hierarchy Standards

### 1. Document Sequencing
Every generated textbook must adhere to the following sequence:
1. **Cover Page**:
   - Centered Book Title, Subtitle, Course Code / Subject, and Institution / Author metadata.
   - Followed immediately by a physical page break: \`<div style="page-break-before: always;"></div>\`.
2. **Table of Contents (ToC)**:
   - 3-Column structured layout:
     | Module / Chapter | Topic / Sub-topic | Page No. |
     | :--- | :--- | :---: |
3. **Module & Chapter Breakdown**:
   - Each major Chapter/Module **MUST** start with a physical page break: \`<div style="page-break-before: always;"></div>\`.
   - Semantic Heading Hierarchy:
     - \`# Book Title\` (Level 1 - Front matter only)
     - \`## Chapter / Module X: [Title]\` (Level 2)
     - \`### X.Y [Sub-topic Title]\` (Level 3)
     - \`#### X.Y.Z [Specific Concept / Step]\` (Level 4)

### 2. Text Pacing & Readability
- **Paragraph Segmentation**: Avoid massive walls of dense text. Break content into digestible paragraphs of 3–5 sentences (~250–350 characters).
- **Key Term Emphases**: Bold crucial domain terms on first mention (\`**Terminology**\`).
- **Callout Blocks**: Use standard blockquotes for key definitions, theorems, or takeaways:
  > **Theorem / Definition 1.1**: *Statement of the definition or principle.*

---

## TIER 2: Visual Assets, KaTeX Formulas & Data Tables

### 1. Visual Exhibits & Diagrams
- **Cropping & Positioning**: Extract high-resolution cropped bounding boxes for all diagrams, flowcharts, schematics, and figures.
- **Display Alignment & Captions**: Every figure/diagram must be centered with a bold title caption below:
  \`\`\`html
  <div align="center">
    <img src="images/page_012_exhibit_1.png" alt="System Architecture Diagram" style="max-width: 90%; border-radius: 4px;" />
    <br/>
    <b>Exhibit 2.1: Distributed Neural System Architecture</b>
  </div>
  \`\`\`

### 2. Mathematical Equations & Formulas
1. **Centered Display KaTeX**:
   - Block display equations must be centered using standard KaTeX/LaTeX syntax:
     \`\`\`latex
     $$ \\sigma(z) = \\frac{1}{1 + e^{-z}} $$
     \`\`\`
2. **Mandatory Symbol Key Table**:
   - Every major equation must immediately be accompanied by a Symbol Key Table:
     | Symbol | Meaning | Unit / Dimension |
     | :--- | :--- | :--- |
     | $\\sigma(z)$ | Sigmoid activation output | Dimensionless $[0, 1]$ |
     | $z$ | Weighted linear input vector | Real number ($\\mathbb{R}$) |
     | $e$ | Euler's constant ($\\approx 2.71828$) | Constant |

3. **5-Step Worked Examples Format**:
   - Complex formula explanations must follow the 5-step worked example sequence:
     - **Given**: Known input values and constraints.
     - **Formula**: The exact formula used.
     - **Substitution**: Variable values plugged into the equation.
     - **Calculation**: Step-by-step arithmetic/algebraic evaluation.
     - **Interpretation**: Real-world/domain meaning of the result.

### 3. Clean Markdown Pipe-Tables
- **Never** flatten tables into plain text sentences.
- Always generate properly formatted Markdown pipe-tables with explicit alignment indicators (\`:---\`, \`:---:\`, \`---:\`):
  \`\`\`markdown
  | Layer Type | Input Shape | Output Shape | Parameters |
  | :--- | :---: | :---: | ---: |
  | Dense_1 | \`(None, 784)\` | \`(None, 128)\` | 100,480 |
  | Dense_2 | \`(None, 128)\` | \`(None, 10)\` | 1,290 |
  \`\`\`

---

## TIER 3: Multi-Dimensional QA Cross-Check

Before finalizing the deliverable, execute the following 3 validation audits:

1. **Syllabus & Topic Fidelity Audit**:
   - Confirm 100% of topics, sub-topics, and learning outcomes in the source syllabus/document are present in the final Markdown.
   - Ensure zero invented facts or unauthorized omissions.
2. **Visual & Layout Audit**:
   - Verify all image paths resolve to valid files.
   - Confirm equations and wide data tables do not overflow or clip on standard A4/Letter margins.
   - Ensure diagram backgrounds are clean without compression artifacts.
3. **Mathematical & Numerical Consistency Audit**:
   - Confirm every variable in an equation is defined in the Symbol Key Table.
   - Validate numerical calculations from input values to the final step in worked examples.

---

## How to Execute

When called with \`/academic-ebook-creator\` or provided raw chapter material / raw markdown files:
1. Parse the input raw markdown content.
2. Execute **Tier 1 (Layout & ToC)**, **Tier 2 (KaTeX & Visuals)**, and **Tier 3 (QA Audit)** concurrently in a single seamless generation pass.
3. Generate the final OCR markdown file (\`final-book.md\` / \`final_ocr.md\`) using LLM from raw markdown with the exact same layout format, KaTeX formulas, tables, and exhibits (result is a clean Markdown file, not PDF).
`,
    references: [
      {
        filename: 'skill-01-markdown-to-pdf.md',
        content: `# SKILL 01: Academic Markdown & Layout Synthesizer

This module defines the rules for structuring academic textbooks and educational modules into clean, publication-ready final OCR Markdown files generated from raw markdown sources (result is a high-fidelity Markdown file, not PDF).

## 1. Document Structure & Hierarchy

Every generated textbook must adhere to the following sequence:

1. **Cover Page**:
   - Centered Title, Subtitle, Subject/Course Code, and Author/Institution metadata.
   - Distinct physical page break immediately following the cover.
2. **Table of Contents (ToC)**:
   - 3-Column structured layout:
     | Module / Chapter | Topic / Sub-topic | Page No. |
     | :--- | :--- | :---: |
3. **Module & Chapter Breakdown**:
   - Each major Chapter/Module MUST start with a physical page break: \`<div style="page-break-before: always;"></div>\`.
   - Semantic Heading Hierarchy:
     - \`# Book Title\` (Level 1 - Front matter only)
     - \`## Chapter / Module X: [Title]\` (Level 2)
     - \`### X.Y [Sub-topic Title]\` (Level 3)
     - \`#### X.Y.Z [Specific Concept / Step]\` (Level 4)

## 2. Text Pacing & Readability

- **Paragraph Segmentation**: Academic texts must avoid massive walls of dense text. Break content into digestible paragraphs of 3–5 sentences (~250–350 characters).
- **Key Term Emphases**: Bold crucial domain terms on first mention (\`**Terminology**\`).
- **Callout Blocks**: Use standard blockquotes for key definitions, theorems, or takeaways:
  > **Theorem / Definition 1.1**: *Statement of the definition or principle.*

## 3. Page Numbering & Footer Standards

- Bottom-right Arabic numerals for all content pages (\`1, 2, 3...\`).
- Roman numerals for front-matter (ToC, Preface) if multi-page (\`i, ii, iii...\`).
`,
      },
      {
        filename: 'skill-02-visual-assets-and-formulas.md',
        content: `# SKILL 02: Visual Asset & Formula Preserver

This module governs the extraction, positioning, rendering, and validation of visual exhibits, charts, mathematical equations, and structured data tables.

## 1. Visual Exhibits & Diagrams

1. **Auto-Cropping & Extraction**:
   - Extract high-resolution cropped bounding boxes for all diagrams, flowcharts, schematics, and figures.
   - Save assets under standard naming: \`images/page_{page_num}_exhibit_{idx}.png\`.
2. **Display Alignment & Standard Captions**:
   - Every figure/diagram must be centered with a bold title caption below:
     \`\`\`html
     <div align="center">
       <img src="images/page_012_exhibit_1.png" alt="System Architecture Diagram" style="max-width: 90%; border-radius: 4px;" />
       <br/>
       <b>Exhibit 2.1: Distributed Neural System Architecture</b>
     </div>
     \`\`\`

## 2. Mathematical Equations & Formulas

1. **Formula Display Standard**:
   - Block display equations must be centered using standard KaTeX/LaTeX syntax:
     \`\`\`latex
     $$ \\sigma(z) = \\frac{1}{1 + e^{-z}} $$
     \`\`\`
2. **Symbol Key Table**:
   - Every major equation must immediately be accompanied by a Symbol Key Table:
     | Symbol | Meaning | Unit / Dimension |
     | :--- | :--- | :--- |
     | $\\sigma(z)$ | Sigmoid activation output | Dimensionless $[0, 1]$ |
     | $z$ | Weighted linear input vector | Real number ($\\mathbb{R}$) |
     | $e$ | Euler's constant ($\\approx 2.71828$) | Constant |

3. **Worked Examples Format**:
   - Complex formula explanations must follow the 5-step worked example sequence:
     - **Given**: Known input values and constraints.
     - **Formula**: The exact formula used.
     - **Substitution**: Variable values plugged into the equation.
     - **Calculation**: Step-by-step arithmetic/algebraic evaluation.
     - **Interpretation**: Real-world/domain meaning of the result.

## 3. Data Tables

- **Never** flatten tables into plain text sentences.
- Always generate properly formatted Markdown pipe-tables with explicit alignment indicators (\`:---\`, \`:---:\`, \`---:\`):
  \`\`\`markdown
  | Layer Type | Input Shape | Output Shape | Parameters |
  | :--- | :---: | :---: | ---: |
  | Dense_1 | \`(None, 784)\` | \`(None, 128)\` | 100,480 |
  | Dense_2 | \`(None, 128)\` | \`(None, 10)\` | 1,290 |
  \`\`\`
`,
      },
      {
        filename: 'skill-03-qa-cross-check.md',
        content: `# SKILL 03: Multi-Dimensional QA Cross-Check

This module defines the validation audits, quality checks, and output manifest requirements before finalizing any academic book artifact.

## 1. Quality Assurance Verification Checkpoints

### A. Syllabus & Topic Fidelity Audit
- Verify that 100% of topics, sub-topics, and learning outcomes in the source syllabus/document are present in the final Markdown.
- Check that no concepts were dropped, mangled, or inappropriately abbreviated.

### B. Visual & Layout Audit
- **Image Integrity**: Ensure all embedded image paths resolve to valid files.
- **No Text Clipping**: Confirm that equations and wide data tables do not overflow or get clipped on standard A4/Letter margins.
- **Background Transparency**: Ensure cropped diagrams have clean or transparent backgrounds without dark compression artifacts.

### C. Mathematical & Numerical Consistency Audit
- Verify that every variable in an equation is defined in the corresponding Symbol Key Table.
- Ensure worked examples have mathematically accurate calculations from input values to the final step.

## 2. Deliverable Manifest Package

Every completed run should deliver or maintain the following output structure (generating final OCR Markdown file without PDF):

| File Name | Purpose |
| :--- | :--- |
| \`final-book.md\` | Consolidated high-fidelity final OCR academic Markdown generated from raw markdown by LLM |
| \`table-of-contents.json\` | Machine-readable syllabus mapping and page indices |
| \`generation-report.md\` | Detailed QA log of preserved assets, formulas, and checks |
`,
      },
    ],
  },

  // ── Adaptive Pedagogy Engine ──────────────────────────────────────────────
  {
    id: 'argo-book-creator',
    name: 'argo-book-creator',
    title: 'Argo Adaptive Book Creator',
    category: 'Master Engines',
    tag: 'Adaptive Pedagogy',
    badgeClass: 'argo',
    command: '/argo-book-creator',
    description:
      'Adaptive educational book production system that turns source chapter material into a coherent, student-friendly book without forcing rigid templates. Includes multi-chapter consistency checks, persistent state tracking (book-state.md), and pedagogical tone calibration.',
    features: [
      'Adaptive Narrative & Chapter Flow',
      'Student-Centric Pedagogy & Analogies',
      'Multi-Chapter Consistency Audits',
      'Persistent State Tracking (book-state.md)',
      'Original Expression & Anti-Filler QA',
    ],
    skillMd: `---
name: argo-book-creator
description: >-
  An adaptive educational book production system that turns source chapter material into
  a coherent, student-friendly book without forcing every chapter into a rigid template.
  Use when creating, reviewing, revising chapters, auditing multi-chapter books, assembling
  books, or preparing publication packages.
---

# Argo Book Creator

An adaptive educational book production system. It turns source chapter material into a coherent, student-friendly book — without forcing every chapter into the same template.

## Core Principle
The right structure for a chapter (intuition → formula → example vs. problem → code → exercise vs. context → chronology → evidence, etc.) depends entirely on the subject and audience. Never impose a fixed section list. Decide structure by asking: *"what will help this specific student learn this specific material?"* — not *"what does a textbook normally have?"*

## Step 0 — Figure out the mode

| User gives you... | Mode | Reference File |
|---|---|---|
| One raw chapter \`.md\`, no other instruction | **Create** | \`references/chapter-workflow.md\` |
| A chapter + "review this" / "what's wrong with this" | **Review** | \`references/chapter-workflow.md\` |
| A chapter + specific requested changes | **Revise** | \`references/chapter-workflow.md\` |
| Multiple completed chapters, asking for consistency check | **Multi-chapter audit** | \`references/book-assembly.md\` |
| All chapters + "assemble the book" | **Book assembly** | \`references/book-assembly.md\` |
| Complete book + "make it publication-ready" / cover | **Publication package** | \`references/book-assembly.md\` |

*If genuinely ambiguous (e.g. first-ever message with no prior chapters and no \`book-state.md\`), default to **Create** mode for the first chapter — don't stall on ceremony.*

## Step 1 — Load persistent book context

Before doing anything else, check whether \`book-state.md\` exists in the working directory (it's how this skill remembers title, terminology, notation, and chapter order across separate conversations). Read it now if present; update it at the end of the task.

## Non-negotiables (apply in every mode, no exceptions)

1. **Source integrity**: The uploaded chapter is the authority on its own subject matter. Never silently invent facts, change formulas/definitions/numbers, or resolve genuine ambiguity by guessing.
2. **Original expression only**: Explanations, examples, analogies, and exercises must be independently written.
3. **No filler**: Don't add a section, example, or exercise because "books usually have one." Add it only if it measurably helps comprehension.
4. **Separate content from commentary**: The final chapter/book Markdown must never contain your editorial notes inline — those go in a separate structural report appended after the deliverable.

## Output Discipline

- **Final chapter or book content**: Clean Markdown, ready for compilation.
- **Structural/editorial report**: Separate section, clearly headed, after the content.
`,
    references: [
      {
        filename: 'book-assembly.md',
        content: `# Book Assembly Reference

This reference covers multi-chapter modes: **Multi-chapter audit**, **Book assembly**, and **Publication package**.

## 1. Multi-Chapter Modes

### Multi-Chapter Audit Mode
- **Goal**: Ensure narrative continuity, term consistency, notation uniformity, and structural balance across multiple chapters.
- **Process**:
  1. Inspect all chapter drafts against \`book-state.md\`.
  2. Flag term drift (e.g., using "EBITDA" vs "Operating Income" inconsistently), notation mismatches, or redundant introductions across chapters.
  3. Identify structural gaps between chapters and ensure smooth logical transitions.

### Book Assembly Mode
- **Goal**: Merge individual chapters into a cohesive complete book draft.
- **Process**:
  1. Organize chapters according to the established table of contents in \`book-state.md\`.
  2. Generate unifying elements: Title page, Master Table of Contents, Section Introductions, Global Glossary, and Master Index.
  3. Validate internal cross-references (e.g., "As discussed in Chapter 2, Section 2.3").

### Publication Package Mode
- **Goal**: Produce publication-ready artifacts (Markdown, front matter, back matter, cover specifications, print/digital assets).
- **Process**:
  1. Format metadata (ISBN, copyright, author bio, acknowledgments).
  2. Ensure clean formatting suitable for rendering engines (PDF/ePub/Docx compilation).
  3. Perform final verification of all images, formulas, tables, and typography guidelines.

---

## 2. Cross-Chapter Consistency Audit Checklist
- [ ] **Terminology**: Are key terms defined once and used consistently throughout?
- [ ] **Notation**: Are math symbols, variable names, and formatting conventions uniform across all chapters?
- [ ] **Tone & Audience**: Is the reading level and explanation depth consistent across chapters?
- [ ] **Formatting**: Are heading hierarchies, callout styles, and code blocks standardized?
`,
      },
      {
        filename: 'chapter-workflow.md',
        content: `# Chapter Workflow Reference

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
  2. Verify source integrity using the 4-label taxonomy (\`SOURCE CONTENT\`, \`MODEL-ADDED CONTENT\`, \`EDITORIAL RECOMMENDATION\`, \`REQUIRES VERIFICATION\`).
  3. Provide concrete actionable feedback and propose structural improvements without altering original core facts without authorization.

### Revise Mode
- **Goal**: Apply targeted modifications requested by the user or identified during review while maintaining overall book consistency.
- **Process**:
  1. Incorporate specific feedback into the chapter text cleanly.
  2. Re-verify alignment with \`book-state.md\` (terminology, notation, style).
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

\`\`\`markdown
---
# Structural & Editorial Report

## 1. Chapter Architecture Rationale
- **Chosen Structure**: [e.g., Problem -> Code -> Exercise]
- **Justification**: [Why this sequence maximizes student understanding]

## 2. Content & Source Audit
- **Source Integrity Notes**: [Highlights of source coverage]
- **Flagged Items**:
  - \`[SOURCE CONTENT]\` ...
  - \`[MODEL-ADDED CONTENT]\` ...
  - \`[EDITORIAL RECOMMENDATION]\` ...
  - \`[REQUIRES VERIFICATION]\` ...

## 3. Pedagogical Enhancements Made
- [List of custom analogies, step-by-step examples, or exercises added]
\`\`\`
`,
      },
      {
        filename: 'pedagogical-principles.md',
        content: `# Pedagogical Principles Reference

These non-negotiable rules apply across all modes of Argo Book Creator.

## 1. Source Integrity & Accuracy Taxonomy

The uploaded chapter or source material is the ultimate authority for core facts. Never guess or fabricate information. Use the following 4-label taxonomy in your structural report when analyzing or supplementing content:

1. **\`SOURCE CONTENT\`**: Information directly extracted and synthesized from the provided source material.
2. **\`MODEL-ADDED CONTENT\`**: Explanations, analogies, contextual background, worked examples, or exercise questions generated independently to enhance pedagogical value.
3. **\`EDITORIAL RECOMMENDATION\`**: Suggestions regarding chapter structure, sequence adjustments, or content truncation/expansion.
4. **\`REQUIRES VERIFICATION\`**: Flagged ambiguous statements, missing variables, incomplete formulas, or contradictory facts in the source material requiring human review.

---

## 2. Original Expression Only

- Explanations, examples, analogies, and exercises must be created independently.
- Do not copy third-party textbook phrasing or structural quirks.
- General domain knowledge and standard pedagogical techniques should be used freely to generate clear, fresh explanations.

---

## 3. Elimination of Cognitive Load & Filler

- **No Filler**: Eliminate superficial overview sections, repetitive summaries, or unnecessary fluff. Every paragraph must serve a clear learning outcome.
- **Pedagogical Alignment**: Structure topics logically based on cognitive progression (e.g., concrete intuition before abstract formulas).
- **Active Engagement**: Incorporate thoughtful self-assessment questions or practical problem-solving steps where beneficial.

---

## 4. Separation of Content and Commentary

- The main output text must be clean Markdown suitable directly for publication.
- Do not place inline commentary, \`TODO\` items, or model feedback inside the chapter body.
- Place all structural notes, gap analyses, and editorial flags in the **Structural & Editorial Report** section appended at the very end of the deliverable.
`,
      },
      {
        filename: 'state-tracking.md',
        content: `# State Tracking Reference (\`book-state.md\`)

\`book-state.md\` acts as the persistent memory for the Argo Book Creator system across user turns and chat sessions.

## 1. When to Read and Update \`book-state.md\`

- **Read**: Step 1 of every task execution. Check if \`book-state.md\` exists in the workspace root directory.
- **Update**: At the end of every task execution, update \`book-state.md\` to reflect new chapters created, updated terminology, modified notation rules, or changes in chapter status.

---

## 2. Standard Schema for \`book-state.md\`

\`\`\`markdown
# Book State Tracking

## Project Metadata
- **Title**: [Working Book Title]
- **Target Audience**: [e.g., Undergraduate Finance Students, Beginners, Practitioners]
- **Primary Language**: [e.g., Indonesian / English]
- **Last Updated**: [YYYY-MM-DD]

## Terminology Glossary
| Term | Preferred Definition / Translation | Notes |
|---|---|---|
| Working Capital | Modal Kerja | Always use uppercase in Indonesian contexts |
| Discount Rate | Suku Bunga Diskonto | Symbolized as 'r' |

## Notation & Formatting Rules
- **Math Symbols**: $r$ for discount rate, $PV$ for Present Value, $FV$ for Future Value.
- **Code/Formula Style**: Use LaTeX inline ($...$) and block ($$...$$).
- **Callout Style**: Use standard GFM quotes (\`> [!NOTE]\`, \`> [!EXAMPLE]\`).

## Chapter Directory & Status

| Ch # | Title | File Path | Status | Last Audit Date |
|---|---|---|---|---|
| 1 | Introduction to Financial Management | \`chapters/ch01.md\` | Completed | 2026-08-13 |
| 2 | Time Value of Money | \`chapters/ch02.md\` | Draft | 2026-08-13 |
| 3 | Risk & Return | \`chapters/ch03.md\` | Planned | - |
\`\`\`
`,
      },
    ],
  },
]

// Direct Browser Blob Download for Markdown files (.md)
export function downloadMarkdownFile(filename, content) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Direct Browser JSZip Package Download for single skill
// Guarantees root SKILL.md with YAML frontmatter for 100% Claude & Antigravity compliance
export async function downloadSkillPackageZip(skill) {
  const zip = new JSZip()
  // Wajib bernama SKILL.md di root zip agar Claude langsung valid
  zip.file('SKILL.md', skill.skillMd)

  if (skill.references && skill.references.length > 0) {
    const refFolder = zip.folder('references')
    skill.references.forEach((ref) => {
      refFolder.file(ref.filename, ref.content)
    })
  }

  const content = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(content)
  const a = document.createElement('a')
  a.href = url
  a.download = `${skill.id}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Direct Browser JSZip Bundle Download for all skills
export async function downloadAllSkillsBundleZip() {
  const zip = new JSZip()

  SKILLS_DATA.forEach((skill) => {
    const skillFolder = zip.folder(skill.id)
    skillFolder.file('SKILL.md', skill.skillMd)

    if (skill.references && skill.references.length > 0) {
      const refFolder = skillFolder.folder('references')
      skill.references.forEach((ref) => {
        refFolder.file(ref.filename, ref.content)
      })
    }
  })

  const content = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(content)
  const a = document.createElement('a')
  a.href = url
  a.download = 'AI_Skills_Directives_Package.zip'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
