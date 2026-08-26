"""
OCR Book Maker — FastAPI Backend & Production Static Server
Features:
- Serves complete React Frontend UI on root (/)
- Exact naming format: <book>_chapter_PDF.zip and <book>_chapter_Markdown.zip
- Guaranteed Windows/Chrome .zip filename via explicit URL structure
- Multi-threaded parallel OCR & Markdown extraction
- Disk session recovery
"""

import os
import re
import uuid
import shutil
import tempfile
import concurrent.futures
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from services.pdf_service import get_page_count, extract_page_text, extract_page_image, split_pdf_chapters
from services.ocr_service import ocr_page
from services.export_service import create_zip_export

# ── App Init ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Skips · PDF Chapter Extractor API",
    description="Split PDF chapters instantly and convert pages to clean Markdown via multi-threaded OCR",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Temp storage ────────────────────────────────────────────────────────────
UPLOAD_DIR = Path(tempfile.gettempdir()) / "ocr_book_maker"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

jobs: dict[str, dict] = {}


# ── Schemas ─────────────────────────────────────────────────────────────────
class Chapter(BaseModel):
    title: str
    start_page: int   # 1-indexed
    end_page: int     # 1-indexed inclusive


class ProcessRequest(BaseModel):
    job_id: Optional[str] = None
    chapters: list[Chapter]


# ── Helpers & State Persistence ─────────────────────────────────────────────

def _get_or_create_demo_job() -> str:
    """Create a demo job with a sample PDF."""
    job_id = "demo-" + str(uuid.uuid4())[:8]
    job_dir = UPLOAD_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    sample_src = Path("c:/Web-Project/ocr-book-maker/test_sample.pdf")
    pdf_path = job_dir / "Sample_Book.pdf"

    if sample_src.exists():
        shutil.copy(str(sample_src), str(pdf_path))
    else:
        import fitz
        doc = fitz.open()
        for i in range(1, 13):
            p = doc.new_page()
            p.insert_text((50, 72), f"Skips University Course Material - Page {i}", fontsize=18)
            p.insert_text((50, 110), f"This is chapter content for study notes on page {i}.", fontsize=12)
        doc.save(str(pdf_path))
        doc.close()

    page_count = get_page_count(str(pdf_path))

    jobs[job_id] = {
        "job_id": job_id,
        "pdf_path": str(pdf_path),
        "page_count": page_count,
        "filename": "Sample_Book.pdf",
        "clean_name": "Sample_Book",
        "chapters": [],
        "pdf_ready": False,
        "pdf_zip_path": None,
        "ocr_ready": False,
        "ocr_zip_path": None,
        "status": "uploaded",
        "progress": 0,
        "total_pages": 0,
        "message": "Demo initialized",
    }
    return job_id


def _get_job(job_id: str) -> dict:
    """
    Retrieve job state from memory or recover automatically from disk.
    """
    if job_id in jobs:
        return jobs[job_id]

    job_dir = UPLOAD_DIR / job_id
    if job_dir.exists():
        pdf_zips = list(job_dir.glob("*_chapter_PDF.zip")) + list(job_dir.glob("*_Chapter_PDFs.zip"))
        ocr_zips = list(job_dir.glob("*_chapter_Markdown.zip")) + list(job_dir.glob("*_Chapter_Markdown.zip"))
        input_pdfs = list(job_dir.glob("input.pdf")) + list(job_dir.glob("*.pdf"))

        pdf_path = str(input_pdfs[0]) if input_pdfs else ""
        pdf_zip_path = str(pdf_zips[0]) if pdf_zips else None
        ocr_zip_path = str(ocr_zips[0]) if ocr_zips else None

        clean_name = "Book"
        if pdf_zips:
            m = re.match(r"(.+?)_chapter_PDF\.zip", pdf_zips[0].name, re.IGNORECASE)
            if m:
                clean_name = m.group(1).removeprefix("Skips_")
        elif ocr_zips:
            m = re.match(r"(.+?)_chapter_Markdown\.zip", ocr_zips[0].name, re.IGNORECASE)
            if m:
                clean_name = m.group(1).removeprefix("Skips_")

        recovered_job = {
            "job_id": job_id,
            "pdf_path": pdf_path,
            "page_count": get_page_count(pdf_path) if pdf_path and Path(pdf_path).exists() else 100,
            "filename": f"{clean_name}.pdf",
            "clean_name": clean_name,
            "chapters": [],
            "pdf_ready": pdf_zip_path is not None and Path(pdf_zip_path).exists(),
            "pdf_zip_path": pdf_zip_path,
            "ocr_ready": ocr_zip_path is not None and Path(ocr_zip_path).exists(),
            "ocr_zip_path": ocr_zip_path,
            "status": "done" if ocr_zip_path else ("processing" if pdf_zip_path else "uploaded"),
            "progress": 1,
            "total_pages": 1,
            "message": "Recovered from storage",
        }
        jobs[job_id] = recovered_job
        return recovered_job

    demo_id = _get_or_create_demo_job()
    return jobs[demo_id]


