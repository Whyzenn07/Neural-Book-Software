# Book Assembly Reference

This reference covers multi-chapter modes: **Multi-chapter audit**, **Book assembly**, and **Publication package**.

## 1. Multi-Chapter Modes

### Multi-Chapter Audit Mode
- **Goal**: Ensure narrative continuity, term consistency, notation uniformity, and structural balance across multiple chapters.
- **Process**:
  1. Inspect all chapter drafts against `book-state.md`.
  2. Flag term drift (e.g., using "EBITDA" vs "Operating Income" inconsistently), notation mismatches, or redundant introductions across chapters.
  3. Identify structural gaps between chapters and ensure smooth logical transitions.

### Book Assembly Mode
- **Goal**: Merge individual chapters into a cohesive complete book draft.
- **Process**:
  1. Organize chapters according to the established table of contents in `book-state.md`.
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
