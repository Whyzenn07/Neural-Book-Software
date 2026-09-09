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
    title: 'Academic E-Book Creator (All-in-One Master)',
    category: 'Master Engines',
    tag: 'All-in-One Master Suite',
    badgeClass: 'academic',
    command: '/academic-ebook-creator',
    description:
      'Unified enterprise academic publishing engine merging raw scan OCR extraction (Docling/PyMuPDF), 3-tier academic Markdown layout, strict KaTeX math formatting (with zero delimiter errors & anti-error safeguards), 300 DPI cover extraction, diagram snapshots, and multi-dimensional QA cross-checks into a single master skill.',
    features: [
      'Raw Scan OCR & Docling Pipeline',
      'Tier 1: Academic Layout & 3-Col ToC',
      'Tier 2: Strict KaTeX Math (Zero Delimiter Errors)',
      'Tier 2: 5-Step Worked Examples & Symbol Tables',
      'Student Takeaways: Box "💡 Intinya"',
      'Tier 3: Multi-Dimensional QA & PDF Manifest',
    ],
    skillMd: `---
name: academic-ebook-creator
description: >-
  Comprehensive all-in-one academic e-book production and validation engine combining raw scan OCR extraction (Docling/PyMuPDF), 3-tier academic Markdown synthesis, zero-invented-facts editorial polish, rigorous KaTeX/LaTeX formula preservation with strict anti-error delimiter balancing, visual diagram preservation, and multi-dimensional QA cross-check. Use when creating, converting, refining, formatting, or auditing academic textbooks, course modules, LaTeX formulas, exhibits, and tables to generate publication-ready final OCR Markdown and academic PDF packages.
---

# Academic E-Book Production & Validation Engine (All-in-One Master)

An enterprise-grade, end-to-end academic book synthesis and quality auditing system that unifies **raw scan OCR extraction**, **academic layout structuring**, **strict KaTeX mathematical formatting (with zero delimiter errors)**, **diagram/exhibit extraction**, and **multi-dimensional QA auditing** into a single, cohesive workflow.

This engine transforms raw scanned textbooks (*raster/image PDFs*), born-digital PDFs, or raw OCR Markdown dumps into publication-ready, student-friendly academic textbooks (as structured Markdown deliverables and optional MathJax-rendered academic PDFs) with 100% preservation of diagrams, exhibits, LaTeX formulas, and structured tables.

---

## 1. Unified 6-Stage Production Pipeline

\`\`\`text
[Source: Scanned PDF / Digital PDF / Raw OCR Markdown]
                         │
                         ▼ (Stage 1: Document Diagnostics)
[Classify: Scan/Raster (OCR Scale 2.0) vs Born-Digital (--no-ocr)]
                         │
                         ▼ (Stage 2: High-Res Extraction via Docling & PyMuPDF)
[Extract Markdown + High-Res Figures into images/ + 300 DPI Cover Page]
                         │
                         ▼ (Stage 3: Tier 1 - Academic Markdown & Layout Synthesizer)
[Cover Metadata + 3-Col ToC + Page Breaks + Heading Hierarchy + Pacing]
                         │
                         ▼ (Stage 4: Tier 2 - Visuals, Tables & KaTeX Math Polish)
[Centered Exhibits + Pipe Tables + Strict KaTeX Formulas (Zero Delimiter Errors)]
                         │
                         ▼ (Stage 5: Student Pedagogy & Zero-Invented-Facts Polish)
[5-Step Worked Examples + Box "💡 Intinya" + Transparent Fallback Markers]
                         │
                         ▼ (Stage 6: Tier 3 - Multi-Dimensional QA & Compilation)
[Topic Fidelity + Visual Integrity + Formula Calculation Audit + PDF/MD Manifest]
\`\`\`

---

## 2. Stage 1 & 2: Document Diagnostics & Extraction Standards

### A. Document Classification (Python Native)
Before running heavy OCR, classify the input document:
\`\`\`python
import pymupdf

doc = pymupdf.open("source_book.pdf")
total_pages = len(doc)
sample_pages = min(5, total_pages)
text_lengths = [len(doc[i].get_text().strip()) for i in range(sample_pages)]
avg_chars = sum(text_lengths) / max(1, len(text_lengths))

is_scanned = avg_chars < 80
print(f"Total Pages: {total_pages} | Avg Chars: {avg_chars:.1f}")
print("Mode:", "SCAN/RASTER (OCR Scale 2.0)" if is_scanned else "BORN-DIGITAL (--no-ocr)")
\`\`\`

### B. High-Resolution Extraction (\`ocr-docling.py\`)
- **Scanned Book**: \`python ocr-docling.py -i "book.pdf" -o "./output" --scale 2.0\`
- **Page Range / Chapter**: \`python ocr-docling.py -i "book.pdf" -o "./output" --page-range 1 35 --scale 2.0\`
- **Born-Digital PDF**: \`python ocr-docling.py -i "digital.pdf" -o "./output" --no-ocr\`
- **Asset Directory**: All extracted figures, charts, and diagrams must be saved to \`images/\` (e.g., \`images/page_012_exhibit_1.png\`).

### C. 300 DPI Cover Page Preservation
\`\`\`python
import pymupdf
from pathlib import Path

def extract_cover(pdf_path: str, out_path: str, dpi: int = 300):
    doc = pymupdf.open(pdf_path)
    page = doc[0]
    pix = page.get_pixmap(dpi=dpi)
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    pix.save(out_path)
    doc.close()

extract_cover("book.pdf", "output/images/00_cover_page_full.png")
\`\`\`

---

## 3. TIER 1: Layout, Structure & Hierarchy Standards

### 1. Document Sequencing
1. **Cover Page**:
   - Centered Book Title, Subtitle, Course Code / Subject, and Institution / Author metadata.
   - Followed immediately by a physical page break: \`<div style="page-break-before: always;"></div>\`.
2. **Table of Contents (ToC)**:
   - 3-Column structured layout:
     | Module / Chapter | Topic / Sub-topic | Page No. |
     | :--- | :--- | :---: |
     | Chapter 1: Introduction | 1.1 Overview of Capital Structure | 1 |
     | Chapter 1: Introduction | 1.2 Weighted Average Cost of Capital | 14 |
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
- **Student Summary Box ("💡 Intinya")**: At the end of every major sub-topic (\`###\`), insert an actionable student summary callout:
  \`\`\`markdown
  > 💡 **Intinya:** Biaya modal rata-rata tertimbang (WACC) adalah batas minimum keuntungan yang harus diperoleh perusahaan agar nilai pasar perusahaan tidak turun.
  \`\`\`

---

## 4. TIER 2: KaTeX Formulas, Anti-Error Math Rules & Visual Assets

### ⚠️ CRITICAL MANDATE: KaTeX Math Syntax & Anti-Error Safeguards

> [!CAUTION]
> **Zero Math Delimiter Errors**: Mismatched dollar signs (\`$\`), lone delimiters, or raw LaTeX commands outside math mode cause KaTeX to crash and display entire formulas in **RED ERROR TEXT**. You MUST adhere strictly to the rules below.

#### Rule 1: Strict Math Delimiter Balancing & Symmetry
- Every opening \`$\` MUST have an exact closing \`$\` on the **same line** for inline math: \`$x = 5$\`.
- Every opening \`$$\` MUST have a matching closing \`$$\` for display math:
  \`\`\`latex
  $$
  PV = \\frac{FV}{(1 + r)^n}
  $$
  \`\`\`
- **NEVER leave dangling \`$\` or unclosed equations** like \`$= 10,000\` or \`25,000$;\`.

#### Rule 2: Zero Naked LaTeX Macros in Plain Text
- Commands like \`\\times\`, \`\\dfrac\`, \`\\frac\`, \`\\text{...}\`, \`\\sqrt\`, \`\\sum\`, \`\\alpha\`, \`\\beta\`, \`{,}\` are LaTeX math macros.
- **NEVER write LaTeX macros outside of \`$...$\` or \`$$...$$\`!**
- If an expression contains \`\\times\` or \`\\dfrac\`, the **entire mathematical statement** must be inside \`$ ... $\` or \`$$ ... $$\`.

#### Rule 3: Separation of Plain Text vs. Math Expressions
When expressing variable names alongside formulas, use one of two clean approaches:
- **Approach A (Clean separation - Recommended)**:
  Plain text labels stay outside math, formulas stay inside \`$ ... $\`:
  \`- **Substitution**: New profit after tax $= 50{,}000 + (5{,}00{,}000 \\times 0.05) = 75{,}000$\`
- **Approach B (Text wrapped inside math via \`\\text{}\`)**:
  \`$\\text{New Profit After Tax} = 50{,}000 + (5{,}00{,}000 \\times 0.05) = 75{,}000$\`

#### Rule 4: Comma & Thousands Separator Rules
- In regular Markdown text, write numbers with normal commas: \`50,000\` or \`5,00,000\`.
- The LaTeX \`{,}\` separator (e.g., \`50{,}000\`) is **ONLY valid inside math mode** (\`$...$\`).
- **NEVER write \`{,}\` in plain text** (it prints raw curly braces \`{,}\`).

#### Rule 5: Currency & Units Formatting
- For currencies like \`Rs\`, \`Rp\`, \`USD\`, \`$\` or units like \`kg\`, \`m/s\`:
  - When inside math mode: use \`\\text{Rs } 75{,}000\` or \`\\text{USD } 50{,}000\`.
  - When using literal \`$\` as currency in plain text, escape it: \`\\$50,000\` to prevent accidental KaTeX math mode triggers!

---

### Comparison: Anti-Error Verification Table

| Status | Broken Markdown Code (Causes Red Error) | Correct Publication-Ready Markdown |
| :--- | :--- | :--- |
| ❌ **BROKEN** vs ✅ **FIXED** | \`Substitution: New profit after tax = 50{,}000 + (5{,}00{,}000 \\times 0.05) = 50{,}000 + 25{,}000$; new share count $= 10{,}000 + 10{,}000\` *(Dangling \`$\` and naked \`\\times\`)* | \`- **Substitution**:<br/>  - New profit after tax $= 50{,}000 + (5{,}00{,}000 \\times 0.05) = 50{,}000 + 25{,}000$<br/>  - New share count $= 10{,}000 + 10{,}000$\` |
| ❌ **BROKEN** vs ✅ **FIXED** | \`Calculation: New profit after tax = \\text{Rs } 75{,}000$; New EPS $= \\dfrac{75{,}000}{20{,}000} = \\text{Rs } 3.75\` *(Missing opening \`$\`, naked \`\\text\`, unclosed \`$=\`)* | \`- **Calculation**:<br/>  - New profit after tax $= \\text{Rs } 75{,}000$<br/>  - $\\text{New EPS} = \\dfrac{75{,}000}{20{,}000} = \\text{Rs } 3.75$\` |
| ❌ **BROKEN** vs ✅ **FIXED** | \`The value is 50{,}000 and formula is \\frac{a}{b}\` *(Naked macros in plain text)* | \`The value is 50,000 and the formula is $\\frac{a}{b}$.\` |

---

### Standard 5-Step Worked Examples Structure

\`\`\`markdown
#### Example 1.1: Impact of Expansion on Earnings Per Share (EPS)

- **Given**:
  - Existing profit after tax $= \\text{Rs } 50{,}000$
  - Additional capital raised $= \\text{Rs } 5{,}00{,}000$
  - Return on new capital $= 5\\% = 0.05$
  - Existing equity shares $= 10{,}000$
  - New equity shares issued $= 10{,}000$

- **Formula**:
  $$ \\text{New Profit After Tax} = \\text{Existing Profit} + (\\text{New Capital} \\times \\text{Return Rate}) $$
  $$ \\text{New EPS} = \\frac{\\text{New Profit After Tax}}{\\text{Total Shares}} $$

- **Substitution**:
  - New profit after tax $= 50{,}000 + (5{,}00{,}000 \\times 0.05) = 50{,}000 + 25{,}000$
  - Total share count $= 10{,}000 + 10{,}000 = 20{,}000$

- **Calculation**:
  - New profit after tax $= \\text{Rs } 75{,}000$
  - $\\text{New EPS} = \\dfrac{75{,}000}{20{,}000} = \\text{Rs } 3.75$

- **Interpretation**:
  The expansion generates an additional $\\text{Rs } 25{,}000$ in after-tax earnings. Despite the $100\\%$ dilution in share count, the combined earnings yield an EPS of $\\text{Rs } 3.75$ per share.
\`\`\`

---

### Mandatory Symbol Key Table

$$ \\sigma(z) = \\frac{1}{1 + e^{-z}} $$

| Symbol | Meaning | Unit / Dimension |
| :--- | :--- | :--- |
| $\\sigma(z)$ | Sigmoid activation output | Dimensionless $[0, 1]$ |
| $z$ | Weighted linear input vector | Real number ($\\mathbb{R}$) |
| $e$ | Euler's constant ($\\approx 2.71828$) | Mathematical constant |

---

### Visual Exhibits & Diagrams
- Every diagram/flowchart/figure must be centered with high-resolution cropping and an explicit bold title caption:
  \`\`\`html
  <div align="center">
    <img src="images/page_012_exhibit_1.png" alt="Capital Structure Diagram" style="max-width: 90%; border-radius: 4px;" />
    <br/>
    <b>Exhibit 1.2: Capital Structure Decision Framework</b>
  </div>
  \`\`\`

### Clean Markdown Pipe-Tables
\`\`\`markdown
| Component | Book Value | Market Value | Specific Cost ($k_i$) | Weighted Cost |
| :--- | :---: | :---: | :---: | ---: |
| Equity Shares | $500,000$ | $800,000$ | $15.0\\%$ | $0.120$ |
| Retained Earnings | $200,000$ | $200,000$ | $14.0\\%$ | $0.028$ |
| Debentures ($10\\%$) | $300,000$ | $280,000$ | $7.0\\%$ | $0.021$ |
| **Total** | **$1,000,000$** | **$1,280,000$** | — | **$16.9\\%$** |
\`\`\`

---

## 5. TIER 3: Zero-Invented-Facts & Multi-Dimensional QA Cross-Check

### 1. Zero Invented Facts (Strict Academic Integrity)
- **Never guess** blurred numbers, symbols, or formulas.
- If text/numbers are illegible on the source scan, mark transparently:
  \`\`\`markdown
  [TIDAK TERBACA: nilai nominal obligasi pada tabel baris ke-2 buram pada pindaian sumber]
  \`\`\`
- If a formula has ambiguous notation needing verification:
  \`\`\`markdown
  [VERIFIKASI MANUAL: formula indeks harga memerlukan pengecekan terhadap buku fisik]
  \`\`\`

### 2. Multi-Dimensional QA Audits
1. **Syllabus & Topic Fidelity**: 100% of chapters, sections, and topics present. Zero dropped concepts.
2. **Visual & Image Path Integrity**: Every referenced image in \`images/\` exists and renders cleanly.
3. **KaTeX Delimiter Audit**: Zero unmatched \`$\` or \`$$\`, zero naked LaTeX macros in regular text, zero red error spans.
4. **Encoding**: File saved strictly in **UTF-8 pure (without BOM)**.

---

## 6. Deliverable Manifest Package

| File Name | Purpose |
| :--- | :--- |
| \`final-book.md\` (or \`final_ocr.md\`) | Consolidated publication-ready academic Markdown with balanced KaTeX and clean exhibits |
| \`images/\` | Folder containing 300 DPI cover page and all cropped diagrams/charts |
| \`table-of-contents.json\` | Syllabus topic structure and page indices |
| \`generation-report.md\` | QA audit report verifying zero formula errors and topic coverage |
| \`final-book.pdf\` *(optional)* | Compiled academic PDF via Edge Headless + MathJax with \`@page\` styling |
`,
    references: [
      {
        filename: 'skill-01-markdown-to-pdf.md',
        content: `# SKILL 01: Academic Markdown & Layout Synthesizer

This module defines the standards for structuring academic textbooks and educational modules into clean, publication-ready final OCR Markdown and academic PDF packages.

---

## 1. Document Structure & Hierarchy

Every generated textbook must strictly adhere to the following sequence:

1. **Cover Page**:
   - Centered Book Title, Subtitle, Course Code / Subject, and Institution / Author metadata.
   - For scanned source books, extract full-res cover bitmap (\`images/00_cover_page_full.png\`) at 300 DPI via PyMuPDF.
   - Followed immediately by a physical page break: \`<div style="page-break-before: always;"></div>\`.
2. **Table of Contents (ToC)**:
   - 3-Column structured layout:
     | Module / Chapter | Topic / Sub-topic | Page No. |
     | :--- | :--- | :---: |
     | Chapter 1: Introduction | 1.1 Overview of Capital Structure | 1 |
     | Chapter 1: Introduction | 1.2 Weighted Average Cost of Capital | 14 |
3. **Module & Chapter Breakdown**:
   - Each major Chapter/Module MUST start with a physical page break: \`<div style="page-break-before: always;"></div>\`.
   - Semantic Heading Hierarchy:
     - \`# Book Title\` (Level 1 - Front matter only)
     - \`## Chapter / Module X: [Title]\` (Level 2)
     - \`### X.Y [Sub-topic Title]\` (Level 3)
     - \`#### X.Y.Z [Specific Concept / Step]\` (Level 4)

---

## 2. Text Pacing, Readability & Student Pedagogy

- **Paragraph Segmentation**: Academic texts must avoid massive walls of dense text. Break content into digestible paragraphs of 3–5 sentences (~250–350 characters).
- **Key Term Emphases**: Bold crucial domain terms on first mention (\`**Terminology**\`).
- **Student Summary Box ("💡 Intinya")**: At the end of every major sub-topic (\`###\`), insert a succinct takeaway callout:
  \`\`\`markdown
  > 💡 **Intinya:** Biaya modal rata-rata tertimbang (WACC) adalah batas minimum keuntungan yang harus diperoleh perusahaan agar nilai pasar perusahaan tidak turun.
  \`\`\`
- **Definition Callout Blocks**: Use standard blockquotes for formal definitions and theorems:
  > **Theorem / Definition 1.1**: *Statement of the definition or principle.*

---

## 3. Academic PDF Compilation Standard (Edge Headless + MathJax)

When compiling from Markdown to academic PDF:
- Use CSS \`@page\` layout with standard A4/B5 margins:
  \`\`\`css
  @page {
    size: A4;
    margin: 25mm 20mm 25mm 20mm;
    @bottom-right {
      content: counter(page);
    }
  }
  \`\`\`
- Render all KaTeX / LaTeX formulas using MathJax SVG vector output for infinite resolution without pixelation.
- Apply high-legibility serif academic typography (Merriweather, Garamond, or Georgia) for body text and clean sans-serif for headings.
`,
      },
      {
        filename: 'skill-02-visual-assets-and-formulas.md',
        content: `# SKILL 02: Visual Asset & KaTeX Formula Preservation (With Strict Anti-Error Safeguards)

This module governs the extraction, positioning, rendering, and strict syntax validation of visual exhibits, charts, mathematical equations, and structured data tables.

---

## 1. Mathematical Equations & KaTeX Syntax Standards

### ⚠️ Strict Delimiter Balancing & Anti-Error Mandates

KaTeX renders mathematical equations inside Markdown. When delimiters are missing, unbalanced, or misplaced, **KaTeX fails and renders raw LaTeX commands as ugly red error text**.

#### The 5 Golden KaTeX Rules:
1. **Strict Delimiter Symmetry**:
   - Every opening \`$\` MUST have a corresponding closing \`$\` on the same line: \`$a^2 + b^2 = c^2$\`.
   - Every block display opening \`$$\` MUST have a matching closing \`$$\`:
     \`\`\`latex
     $$
     PV = \\frac{FV}{(1 + r)^n}
     $$
     \`\`\`
   - **NEVER** leave a lone dangling \`$\`, such as \`$= 10,000\` or \`25,000$;\`.
2. **Zero Naked LaTeX Macros**:
   - Macros such as \`\\times\`, \`\\dfrac\`, \`\\frac\`, \`\\text{...}\`, \`\\sqrt\`, \`\\alpha\`, \`\\beta\`, \`{,}\` can ONLY exist inside math delimiters (\`$\` or \`$$\`).
   - If you need multiplication \`\\times\`, the entire expression MUST be inside math mode: \`$5 \\times 10 = 50$\`.
3. **Clean Separation of Text vs. Math**:
   - Keep variable names and regular words either outside \`$ ... $\` as plain text, or wrapped in \`\\text{...}\` inside math delimiters.
   - Example (Plain text outside): \`New Profit After Tax $= 50{,}000 + 25{,}000 = 75{,}000$\`
   - Example (Inside math): \`$\\text{New Profit After Tax} = 50{,}000 + 25{,}000 = 75{,}000$\`
4. **Number Formatting & Thousands Separators**:
   - Plain text numbers: Write standard digits with regular commas (\`50,000\` or \`5,00,000\`).
   - Math mode numbers: You may use \`{,}\` to remove math-spacing after commas (\`$50{,}000$\`), but **NEVER** write \`{,}\` in plain text without \`$\`.
5. **Currency and Units**:
   - Use \`\\text{Rs } 75{,}000\` or \`\\text{USD } 50{,}000\` inside math mode.
   - Escape literal dollar signs in plain text (\`\\$50,000\`) so markdown parsers do not accidentally start a math block!

---

### Direct Anti-Error Comparison Table

| Problematic Syntax (Produces Red Error) | Root Cause of Failure | Correct Syntax (Flawless Render) |
| :--- | :--- | :--- |
| \`Substitution: New profit after tax = 50{,}000 + (5{,}00{,}000 \\times 0.05) = 50{,}000 + 25{,}000$; new share count $= 10{,}000 + 10{,}000\` | Unopened math mode, dangling \`$\` after \`25{,}000\`, naked \`\\times\`, unclosed \`$=\` | \`- **Substitution**:<br/>  - New profit after tax $= 50{,}000 + (5{,}00{,}000 \\times 0.05) = 50{,}000 + 25{,}000$<br/>  - New share count $= 10{,}000 + 10{,}000$\` |
| \`Calculation: New profit after tax = \\text{Rs } 75{,}000$; New EPS $= \\dfrac{75{,}000}{20{,}000} = \\text{Rs } 3.75\` | Missing opening \`$\`, naked \`\\text{Rs }\`, unclosed \`$= \\dfrac...\` | \`- **Calculation**:<br/>  - New profit after tax $= \\text{Rs } 75{,}000$<br/>  - $\\text{New EPS} = \\dfrac{75{,}000}{20{,}000} = \\text{Rs } 3.75$\` |
| \`The cost is 50{,}000 with formula \\frac{a}{b}\` | Naked \`{,}\` and \`\\frac\` in plain text | \`The cost is 50,000 with formula $\\frac{a}{b}$.\` |

---

## 2. Standard 5-Step Worked Examples Format

Complex formula explanations must follow the 5-step sequence with strict KaTeX syntax:

\`\`\`markdown
#### Example 1.1: Expansion Impact on Earnings Per Share (EPS)

- **Given**:
  - Existing profit after tax $= \\text{Rs } 50{,}000$
  - New capital to be raised $= \\text{Rs } 5{,}00{,}000$
  - Expected return on new capital $= 5\\% = 0.05$
  - Existing number of shares $= 10{,}000$
  - Additional equity shares issued $= 10{,}000$

- **Formula**:
  $$ \\text{New Profit After Tax} = \\text{Existing Profit} + (\\text{New Capital} \\times \\text{Return Rate}) $$
  $$ \\text{New EPS} = \\frac{\\text{New Profit After Tax}}{\\text{Total Number of Shares}} $$

- **Substitution**:
  - New profit after tax $= 50{,}000 + (5{,}00{,}000 \\times 0.05) = 50{,}000 + 25{,}000$
  - Total share count $= 10{,}000 + 10{,}000 = 20{,}000$

- **Calculation**:
  - New profit after tax $= \\text{Rs } 75{,}000$
  - $\\text{New EPS} = \\dfrac{75{,}000}{20{,}000} = \\text{Rs } 3.75$

- **Interpretation**:
  The new project yields an additional profit of $\\text{Rs } 25{,}000$. Total profit reaches $\\text{Rs } 75{,}000$, resulting in an EPS of $\\text{Rs } 3.75$ per share.
\`\`\`

---

## 3. Mandatory Symbol Key Table

Every major theoretical equation must be accompanied by a structured Symbol Key Table:

$$ \\sigma(z) = \\frac{1}{1 + e^{-z}} $$

| Symbol | Meaning | Unit / Dimension |
| :--- | :--- | :--- |
| $\\sigma(z)$ | Sigmoid activation output | Dimensionless $[0, 1]$ |
| $z$ | Weighted linear input vector | Real number ($\\mathbb{R}$) |
| $e$ | Euler's constant ($\\approx 2.71828$) | Mathematical constant |

---

## 4. Visual Exhibits & Diagrams

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

---

## 5. Structured Markdown Pipe-Tables

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
        content: `# SKILL 03: Multi-Dimensional QA Cross-Check & Quality Gate

This module defines the validation audits, quality checks, and output manifest requirements before finalizing any academic book artifact.

---

## 1. Quality Assurance Verification Checkpoints

### A. Syllabus & Topic Fidelity Audit
- Verify that 100% of topics, sub-topics, and learning outcomes in the source syllabus/document are present in the final Markdown.
- Check that no concepts were dropped, mangled, or inappropriately abbreviated.

### B. Zero-Invented-Facts & Academic Integrity Audit
- **Zero Hallucinations**: Never fabricate numbers, steps, or missing text from blurred scans.
- Transparent markers for illegible or degraded sections:
  \`\`\`markdown
  [TIDAK TERBACA: tabel baris ke-3 buram pada scan asli]
  \`\`\`
- Transparent markers for ambiguous formulas:
  \`\`\`markdown
  [VERIFIKASI MANUAL: formula indeks harga memerlukan pengecekan terhadap buku cetak]
  \`\`\`

### C. KaTeX & Math Syntax Audit (Zero Red Code Errors)
- **Delimiter Check**: Ensure every opening \`$\` or \`$$\` has a matching closing delimiter on the same line/block.
- **Macro Audit**: Verify zero instances of \`\\times\`, \`\\dfrac\`, \`\\frac\`, \`\\text{}\`, or \`{,}\` outside math delimiters.
- **Worked Examples Audit**: Confirm that all 5-step worked examples (Given, Formula, Substitution, Calculation, Interpretation) are structurally sound and calculate accurately.

### D. Visual & Layout Audit
- **Image Integrity**: Ensure all embedded image paths resolve to valid files in \`images/\`.
- **No Text Clipping**: Confirm that equations and wide data tables do not overflow or get clipped on standard A4/Letter margins.
- **Background Transparency**: Ensure cropped diagrams have clean or transparent backgrounds without dark compression artifacts.
- **File Encoding**: The output must be encoded in **UTF-8 pure (without BOM)**.

---

## 2. Deliverable Manifest Package

Every completed production run delivers the following output package:

| File Name | Purpose |
| :--- | :--- |
| \`final-book.md\` (or \`final_ocr.md\`) | Consolidated high-fidelity final OCR academic Markdown generated from raw markdown / scans |
| \`images/\` | High-resolution cropped visual diagrams, flowcharts, tables, and 300 DPI cover page |
| \`table-of-contents.json\` | Machine-readable syllabus mapping and page indices |
| \`generation-report.md\` | Detailed QA log of preserved assets, formulas, and verified checks |
| \`final-book.pdf\` *(optional)* | Clean academic PDF compiled with MathJax vector formulas and \`@page\` layout |
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
