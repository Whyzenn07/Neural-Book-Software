"""
Export Service - high-speed ZIP archive packager and Markdown-to-PDF converter.

Features:
- Professional Academic Book Typography and Page Setup
- Native Styling for .model-box, .illustration-box, Tables, LaTeX Formula Callouts, and ASCII Box Art Diagrams
- Clean Image & Diagram Embedding with link_callback resolution
- Complete ZIP Package generation containing Master Merged PDF + Individual Chapter PDFs + Visual Assets
"""

import io
import re
import zipfile
import subprocess
import tempfile
import base64
import shutil
from pathlib import Path
import markdown
from xhtml2pdf import pisa
import fitz  # PyMuPDF


def create_zip_export(files_with_names: list[tuple[str, str]], zip_output_path: str, compress: bool = True):
    """
    Zip files into a single archive with custom relative paths inside the archive.

    Args:
        files_with_names: list of (absolute_file_path, arcname_in_zip)
        zip_output_path:  destination ZIP path
        compress:         True for DEFLATED (text/md), False for STORED (already compressed PDFs/Images)
    """
    mode = zipfile.ZIP_DEFLATED if compress else zipfile.ZIP_STORED
    Path(zip_output_path).parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_output_path, "w", mode) as zf:
        for file_path, arcname in files_with_names:
            p = Path(file_path)
            if p.exists():
                zf.write(p, arcname=arcname)


def _make_link_callback(base_dir: str | Path | None = None):
    """
    Create a link_callback for xhtml2pdf to resolve local image files.
    """
    def link_callback(uri, rel):
        if not uri:
            return uri
        
        # If absolute path and exists
        p = Path(uri)
        if p.exists():
            return str(p.resolve())

        if base_dir:
            base = Path(base_dir)
            # Direct match in base_dir
            candidate1 = (base / uri).resolve()
            if candidate1.exists():
                return str(candidate1)

            # Match inside images/ folder
            candidate2 = (base / "images" / p.name).resolve()
            if candidate2.exists():
                return str(candidate2)

            # Direct match on filename in base_dir
            candidate3 = (base / p.name).resolve()
            if candidate3.exists():
                return str(candidate3)

            # Recursive search in base_dir for filename as fail-safe
            for match in base.rglob(p.name):
                if match.is_file():
                    return str(match.resolve())

        return uri

    return link_callback


def _extract_balanced_braces(s: str, open_pos: int) -> tuple[str, int]:
    """Given index of '{', returns (content_inside, index_after_closing_brace)."""
    if open_pos >= len(s) or s[open_pos] != '{':
        return ("", -1)
    depth = 0
    start = open_pos + 1
    for i in range(open_pos, len(s)):
        if s[i] == '{':
            depth += 1
        elif s[i] == '}':
            depth -= 1
            if depth == 0:
                return (s[start:i], i + 1)
    return ("", -1)


def _parse_fractions(text: str) -> str:
    """Recursively replaces \\frac{A}{B}, \\tfrac{A}{B}, \\dfrac{A}{B} with formatted (A / B)."""
    while True:
        match = re.search(r'\\(?:frac|tfrac|dfrac)\s*\{', text)
        if not match:
            break
        start_pos = match.start()
        num_start = match.end() - 1
        num_content, num_end = _extract_balanced_braces(text, num_start)
        if num_end == -1:
            break
        den_match = re.match(r'\s*\{', text[num_end:])
        if not den_match:
            break
        den_start = num_end + den_match.end() - 1
        den_content, den_end = _extract_balanced_braces(text, den_start)
        if den_end == -1:
            break

        clean_num = clean_latex_math(num_content).strip()
        clean_den = clean_latex_math(den_content).strip()

        has_compound_num = any(op in clean_num for op in ["+", "-", "×", "·", " "]) and not (clean_num.startswith("(") and clean_num.endswith(")"))
        has_compound_den = any(op in clean_den for op in ["+", "-", "×", "·", " "]) and not (clean_den.startswith("(") and clean_den.endswith(")"))

        num_str = f"({clean_num})" if has_compound_num else clean_num
        den_str = f"({clean_den})" if has_compound_den else clean_den

        frac_repr = f"{num_str} / {den_str}"
        text = text[:start_pos] + frac_repr + text[den_end:]
    return text


