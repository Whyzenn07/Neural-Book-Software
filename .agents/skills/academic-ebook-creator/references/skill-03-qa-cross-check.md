# SKILL 03: Multi-Dimensional QA Cross-Check & Quality Gate

This module defines the validation audits, quality checks, and output manifest requirements before finalizing any academic book artifact.

---

## 1. Quality Assurance Verification Checkpoints

### A. Syllabus & Topic Fidelity Audit
- Verify that 100% of topics, sub-topics, and learning outcomes in the source syllabus/document are present in the final Markdown.
- Check that no concepts were dropped, mangled, or inappropriately abbreviated.

### B. Zero-Invented-Facts & Academic Integrity Audit
- **Zero Hallucinations**: Never fabricate numbers, steps, or missing text from blurred scans.
- Transparent markers for illegible or degraded sections:
  ```markdown
  [TIDAK TERBACA: tabel baris ke-3 buram pada scan asli]
  ```
- Transparent markers for ambiguous formulas:
  ```markdown
  [VERIFIKASI MANUAL: formula indeks harga memerlukan pengecekan terhadap buku cetak]
  ```

### C. KaTeX & Math Syntax Audit (Zero Red Code Errors)
- **Delimiter Check**: Ensure every opening `$` or `$$` has a matching closing delimiter on the same line/block.
- **Macro Audit**: Verify zero instances of `\times`, `\dfrac`, `\frac`, `\text{}`, or `{,}` outside math delimiters.
- **Worked Examples Audit**: Confirm that all 5-step worked examples (Given, Formula, Substitution, Calculation, Interpretation) are structurally sound and calculate accurately.

### D. Visual & Layout Audit
- **Image Integrity**: Ensure all embedded image paths resolve to valid files in `images/`.
- **No Text Clipping**: Confirm that equations and wide data tables do not overflow or get clipped on standard A4/Letter margins.
- **Background Transparency**: Ensure cropped diagrams have clean or transparent backgrounds without dark compression artifacts.
- **File Encoding**: The output must be encoded in **UTF-8 pure (without BOM)**.

---

## 2. Deliverable Manifest Package

Every completed production run delivers the following output package:

| File Name | Purpose |
| :--- | :--- |
| `final-book.md` (or `final_ocr.md`) | Consolidated high-fidelity final OCR academic Markdown generated from raw markdown / scans |
| `images/` | High-resolution cropped visual diagrams, flowcharts, tables, and 300 DPI cover page |
| `table-of-contents.json` | Machine-readable syllabus mapping and page indices |
| `generation-report.md` | Detailed QA log of preserved assets, formulas, and verified checks |
| `final-book.pdf` *(optional)* | Clean academic PDF compiled with MathJax vector formulas and `@page` layout |
