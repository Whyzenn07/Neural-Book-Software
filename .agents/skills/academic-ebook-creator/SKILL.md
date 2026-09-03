---
name: academic-ebook-creator
description: >-
  Comprehensive all-in-one 3-tier academic e-book production and validation engine (Tier 1: Academic Markdown Layout & Structure, Tier 2: Visual Asset & KaTeX Formula Preservation, Tier 3: Multi-Dimensional QA Cross-Check). Use when creating, converting, refining, formatting, or auditing academic textbooks, course modules, LaTeX formulas, exhibits, and tables to generate final OCR markdown files from raw markdown sources using LLM (output is a structured markdown file, not PDF).
---

# Academic E-Book Production & Validation Engine (All-in-One)

An end-to-end academic book synthesis and quality auditing system that transforms raw markdown chapter material and raw OCR text into high-fidelity, student-friendly academic textbooks by generating the final OCR markdown file using LLM (the deliverable is a publication-ready Markdown file, not a PDF) with 100% preservation of diagrams, exhibits, LaTeX formulas, and structured tables in a single automated pipeline.

---

## Complete 3-Tier Production Pipeline

```text
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
```

---

## TIER 1: Layout, Structure & Hierarchy Standards

### 1. Document Sequencing
Every generated textbook must adhere to the following sequence:
1. **Cover Page**:
   - Centered Book Title, Subtitle, Course Code / Subject, and Institution / Author metadata.
   - Followed immediately by a physical page break: `<div style="page-break-before: always;"></div>`.
2. **Table of Contents (ToC)**:
   - 3-Column structured layout:
     | Module / Chapter | Topic / Sub-topic | Page No. |
     | :--- | :--- | :---: |
3. **Module & Chapter Breakdown**:
   - Each major Chapter/Module **MUST** start with a physical page break: `<div style="page-break-before: always;"></div>`.
   - Semantic Heading Hierarchy:
     - `# Book Title` (Level 1 - Front matter only)
     - `## Chapter / Module X: [Title]` (Level 2)
     - `### X.Y [Sub-topic Title]` (Level 3)
     - `#### X.Y.Z [Specific Concept / Step]` (Level 4)

### 2. Text Pacing & Readability
- **Paragraph Segmentation**: Avoid massive walls of dense text. Break content into digestible paragraphs of 3–5 sentences (~250–350 characters).
- **Key Term Emphases**: Bold crucial domain terms on first mention (`**Terminology**`).
- **Callout Blocks**: Use standard blockquotes for key definitions, theorems, or takeaways:
  > **Theorem / Definition 1.1**: *Statement of the definition or principle.*

---

## TIER 2: Visual Assets, KaTeX Formulas & Data Tables

### 1. Visual Exhibits & Diagrams
- **Cropping & Positioning**: Extract high-resolution cropped bounding boxes for all diagrams, flowcharts, schematics, and figures.
- **Display Alignment & Captions**: Every figure/diagram must be centered with a bold title caption below:
  ```html
  <div align="center">
    <img src="images/page_012_exhibit_1.png" alt="System Architecture Diagram" style="max-width: 90%; border-radius: 4px;" />
    <br/>
    <b>Exhibit 2.1: Distributed Neural System Architecture</b>
  </div>
  ```

### 2. Mathematical Equations & Formulas
1. **Centered Display KaTeX**:
   - Block display equations must be centered using standard KaTeX/LaTeX syntax:
     ```latex
     $$ \sigma(z) = \frac{1}{1 + e^{-z}} $$
     ```
2. **Mandatory Symbol Key Table**:
   - Every major equation must immediately be accompanied by a Symbol Key Table:
     | Symbol | Meaning | Unit / Dimension |
     | :--- | :--- | :--- |
     | $\sigma(z)$ | Sigmoid activation output | Dimensionless $[0, 1]$ |
     | $z$ | Weighted linear input vector | Real number ($\mathbb{R}$) |
     | $e$ | Euler's constant ($\approx 2.71828$) | Constant |

3. **5-Step Worked Examples Format**:
   - Complex formula explanations must follow the 5-step worked example sequence:
     - **Given**: Known input values and constraints.
     - **Formula**: The exact formula used.
     - **Substitution**: Variable values plugged into the equation.
     - **Calculation**: Step-by-step arithmetic/algebraic evaluation.
     - **Interpretation**: Real-world/domain meaning of the result.

### 3. Clean Markdown Pipe-Tables
- **Never** flatten tables into plain text sentences.
- Always generate properly formatted Markdown pipe-tables with explicit alignment indicators (`:---`, `:---:`, `---:`):
  ```markdown
  | Layer Type | Input Shape | Output Shape | Parameters |
  | :--- | :---: | :---: | ---: |
  | Dense_1 | `(None, 784)` | `(None, 128)` | 100,480 |
  | Dense_2 | `(None, 128)` | `(None, 10)` | 1,290 |
  ```

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

When called with `/academic-ebook-creator` or provided raw chapter material / raw markdown files:
1. Parse the input raw markdown content.
2. Execute **Tier 1 (Layout & ToC)**, **Tier 2 (KaTeX & Visuals)**, and **Tier 3 (QA Audit)** concurrently in a single seamless generation pass.
3. Generate the final OCR markdown file (`final-book.md` / `final_ocr.md`) using LLM from raw markdown with the exact same layout format, KaTeX formulas, tables, and exhibits (result is a clean Markdown file, not PDF).
