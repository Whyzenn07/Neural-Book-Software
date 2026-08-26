"""
Export Service — high-speed ZIP archive packager.
"""

import zipfile
from pathlib import Path


def create_zip_export(files_with_names: list[tuple[str, str]], zip_output_path: str, compress: bool = True):
    """
    Zip files into a single archive with custom relative paths inside the archive.

    Args:
        files_with_names: list of (absolute_file_path, arcname_in_zip)
        zip_output_path:  destination ZIP path
        compress:         True for DEFLATED (text/md), False for STORED (already compressed PDFs)
    """
    mode = zipfile.ZIP_DEFLATED if compress else zipfile.ZIP_STORED
    with zipfile.ZipFile(zip_output_path, "w", mode) as zf:
        for file_path, arcname in files_with_names:
            p = Path(file_path)
            if p.exists():
                zf.write(p, arcname=arcname)
