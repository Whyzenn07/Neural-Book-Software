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
            # Search globally in temp or upload folders
            try:
                from services.pdf_service import UPLOAD_DIR
                matches = [p for p in UPLOAD_DIR.glob(f"**/{cand.name}") if p.is_file()]
                if matches:
                    found_path = matches[0]
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


def _format_exhibit_placeholders(html_str: str) -> str:
    """Format placeholder text like [Exhibit 1.1 — source figure 'img_001.png' not available...] into neat cards."""
    def _rep(m):
        raw_text = m.group(1)
        return (
            f'<div class="exhibit-placeholder-box">'
            f'<div class="exhibit-placeholder-title"><b>Exhibit Information</b></div>'
            f'<div class="exhibit-placeholder-body">{raw_text}</div>'
            f'</div>'
        )
    return re.sub(r'\[(Exhibit\s+\d+[\.\d]*\s*[\—\-][^\]]+)\]', _rep, html_str)


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
    # 1. Normalize table separators so markdown.markdown() parses tables properly
    md_normalized = _normalize_markdown_tables(md_content)

    # 2. Parse Markdown to HTML (without nl2br to prevent breaking Markdown tables)
    html_body = markdown.markdown(
        md_normalized,
        extensions=["extra", "tables", "fenced_code"]
    )

    # 3. Resolve images to base64 data URIs & format exhibit placeholders
    html_body = _resolve_and_embed_images(html_body, base_dir=base_dir)
    html_body = _format_exhibit_placeholders(html_body)

    # 4. Resolve MathJax script URI
    mathjax_local = Path(__file__).resolve().parent.parent / "assets" / "tex-mml-chtml.js"
    if mathjax_local.exists():
        mathjax_src = mathjax_local.as_uri()
    else:
        mathjax_src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"

    # 5. Academic Book Typography CSS (Booktabs table layout, Serif fonts, dynamic margins)
    academic_css = """
    @page {
        size: A4 portrait;
        margin: 20mm 20mm 25mm 20mm;
        @bottom-right {
            content: counter(page);
        }
    }
    body {
        font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
        font-size: 10pt;
        line-height: 1.6;
        color: #1e293b;
        background-color: #ffffff;
    }
    h1 {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-size: 20pt;
        color: #0f172a;
        margin-top: 24px;
        margin-bottom: 12px;
        padding-bottom: 6px;
        border-bottom: 2px solid #0f172a;
        font-weight: bold;
        page-break-after: avoid;
    }
    h2 {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-size: 13pt;
        color: #1e293b;
        margin-top: 18px;
        margin-bottom: 8px;
        border-bottom: 1px solid #cbd5e1;
        padding-bottom: 4px;
        font-weight: bold;
        page-break-after: avoid;
    }
    h3 {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-size: 11pt;
        color: #334155;
        margin-top: 14px;
        margin-bottom: 6px;
        font-weight: bold;
        page-break-after: avoid;
    }
    p {
        margin-bottom: 8px;
        text-align: justify;
    }
    /* Academic Booktabs Tables */
    table {
        width: 100%;
        border-collapse: collapse;
        margin: 18px 0 22px 0;
        font-size: 9pt;
        page-break-inside: avoid;
    }
    th {
        border-top: 2px solid #0f172a;
        border-bottom: 1.5px solid #0f172a;
        padding: 8px 10px;
        font-weight: bold;
        text-align: left;
        background-color: #f8fafc;
        color: #0f172a;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    td {
        border-bottom: 1px solid #e2e8f0;
        padding: 7px 10px;
        vertical-align: top;
    }
    tr:last-child td {
        border-bottom: 2px solid #0f172a;
    }
    /* Academic Blockquotes & Callouts */
    blockquote {
        border-left: 3.5px solid #0284c7;
        background-color: #f8fafc;
        padding: 10px 16px;
        margin: 14px 0;
        font-style: normal;
        color: #0f172a;
        border-radius: 0 4px 4px 0;
        page-break-inside: avoid;
    }
    /* Formula boxes & Math styles */
    .formula-box {
        background-color: #f8fafc;
        border: 1px solid #cbd5e1;
        border-left: 4px solid #0284c7;
        padding: 10px 14px;
        margin: 14px 0;
        border-radius: 4px;
        page-break-inside: avoid;
    }
    .formula-title {
        font-weight: bold;
        color: #0369a1;
        margin-bottom: 4px;
        font-size: 9pt;
    }
    /* Exhibit Cards */
    .exhibit-placeholder-box {
        background-color: #f8fafc;
        border: 1px dashed #94a3b8;
        border-left: 4px solid #0284c7;
        padding: 10px 16px;
        margin: 14px 0;
        border-radius: 4px;
        page-break-inside: avoid;
    }
    .exhibit-placeholder-title {
        font-weight: bold;
        color: #0369a1;
        font-size: 9pt;
        margin-bottom: 3px;
    }
    .exhibit-placeholder-body {
        color: #475569;
        font-size: 8.5pt;
        font-style: italic;
    }
    img {
        max-width: 90%;
        max-height: 420px;
        display: block;
        margin: 16px auto;
        border-radius: 4px;
        page-break-inside: avoid;
    }
    code {
        font-family: Consolas, 'Courier New', monospace;
        font-size: 8.5pt;
        background-color: #f1f5f9;
        padding: 2px 4px;
        border-radius: 3px;
    }
    pre {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 8px 12px;
        border-radius: 4px;
        font-family: Consolas, 'Courier New', monospace;
        font-size: 8.5pt;
        page-break-inside: avoid;
    }
    ul, ol {
        margin: 8px 0 12px 20px;
        padding: 0;
    }
    li {
        margin-bottom: 4px;
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
</head>
<body>
{html_body}
</body>
</html>
"""

    # 6. Primary Render Attempt: Edge Headless with MathJax vector SVG math
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

            curr_num = start_page + i
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


def merge_markdown_files_to_pdf(
    md_items: list[tuple[str, str]],
    output_pdf_path: str,
    images_dir: str | None = None,
    chapter_ranges: list[tuple[int, int]] | None = None,
) -> str:
    """
    Convert multiple Markdown chapters and merge them into one full-page PDF
    with bottom-right page numbering stamped throughout.
    """
    merged_doc = fitz.open()

    for idx, (name, content) in enumerate(md_items):
        title = Path(name).stem.replace("_", " ")
        pdf_bytes = markdown_to_pdf_bytes(content, title=title, base_dir=images_dir)
        chapter_doc = fitz.open("pdf", pdf_bytes)
        merged_doc.insert_pdf(chapter_doc)
        chapter_doc.close()

    # Stamp bottom right page numbers on the unified merged PDF (Page 1 of N onwards, skipping cover if desired)
    out_buf = io.BytesIO()
    merged_doc.save(out_buf, garbage=1, deflate=True)
    merged_doc.close()

    stamped_bytes = stamp_bottom_right_page_numbers(
        out_buf.getvalue(),
        start_page=1,
        skip_first_if_cover=False,
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

        pdf_bytes = markdown_to_pdf_bytes(content, title=title, base_dir=images_dir)

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

