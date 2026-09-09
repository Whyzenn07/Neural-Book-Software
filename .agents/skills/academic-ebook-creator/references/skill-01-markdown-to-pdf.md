# SKILL 01: Academic Markdown & Layout Synthesizer

This module defines the standards for structuring academic textbooks and educational modules into clean, publication-ready final OCR Markdown and academic PDF packages.

---

## 1. Document Structure & Hierarchy

Every generated textbook must strictly adhere to the following sequence:

1. **Cover Page**:
   - Centered Book Title, Subtitle, Course Code / Subject, and Institution / Author metadata.
   - For scanned source books, extract full-res cover bitmap (`images/00_cover_page_full.png`) at 300 DPI via PyMuPDF.
   - Followed immediately by a physical page break: `<div style="page-break-before: always;"></div>`.
2. **Table of Contents (ToC)**:
   - 3-Column structured layout:
     | Module / Chapter | Topic / Sub-topic | Page No. |
     | :--- | :--- | :---: |
     | Chapter 1: Introduction | 1.1 Overview of Capital Structure | 1 |
     | Chapter 1: Introduction | 1.2 Weighted Average Cost of Capital | 14 |
3. **Module & Chapter Breakdown**:
   - Each major Chapter/Module MUST start with a physical page break: `<div style="page-break-before: always;"></div>`.
   - Semantic Heading Hierarchy:
     - `# Book Title` (Level 1 - Front matter only)
     - `## Chapter / Module X: [Title]` (Level 2)
     - `### X.Y [Sub-topic Title]` (Level 3)
     - `#### X.Y.Z [Specific Concept / Step]` (Level 4)

---

## 2. Text Pacing, Readability & Student Pedagogy

- **Paragraph Segmentation**: Academic texts must avoid massive walls of dense text. Break content into digestible paragraphs of 3–5 sentences (~250–350 characters).
- **Key Term Emphases**: Bold crucial domain terms on first mention (`**Terminology**`).
- **Student Summary Box ("💡 Intinya")**: At the end of every major sub-topic (`###`), insert a succinct takeaway callout:
  ```markdown
  > 💡 **Intinya:** Biaya modal rata-rata tertimbang (WACC) adalah batas minimum keuntungan yang harus diperoleh perusahaan agar nilai pasar perusahaan tidak turun.
  ```
- **Definition Callout Blocks**: Use standard blockquotes for formal definitions and theorems:
  > **Theorem / Definition 1.1**: *Statement of the definition or principle.*

---

## 3. Academic PDF Compilation Standard (Edge Headless + MathJax)

When compiling from Markdown to academic PDF:
- Use CSS `@page` layout with standard A4/B5 margins:
  ```css
  @page {
    size: A4;
    margin: 25mm 20mm 25mm 20mm;
    @bottom-right {
      content: counter(page);
    }
  }
  ```
- Render all KaTeX / LaTeX formulas using MathJax SVG vector output for infinite resolution without pixelation.
- Apply high-legibility serif academic typography (Merriweather, Garamond, or Georgia) for body text and clean sans-serif for headings.
