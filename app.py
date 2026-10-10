"""
SKIPS - Neural Book Software (Gradio Web Interface for Hugging Face Spaces)
100% Free Hosting on Hugging Face Spaces (SDK: Gradio, CPU-basic, 16GB RAM)
Features:
- Smart PDF Chapter Splitting & ZIP Export
- High-Speed OCR & Academic Markdown Generation
- Markdown to Publication-Ready PDF Compilation
"""

import os
import sys
import tempfile
import zipfile
from pathlib import Path

# Add backend directory to path
BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import fitz  # PyMuPDF
import gradio as gr

from services.pdf_service import (
    get_page_count,
    extract_page_text,
    split_pdf_chapters,
    make_safe_chapter_filename,
)
from services.ocr_service import ocr_page, refine_raw_ocr_to_final_markdown
from services.export_service import (
    create_zip_export,
    markdown_to_pdf_bytes,
)
from services.markdown_generator import (
    clean_hyphenation,
    detect_and_format_latex,
)

# ── ZeroGPU Startup Hook ─────────────────────────────────────────────────────
try:
    import spaces

    @spaces.GPU
    def spaces_gpu_worker():
        """Satisfies ZeroGPU startup check on Hugging Face Spaces"""
        return True
except Exception:
    pass


# ── Core Functions for Gradio ────────────────────────────────────────────────

def inspect_pdf_info(pdf_file):
    if not pdf_file:
        return "Silakan pilih atau unggah file PDF terlebih dahulu."
    try:
        pdf_path = pdf_file.name if hasattr(pdf_file, 'name') else str(pdf_file)
        doc = fitz.open(pdf_path)
        page_count = len(doc)
        title = doc.metadata.get("title") or Path(pdf_path).stem
        doc.close()
        return (
            f"✅ **Informasi PDF Berhasil Dimuat**\n"
            f"- **Judul Dokumen**: {title}\n"
            f"- **Total Halaman**: {page_count} halaman\n"
            f"- **Format Rekomendasi Bab**: Contoh:\n"
            f"  `Bab 1 | Pengantar | 1 - 15`\n"
            f"  `Bab 2 | Metodologi | 16 - 35`"
        )
    except Exception as e:
        return f"❌ Gagal membaca PDF: {str(e)}"


def split_chapters_action(pdf_file, chapter_definitions_text):
    if not pdf_file:
        return None, "❌ Silakan unggah file PDF terlebih dahulu."
    if not chapter_definitions_text or not chapter_definitions_text.strip():
        return None, "❌ Masukkan minimal 1 definisi bab."

    try:
        pdf_path = pdf_file.name if hasattr(pdf_file, 'name') else str(pdf_file)
        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        book_title = Path(pdf_path).stem
        doc.close()

        chapters = []
        for line in chapter_definitions_text.strip().splitlines():
            line = line.strip()
            if not line:
                continue
            parts = [p.strip() for p in line.split("|")]
            if len(parts) >= 3:
                heading = parts[0]
                title = parts[1]
                range_part = parts[2]
            elif len(parts) == 2:
                heading = f"Bab {len(chapters) + 1}"
                title = parts[0]
                range_part = parts[1]
            elif len(parts) == 1:
                heading = f"Bab {len(chapters) + 1}"
                title = f"Bab {len(chapters) + 1}"
                range_part = parts[0]
            else:
                continue

            # Parse page numbers (e.g. 1-15 or 1, 15)
            range_clean = range_part.replace("–", "-").replace("—", "-")
            if "-" in range_clean:
                p_start, p_end = range_clean.split("-", 1)
                try:
                    s = max(1, min(total_pages, int(p_start.strip())))
                    e = max(s, min(total_pages, int(p_end.strip())))
                    chapters.append({
                        "heading": heading,
                        "title": title,
                        "start_page": s,
                        "end_page": e
                    })
                except ValueError:
                    continue

        if not chapters:
            return None, "❌ Format pembagian bab tidak valid. Gunakan format: `Bab 1 | Judul | 1-15`"

        temp_dir = tempfile.mkdtemp(prefix="skips_split_")
        pdf_items_for_zip = []

        doc_src = fitz.open(pdf_path)
        for idx, ch in enumerate(chapters, 1):
            ch_doc = fitz.open()
            # PyMuPDF 0-indexed
            ch_doc.insert_pdf(doc_src, from_page=ch["start_page"] - 1, to_page=ch["end_page"] - 1)
            filename = make_safe_chapter_filename(idx, f"{ch['heading']} {ch['title']}", prefix="", ext="pdf")
            out_ch_path = Path(temp_dir) / filename
            ch_doc.save(str(out_ch_path))
            ch_doc.close()
            pdf_items_for_zip.append((str(out_ch_path), filename))
        doc_src.close()

        zip_out_path = Path(temp_dir) / f"{book_title}_chapter_PDF.zip"
        create_zip_export(pdf_items_for_zip, str(zip_out_path))

        status_msg = f"🎉 Berhasil memecah {len(chapters)} bab PDF! Silakan download berkas ZIP di bawah ini."
        return str(zip_out_path), status_msg

    except Exception as e:
        return None, f"❌ Terjadi kesalahan saat memecah PDF: {str(e)}"