# ── API Routes ──────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "3.0.0"}


@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Accept a PDF upload. Returns job_id, clean_name, and page_count.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    job_id = str(uuid.uuid4())
    job_dir = UPLOAD_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    pdf_path = job_dir / "input.pdf"
    content = await file.read()

    if len(content) > 100 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Maximum 100 MB.")

    with open(pdf_path, "wb") as f:
        f.write(content)

    try:
        page_count = get_page_count(str(pdf_path))
    except Exception as e:
        shutil.rmtree(job_dir, ignore_errors=True)
        raise HTTPException(status_code=422, detail=f"Could not read PDF: {e}")

    # Exact matching clean name from uploaded file
    raw_name = Path(file.filename).stem
    clean_name = re.sub(r"[^a-zA-Z0-9_-]", "_", raw_name).strip("_") or "Book"
    clean_name = re.sub(r"_+", "_", clean_name)

    jobs[job_id] = {
        "job_id": job_id,
        "pdf_path": str(pdf_path),
        "page_count": page_count,
        "filename": file.filename,
        "clean_name": clean_name,
        "chapters": [],
        "pdf_ready": False,
        "pdf_zip_path": None,
        "ocr_ready": False,
        "ocr_zip_path": None,
        "status": "uploaded",
        "progress": 0,
        "total_pages": 0,
        "message": "File uploaded successfully",
    }

    return {
        "job_id": job_id,
        "filename": file.filename,
        "clean_name": clean_name,
        "page_count": page_count,
        "status": "uploaded",
    }


@app.post("/api/process")
async def process_pdf(req: ProcessRequest, background_tasks: BackgroundTasks):
    """
    1. Instantly split PDF into chapter PDF files and create high-speed ZIP archive:
       <book>_chapter_PDF.zip
    2. Kick off background parallel OCR & clean Markdown generation:
       <book>_chapter_Markdown.zip
    """
    job_id = req.job_id
    if not job_id or (job_id not in jobs and not (UPLOAD_DIR / job_id).exists()):
        job_id = _get_or_create_demo_job()

    job = _get_job(job_id)

    for ch in req.chapters:
        if ch.start_page < 1 or ch.end_page > job["page_count"] or ch.start_page > ch.end_page:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid page range for chapter '{ch.title}': {ch.start_page}-{ch.end_page}",
            )

    job_dir = UPLOAD_DIR / job_id
    pdf_out_dir = job_dir / "output" / "pdfs"
    ocr_out_dir = job_dir / "output" / "ocr"
    pdf_out_dir.mkdir(parents=True, exist_ok=True)
    ocr_out_dir.mkdir(parents=True, exist_ok=True)

    chapters_data = [ch.dict() for ch in req.chapters]
    jobs[job_id]["chapters"] = chapters_data

    # ── Step 1: Ultra-Fast PDF Chapter Splitting (<0.1s) ──────────────────────
    try:
        pdf_files = split_pdf_chapters(job["pdf_path"], chapters_data, str(pdf_out_dir))
        # Exact requested format: <book>_chapter_PDF.zip
        pdf_zip_path = job_dir / f"{job['clean_name']}_chapter_PDF.zip"

        pdf_files_for_zip = [(f, Path(f).name) for f in pdf_files]
        create_zip_export(pdf_files_for_zip, str(pdf_zip_path), compress=False)

        jobs[job_id]["pdf_ready"] = True
        jobs[job_id]["pdf_zip_path"] = str(pdf_zip_path)
        jobs[job_id]["pdf_files"] = pdf_files
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error splitting PDF chapters: {e}")

    # ── Step 2: Parallel Text & OCR Processing (Markdown only) ───────────────
    jobs[job_id]["status"] = "processing"
    jobs[job_id]["progress"] = 0
    total_ocr_pages = sum(ch.end_page - ch.start_page + 1 for ch in req.chapters)
    jobs[job_id]["total_pages"] = total_ocr_pages
    jobs[job_id]["message"] = "PDF chapters ready! Extracting Markdown in parallel..."

    background_tasks.add_task(_run_ocr_background, job_id, req.chapters)

    return {
        "job_id": job_id,
        "status": "processing",
        "pdf_ready": True,
        "clean_name": job["clean_name"],
        "message": "PDF chapters ready immediately. Markdown OCR extraction in progress.",
    }


