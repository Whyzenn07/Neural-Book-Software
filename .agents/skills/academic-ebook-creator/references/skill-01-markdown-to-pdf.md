# SKILL 01: Academic Markdown & Layout Synthesizer

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
   - Each major Chapter/Module MUST start with a physical page break: `<div style="page-break-before: always;"></div>`.
   - Semantic Heading Hierarchy:
     - `# Book Title` (Level 1 - Front matter only)
     - `## Chapter / Module X: [Title]` (Level 2)
     - `### X.Y [Sub-topic Title]` (Level 3)
     - `#### X.Y.Z [Specific Concept / Step]` (Level 4)

## 2. Text Pacing & Readability

- **Paragraph Segmentation**: Academic texts must avoid massive walls of dense text. Break content into digestible paragraphs of 3–5 sentences (~250–350 characters).
- **Key Term Emphases**: Bold crucial domain terms on first mention (`**Terminology**`).
- **Callout Blocks**: Use standard blockquotes for key definitions, theorems, or takeaways:
  > **Theorem / Definition 1.1**: *Statement of the definition or principle.*

## 3. Page Numbering & Footer Standards

- Bottom-right Arabic numerals for all content pages (`1, 2, 3...`).
- Roman numerals for front-matter (ToC, Preface) if multi-page (`i, ii, iii...`).