def ocr_markdown_action(pdf_file, start_page, end_page, chapter_title):
    if not pdf_file:
        return None, "❌ Silakan unggah file PDF terlebih dahulu.", ""
    try:
        pdf_path = pdf_file.name if hasattr(pdf_file, 'name') else str(pdf_file)
        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        doc.close()

        s = max(1, min(total_pages, int(start_page)))
        e = max(s, min(total_pages, int(end_page)))
        title = chapter_title.strip() if chapter_title else f"Halaman {s}-{e}"

        extracted_pages = []
        for p in range(s, e + 1):
            raw_text = extract_page_text(pdf_path, p)
            if not raw_text.strip():
                # Fallback to OCR if raw text is empty
                raw_text = ocr_page(pdf_path, p)
            clean_page = clean_hyphenation(raw_text)
            clean_page = detect_and_format_latex(clean_page)
            extracted_pages.append(f"<!-- Page {p} -->\n\n{clean_page}")

        combined_text = "\n\n---\n\n".join(extracted_pages)
        refined_md = refine_raw_ocr_to_final_markdown(
            combined_text,
            chapter_idx=1,
            title=title,
            book_name=Path(pdf_path).stem
        )

        temp_dir = tempfile.mkdtemp(prefix="skips_ocr_")
        md_file_path = Path(temp_dir) / f"{make_safe_chapter_filename(1, title, prefix='Module', ext='md')}"
        md_file_path.write_text(refined_md, encoding="utf-8")

        status_msg = f"✨ Ekstraksi Markdown berhasil untuk {e - s + 1} halaman (Halaman {s} s/d {e})."
        return str(md_file_path), status_msg, refined_md

    except Exception as e:
        return None, f"❌ Gagal memproses OCR: {str(e)}", ""


def markdown_to_pdf_action(markdown_text, book_title, chapter_title, add_cover):
    if not markdown_text or not markdown_text.strip():
        return None, "❌ Teks Markdown masih kosong."
    try:
        title = book_title.strip() if book_title else "E-Book Akademik"
        ch_title = chapter_title.strip() if chapter_title else "Bab 1"

        pdf_bytes = markdown_to_pdf_bytes(
            markdown_text=markdown_text,
            book_title=title,
            chapter_title=ch_title,
            generate_cover=bool(add_cover),
        )

        temp_dir = tempfile.mkdtemp(prefix="skips_pub_")
        safe_name = f"{title.replace(' ', '_')}_{ch_title.replace(' ', '_')}.pdf"
        out_pdf_path = Path(temp_dir) / safe_name
        out_pdf_path.write_bytes(pdf_bytes)

        return str(out_pdf_path), f"🎉 E-Book PDF Akademik berhasil dikompilasi! Ukuran: {len(pdf_bytes) / 1024:.1f} KB"

    except Exception as e:
        return None, f"❌ Gagal mengompilasi PDF: {str(e)}"


# ── Gradio Blocks Interface ──────────────────────────────────────────────────

theme = gr.themes.Soft(
    primary_hue="indigo",
    secondary_hue="blue",
    neutral_hue="slate",
)

custom_css = """
.main-header {
    text-align: center;
    padding: 28px 16px 20px;
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
    color: #ffffff !important;
    border-radius: 14px;
    margin-bottom: 24px;
}
.main-header h1 {
    font-size: 2.2rem;
    font-weight: 800;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
    color: #ffffff !important;
}
.main-header p {
    font-size: 1.05rem;
    color: #e0e7ff !important;
    opacity: 0.95;
    max-width: 700px;
    margin: 0 auto;
}
"""