def clean_latex_math(text: str) -> str:
    """
    Convert any LaTeX math string (inline or display) into beautiful, readable Unicode text.
    Handles fractions, square roots, subscripts, superscripts, Greek letters, operators, and formatting.
    """
    if not text:
        return ""

    t = text.strip()

    # Remove outer math delimiters if present
    if t.startswith("$$") and t.endswith("$$") and len(t) >= 4:
        t = t[2:-2].strip()
    elif t.startswith("$") and t.endswith("$") and len(t) >= 2:
        t = t[1:-1].strip()
    elif t.startswith(r"\[") and t.endswith(r"\]") and len(t) >= 4:
        t = t[2:-2].strip()
    elif t.startswith(r"\(") and t.endswith(r"\)") and len(t) >= 4:
        t = t[2:-2].strip()

    # 1. Clean equation tags: \tag{5}, \tag5, \label{eq1}
    tag_match = re.search(r'\\tag\s*(?:\{([^}]+)\}|([0-9A-Za-z\.]+))', t)
    tag_str = ""
    if tag_match:
        tag_val = tag_match.group(1) or tag_match.group(2)
        tag_str = f"  (Eq. {tag_val})"
        t = re.sub(r'\\tag\s*(?:\{[^}]+\}|[0-9A-Za-z\.]+)', '', t)
    t = re.sub(r'\\label\{[^}]+\}', '', t)

    # 2. Parse and replace all \frac{...}{...} fractions
    t = _parse_fractions(t)

    # 3. Parse square roots: \sqrt{...} or \sqrt[n]{...}
    while True:
        sqrt_match = re.search(r'\\sqrt\s*(?:\[([^\]]+)\])?\s*\{', t)
        if not sqrt_match:
            break
        s_pos = sqrt_match.start()
        deg = sqrt_match.group(1)
        root_start = sqrt_match.end() - 1
        root_content, root_end = _extract_balanced_braces(t, root_start)
        if root_end == -1:
            break
        clean_root = clean_latex_math(root_content).strip()
        deg_prefix = f"{deg}√" if deg else "√"
        t = t[:s_pos] + f"{deg_prefix}({clean_root})" + t[root_end:]

    # 4. Remove text environment wrappers \text{...}, \mathrm{...}, etc.
    for env in ["text", "mathrm", "mathbf", "mathit", "operatorname", "textbf", "textit", "mbox"]:
        while True:
            env_match = re.search(rf'\\{env}\s*\{{', t)
            if not env_match:
                break
            e_start = env_match.start()
            c_start = env_match.end() - 1
            content, c_end = _extract_balanced_braces(t, c_start)
            if c_end == -1:
                break
            t = t[:e_start] + content + t[c_end:]

    # 5. Clean LaTeX sizing & delimiters
    delimiters = [
        (r'\\left\(', '('), (r'\\right\)', ')'),
        (r'\\left\[', '['), (r'\\right\]', ']'),
        (r'\\left\\\{', '{'), (r'\\right\\\}', '}'),
        (r'\\left\|', '|'), (r'\\right\|', '|'),
        (r'\\left\.', ''), (r'\\right\.', ''),
        (r'\\left\b', ''), (r'\\right\b', ''),
        (r'\\big[lrg]?[()\[\]|]', ''),
        (r'\\Big[lrg]?[()\[\]|]', ''),
    ]
    for pat, rep in delimiters:
        t = re.sub(pat, rep, t)

    # 6. Operators, symbols, and Greek letters
    replacements = [
        (r'\\times\b', ' × '),
        (r'\\cdot\b', ' · '),
        (r'\\pm\b', ' ± '),
        (r'\\mp\b', ' ∓ '),
        (r'\\approx\b', ' ≈ '),
        (r'\\neq\b|\\ne\b', ' ≠ '),
        (r'\\leq\b|\\le\b', ' ≤ '),
        (r'\\geq\b|\\ge\b', ' ≥ '),
        (r'\\ll\b', ' ≪ '),
        (r'\\gg\b', ' ≫ '),
        (r'\\infty\b', ' ∞ '),
        (r'\\propto\b', ' ∝ '),
        (r'\\sum\b', ' Σ '),
        (r'\\prod\b', ' Π '),
        (r'\\int\b', ' ∫ '),
        (r'\\partial\b', ' ∂ '),
        (r'\\nabla\b', ' ∇ '),
        (r'\\Delta\b', ' Δ '),
        (r'\\delta\b', ' δ '),
        (r'\\sigma\b', ' σ '),
        (r'\\Sigma\b', ' Σ '),
        (r'\\mu\b', ' μ '),
        (r'\\alpha\b', ' α '),
        (r'\\beta\b', ' β '),
        (r'\\gamma\b', ' γ '),
        (r'\\Gamma\b', ' Γ '),
        (r'\\theta\b', ' θ '),
        (r'\\lambda\b', ' λ '),
        (r'\\Lambda\b', ' Λ '),
        (r'\\pi\b', ' π '),
        (r'\\rho\b', ' ρ '),
        (r'\\tau\b', ' τ '),
        (r'\\phi\b', ' φ '),
        (r'\\Phi\b', ' Φ '),
        (r'\\omega\b', ' ω '),
        (r'\\Omega\b', ' Ω '),
        (r'\\in\b', ' ∈ '),
        (r'\\notin\b', ' ∉ '),
        (r'\\%', '%'),
        (r'\\\$', '$'),
        (r'\\\&', '&'),
        (r'\\\_', '_'),
        (r'\\quad\b|\\qquad\b|\\,|\\;|\\!|~', ' '),
    ]
    for pat, rep in replacements:
        t = re.sub(pat, rep, t)

    # 7. Subscripts & Superscripts
    t = re.sub(r'\_\{([^}]+)\}', r'_\1', t)

    sup_map = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
        '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
        'n': 'ⁿ', 'i': 'ⁱ'
    }
    def _sup_replace(m):
        content = m.group(1) or m.group(2)
        if all(c in sup_map for c in content):
            return "".join(sup_map[c] for c in content)
        return f"^{content}"

    t = re.sub(r'\^\{([^}]+)\}|\^([0-9n])', _sup_replace, t)

    # 8. Clean leftover braces and redundant spaces
    t = t.replace('{', '').replace('}', '')
    t = re.sub(r'\s{2,}', ' ', t)
    t = re.sub(r'\s*=\s*', ' = ', t)
    t = re.sub(r'\s*\+\s*', ' + ', t)
    t = re.sub(r'\s*-\s*', ' - ', t)
    t = re.sub(r'\s*×\s*', ' × ', t)
    t = re.sub(r'\s*\/\s*', ' / ', t)

    return t.strip() + tag_str


def _make_link_callback(base_dir: Path | str | None = None):
    """
    Helper callback for xhtml2pdf to resolve relative image paths (e.g. images/cover_logo.png)
    to valid absolute disk paths across temp directories.
    """
    def link_callback(uri, rel):
        if not uri:
            return None
        p = Path(uri)
        if p.exists():
            return str(p.resolve())

        # Check in base_dir
        if base_dir:
            b_path = Path(base_dir)
            for cand in [
                b_path / uri,
                b_path / "images" / p.name,
                b_path / p.name,
                b_path.parent / uri,
                b_path.parent / "images" / p.name,
            ]:
                if cand.exists():
                    return str(cand.resolve())

        # Check globally in UPLOAD_DIR
        try:
            import tempfile
            upload_root = Path(tempfile.gettempdir()) / "ocr_book_maker"
            fname = p.name
            matches = list(upload_root.glob(f"**/{fname}"))
            if matches:
                return str(matches[0].resolve())
        except Exception:
            pass

        return None
    return link_callback


def _find_edge_executable() -> str | None:
    """Detect Microsoft Edge or Chromium binary for headless PDF generation."""
    candidates = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ]
    for c in candidates:
        if Path(c).exists():
            return c
    found = shutil.which("msedge") or shutil.which("chrome")
    if found:
        return found
    return None


def _render_via_edge_headless(html_content: str) -> bytes | None:
    """
    Render HTML to PDF using Edge Headless with MathJax SVG vector math support.
    """
    edge_bin = _find_edge_executable()
    if not edge_bin:
        return None

    temp_dir = Path(tempfile.mkdtemp(prefix="academic_edge_pdf_"))
    html_path = temp_dir / "render_document.html"
    pdf_path = temp_dir / "render_document.pdf"

    try:
        html_path.write_text(html_content, encoding="utf-8")
        cmd = [
            edge_bin,
            "--headless=new",
            "--disable-gpu",
            "--allow-file-access-from-files",
            "--no-pdf-header-footer",
            "--run-all-compositor-stages-before-draw",
            f"--print-to-pdf={pdf_path.resolve()}",
            str(html_path.resolve()),
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=35)
        if pdf_path.exists() and pdf_path.stat().st_size > 500:
            return pdf_path.read_bytes()
        else:
            print(f"[export_service] Edge headless exit code {res.returncode}, stderr: {res.stderr[:300]}")
    except Exception as e:
        print(f"[export_service] Edge headless rendering error: {e}")
    finally:
        try:
            if html_path.exists():
                html_path.unlink()
            if pdf_path.exists():
                pdf_path.unlink()
            temp_dir.rmdir()
        except Exception:
            pass

    return None


def _normalize_markdown_tables(md_text: str) -> str:
    """
    Ensure all tables have valid GFM separators so markdown.markdown() parses them into real <table> elements.
    Fixes cases where separators lack outer pipes (e.g. ':--- :--- :---:' -> '| :--- | :--- | :---: |').
    """
    lines = md_text.splitlines()
    out = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        # Detect table separator line like ':--- :--- :---' or '--- --- ---' that lack outer pipes
        if re.match(r'^:?-+:?(?:\s+:?-+:?)+$', stripped):
            if i > 0 and '|' in lines[i - 1]:
                parts = stripped.split()
                out.append('| ' + ' | '.join(parts) + ' |')
                continue
        out.append(line)
    return "\n".join(out)


