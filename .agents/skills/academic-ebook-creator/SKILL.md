---
name: academic-ebook-creator
description: >-
  Comprehensive all-in-one academic e-book production and validation engine combining raw scan OCR extraction (Docling/PyMuPDF), 3-tier academic Markdown synthesis, zero-invented-facts editorial polish, rigorous KaTeX/LaTeX formula preservation with strict anti-error delimiter balancing, visual diagram preservation, and multi-dimensional QA cross-check. Use when creating, converting, refining, formatting, or auditing academic textbooks, course modules, LaTeX formulas, exhibits, and tables to generate publication-ready final OCR Markdown and academic PDF packages.
---

# Academic E-Book Production & Validation Engine (All-in-One Master)

An enterprise-grade, end-to-end academic book synthesis and quality auditing system that unifies **raw scan OCR extraction**, **academic layout structuring**, **strict KaTeX mathematical formatting (with zero delimiter errors)**, **diagram/exhibit extraction**, and **multi-dimensional QA auditing** into a single, cohesive workflow.

This engine transforms raw scanned textbooks (*raster/image PDFs*), born-digital PDFs, or raw OCR Markdown dumps into publication-ready, student-friendly academic textbooks (as structured Markdown deliverables and optional MathJax-rendered academic PDFs) with 100% preservation of diagrams, exhibits, LaTeX formulas, and structured tables.

---

## 1. Unified 6-Stage Production Pipeline

```text
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
```

---

## 2. Stage 1 & 2: Document Diagnostics & Extraction Standards

### A. Document Classification (Python Native)
Before running heavy OCR, classify the input document:
```python
import pymupdf

doc = pymupdf.open("source_book.pdf")
total_pages = len(doc)
sample_pages = min(5, total_pages)
text_lengths = [len(doc[i].get_text().strip()) for i in range(sample_pages)]
avg_chars = sum(text_lengths) / max(1, len(text_lengths))

is_scanned = avg_chars < 80
print(f"Total Pages: {total_pages} | Avg Chars: {avg_chars:.1f}")
print("Mode:", "SCAN/RASTER (OCR Scale 2.0)" if is_scanned else "BORN-DIGITAL (--no-ocr)")
```

### B. High-Resolution Extraction (`ocr-docling.py`)
- **Scanned Book**: `python ocr-docling.py -i "book.pdf" -o "./output" --scale 2.0`
- **Page Range / Chapter**: `python ocr-docling.py -i "book.pdf" -o "./output" --page-range 1 35 --scale 2.0`
- **Born-Digital PDF**: `python ocr-docling.py -i "digital.pdf" -o "./output" --no-ocr`
- **Asset Directory**: All extracted figures, charts, and diagrams must be saved to `images/` (e.g., `images/page_012_exhibit_1.png`).

### C. 300 DPI Cover Page Preservation
Full-resolution cover extraction to avoid typography degradation:
```python
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
```

---

## 3. TIER 1: Layout, Structure & Hierarchy Standards

### 1. Document Sequencing
Every generated textbook must adhere to the following sequence:
1. **Cover Page**:
   - Centered Book Title, Subtitle, Course Code / Subject, and Institution / Author metadata.
   - Followed immediately by a physical page break: `<div style="page-break-before: always;"></div>`.
2. **Table of Contents (ToC)**:
   - 3-Column structured layout:
     | Module / Chapter | Topic / Sub-topic | Page No. |
     | :--- | :--- | :---: |
     | Chapter 1: Introduction | 1.1 Overview of Capital Structure | 1 |
     | Chapter 1: Introduction | 1.2 Weighted Average Cost of Capital | 14 |
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

### 3. Student Key Takeaway Callout Boxes
At the conclusion of every major sub-topic (`###`), insert an actionable student summary callout:
```markdown
> 💡 **Intinya:** Biaya modal rata-rata tertimbang (WACC) adalah batas minimum keuntungan yang harus diperoleh perusahaan agar nilai pasar perusahaan tidak turun.
```
*(Or in English texts: `> 💡 **Key Takeaway:** ...`)*

---

## 4. TIER 2: KaTeX Formulas, Anti-Error Math Rules & Visual Assets

### ⚠️ CRITICAL MANDATE: KaTeX Math Syntax & Anti-Error Safeguards

> [!CAUTION]
> **Zero Math Delimiter Errors**: Mismatched dollar signs (`$`), lone delimiters, or raw LaTeX commands outside math mode cause KaTeX to crash and display entire formulas in **RED ERROR TEXT**. You MUST adhere strictly to the rules below.

#### Rule 1: Strict Math Delimiter Balancing & Symmetry
- Every opening `$` MUST have an exact closing `$` on the **same line** for inline math: `$x = 5$`.
- Every opening `$$` MUST have a matching closing `$$` for display math:
  ```latex
  $$
  PV = \frac{FV}{(1 + r)^n}
  $$
  ```
