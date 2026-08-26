"""
PDF Service - high-speed PDF page reading, text extraction, and chapter splitting using PyMuPDF.
Provides: get_page_count, extract_page_text, extract_page_image, split_pdf_chapters
"""

import fitz  # PyMuPDF
from pathlib import Path


def get_page_count(pdf_path: str) -> int:
    """Return the total number of pages in the PDF."""
    with fitz.open(pdf_path) as doc:
        return doc.page_count


def extract_page_text(pdf_path: str, page_index: int) -> str:
    """
    Extract embedded digital text from a PDF page with layout preservation.

    Args:
        pdf_path:   path to the PDF
        page_index: 0-based page index

    Returns:
        Extracted text as string.
    """
    with fitz.open(pdf_path) as doc:
        if 0 <= page_index < doc.page_count:
            return doc[page_index].get_text("text").strip()
    return ""


def extract_page_image(pdf_path: str, page_index: int, output_path: str, dpi: int = 150) -> None:
    """
    Render a single PDF page to a JPEG/PNG image file.

    Args:
        pdf_path:    path to the PDF
        page_index:  0-based page index
        output_path: destination image path
        dpi:         render resolution (default 150 for speed & quality)
    """
    with fitz.open(pdf_path) as doc:
        page = doc[page_index]
        zoom = dpi / 72.0
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, colorspace=fitz.csRGB, alpha=False)
        pix.save(output_path)


def split_pdf_chapters(pdf_path: str, chapters: list[dict], output_dir: str) -> list[str]:
    """
    Ultra-fast splitting of a source PDF into individual chapter PDF files.

    Args:
        pdf_path:   path to the source PDF
        chapters:   list of dicts: [{'title': str, 'start_page': int, 'end_page': int}]
        output_dir: destination directory for the split PDF files

    Returns:
        List of generated PDF file paths.
    """
    out_paths = []
    target_dir = Path(output_dir)
    target_dir.mkdir(parents=True, exist_ok=True)

    with fitz.open(pdf_path) as src_doc:
        total_pages = src_doc.page_count
        for idx, ch in enumerate(chapters, start=1):
            title = ch.get("title") or f"Chapter_{idx}"
            safe_title = "".join(c if c.isalnum() or c in " _-" else "_" for c in title).strip()
            safe_title = safe_title.replace(" ", "_")

            start = max(0, int(ch.get("start_page", 1)) - 1)
            end = min(total_pages - 1, int(ch.get("end_page", total_pages)) - 1)
            if start > end:
                start, end = end, start

            chapter_doc = fitz.open()
            chapter_doc.insert_pdf(src_doc, from_page=start, to_page=end)

            filename = f"Chapter_{idx:02d}_{safe_title}.pdf"
            out_file = target_dir / filename
            # Fast save without redundant compression re-encoding
            chapter_doc.save(str(out_file), garbage=1, deflate=False)
            chapter_doc.close()
            out_paths.append(str(out_file))

    return out_paths