def _resolve_and_embed_images(html_str: str, base_dir: Path | str | None = None) -> str:
    """
    Convert image paths to base64 data URIs so that Edge Headless and xhtml2pdf
    can load them without local filesystem security blocks.
    Recursively resolves image basenames across base_dir subfolders, temp folders, and Downloads.
    """
    def _img_replacer(match):
        prefix = match.group(1)
        src = match.group(2)
        suffix = match.group(3)
        if src.startswith("data:"):
            return match.group(0)

        found_path = None
        cand = Path(src)
        if cand.exists() and cand.is_file():
            found_path = cand
        elif base_dir:
            b = Path(base_dir)
            for c in [b / src, b / "images" / cand.name, b / cand.name, b.parent / src, b.parent / "images" / cand.name]:
                if c.exists() and c.is_file():
                    found_path = c
                    break
            if not found_path:
                for search_root in [b, b / "images", b.parent, b.parent / "images"]:
                    if search_root.exists():
                        sub_matches = [p for p in search_root.rglob(cand.name) if p.is_file()]
                        if sub_matches:
                            found_path = sub_matches[0]
                            break

        if not found_path:
            # Search globally in temp or upload folders
            try:
                upload_root = Path(tempfile.gettempdir()) / "ocr_book_maker"
                if upload_root.exists():
                    matches = [p for p in upload_root.rglob(cand.name) if p.is_file()]
                    if matches:
                        matches.sort(key=lambda p: p.stat().st_mtime, reverse=True)
                        found_path = matches[0]
            except Exception:
                pass

        if not found_path:
            # Search in user's Downloads folder as fallback
            try:
                downloads_dir = Path.home() / "Downloads"
                if downloads_dir.exists():
                    matches = [p for p in downloads_dir.rglob(cand.name) if p.is_file()]
                    if matches:
                        matches.sort(key=lambda p: p.stat().st_mtime, reverse=True)
                        found_path = matches[0]
            except Exception:
                pass

        if not found_path:
            # Case-insensitive search fallback
            target_lower = cand.name.lower()
            try:
                upload_root = Path(tempfile.gettempdir()) / "ocr_book_maker"
                downloads_dir = Path.home() / "Downloads"
                for root in [upload_root, downloads_dir]:
                    if root.exists():
                        for p in root.rglob("*"):
                            if p.is_file() and p.name.lower() == target_lower:
                                found_path = p
                                break
                        if found_path:
                            break
            except Exception:
                pass

        if found_path and found_path.exists():
            try:
                ext = found_path.suffix.lower().lstrip(".")
                mime = "image/png" if ext == "png" else ("image/jpeg" if ext in ["jpg", "jpeg"] else f"image/{ext}")
                b64 = base64.b64encode(found_path.read_bytes()).decode("ascii")
                return f'{prefix}src="data:{mime};base64,{b64}"{suffix}'
            except Exception:
                pass
        return match.group(0)

    return re.sub(r'(<img\s+[^>]*?)src=["\']([^"\']+)["\']([^>]*>)', _img_replacer, html_str, flags=re.IGNORECASE)


def _format_exhibit_placeholders(html_str: str, base_dir: Path | str | None = None) -> str:
    """
    Format exhibit placeholders.
    If the source image exists in base_dir or images/, embed the actual image!
    Otherwise, render a neat exhibit information card.
    """
    def _rep(m):
        raw_text = m.group(1)
        # Check if an image filename is mentioned (e.g. 'img_001.png' or "img_001.jpg")
        fn_match = re.search(r"['\"]([^'\"]+\.(?:png|jpg|jpeg|webp|svg))['\"]", raw_text, re.IGNORECASE)
        found_img_path = None
        if fn_match:
            fn = fn_match.group(1)
            cand_p = Path(fn)
            if cand_p.exists() and cand_p.is_file():
                found_img_path = cand_p
            elif base_dir:
                b = Path(base_dir)
                for c in [
                    b / fn,
                    b / "images" / cand_p.name,
                    b / cand_p.name,
                    b.parent / fn,
                    b.parent / "images" / cand_p.name,
                ]:
                    if c.exists() and c.is_file():
                        found_img_path = c
                        break
            if not found_img_path:
                try:
                    import tempfile
                    upload_root = Path(tempfile.gettempdir()) / "ocr_book_maker"
                    matches = [p for p in upload_root.glob(f"**/{cand_p.name}") if p.is_file()]
                    if matches:
                        found_img_path = matches[0]
                except Exception:
                    pass

        if found_img_path and found_img_path.exists():
            try:
                ext = found_img_path.suffix.lower().lstrip(".")
                mime = "image/png" if ext == "png" else ("image/jpeg" if ext in ["jpg", "jpeg"] else f"image/{ext}")
                b64 = base64.b64encode(found_img_path.read_bytes()).decode("ascii")
                title_part = raw_text.split("—")[0].strip() if "—" in raw_text else (raw_text.split("-")[0].strip() if "-" in raw_text else "Exhibit Figure")
                return (
                    f'<div class="exhibit-box">'
                    f'<div class="exhibit-title"><b>{title_part}</b></div>'
                    f'<div class="exhibit-image-wrap"><img src="data:{mime};base64,{b64}" alt="{title_part}" /></div>'
                    f'<div class="exhibit-caption">{raw_text}</div>'
                    f'</div>'
                )
            except Exception:
                pass

        return (
            f'<div class="exhibit-placeholder-box">'
            f'<div class="exhibit-placeholder-title"><b>Exhibit Information</b></div>'
            f'<div class="exhibit-placeholder-body">{raw_text}</div>'
            f'</div>'
        )
    return re.sub(r'\[(Exhibit\s+\d+[\.\d]*\s*[\—\-][^\]]+)\]', _rep, html_str)


def _transform_mermaid_blocks(text: str) -> str:
    """
    Convert markdown ```mermaid ... ``` code blocks to <div class="mermaid">...</div>
    so Mermaid.js renders them into crisp SVG vector diagrams.
    """
    pattern = r'```(?:mermaid)\s*\n(.*?)\n```'
    def _rep(m):
        code = m.group(1).strip()
        return f'\n\n<div class="mermaid">\n{code}\n</div>\n\n'
    return re.sub(pattern, _rep, text, flags=re.DOTALL | re.IGNORECASE)


def generate_academic_cover_pdf(
    book_title: str,
    subtitle: str = "Course Reader & Academic Companion",
    publisher: str = "SKIPS University Academic Press",
    year: str = "2026",
) -> bytes:
    """Generate an executive academic typographic cover page PDF."""
    clean_title = (book_title or "ACADEMIC TEXTBOOK").replace("_", " ").title()
    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