- **NEVER leave dangling `$` or unclosed equations** like `$= 10,000` or `25,000$;`.

#### Rule 2: Zero Naked LaTeX Macros in Plain Text
- Commands like `\times`, `\dfrac`, `\frac`, `\text{...}`, `\sqrt`, `\sum`, `\alpha`, `\beta`, `{,}` are LaTeX math macros.
- **NEVER write LaTeX macros outside of `$...$` or `$$...$$`!**
- If an expression contains `\times` or `\dfrac`, the **entire mathematical statement** must be inside `$ ... $` or `$$ ... $$`.

#### Rule 3: Separation of Plain Text vs. Math Expressions
When expressing variable names alongside formulas, use one of two clean approaches:
- **Approach A (Clean separation - Recommended)**:
  Plain text labels stay outside math, formulas stay inside `$ ... $`:
  `- **Substitution**: New profit after tax $= 50{,}000 + (5{,}00{,}000 \times 0.05) = 75{,}000$`
- **Approach B (Text wrapped inside math via `\text{}`)**:
  `$\text{New Profit After Tax} = 50{,}000 + (5{,}00{,}000 \times 0.05) = 75{,}000$`

#### Rule 4: Comma & Thousands Separator Rules
- In regular Markdown text, write numbers with normal commas: `50,000` or `5,00,000`.
- The LaTeX `{,}` separator (e.g., `50{,}000`) is **ONLY valid inside math mode** (`$...$`).
- **NEVER write `{,}` in plain text** (it prints raw curly braces `{,}`).

#### Rule 5: Currency & Units Formatting
- For currencies like `Rs`, `Rp`, `USD`, `$` or units like `kg`, `m/s`:
  - When inside math mode: use `\text{Rs } 75{,}000` or `\text{USD } 50{,}000`.
  - When using literal `$` as currency in plain text, escape it: `\$50,000` to prevent accidental KaTeX math mode triggers!

---

### Comparison: Anti-Error Verification Table

| Status | Broken Markdown Code (Causes Red Error) | Correct Publication-Ready Markdown |
| :--- | :--- | :--- |
| ❌ **BROKEN** vs ✅ **FIXED** | `Substitution: New profit after tax = 50{,}000 + (5{,}00{,}000 \times 0.05) = 50{,}000 + 25{,}000$; new share count $= 10{,}000 + 10{,}000` *(Dangling `$` and naked `\times`)* | `- **Substitution**:<br/>  - New profit after tax $= 50{,}000 + (5{,}00{,}000 \times 0.05) = 50{,}000 + 25{,}000$<br/>  - New share count $= 10{,}000 + 10{,}000$` |
| ❌ **BROKEN** vs ✅ **FIXED** | `Calculation: New profit after tax = \text{Rs } 75{,}000$; New EPS $= \dfrac{75{,}000}{20{,}000} = \text{Rs } 3.75` *(Missing opening `$`, naked `\text`, unclosed `$=`)* | `- **Calculation**:<br/>  - New profit after tax $= \text{Rs } 75{,}000$<br/>  - $\text{New EPS} = \dfrac{75{,}000}{20{,}000} = \text{Rs } 3.75$` |
| ❌ **BROKEN** vs ✅ **FIXED** | `The value is 50{,}000 and formula is \frac{a}{b}` *(Naked macros in plain text)* | `The value is 50,000 and the formula is $\frac{a}{b}$.` |

---

### Standard 5-Step Worked Examples Structure

Every quantitative worked example **MUST** follow this clean, error-free 5-step format:

```markdown
#### Example 1.1: Impact of Expansion on Earnings Per Share (EPS)

- **Given**:
  - Existing profit after tax $= \text{Rs } 50{,}000$
  - Additional capital raised $= \text{Rs } 5{,}00{,}000$
  - Return on new capital $= 5\% = 0.05$
  - Existing equity shares $= 10{,}000$
  - New equity shares issued $= 10{,}000$

- **Formula**:
  $$ \text{New Profit After Tax} = \text{Existing Profit} + (\text{New Capital} \times \text{Return Rate}) $$
  $$ \text{New EPS} = \frac{\text{New Profit After Tax}}{\text{Total Shares}} $$

- **Substitution**:
  - New profit after tax $= 50{,}000 + (5{,}00{,}000 \times 0.05) = 50{,}000 + 25{,}000$
  - Total share count $= 10{,}000 + 10{,}000 = 20{,}000$

- **Calculation**:
  - New profit after tax $= \text{Rs } 75{,}000$
  - $\text{New EPS} = \dfrac{75{,}000}{20{,}000} = \text{Rs } 3.75$

- **Interpretation**:
  The expansion generates an additional $\text{Rs } 25{,}000$ in after-tax earnings. Despite the $100\%$ dilution in share count, the combined earnings yield an EPS of $\text{Rs } 3.75$ per share.
```

