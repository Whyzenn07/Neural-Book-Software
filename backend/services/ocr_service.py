"""
ocr_service.py
==============
Advanced PDF -> Structured Markdown OCR & Layout Pipeline for NeuralBook.
Features:
- Dual-Stage Processing: Fast Native Layer + Visual & Math Detection + OCR Fallback
- Auto-Crop High-Resolution Math Formula Snapshots + LaTeX ($$ ... $$) Formatting
- In-Place Element Sorting (Text, Headings, Tables, Figures, Formulas)
- Multi-column & Table Structure Extraction (Markdown Pipe-Tables)
- Standalone CLI and Service Integration
"""

from __future__ import annotations

import argparse
import asyncio
import dataclasses
import os
import re
from pathlib import Path
from typing import Optional, List, Dict, Any

import fitz  # PyMuPDF
from PIL import Image

# ── Windows compatibility ───────────────────────────────────────────────────
os.environ['TORCHDYNAMO_DISABLE'] = '1'
os.environ['TORCH_COMPILE_DISABLE'] = '1'
os.environ['TOKENIZERS_PARALLELISM'] = 'false'

# Try native Windows OCR (winocr) and Tesseract
try:
    import winocr  # type: ignore
    HAS_WINOCR = True
except ImportError:
    HAS_WINOCR = False

try:
    import pytesseract  # type: ignore
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

# Lazy-loaded Docling converter instance
_docling_converter = None


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclasses.dataclass
class PageContent:
    page_number: int
    text: str
    tables_markdown: list[str]
    figure_paths: list[Path]
    formula_flags: list[str]
    used_ocr: bool


# ---------------------------------------------------------------------------
# Math & Formula Detection Helpers
# ---------------------------------------------------------------------------

_MATH_SYMBOLS = set("∑∫√±×÷≈≠≤≥∞∂∆∇βθλμπσΣαγδεζηκμνξρτω")
_MATH_PATTERNS = [
    re.compile(r'(\b[A-Za-z0-9_]+\s*=\s*[^,\.\n]+[\/\*\+\-][^,\.\n]+)'),
    re.compile(r'(\\frac|\\sum|\\int|\\sqrt|\\times|\\leq|\\geq|[A-Za-z]_\{?[0-9A-Za-z]+\}?)'),
    re.compile(r'(\b[A-Z][a-z]*\s*(?:Rate|ROI|Ratio|Spread|Midpoint|Index|Formula)\s*=)', re.IGNORECASE),
    re.compile(r'\(\s*\d+\s*\)\s*$'),  # Equation numbering (1) or (2.3)
]


def looks_like_formula(line: str) -> bool:
    """Detect if a text line contains mathematical formulas, fractions, or metric assignments."""
    text_clean = line.strip()
    if not text_clean or len(text_clean) < 3:
        return False
    
    symbol_hits = sum(1 for ch in text_clean if ch in _MATH_SYMBOLS)
    if symbol_hits >= 1 and (symbol_hits / len(text_clean)) > 0.03:
        return True

    for pat in _MATH_PATTERNS:
        if pat.search(text_clean):
            return True

    return False


def format_to_latex(text: str) -> Optional[str]:
    """Convert common formula patterns to clean KaTeX/MathJax LaTeX ($$ ... $$)."""
    t = text.strip()
    from services.markdown_generator import detect_and_format_latex
    res = detect_and_format_latex(t)
    if res.startswith("$$"):
        return res

    # Fractional formulas: LHS = NUM / DEN or (NUM) / (DEN)
    frac_match = re.match(
        r'^([A-Za-z\s\(\)]+)\s*=\s*\(?([^/]+?)\)?\s*\/\s*\(?([^/]+?)\)?(?:\s*[\*x×]\s*(\d+))?$',
        t
    )
    if frac_match:
        lhs, num, den, mult = frac_match.groups()
        mult_str = f" \\times {mult}" if mult else ""
        return f"$$\\text{{{lhs.strip()}}} = \\frac{{\\text{{{num.strip()}}}}}{{\\text{{{den.strip()}}}}}{mult_str}$$"

    if any(sym in t for sym in ["=", "≈", "≤", "≥"]) and any(op in t for op in ["+", "-", "/", "*", "×"]):
        clean_eq = t.replace("×", "\\times ").replace("±", "\\pm ").replace("≤", "\\leq ").replace("≥", "\\geq ")
        return f"$${clean_eq}$$"

    return None