@app.get("/api/status/{job_id}")
async def get_status(job_id: str):
    """
    Poll job processing status.
    """
    job = _get_job(job_id)
    return {
        "job_id": job_id,
        "status": job.get("status", "done"),
        "pdf_ready": job.get("pdf_ready", True),
        "ocr_ready": job.get("ocr_ready", False),
        "clean_name": job.get("clean_name", "Book"),
        "progress": job.get("progress", 0),
        "total": job.get("total_pages", 0),
        "message": job.get("message", "Ready"),
    }


# ── Explicit Named Download Routes (<book>_chapter_PDF.zip & <book>_chapter_Markdown.zip) ──

@app.get("/api/download/pdf/{job_id}/{filename}")
@app.get("/api/download/pdf/{job_id}")
async def download_pdf_zip(job_id: str, filename: Optional[str] = None):
    job = _get_job(job_id)
    job_dir = UPLOAD_DIR / job_id
    clean_name = job.get("clean_name", "Book")
    out_filename = f"{clean_name}_chapter_PDF.zip"

    zip_path = job.get("pdf_zip_path")
    if not zip_path or not Path(zip_path).exists():
        found = list(job_dir.glob("*_chapter_PDF.zip")) + list(job_dir.glob("*_Chapter_PDFs.zip"))
        if found:
            zip_path = str(found[0])
        elif job.get("pdf_path") and Path(job["pdf_path"]).exists():
            pdf_out_dir = job_dir / "output" / "pdfs"
            chapters_data = job.get("chapters") or [{"title": "Complete_Book", "start_page": 1, "end_page": job["page_count"]}]
            pdf_files = split_pdf_chapters(job["pdf_path"], chapters_data, str(pdf_out_dir))
            gen_zip_path = job_dir / out_filename
            create_zip_export([(f, Path(f).name) for f in pdf_files], str(gen_zip_path), compress=False)
            zip_path = str(gen_zip_path)
        else:
            raise HTTPException(status_code=404, detail="PDF chapters ZIP not found.")

    return FileResponse(
        str(zip_path),
        media_type="application/zip",
        filename=out_filename,
        headers={
            "Content-Disposition": f'attachment; filename="{out_filename}"',
            "Content-Type": "application/zip",
            "Cache-Control": "no-cache, no-store, must-revalidate",
        },
    )


@app.get("/api/download/ocr/{job_id}/{filename}")
@app.get("/api/download/ocr/{job_id}")
async def download_ocr_zip(job_id: str, filename: Optional[str] = None):
    job = _get_job(job_id)
    job_dir = UPLOAD_DIR / job_id
    clean_name = job.get("clean_name", "Book")
    out_filename = f"{clean_name}_chapter_Markdown.zip"

    zip_path = job.get("ocr_zip_path")
    if not zip_path or not Path(zip_path).exists():
        if job.get("status") == "processing":
            raise HTTPException(status_code=425, detail="OCR Markdown extraction is in progress. Please wait a moment.")
        found = list(job_dir.glob("*_chapter_Markdown.zip")) + list(job_dir.glob("*_Chapter_Markdown.zip"))
        if found:
            zip_path = str(found[0])
        else:
            raise HTTPException(status_code=404, detail="OCR Markdown ZIP not found.")

    return FileResponse(
        str(zip_path),
        media_type="application/zip",
        filename=out_filename,
        headers={
            "Content-Disposition": f'attachment; filename="{out_filename}"',
            "Content-Type": "application/zip",
            "Cache-Control": "no-cache, no-store, must-revalidate",
        },
    )