---

### Mandatory Symbol Key Table
Every major theoretical equation must be followed by a Symbol Key Table:

$$ \sigma(z) = \frac{1}{1 + e^{-z}} $$

| Symbol | Meaning | Unit / Dimension |
| :--- | :--- | :--- |
| $\sigma(z)$ | Sigmoid activation output | Dimensionless $[0, 1]$ |
| $z$ | Weighted linear input vector | Real number ($\mathbb{R}$) |
| $e$ | Euler's constant ($\approx 2.71828$) | Mathematical constant |

---

### Visual Exhibits & Diagrams
- Every diagram/flowchart/figure must be centered with high-resolution cropping and an explicit bold title caption:
  ```html
  <div align="center">
    <img src="images/page_012_exhibit_1.png" alt="Capital Structure Diagram" style="max-width: 90%; border-radius: 4px;" />
    <br/>
    <b>Exhibit 1.2: Capital Structure Decision Framework</b>
  </div>
  ```

### Clean Markdown Pipe-Tables
- Never flatten tables into text. Always maintain Markdown pipe-tables with alignment indicators:
  ```markdown
  | Component | Book Value | Market Value | Specific Cost ($k_i$) | Weighted Cost |
  | :--- | :---: | :---: | :---: | ---: |
  | Equity Shares | $500,000$ | $800,000$ | $15.0\%$ | $0.120$ |
  | Retained Earnings | $200,000$ | $200,000$ | $14.0\%$ | $0.028$ |
  | Debentures ($10\%$) | $300,000$ | $280,000$ | $7.0\%$ | $0.021$ |
  | **Total** | **$1,000,000$** | **$1,280,000$** | — | **$16.9\%$** |
  ```

---

## 5. TIER 3: Zero-Invented-Facts & Multi-Dimensional QA Cross-Check

### 1. Zero Invented Facts (Strict Academic Integrity)
- **Never guess** blurred numbers, symbols, or formulas.
- If text/numbers are illegible on the source scan, mark transparently:
  ```markdown
  [TIDAK TERBACA: nilai nominal obligasi pada tabel baris ke-2 buram pada pindaian sumber]
  ```
  *(Or in English: `[UNREADABLE: bond par value on table row 2 is obscured on source scan]`)*
- If a formula has ambiguous notation needing verification:
  ```markdown
  [VERIFIKASI MANUAL: formula indeks harga memerlukan pengecekan terhadap buku fisik]
  ```

### 2. Multi-Dimensional QA Audits
Before final package delivery, verify:
1. **Syllabus & Topic Fidelity**: 100% of chapters, sections, and topics present. Zero dropped concepts.
2. **Visual & Image Path Integrity**: Every referenced image in `images/` exists and renders cleanly.
3. **KaTeX Delimiter Audit**:
   - Zero unmatched `$` or `$$`.
   - Zero naked LaTeX macros (`\times`, `\dfrac`, etc.) in regular text.
   - Zero red error spans in rendered HTML/preview.
4. **Encoding**: File saved strictly in **UTF-8 pure (without BOM)**.

---

## 6. Deliverable Manifest Package

Every run produces a standardized, publication-ready package:

| File Name | Purpose |
| :--- | :--- |
| `final-book.md` (or `final_ocr.md`) | Consolidated publication-ready academic Markdown with balanced KaTeX and clean exhibits |
| `images/` | Folder containing 300 DPI cover page and all cropped diagrams/charts |
| `table-of-contents.json` | Syllabus topic structure and page indices |
| `generation-report.md` | QA audit report verifying zero formula errors and topic coverage |
| `final-book.pdf` *(optional)* | Compiled academic PDF via Edge Headless + MathJax with `@page` styling |

---

## 7. How to Execute

When called with `/academic-ebook-creator` or provided raw chapter material / scanned PDFs / raw OCR Markdown:
1. **Diagnostic & Extraction**: Classify PDF and run Docling/PyMuPDF extraction (or ingest existing raw Markdown).
2. **Synthesis & Polish**:
   - Apply **Tier 1 Layout** (Cover metadata, 3-Col ToC, page breaks, hierarchy).
   - Apply **Tier 2 KaTeX & Visuals** strictly following the **Anti-Error Math Rules** (ensuring all `$ ... $` are balanced and no red KaTeX errors occur).
   - Apply **Student Pedagogy** (5-step worked examples, "💡 Intinya" summary callouts).
3. **QA Verification**: Execute Tier 3 QA audit and deliver the clean `final-book.md` and assets.