# ---------------------------------------------------------------------------
# Core OCR Service
# ---------------------------------------------------------------------------

def get_docling_converter():
    """Initialize Docling converter if available."""
    global _docling_converter
    if _docling_converter is not None:
        return _docling_converter

    try:
        from docling.document_converter import DocumentConverter, PdfFormatOption  # type: ignore
        from docling.datamodel.base_models import InputFormat  # type: ignore
        from docling.datamodel.pipeline_options import PdfPipelineOptions  # type: ignore

        pipeline_options = PdfPipelineOptions()
        pipeline_options.do_ocr = True
        pipeline_options.do_table_structure = True

        _docling_converter = DocumentConverter(
            format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)}
        )
        print("[+] Docling AI-OCR Engine initialized successfully.")
        return _docling_converter
    except Exception as ex:
        print(f"[!] Docling initialization note: {ex}")
        return None


def convert_pdf_chapter_to_raw_markdown(pdf_path: Path) -> str:
    """Stage 1: Convert a chapter PDF to Raw Markdown with PyMuPDF layout fallback."""
    converter = get_docling_converter()
    if converter is not None:
        try:
            doc = converter.convert(str(pdf_path)).document
            return doc.export_to_markdown()
        except Exception as e:
            print(f"[ocr_service] Docling conversion fallback on {pdf_path.name}: {e}")

    # PyMuPDF fast fallback
    text_parts = []
    with fitz.open(str(pdf_path)) as doc:
        for page in doc:
            t = page.get_text("text").strip()
            if t:
                text_parts.append(t)
    return "\n\n---\n\n".join(text_parts)


def refine_raw_ocr_to_final_markdown(
    raw_content: str,
    chapter_idx: int = 1,
    title: str = "Chapter",
    book_name: str = ""
) -> str:
    """
    Stage 2: Refine and format OCR text into publication-grade Final Markdown.
    Preserves existing markdown tables, embedded diagrams/images, and prevents duplicate chapter headers.
    """
    from services.markdown_generator import (
        clean_hyphenation,
        detect_and_format_latex,
        format_table_block,
        humanize_academic_markdown,
    )

    clean_body = humanize_academic_markdown(raw_content.strip())

    # If content is already formatted rich markdown, avoid breaking tables or duplicating headers
    ch_label = f"Chapter {chapter_idx}"
    clean_t = title.replace(ch_label, "").replace(f"Module {chapter_idx}", "").strip(" :—-_")
    full_heading = f"{ch_label}: {clean_t}" if clean_t else ch_label

    if ("| ---" in clean_body or "|:---" in clean_body) or ("<img " in clean_body):
        if not clean_body.startswith("# "):
            return f"# {full_heading}\n\n{clean_body}\n"
        return f"{clean_body}\n"

    # Semantic refinement pipeline for raw plain text
    lines = raw_content.splitlines()
    clean_lines = []
    in_table_buffer = []

    for line in lines:
        stripped = line.strip()

        # Remove running headers and isolated page number artifacts
        if re.match(r'^(?:Page\s*\d+|\d+\s*Human Resource|\d+\s*PART\s*\d+|\d+\s*CHAPTER)', stripped, re.IGNORECASE) and len(stripped) < 50:
            continue

        # Clean hyphenation
        cleaned_line = clean_hyphenation(stripped)

        # LaTeX formula detection
        latex_line = detect_and_format_latex(cleaned_line)
        if latex_line.startswith("$$"):
            clean_lines.append(f"\n{latex_line}\n")
            continue

        # Table detection & buffering
        if '\t' in cleaned_line or '   ' in cleaned_line:
            in_table_buffer.append(cleaned_line)
            continue
        elif in_table_buffer:
            clean_lines.append(format_table_block(in_table_buffer))
            in_table_buffer = []

        # Heading detection
        if re.match(r'^(?:Chapter\s*\d+|Module\s*\d+)\s*[:\—\-]?\s*(.*)', cleaned_line, re.IGNORECASE):
            clean_lines.append(f"\n## {cleaned_line}\n")
        elif re.match(r'^(?:\d+\.\d+|\d+\.\d+\.\d+)\s+[A-Z]', cleaned_line):
            clean_lines.append(f"\n## {cleaned_line}\n")
        elif re.match(r'^[A-Z\s]{4,40}$', cleaned_line) and not cleaned_line.startswith("#"):
            clean_lines.append(f"\n### {cleaned_line.title()}\n")
        elif cleaned_line.startswith("•") or cleaned_line.startswith("- "):
            clean_lines.append(f"- {cleaned_line.lstrip('•- ').strip()}")
        else:
            clean_lines.append(cleaned_line)

    if in_table_buffer:
        clean_lines.append(format_table_block(in_table_buffer))

    # Segment long prose blocks into readable paragraphs
    structured_blocks = []
    for line in clean_lines:
        line_s = line.strip()
        if not line_s:
            continue
        if line_s.startswith("#") or line_s.startswith("-") or line_s.startswith(">") or line_s.startswith("<") or line_s.startswith("|") or line_s.startswith("$$"):
            structured_blocks.append(line_s)
            continue
        
        # Split sentences if line is too dense (> 300 chars)
        if len(line_s) > 300:
            sentences = re.split(r'(?<=[.?!])\s+(?=[A-Z0-9"\'\(\[])', line_s)
            cur_p = []
            cur_len = 0
            for s in sentences:
                s_c = s.strip()
                if not s_c:
                    continue
                cur_p.append(s_c)
                cur_len += len(s_c)
                if cur_len > 280 or len(cur_p) >= 3:
                    structured_blocks.append(" ".join(cur_p))
                    cur_p = []
                    cur_len = 0
            if cur_p:
                structured_blocks.append(" ".join(cur_p))
        else:
            structured_blocks.append(line_s)

    body = "\n\n".join(structured_blocks).strip()
    if body.startswith("# "):
        return f"{body}\n"
    return f"# {full_heading}\n\n{body}\n"