with gr.Blocks(theme=theme, css=custom_css, title="SKIPS · Neural Book Software") as demo:

    gr.HTML("""
    <div class="main-header">
        <h1>📚 SKIPS — Neural Book Software</h1>
        <p>Aplikasi pemecah bab buku PDF, ekstraksi teks OCR akademik berkecepatan tinggi, dan konversi ke Markdown & PDF publikasi.</p>
    </div>
    """)

    with gr.Tabs():

        # ── TAB 1: Split Bab PDF ─────────────────────────────────────────────
        with gr.TabItem("📖 1. Split Bab PDF"):
            gr.Markdown("### Ekstraksi & Pemecahan Bab Buku PDF ke Arsip ZIP")
            with gr.Row():
                with gr.Column(scale=1):
                    pdf_input_tab1 = gr.File(label="Unggah File Buku PDF", file_types=[".pdf"])
                    info_output = gr.Markdown("Unggah PDF untuk melihat rincian halaman.")
                    pdf_input_tab1.change(fn=inspect_pdf_info, inputs=[pdf_input_tab1], outputs=[info_output])

                with gr.Column(scale=1):
                    chapters_input = gr.Textbox(
                        label="Daftar Bab & Rentang Halaman",
                        placeholder="Contoh format per baris:\nBab 1 | Pengantar Sistem | 1 - 15\nBab 2 | Teori & Konsep | 16 - 40\nBab 3 | Implementasi | 41 - 75",
                        lines=7,
                    )
                    btn_split = gr.Button("⚡ Pisahkan Bab & Buat ZIP", variant="primary")
                    status_split = gr.Markdown()
                    zip_download_tab1 = gr.File(label="Unduh Berkas ZIP Bab PDF")

                    btn_split.click(
                        fn=split_chapters_action,
                        inputs=[pdf_input_tab1, chapters_input],
                        outputs=[zip_download_tab1, status_split]
                    )

        # ── TAB 2: OCR & Markdown ───────────────────────────────────────────
        with gr.TabItem("⚡ 2. Ekstraksi OCR ke Markdown"):
            gr.Markdown("### Konversi Lembar Halaman PDF ke Teks Bersih & Formula LaTeX")
            with gr.Row():
                with gr.Column(scale=1):
                    pdf_input_tab2 = gr.File(label="Pilih File PDF", file_types=[".pdf"])
                    with gr.Row():
                        start_page_input = gr.Number(label="Halaman Mulai", value=1, precision=0)
                        end_page_input = gr.Number(label="Halaman Selesai", value=5, precision=0)
                    ch_title_input = gr.Textbox(label="Judul Bab / Modul", placeholder="Misal: Bab 1 Pendahuluan")
                    btn_ocr = gr.Button("🔍 Ekstrak Teks & Format LaTeX", variant="primary")
                    status_ocr = gr.Markdown()
                    md_download_tab2 = gr.File(label="Unduh Berkas .md")

                with gr.Column(scale=1):
                    md_preview_output = gr.Markdown(label="Pratinjau Hasil Markdown")

            btn_ocr.click(
                fn=ocr_markdown_action,
                inputs=[pdf_input_tab2, start_page_input, end_page_input, ch_title_input],
                outputs=[md_download_tab2, status_ocr, md_preview_output]
            )

        # ── TAB 3: Markdown to Academic PDF ─────────────────────────────────
        with gr.TabItem("🎨 3. Kompilasi ke PDF Akademik"):
            gr.Markdown("### Ubah Teks Markdown Menjadi Dokumen PDF Standar Penerbit")
            with gr.Row():
                with gr.Column(scale=1):
                    book_title_pub = gr.Textbox(label="Judul Utama Buku", placeholder="Contoh: Pengantar Jaringan Syaraf Tiruan")
                    chapter_title_pub = gr.Textbox(label="Judul Bab / Modul", placeholder="Contoh: Bab 1 - Arsitektur Dasar")
                    add_cover_pub = gr.Checkbox(label="Sertakan Cover Depan Akademik Modern", value=True)
                    btn_gen_pdf = gr.Button("🚀 Kompilasi PDF Akademik", variant="primary")
                    status_pub = gr.Markdown()
                    pdf_download_tab3 = gr.File(label="Unduh PDF Siap Cetak/Baca")

                with gr.Column(scale=1):
                    md_text_input = gr.Textbox(
                        label="Konten Markdown (atau salin dari Tab 2)",
                        placeholder="# Bab 1 Pendahuluan\n\nIsi materi kuliah atau bab buku di sini...",
                        lines=12,
                    )

            btn_gen_pdf.click(
                fn=markdown_to_pdf_action,
                inputs=[md_text_input, book_title_pub, chapter_title_pub, add_cover_pub],
                outputs=[pdf_download_tab3, status_pub]
            )

        # ── TAB 4: Dokumentasi ──────────────────────────────────────────────
        with gr.TabItem("ℹ️ Informasi & API"):
            gr.Markdown("""
            ### Tentang SKIPS - Neural Book Software
            * **Mesin**: Python 3 + PyMuPDF (fitz) + XHTML2PDF + MathJax SVG.
            * **Penyimpanan**: Zero-persistence (file diproses di temporary directory dan langsung dihapus saat selesai).
            * **Hosting**: Siap dideploy 100% gratis di Hugging Face Spaces (Gradio SDK).
            """)

    gr.Markdown("---")
    gr.HTML("<div style='text-align: center; color: #64748b; font-size: 0.9rem;'>© 2026 Whyzenn07 — SKIPS Neural Book Software</div>")


# ── Launch Entrypoint ────────────────────────────────────────────────────────
if __name__ == "__main__":
    demo.queue().launch(
        server_name="0.0.0.0",
        server_port=int(os.environ.get("PORT", 7860)),
        show_error=True
    )