@page {{
    size: A4 portrait;
    margin: 0;
}}
body {{
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Georgia, serif;
    background: #ffffff;
    color: #0f172a;
    -webkit-print-color-adjust: exact;
}}
.cover-container {{
    width: 210mm;
    height: 297mm;
    box-sizing: border-box;
    padding: 24mm 22mm 26mm 22mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border: 12px solid #0f172a;
    position: relative;
}}
.cover-inner-border {{
    position: absolute;
    top: 6mm;
    left: 6mm;
    right: 6mm;
    bottom: 6mm;
    border: 1.5px solid #0284c7;
    pointer-events: none;
}}
.top-section {{
    margin-top: 14mm;
}}
.series-tag {{
    font-size: 10pt;
    font-weight: 700;
    letter-spacing: 3.5px;
    text-transform: uppercase;
    color: #0284c7;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}}
.main-title {{
    font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
    font-size: 32pt;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.2;
    margin: 18mm 0 10mm 0;
}}
.accent-bar {{
    width: 75mm;
    height: 4.5px;
    background: #0284c7;
    margin: 10mm 0 12mm 0;
    border-radius: 2px;
}}
.subtitle {{
    font-size: 13.5pt;
    font-weight: 400;
    color: #475569;
    line-height: 1.45;
    max-width: 90%;
    font-style: italic;
}}
.bottom-section {{
    margin-bottom: 12mm;
    padding-top: 12mm;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
}}
.publisher-name {{
    font-size: 12pt;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: 0.5px;
}}
.edition-label {{
    font-size: 9.5pt;
    color: #64748b;
    margin-top: 4px;
}}
.seal-mark {{
    font-size: 10pt;
    font-weight: 800;
    color: #0284c7;
    border: 2px solid #0284c7;
    padding: 6px 12px;
    border-radius: 4px;
    letter-spacing: 1px;
}}
</style>
</head>
<body>
<div class="cover-container">
  <div class="cover-inner-border"></div>
  <div class="top-section">
    <div class="series-tag">Academic Courseware • Higher Education</div>
    <div class="main-title">{clean_title}</div>
    <div class="accent-bar"></div>
    <div class="subtitle">{subtitle}</div>
  </div>
  <div class="bottom-section">
    <div>
      <div class="publisher-name">{publisher}</div>
      <div class="edition-label">Academic Reference Edition • {year}</div>
    </div>
    <div class="seal-mark">SKIPS CERTIFIED</div>
  </div>
</div>
</body>
</html>"""
    edge_pdf = _render_via_edge_headless(html)
    if edge_pdf:
        return edge_pdf

    doc = fitz.open()
    A4_W, A4_H = 595.28, 841.89
    p = doc.new_page(width=A4_W, height=A4_H)
    p.draw_rect(fitz.Rect(20, 20, A4_W - 20, A4_H - 20), color=(0.06, 0.09, 0.16), width=3)
    p.insert_text((50, 150), "ACADEMIC TEXTBOOK SERIES", fontsize=11, fontname="helv", color=(0.01, 0.52, 0.78))
    p.insert_text((50, 220), clean_title[:45], fontsize=26, fontname="times-bold", color=(0.06, 0.09, 0.16))
    p.insert_text((50, 280), subtitle[:65], fontsize=13, fontname="times-italic", color=(0.3, 0.35, 0.4))
    p.insert_text((50, 750), f"{publisher} • {year}", fontsize=10, fontname="helv", color=(0.4, 0.4, 0.4))
    out = io.BytesIO()
    doc.save(out, garbage=1, deflate=True)
    doc.close()
    return out.getvalue()


def _transform_latex_figures_and_environments(text: str) -> str:
    """
    Transform LaTeX figure and image environments to clean HTML/Markdown images,
    and convert/neutralize \\begin{center}...\\end{center} so MathJax does not fail
    with "Unknown environment 'center'".
    """
    if not text:
        return ""

    def _parse_width(opt_str: str) -> str:
        """Extract width percentage from options like width=0.85\\textwidth."""
        if not opt_str:
            return "88%"
        m = re.search(r'width\s*=\s*([0-9\.]+)\s*(?:\\textwidth|\\linewidth)?', opt_str)
        if m:
            val = float(m.group(1))
            if val <= 1.0:
                pct = max(82, int(val * 100))
                return f"{pct}%"
            return f"{min(int(val), 100)}%"
        m_pct = re.search(r'width\s*=\s*([0-9]+)\s*%', opt_str)
        if m_pct:
            pct = int(m_pct.group(1))
            return f"{max(82, pct)}%"
        return "88%"

    # 1. Transform \begin{figure} ... \caption{...} ... \end{figure}
    def _fig_replacer(match):
        body = match.group(1)
        img_m = re.search(r'\\includegraphics(?:\[(.*?)\])?\{([^}]+)\}', body)
        cap_m = re.search(r'\\caption\{([^}]+)\}', body)
        if not img_m:
            return ""
        opts = img_m.group(1) or ""
        img_path = img_m.group(2).strip()
        width = _parse_width(opts)
        caption = cap_m.group(1).strip() if cap_m else Path(img_path).stem.replace("_", " ").title()
        return (
            f'\n\n<div class="exhibit-box" style="text-align: center; margin: 16px auto;">'
            f'<div class="exhibit-image-wrap"><img src="{img_path}" alt="{caption}" style="max-width: {width}; max-height: 320px; object-fit: contain; border-radius: 4px;" /></div>'
            f'<div class="exhibit-caption" style="font-size: 8.5pt; color: #64748b; font-style: italic; text-align: center; margin-top: 6px;">{caption}</div>'
            f'</div>\n\n'
        )

    text = re.sub(r'\\begin\{figure\}(?:\[.*?\])?(.*?)\\end\{figure\}', _fig_replacer, text, flags=re.DOTALL | re.IGNORECASE)

    # 2. Transform \begin{center}\s*\\includegraphics... \end{center}
    def _center_img_replacer(match):
        opts = match.group(1) or ""
        img_path = match.group(2).strip()
        width = _parse_width(opts)
        clean_name = Path(img_path).stem.replace("_", " ").replace("-", " ").title()
        return (
            f'\n\n<div class="exhibit-image-wrap" style="text-align: center; margin: 16px auto;">'
            f'<img src="{img_path}" alt="{clean_name}" style="max-width: {width}; max-height: 320px; object-fit: contain; border-radius: 4px; display: inline-block;" />'
            f'</div>\n\n'
        )

    text = re.sub(
        r'\\begin\{center\}\s*\\includegraphics(?:\[(.*?)\])?\{([^}]+)\}\s*\\end\{center\}',
        _center_img_replacer,
        text,
        flags=re.IGNORECASE
    )

    # 3. Transform standalone \includegraphics[...]{...}
    def _standalone_img_replacer(match):
        opts = match.group(1) or ""
        img_path = match.group(2).strip()
        width = _parse_width(opts)
        clean_name = Path(img_path).stem.replace("_", " ").replace("-", " ").title()
        return (
            f'\n\n<div class="exhibit-image-wrap" style="text-align: center; margin: 14px auto;">'
            f'<img src="{img_path}" alt="{clean_name}" style="max-width: {width}; max-height: 320px; object-fit: contain; border-radius: 4px; display: inline-block;" />'
            f'</div>\n\n'
        )

    text = re.sub(
        r'\\includegraphics(?:\[(.*?)\])?\{([^}]+)\}',
        _standalone_img_replacer,
        text,
        flags=re.IGNORECASE
    )

    # 4. Neutralize any remaining \begin{center} and \end{center}
    text = re.sub(r'\\begin\{center\}', r'<div style="text-align: center;">', text, flags=re.IGNORECASE)
    text = re.sub(r'\\end\{center\}', r'</div>', text, flags=re.IGNORECASE)

    # 5. Neutralize other LaTeX environments that break MathJax
    text = re.sub(r'\\begin\{flushleft\}', r'<div style="text-align: left;">', text, flags=re.IGNORECASE)
    text = re.sub(r'\\end\{flushleft\}', r'</div>', text, flags=re.IGNORECASE)
    text = re.sub(r'\\begin\{flushright\}', r'<div style="text-align: right;">', text, flags=re.IGNORECASE)
    text = re.sub(r'\\end\{flushright\}', r'</div>', text, flags=re.IGNORECASE)
    text = re.sub(r'\\begin\{minipage\}(?:\[.*?\])?\{.*?\}', r'<div>', text, flags=re.IGNORECASE)
    text = re.sub(r'\\end\{minipage\}', r'</div>', text, flags=re.IGNORECASE)

    # 6. Remove any leftover \centering
    text = re.sub(r'\\centering\b', '', text, flags=re.IGNORECASE)

    return text


def markdown_to_pdf_bytes(
    md_content: str,
    title: str = "Chapter",
    page_images: list[str] | None = None,
    base_dir: str | Path | None = None,
) -> bytes:
    """
    Convert Markdown string into an Academic Publication-grade PDF.
    Uses Microsoft Edge Headless with MathJax 3 (SVG vector math) as the primary engine.
    Gracefully falls back to xhtml2pdf (pisa) if headless browser is unavailable.

    Args:
        md_content:   Markdown-formatted string
        title:        Chapter/book title used as heading
        page_images:  Optional list of absolute paths to JPEG/PNG page renders
        base_dir:     Directory containing image assets for relative link resolution

    Returns:
        PDF bytes (in-memory).
    """
    # 1. Transform mermaid code blocks to <div class="mermaid">
    md_with_mermaid = _transform_mermaid_blocks(md_content)

    # 1b. Transform LaTeX figure environments, \includegraphics, and \begin{center}
    md_with_figures = _transform_latex_figures_and_environments(md_with_mermaid)

    # 2. Normalize table separators so markdown.markdown() parses tables properly
    md_normalized = _normalize_markdown_tables(md_with_figures)

    # 3. Parse Markdown to HTML (without nl2br to prevent breaking Markdown tables)
    html_body = markdown.markdown(
        md_normalized,
        extensions=["extra", "tables", "fenced_code"]
    )

    # Also catch language-mermaid pre blocks
    html_body = re.sub(r'<pre><code class="language-mermaid">(.*?)</code></pre>', r'<div class="mermaid">\1</div>', html_body, flags=re.DOTALL)
    html_body = re.sub(r'<pre><code class="mermaid">(.*?)</code></pre>', r'<div class="mermaid">\1</div>', html_body, flags=re.DOTALL)

    # 4. Resolve images to base64 data URIs & format exhibit figures/placeholders
    html_body = _resolve_and_embed_images(html_body, base_dir=base_dir)
    html_body = _format_exhibit_placeholders(html_body, base_dir=base_dir)

    # 5. Resolve MathJax and Mermaid script URIs
    mathjax_local = Path(__file__).resolve().parent.parent / "assets" / "tex-mml-chtml.js"
    mathjax_src = mathjax_local.as_uri() if mathjax_local.exists() else "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"

    mermaid_local = Path(__file__).resolve().parent.parent / "assets" / "mermaid.min.js"
    mermaid_src = mermaid_local.as_uri() if mermaid_local.exists() else "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"

    # 6. Academic Book Typography CSS (Booktabs table layout, Serif fonts, dynamic margins, Mermaid styling)
    academic_css = """
    @page {
        size: A4 portrait;
        margin: 18mm 18mm 20mm 18mm;
    }
    * {
        box-sizing: border-box;
    }
    body {
        font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
        font-size: 9.5pt;
        line-height: 1.55;
        color: #1e293b;
        background-color: #ffffff;
        orphans: 3;
        widows: 3;
    }
    h1 {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-size: 19pt;
        color: #0f172a;
        margin-top: 20px;
        margin-bottom: 10px;
        padding-bottom: 5px;
        border-bottom: 2px solid #0f172a;
        font-weight: bold;
        page-break-after: avoid !important;
        break-after: avoid !important;
    }
    h2 {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-size: 13pt;
        color: #1e293b;
        margin-top: 16px;
        margin-bottom: 7px;
        border-bottom: 1px solid #cbd5e1;
        padding-bottom: 4px;
        font-weight: bold;
        page-break-after: avoid !important;
        break-after: avoid !important;
    }
    h3 {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-size: 11pt;
        color: #334155;
        margin-top: 14px;
        margin-bottom: 6px;
        font-weight: bold;
        page-break-after: avoid !important;
        break-after: avoid !important;
    }
    h4, h5, h6 {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-size: 10pt;
        color: #475569;
        margin-top: 12px;
        margin-bottom: 4px;
        font-weight: bold;
        page-break-after: avoid !important;
        break-after: avoid !important;
    }
    /* Prevent headers from separating from subsequent paragraphs or lists */
    h1 + *, h2 + *, h3 + *, h4 + *, h5 + *, h6 + * {
        page-break-before: avoid !important;
        break-before: avoid !important;
    }
    p:has(+ ol), p:has(+ ul) {
        page-break-after: avoid !important;
        break-after: avoid !important;
    }
    p {
        margin-bottom: 6px;
        text-align: justify;
    }
    /* Academic Booktabs Tables */
    table {
        width: 100%;
        border-collapse: collapse;
        margin: 14px 0 18px 0;
        font-size: 8.5pt;
        line-height: 1.4;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
    }
    th {
        border-top: 2px solid #0f172a;
        border-bottom: 1.5px solid #0f172a;
        padding: 7px 10px;
        font-weight: bold;
        text-align: left;
        background-color: #f8fafc;
        color: #0f172a;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    td {
        border-bottom: 1px solid #e2e8f0;
        padding: 6px 10px;
        vertical-align: top;
    }
    tr:nth-child(even) td {
        background-color: #fafbfd;
    }
    tr:last-child td {
        border-bottom: 2px solid #0f172a;
    }
    /* Academic Blockquotes & Callouts */
    blockquote {
        border-left: 3.5px solid #0284c7;
        background-color: #f8fafc;
        padding: 8px 14px;
        margin: 12px 0;
        font-style: normal;
        color: #0f172a;
        border-radius: 0 4px 4px 0;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
    }
    /* Formula boxes & Math styles */
    .formula-box {
        background-color: #f8fafc;
        border: 1px solid #cbd5e1;
        border-left: 4px solid #0284c7;
        padding: 8px 12px;
        margin: 12px 0;
        border-radius: 4px;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
    }
    .formula-title {
        font-weight: bold;
        color: #0369a1;
        margin-bottom: 4px;
        font-size: 8.5pt;
    }
    /* Exhibits, Figures & Graphic Charts */
    .exhibit-box {
        background-color: #f8fafc;
        border: 1px solid #cbd5e1;
        border-left: 4px solid #0284c7;
        padding: 10px 14px;
        margin: 12px 0;
        border-radius: 4px;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
    }
    .exhibit-title {
        font-weight: bold;
        color: #0369a1;
        font-size: 9pt;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        margin-bottom: 6px;
    }
    .exhibit-image-wrap {
        text-align: center;
        margin: 8px 0;
    }
    .exhibit-image-wrap img {
        max-width: 90%;
        max-height: 360px;
        object-fit: contain;
        border-radius: 4px;
    }
    .exhibit-caption {
        font-size: 8pt;
        color: #64748b;
        font-style: italic;
        text-align: center;
        margin-top: 4px;
    }
    .exhibit-placeholder-box {
        background-color: #f8fafc;
        border: 1px dashed #94a3b8;
        border-left: 3.5px solid #0284c7;
        padding: 6px 12px;
        margin: 10px 0;
        border-radius: 4px;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
    }
    .exhibit-placeholder-title {
        font-weight: bold;
        color: #0369a1;
        font-size: 8.5pt;
        margin-bottom: 2px;
    }
    .exhibit-placeholder-body {
        color: #475569;
        font-size: 8pt;
        font-style: italic;
    }
    .mermaid {
        text-align: center;
        margin: 14px auto;
        padding: 10px;
        background-color: #fcfdfd;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
    }
    .mermaid svg {
        max-width: 100% !important;
        height: auto !important;
    }
    img {
        max-width: 90%;
        max-height: 380px;
        object-fit: contain;
        display: block;
        margin: 12px auto;
        border-radius: 4px;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
    }
    code {
        font-family: Consolas, 'Courier New', monospace;
        font-size: 8pt;
        background-color: #f1f5f9;
        padding: 2px 4px;
        border-radius: 3px;
    }
    pre {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 6px 10px;
        border-radius: 4px;
        font-family: Consolas, 'Courier New', monospace;
        font-size: 8pt;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
    }
    ul, ol {
        margin: 6px 0 10px 20px;
        padding: 0;
    }
    li {
        margin-bottom: 3px;
        page-break-inside: avoid;
        break-inside: avoid;
    }
    """

    full_html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>{title}</title>
<style>{academic_css}</style>
<script>
window.MathJax = {{
  tex: {{
    inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
    displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
    processEscapes: true
  }},
  svg: {{ fontCache: 'global' }}
}};
</script>
<script src="{mathjax_src}"></script>
<script src="{mermaid_src}"></script>
<script>
document.addEventListener("DOMContentLoaded", function() {{
  if (window.mermaid) {{
    try {{
      mermaid.initialize({{
        startOnLoad: true,
        theme: 'neutral',
        securityLevel: 'loose',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }});
    }} catch(e) {{
      console.error("Mermaid init error:", e);
    }}
  }}
}});
</script>
</head>
<body>
{html_body}
</body>
</html>
"""

    # 7. Primary Render Attempt: Edge Headless with MathJax vector SVG math & Mermaid diagrams
    edge_pdf_bytes = _render_via_edge_headless(full_html)
    if edge_pdf_bytes:
        final_bytes = edge_pdf_bytes
    else:
        # Fallback Render: xhtml2pdf (pisa) with formula cleanup
        def _display_math_replacer(match):
            raw_code = match.group(1).strip()
            clean = clean_latex_math(raw_code)
            return (
                f'\n\n<div class="formula-box">'
                f'<div class="formula-title">Mathematical Formula:</div>'
                f'<div class="formula-body">{clean}</div>'
                f'</div>\n\n'
            )

        md_clean_fallback = re.sub(r'\$\$(.*?)\$\$', _display_math_replacer, md_normalized, flags=re.DOTALL)
        def _inline_replacer(match):
            raw_code = match.group(1).strip()
            if re.match(r'^\d+(\.\d+)?\s*$', raw_code):
                return f"${raw_code}$"
            clean = clean_latex_math(raw_code)
            return f"<code>{clean}</code>"
        md_clean_fallback = re.sub(r'(?<!\$)\$(?!\$)(.*?)(?<!\$)\$(?!\$)', _inline_replacer, md_clean_fallback)

        html_body_fallback = markdown.markdown(md_clean_fallback, extensions=["extra", "tables", "fenced_code"])
        html_body_fallback = _resolve_and_embed_images(html_body_fallback, base_dir=base_dir)
        html_body_fallback = _format_exhibit_placeholders(html_body_fallback)

        fallback_html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>{title}</title>
<style>{academic_css}</style>
</head>
<body>
{html_body_fallback}
</body>
</html>
"""
        text_pdf_buffer = io.BytesIO()
        pisa_status = pisa.CreatePDF(
            fallback_html,
            dest=text_pdf_buffer,
            link_callback=_make_link_callback(base_dir)
        )
        if pisa_status.err:
            raise Exception("Error rendering PDF with xhtml2pdf fallback")
        final_bytes = text_pdf_buffer.getvalue()

    # 7. Append physical page images if supplied
    if not page_images:
        return final_bytes

    try:
        combined_doc = fitz.open("pdf", final_bytes)
        A4_W = 595.28
        A4_H = 841.89

        for img_path in page_images:
            img_p = Path(img_path)
            if not img_p.exists():
                continue

            img_page = combined_doc.new_page(width=A4_W, height=A4_H)
            margin = 28.35
            rect = fitz.Rect(margin, margin, A4_W - margin, A4_H - margin)
            img_page.insert_image(rect, filename=str(img_path), keep_proportion=True)

            page_label = img_p.stem.replace("page_", "Halaman ").replace("_dpi150", "").replace("_dpi100", "")
            img_page.insert_text(
                (margin, margin - 10),
                f"▸ Visual Asli: {page_label}",
                fontsize=7,
                color=(0.6, 0.6, 0.6),
            )

        out_buf = io.BytesIO()
        combined_doc.save(out_buf, garbage=1, deflate=True)
        combined_doc.close()
        return out_buf.getvalue()

    except Exception as e:
        print(f"[export_service] Hybrid image embed failed, falling back to text-only: {e}")
        return final_bytes

    if not page_images:
        return text_pdf_bytes

    try:
        combined_doc = fitz.open("pdf", text_pdf_bytes)
        A4_W = 595.28
        A4_H = 841.89

        for img_path in page_images:
            img_p = Path(img_path)
            if not img_p.exists():
                continue

            img_page = combined_doc.new_page(width=A4_W, height=A4_H)
            margin = 28.35
            rect = fitz.Rect(margin, margin, A4_W - margin, A4_H - margin)
            img_page.insert_image(rect, filename=str(img_path), keep_proportion=True)

            page_label = img_p.stem.replace("page_", "Halaman ").replace("_dpi150", "").replace("_dpi100", "")
            img_page.insert_text(
                (margin, margin - 10),
                f"▸ Visual Asli: {page_label}",
                fontsize=7,
                color=(0.6, 0.6, 0.6),
            )

        out_buf = io.BytesIO()
        combined_doc.save(out_buf, garbage=1, deflate=True)
        combined_doc.close()
        return out_buf.getvalue()

    except Exception as e:
        print(f"[export_service] Hybrid image embed failed, falling back to text-only: {e}")
        return text_pdf_bytes


def stamp_bottom_right_page_numbers(
    pdf_bytes: bytes,
    start_page: int = 1,
    skip_first_if_cover: bool = False,
    page_prefix: str = ""
) -> bytes:
    """
    Stamp elegant, publication-grade page numbers at the bottom-right corner of each page.
    e.g. '1', '2', '21' or custom start page offset like real textbook pages.
    """
    try:
        doc = fitz.open("pdf", pdf_bytes)
        for i, page in enumerate(doc):
            if i == 0 and skip_first_if_cover:
                continue

            curr_num = start_page + (i - 1 if skip_first_if_cover else i)
            text = f"{page_prefix}{curr_num}"
            rect = page.rect
            text_width = len(text) * 6.0
            point = fitz.Point(rect.width - 45 - text_width, rect.height - 24)

            page.insert_text(
                point,
                text,
                fontsize=9.0,
                fontname="helv",
                color=(0.35, 0.35, 0.35),
            )

        out_buf = io.BytesIO()
        doc.save(out_buf, garbage=1, deflate=True)
        doc.close()
        return out_buf.getvalue()
    except Exception as e:
        print(f"[export_service] Page number stamping note: {e}")
        return pdf_bytes


def strip_chapter_opening_duplicates(content: str) -> str:
    """
    Detect and eliminate redundant duplicate covers, redundant book title banners,
    and trailing page-breaks that occur before Chapter/Module 1 heading.
    Prevents duplicate cover pages and offset page numbers in merged book PDFs.
    """
    if not content:
        return ""
    ch_match = re.search(
        r'^(?:#{1,3})\s+(?:Chapter\s*\d+|Module\s*[:\s]*\d+|\d+[\.:])\b.*$',
        content,
        flags=re.MULTILINE | re.IGNORECASE
    )
    if ch_match and ch_match.start() > 0:
        preamble = content[:ch_match.start()]
        has_cover_img = bool(re.search(r'(?:cover|banner|logo)[^)]*\.(?:png|jpg|jpeg|webp)', preamble, re.IGNORECASE))
        has_page_break = "page-break" in preamble.lower()
        if has_cover_img or (has_page_break and len(preamble.strip().splitlines()) <= 30):
            return content[ch_match.start():].lstrip()
    return content


def merge_markdown_files_to_pdf(
    md_items: list[tuple[str, str]],
    output_pdf_path: str,
    images_dir: str | None = None,
    cover_image_path: str | Path | None = None,
    generate_cover: bool = True,
    book_title: str | None = None,
    chapter_ranges: list[tuple[int, int]] | None = None,
) -> str:
    """
    Convert multiple Markdown chapters and merge them into one full-page PDF
    with optional cover image / executive typographic cover, and bottom-right page numbering throughout.
    Guarantees:
    1. Redundant opening chapter covers and duplicate book titles are cleanly stripped.
    2. Cover image is unnumbered (skipped during footer stamping).
    3. Table of Contents page ranges strictly and dynamically match the physical stamped numbers of each chapter.
    """
    from services.markdown_generator import generate_front_matter_and_toc

    merged_doc = fitz.open()
    has_cover = False

    # 1. Discover cover image or use explicitly provided cover
    found_cover = cover_image_path
    if not found_cover and images_dir:
        img_p = Path(images_dir)
        if img_p.exists():
            cands = list(img_p.glob("*cover*.*")) + list(img_p.glob("00_*.*")) + list(img_p.glob("cover_page*.*"))
            cands = [c for c in cands if c.suffix.lower() in [".png", ".jpg", ".jpeg", ".webp"]]
            if cands:
                found_cover = str(cands[0])

    # 2. Prepend Cover Page
    if found_cover and Path(found_cover).exists():
        try:
            A4_W = 595.28
            A4_H = 841.89
            cover_page = merged_doc.new_page(width=A4_W, height=A4_H)

            # Auto-fit calculation to maintain exact aspect ratio and prevent distortion/stretching
            pix = fitz.Pixmap(str(found_cover))
            img_w = float(pix.width)
            img_h = float(pix.height)
            pix = None

            aspect_img = img_w / img_h
            aspect_a4 = A4_W / A4_H

            # If image aspect ratio is close to A4 (within 6%), use full-page bleed
            if abs(aspect_img - aspect_a4) < 0.06:
                target_rect = fitz.Rect(0, 0, A4_W, A4_H)
            else:
                margin_x = 34.0
                margin_y = 34.0
                avail_w = A4_W - (margin_x * 2)
                avail_h = A4_H - (margin_y * 2)

                scale = min(avail_w / img_w, avail_h / img_h)
                scaled_w = img_w * scale
                scaled_h = img_h * scale

                x0 = (A4_W - scaled_w) / 2.0
                y0 = (A4_H - scaled_h) / 2.0
                target_rect = fitz.Rect(x0, y0, x0 + scaled_w, y0 + scaled_h)

            cover_page.insert_image(target_rect, filename=str(found_cover), keep_proportion=True)
            has_cover = True
        except Exception as e:
            print(f"[export_service] Error inserting cover image: {e}")
    elif generate_cover:
        try:
            t = book_title or (Path(md_items[0][0]).stem if md_items else "Academic Textbook")
            cover_bytes = generate_academic_cover_pdf(book_title=t)
            cover_doc = fitz.open("pdf", cover_bytes)
            merged_doc.insert_pdf(cover_doc)
            cover_doc.close()
            has_cover = True
        except Exception as e:
            print(f"[export_service] Error generating cover page: {e}")

    # 3. Separate Front Matter from Content Chapters
    content_items = []
    has_fm_input = False
    for name, content in md_items:
        n_lower = name.lower()
        if n_lower.startswith("fm_") or "front_matter" in n_lower or "toc" in n_lower:
            has_fm_input = True
        else:
            content_items.append((name, content))

    # Natural sort content chapters
    def _nat_key(item):
        nums = [int(x) for x in re.findall(r'\d+', item[0])]
        return nums[0] if nums else 999
    content_items.sort(key=_nat_key)

    # 4. Clean content chapters and render to measure exact page counts
    rendered_chapters = []
    chapter_toc_info = []

    for idx, (name, raw_content) in enumerate(content_items, start=1):
        clean_content = strip_chapter_opening_duplicates(raw_content)
        stem = Path(name).stem
        title = stem.replace("_", " ")

        pdf_bytes = markdown_to_pdf_bytes(clean_content, title=title, base_dir=images_dir)
        ch_doc = fitz.open("pdf", pdf_bytes)
        p_count = max(1, ch_doc.page_count)
        rendered_chapters.append(ch_doc)

        h_match = re.search(r'^(?:#{1,3})\s+(.*)$', clean_content, re.MULTILINE)
        if h_match:
            raw_h = h_match.group(1).strip()
            clean_topic = re.sub(r'^(?:Chapter\s*\d+|Module\s*[:\s]*\d+|\d+[\.\)])\s*[:\—\-]?\s*', '', raw_h, flags=re.IGNORECASE).strip()
            topic_name = clean_topic if clean_topic else title
        else:
            topic_name = title

        chapter_toc_info.append({
            "idx": idx,
            "title": topic_name,
            "page_count": p_count,
        })

    # 5. Determine if Table of Contents should be included
    need_toc = has_fm_input or len(content_items) > 1

    if need_toc and rendered_chapters:
        # Front Matter (TOC) is stamped as Page 1
        # Content Chapter 1 starts on stamped Page 2
        cur_stamped_page = 2
        for ch in chapter_toc_info:
            start_p = cur_stamped_page
            end_p = cur_stamped_page + ch["page_count"] - 1
            ch["book_start_page"] = start_p
            ch["book_end_page"] = end_p
            ch["start_page"] = start_p
            ch["end_page"] = end_p
            cur_stamped_page = end_p + 1

        b_name = book_title or (Path(content_items[0][0]).stem if content_items else "Course Material")
        fm_md = generate_front_matter_and_toc(
            book_name=b_name,
            chapters=chapter_toc_info,
            single_page=True,
        )
        fm_pdf = markdown_to_pdf_bytes(fm_md, title="Table of Contents", base_dir=images_dir)
        fm_doc = fitz.open("pdf", fm_pdf)
        merged_doc.insert_pdf(fm_doc)
        fm_doc.close()

    # 6. Append all rendered chapter PDFs
    for ch_doc in rendered_chapters:
        merged_doc.insert_pdf(ch_doc)
        ch_doc.close()

    # 7. Stamp bottom right page numbers (skipping cover page if present)
    out_buf = io.BytesIO()
    merged_doc.save(out_buf, garbage=1, deflate=True)
    merged_doc.close()

    stamped_bytes = stamp_bottom_right_page_numbers(
        out_buf.getvalue(),
        start_page=1,
        skip_first_if_cover=has_cover,
    )

    Path(output_pdf_path).parent.mkdir(parents=True, exist_ok=True)
    Path(output_pdf_path).write_bytes(stamped_bytes)
    return output_pdf_path


def create_md_to_pdf_zip_package(
    md_items: list[tuple[str, str]],
    zip_output_path: str,
    base_name: str,
    output_dir: Path | str,
    images_dir: Path | str | None = None,
    chapter_start_pages: list[int] | None = None,
) -> dict:
    """
    Convert all Markdown chapters into individual PDF files + one Master Merged PDF,
    and package everything into a complete ZIP archive with images and bottom-right page numbers.
    """
    out_dir = Path(output_dir)
    chapters_dir = out_dir / "chapters"
    chapters_dir.mkdir(parents=True, exist_ok=True)

    files_for_zip: list[tuple[str, str]] = []
    merged_doc = fitz.open()
    chapter_pdf_paths: list[str] = []

    # 1. Convert each chapter markdown to individual PDF & add to merged doc
    for idx, (name, content) in enumerate(md_items, start=1):
        stem = Path(name).stem
        title = stem.replace("_", " ")
        clean_content = strip_chapter_opening_duplicates(content)

        pdf_bytes = markdown_to_pdf_bytes(clean_content, title=title, base_dir=images_dir)

        # Get custom starting page number for this chapter if provided (e.g. Chapter 1: 1, Chapter 2: 21)
        start_pg = chapter_start_pages[idx - 1] if chapter_start_pages and idx - 1 < len(chapter_start_pages) else 1
        stamped_chapter_bytes = stamp_bottom_right_page_numbers(pdf_bytes, start_page=start_pg)

        # Save individual chapter PDF
        chapter_pdf_name = f"{stem}.pdf"
        chapter_pdf_path = chapters_dir / chapter_pdf_name
        chapter_pdf_path.write_bytes(stamped_chapter_bytes)
        chapter_pdf_paths.append(str(chapter_pdf_path))

        # Add individual chapter PDF to ZIP archive (under chapters/ directory)
        files_for_zip.append((str(chapter_pdf_path), f"chapters/{chapter_pdf_name}"))

        # Append un-stamped or stamped pages into master merged PDF
        chapter_doc = fitz.open("pdf", pdf_bytes)
        merged_doc.insert_pdf(chapter_doc)
        chapter_doc.close()

    # 2. Save master unified merged PDF with continuous page numbering
    merged_pdf_filename = f"{base_name}_Merged_Full.pdf"
    merged_pdf_path = out_dir / merged_pdf_filename
    
    out_buf = io.BytesIO()
    merged_doc.save(out_buf, garbage=1, deflate=True)
    merged_doc.close()

    master_stamped_bytes = stamp_bottom_right_page_numbers(out_buf.getvalue(), start_page=1)
    merged_pdf_path.write_bytes(master_stamped_bytes)

    # Place master merged PDF at root of ZIP archive
    files_for_zip.insert(0, (str(merged_pdf_path), merged_pdf_filename))

    # 3. Include any images / diagrams in the ZIP archive
    if images_dir:
        img_dir_path = Path(images_dir)
        if img_dir_path.exists():
            for img_file in img_dir_path.glob("*.png"):
                files_for_zip.append((str(img_file), f"images/{img_file.name}"))
            for img_file in img_dir_path.glob("*.jpg"):
                files_for_zip.append((str(img_file), f"images/{img_file.name}"))

    # 4. Create the final ZIP archive
    create_zip_export(files_for_zip, str(zip_output_path), compress=False)

    return {
        "zip_path": str(zip_output_path),
        "zip_filename": Path(zip_output_path).name,
        "merged_pdf_path": str(merged_pdf_path),
        "merged_pdf_filename": merged_pdf_filename,
        "chapter_pdfs": chapter_pdf_paths,
        "total_chapters": len(md_items),
        "total_files": len(files_for_zip),
    }


def _natural_sort_key_path(p: Path) -> list:
    """Natural sort helper for Path objects."""
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", p.name)]