def ocr_page(image_path: str, lang: str = "en") -> str:
    """Run OCR on a single image with native Windows OCR or PyTesseract fallback."""
    if not os.path.exists(image_path):
        return ""

    if HAS_WINOCR:
        try:
            import concurrent.futures
            img = Image.open(image_path)
            
            def _run_winocr_isolated():
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    res = loop.run_until_complete(winocr.recognize_pil(img, lang=lang))  # type: ignore
                    return res.text.strip() if res and res.text else ""
                finally:
                    loop.close()

            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(_run_winocr_isolated)
                text = future.result(timeout=15)
                if text:
                    return text
        except Exception as e:
            pass

    if HAS_TESSERACT:
        try:
            img = Image.open(image_path)
            text = pytesseract.image_to_string(img, lang="eng", config="--psm 6")  # type: ignore
            return text.strip()
        except Exception:
            pass

    return ""


# ---------------------------------------------------------------------------
# Advanced Standalone & CLI PDF to Structured Markdown Service
# ---------------------------------------------------------------------------

class AdvancedPDFToMarkdownService:
    """
    High-fidelity PDF to Markdown converter preserving in-place layout,
    auto-cropping visual formulas with LaTeX reconstruction, and formatting tables.
    """

    def __init__(self, pdf_path: str, out_dir: str, dpi: int = 250):
        self.pdf_path = Path(pdf_path)
        self.out_dir = Path(out_dir)
        self.figs_dir = self.out_dir / "figs"
        self.math_dir = self.out_dir / "figs" / "formulas"
        self.dpi = dpi
        self.zoom = dpi / 72.0

        for d in (self.out_dir, self.figs_dir, self.math_dir):
            d.mkdir(parents=True, exist_ok=True)

    def extract_page_elements(
        self,
        doc_fitz: fitz.Document,
        pdfplumber_doc: Optional[Any],
        page_idx: int
    ) -> List[Dict[str, Any]]:
        page_num = page_idx + 1
        page_fitz = doc_fitz[page_idx]
        page_rect = page_fitz.rect
        elements: List[Dict[str, Any]] = []

        table_bboxes = []

        # 1. Table extraction
        if pdfplumber_doc is not None:
            try:
                page_plumber = pdfplumber_doc.pages[page_idx]
                found_tables = page_plumber.find_tables()
                for t_idx, table_obj in enumerate(found_tables):
                    t_bbox = table_obj.bbox
                    table_bboxes.append(t_bbox)
                    extracted_data = table_obj.extract()
                    if extracted_data and len(extracted_data) >= 2:
                        md_table = self._convert_table_to_markdown(extracted_data)
                        elements.append({
                            "type": "table",
                            "y0": t_bbox[1],
                            "content": md_table,
                            "page": page_num,
                            "index": t_idx + 1
                        })
            except Exception as e:
                print(f"[!] Warning extracting tables on page {page_num}: {e}")

        # 2. Image / Figure extraction
        for img_idx, img_info in enumerate(page_fitz.get_images(full=True)):
            xref = img_info[0]
            try:
                base_image = doc_fitz.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]

                rects = page_fitz.get_image_rects(xref)
                y0 = rects[0].y0 if rects else 9999.0

                if base_image["width"] < 40 or base_image["height"] < 40:
                    continue

                fig_filename = f"page{page_num:03d}-fig{img_idx+1}.{image_ext}"
                fig_path = self.figs_dir / fig_filename
                with open(fig_path, "wb") as f:
                    f.write(image_bytes)

                elements.append({
                    "type": "image",
                    "y0": y0,
                    "content": f"![Figure — Page {page_num} #{img_idx+1}](figs/{fig_filename}){{width=80%}}",
                    "page": page_num,
                    "path": fig_path
                })
            except Exception:
                continue

        # 3. Text & Formula extraction
        text_dict = page_fitz.get_text("dict")
        pix = None

        for b_idx, block in enumerate(text_dict.get("blocks", [])):
            if block.get("type") != 0:
                continue

            bbox = block.get("bbox", (0, 0, 0, 0))
            y0, y1 = bbox[1], bbox[3]

            # Filter running header/footer
            if (y0 < page_rect.height * 0.05 or y1 > page_rect.height * 0.95):
                continue

            # Skip text inside table
            inside_table = any(
                (tb[0] - 5 <= bbox[0] <= tb[2] + 5) and (tb[1] - 5 <= y0 <= tb[3] + 5)
                for tb in table_bboxes
            )
            if inside_table:
                continue

            block_lines = []
            for line in block.get("lines", []):
                line_text = "".join(span.get("text", "") for span in line.get("spans", []))
                line_text = re.sub(r'(\w+)-\s*\n\s*(\w+)', r'\1\2', line_text).strip()
                if line_text:
                    block_lines.append(line_text)

            full_block_text = " ".join(block_lines).strip()
            if not full_block_text:
                continue

            # Check if this block is a mathematical formula
            if looks_like_formula(full_block_text):
                latex_version = format_to_latex(full_block_text)

                if pix is None:
                    pix = page_fitz.get_pixmap(dpi=self.dpi)

                crop_rect = fitz.Rect(
                    max(0, bbox[0] - 8),
                    max(0, bbox[1] - 4),
                    min(page_rect.width, bbox[2] + 8),
                    min(page_rect.height, bbox[3] + 4)
                ) * self.zoom

                math_filename = f"formula-p{page_num:03d}-b{b_idx:02d}.png"
                math_crop_path = self.math_dir / math_filename

                try:
                    crop_pix = fitz.Pixmap(pix, int(crop_rect.x0), int(crop_rect.y0), int(crop_rect.x1), int(crop_rect.y1))
                    crop_pix.save(str(math_crop_path))
                except Exception:
                    pass

                elements.append({
                    "type": "formula",
                    "y0": y0,
                    "latex": latex_version,
                    "raw_text": full_block_text,
                    "image_rel_path": f"figs/formulas/{math_filename}",
                    "page": page_num
                })
            else:
                formatted_text = self._format_text_block(full_block_text)
                elements.append({
                    "type": "text",
                    "y0": y0,
                    "content": formatted_text,
                    "page": page_num
                })

        elements.sort(key=lambda item: item["y0"])
        return elements

    @staticmethod
    def _convert_table_to_markdown(table_data: List[List[Optional[str]]]) -> str:
        def clean_cell(cell: Optional[str]) -> str:
            return (cell or "").replace("\n", " ").replace("|", "\\|").strip()

        header, *rows = table_data
        header_cells = [clean_cell(c) for c in header]
        if not any(header_cells):
            header_cells = [f"Col {i+1}" for i in range(len(header_cells))]

        lines = [
            "| " + " | ".join(header_cells) + " |",
            "| " + " | ".join([":---"] * len(header_cells)) + " |",
        ]
        for row in rows:
            row_cells = [clean_cell(c) for c in row]
            row_cells = (row_cells + [""] * len(header_cells))[:len(header_cells)]
            lines.append("| " + " | ".join(row_cells) + " |")

        return "\n".join(lines)

    @staticmethod
    def _format_text_block(text: str) -> str:
        if re.match(r'^(?:Chapter\s*\d+|BAB\s*\d+|Module\s*\d+)', text, re.IGNORECASE):
            return f"\n# {text}\n"
        if re.match(r'^(?:\d+\.\d+|\d+\.\d+\.\d+)\s+[A-Z]', text):
            return f"\n## {text}\n"
        if re.match(r'^(?:Illustration|Case Study|Check Your Understanding|Exhibit|Box\s*\d+)', text, re.IGNORECASE):
            return f"\n> **📖 {text}**\n"
        if text.startswith("•") or text.startswith("- "):
            return f"- {text.lstrip('•- ').strip()}"
        return text

    def build_markdown_document(self, all_page_elements: Dict[int, List[Dict[str, Any]]], title: str) -> str:
        doc_lines = [f"# {title}\n"]

        for page_num in sorted(all_page_elements.keys()):
            doc_lines.append(f"\n<!-- ===== Page {page_num} ===== -->\n")
            elements = all_page_elements[page_num]

            for elem in elements:
                e_type = elem["type"]

                if e_type == "text":
                    doc_lines.append(elem["content"] + "\n")

                elif e_type == "table":
                    doc_lines.append(f"\n**Table (Page {page_num}, #{elem['index']}):**\n")
                    doc_lines.append(elem["content"] + "\n")

                elif e_type == "image":
                    doc_lines.append(f"\n{elem['content']}\n")

                elif e_type == "formula":
                    doc_lines.append(f"\n**Formula (Page {page_num}):**")
                    if elem.get("latex"):
                        doc_lines.append(f"{elem['latex']}\n")
                    else:
                        doc_lines.append(f"```text\n{elem['raw_text']}\n```")

                    img_ref = elem.get("image_rel_path")
                    if img_ref and (self.out_dir / img_ref).exists():
                        doc_lines.append(f"![Formula Visual]({img_ref})\n")

        return "\n".join(doc_lines)

    def run(self, first_page: int = 1, last_page: Optional[int] = None, title: str = "Extracted Document") -> Path:
        print(f"[*] Opening PDF: {self.pdf_path.name}")
        doc_fitz = fitz.open(str(self.pdf_path))
        pdfplumber_doc = pdfplumber.open(str(self.pdf_path)) if HAS_PDFPLUMBER else None

        total_pages = doc_fitz.page_count
        first_page = max(1, first_page)
        last_page = min(last_page or total_pages, total_pages)

        all_page_elements: Dict[int, List[Dict[str, Any]]] = {}

        print(f"[*] Processing Pages {first_page} - {last_page} (DPI: {self.dpi})...")
        for p_num in range(first_page, last_page + 1):
            p_idx = p_num - 1
            elements = self.extract_page_elements(doc_fitz, pdfplumber_doc, p_idx)
            all_page_elements[p_num] = elements

        doc_fitz.close()
        if pdfplumber_doc is not None:
            pdfplumber_doc.close()

        final_markdown = self.build_markdown_document(all_page_elements, title=title)
        out_file = self.out_dir / "output.md"
        out_file.write_text(final_markdown, encoding="utf-8")

        print(f"[+] Extraction complete. Saved to: {out_file}")
        return out_file


# Backward compatibility alias
PDFToMarkdownService = AdvancedPDFToMarkdownService


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert a PDF into structured Markdown with text, tables, figures, and visual formulas."
    )
    parser.add_argument("pdf_path", help="Path to the source PDF")
    parser.add_argument("--out", default="./ocr_output", help="Output directory")
    parser.add_argument("--dpi", type=int, default=250, help="Rasterization DPI")
    parser.add_argument("--first-page", type=int, default=1)
    parser.add_argument("--last-page", type=int, default=None)
    parser.add_argument("--title", default=None, help="Markdown title")
    args = parser.parse_args()

    title = args.title or Path(args.pdf_path).stem.replace("_", " ").title()
    service = AdvancedPDFToMarkdownService(args.pdf_path, args.out, dpi=args.dpi)
    service.run(first_page=args.first_page, last_page=args.last_page, title=title)


if __name__ == "__main__":
    main()
