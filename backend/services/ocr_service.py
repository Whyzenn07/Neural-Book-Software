"""
OCR Service — robust OCR text extraction using Windows Native OCR (winocr)
with PyTesseract fallback.
"""

import asyncio
import os
from PIL import Image

try:
    import winocr
    HAS_WINOCR = True
except ImportError:
    HAS_WINOCR = False

try:
    import pytesseract
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False


def ocr_page(image_path: str, lang: str = "en") -> str:
    """
    Run OCR on an image and return extracted text.
    Uses native Windows OCR if available, otherwise Tesseract.

    Args:
        image_path: path to the image file (JPEG/PNG)
        lang: language code (default: 'en')

    Returns:
        Extracted text string.
    """
    if not os.path.exists(image_path):
        return ""

    # 1. Try native Windows OCR (built-in, no binary needed)
    if HAS_WINOCR:
        try:
            img = Image.open(image_path)
            # Run async recognize in sync context
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    # If already in an async event loop, use a new thread or run_coroutine_threadsafe
                    import concurrent.futures
                    with concurrent.futures.ThreadPoolExecutor() as pool:
                        res = pool.submit(lambda: asyncio.run(winocr.recognize_pil(img, lang=lang))).result()
                        return res.text.strip()
                else:
                    res = loop.run_until_complete(winocr.recognize_pil(img, lang=lang))
                    return res.text.strip()
            except RuntimeError:
                res = asyncio.run(winocr.recognize_pil(img, lang=lang))
                return res.text.strip()
        except Exception as e:
            print(f"[winocr error]: {e}")

    # 2. Fallback to PyTesseract
    if HAS_TESSERACT:
        try:
            img = Image.open(image_path)
            text = pytesseract.image_to_string(img, lang="eng", config="--psm 6")
            return text.strip()
        except Exception as e:
            print(f"[pytesseract error]: {e}")

    return ""