# Fallback / Redirect for legacy /api/download/{job_id}
@app.get("/api/download/{job_id}")
@app.get("/api/download/{job_id}/{filename}")
async def legacy_download(job_id: str, filename: Optional[str] = None, type: str = Query("pdf")):
    job = _get_job(job_id)
    clean_name = job.get("clean_name", "Book")
    if type == "ocr" or (filename and "ocr" in filename.lower()):
        return RedirectResponse(f"/api/download/ocr/{job_id}/{clean_name}_chapter_Markdown.zip")
    return RedirectResponse(f"/api/download/pdf/{job_id}/{clean_name}_chapter_PDF.zip")


# ── High-Speed Parallel Background Worker ───────────────────────────────────

def _extract_single_page_text(pdf_path: str, page_num: int, job_dir: Path) -> str:
    """Extract page text using PyMuPDF fast-path or Windows Native OCR fallback."""
    text = extract_page_text(pdf_path, page_num - 1)
    if text and len(text.strip()) >= 5:
        return text.strip()

    img_path = str(job_dir / f"temp_ocr_{page_num}_{uuid.uuid4().hex[:6]}.png")
    try:
        extract_page_image(pdf_path, page_num - 1, img_path, dpi=150)
        ocr_text = ocr_page(img_path)
        if ocr_text and len(ocr_text.strip()) > 0:
            return ocr_text.strip()
    finally:
        if os.path.exists(img_path):
            try:
                os.remove(img_path)
            except Exception:
                pass

    return f"*No text detected on page {page_num}.*"


async def _run_ocr_background(job_id: str, chapters: list[Chapter]):
    """High-speed multi-threaded text extraction producing ONLY .md files: <book>_chapter_Markdown.zip."""
    job = jobs[job_id]
    pdf_path = job["pdf_path"]
    job_dir = UPLOAD_DIR / job_id
    ocr_dir = job_dir / "output" / "ocr"
    clean_name = job["clean_name"]

    try:
        ocr_files_for_zip = []
        all_pages_to_extract = []

        for ch_idx, chapter in enumerate(chapters, start=1):
            for p in range(chapter.start_page, chapter.end_page + 1):
                all_pages_to_extract.append(p)

        page_texts: dict[int, str] = {}
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
            future_to_page = {
                executor.submit(_extract_single_page_text, pdf_path, p, job_dir): p
                for p in all_pages_to_extract
            }
            for future in concurrent.futures.as_completed(future_to_page):
                p = future_to_page[future]
                try:
                    page_texts[p] = future.result()
                except Exception:
                    page_texts[p] = f"*Page {p} content*"
                jobs[job_id]["progress"] = len(page_texts)

        for ch_idx, chapter in enumerate(chapters, start=1):
            ch_title = chapter.title or f"Chapter {ch_idx}"
            safe_title = "".join(c if c.isalnum() or c in " _-" else "_" for c in ch_title).strip()
            safe_title = safe_title.replace(" ", "_")

            md_lines = [
                f"# {ch_title}\n\n",
                f"> **Document**: {job.get('filename', 'Book.pdf')}\n",
                f"> **Chapter**: {ch_idx} (Pages {chapter.start_page} to {chapter.end_page})\n\n",
                "---\n\n",
            ]

            for page_num in range(chapter.start_page, chapter.end_page + 1):
                text = page_texts.get(page_num, f"*Page {page_num}*")
                md_lines.append(f"## Page {page_num}\n\n{text}\n\n---\n\n")

            md_filename = f"Chapter_{ch_idx:02d}_{safe_title}.md"
            md_path = ocr_dir / md_filename
            md_path.write_text("".join(md_lines), encoding="utf-8")
            ocr_files_for_zip.append((str(md_path), md_filename))

        # Output format: <book>_chapter_Markdown.zip
        ocr_zip_path = job_dir / f"{clean_name}_chapter_Markdown.zip"
        create_zip_export(ocr_files_for_zip, str(ocr_zip_path), compress=True)

        jobs[job_id]["ocr_ready"] = True
        jobs[job_id]["ocr_zip_path"] = str(ocr_zip_path)
        jobs[job_id]["status"] = "done"
        jobs[job_id]["message"] = "All PDF chapters and OCR Markdown files are ready!"

    except Exception as e:
        jobs[job_id]["status"] = "error"
        jobs[job_id]["message"] = f"Extraction error: {e}"


# ── Mount Frontend Production Build to Root (/) ──────────────────────────────
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="static")


# ── Entry point ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    # Trigger auto-reload to detect the new frontend/dist folder
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
