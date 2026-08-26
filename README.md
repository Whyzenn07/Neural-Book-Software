# 📚 Neural Book Software (SKIPS - PDF Chapter Extractor)

Aplikasi berbasis web modern dan canggih untuk memecah (*split*), mengekstrak teks menggunakan OCR berkecepatan tinggi dengan multi-threading, serta mengekspor buku PDF per bab (*chapter*) ke format PDF dan Markdown (.zip).

---

## ✨ Fitur Utama

- 📖 **PDF Chapter Splitting**: Deteksi dan pemisahan buku PDF berdasarkan rentang bab (*chapter ranges*).
- ⚡ **Multi-threaded OCR Extraction**: Ekstraksi teks cepat dan paralel menggunakan background worker.
- 📦 **Automated ZIP Export**:
  - Format PDF: `<JudulBuku>_chapter_PDF.zip`
  - Format Markdown: `<JudulBuku>_chapter_Markdown.zip`
- 🖥️ **Full-stack Single Server**: Backend FastAPI sekaligus melayani UI React production.
- 🔄 **Session Recovery**: Data sesi kerja disimpan dan dapat dipulihkan kapan saja.
- 🚀 **One-Click Local Launcher**: Tersedia skrip `run_local.bat` untuk menjalankan aplikasi secara instan di Windows.

---

## 🛠️ Tech Stack

### **Backend**
- **Framework**: Python 3.10+ / [FastAPI](https://fastapi.tiangolo.com/)
- **Server**: [Uvicorn](https://www.uvicorn.org/)
- **PDF & OCR Processing**: `xhtml2pdf`, `markdown`, `aiofiles`, `python-multipart`

### **Frontend**
- **Library/Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: Modern Responsive UI (CSS3)

---

## 📁 Struktur Direktori

```text
Neural_Book_Software/
├── backend/
│   ├── services/
│   │   ├── pdf_service.py       # Pemrosesan dan pemotongan PDF
│   │   ├── ocr_service.py       # Pipeline ekstraksi teks / OCR
│   │   └── export_service.py    # Pembuatan arsip zip hasil ekspor
│   ├── main.py                  # Entry point FastAPI & route API
│   └── requirements.txt         # Daftar pustaka Python backend
├── frontend/
│   ├── src/                     # Komponen UI React
│   ├── public/                  # Static assets
│   ├── package.json             # Dependensi Node.js frontend
│   └── vite.config.js           # Konfigurasi bundler Vite
├── .gitignore                   # File & folder yang diabaikan Git
├── run_local.bat                # Shortcut launcher aplikasi (Windows)
└── README.md                    # Dokumentasi proyek
```

---

## 🚀 Panduan Instalasi & Menjalankan

### 1. Prasyarat
Pastikan Anda telah menginstal:
- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/) (hanya diperlukan jika ingin memodifikasi / build frontend)
- [Git](https://git-scm.com/)

---

### 2. Setup Backend
1. Masuk ke direktori backend dan buat virtual environment:
   ```bash
   cd backend
   python -m venv venv
   ```
2. Aktifkan virtual environment:
   - **Windows**:
     ```bash
     .\venv\Scripts\activate
     ```
   - **Linux / macOS**:
     ```bash
     source venv/bin/activate
     ```
3. Pasang dependensi:
   ```bash
   pip install -r requirements.txt
   ```

---

### 3. Setup Frontend (Opsional - Jika Build Ulang)
Jika Anda melakukan perubahan pada tampilan frontend:
```bash
cd frontend
npm install
npm run build
```

---

### 4. Menjalankan Aplikasi

#### ⚡ Cara Cepat (Windows)
Cukup klik dua kali file **`run_local.bat`** di direktori utama. Browser akan terbuka otomatis di `http://localhost:8000`.

#### 💻 Cara Manual
Dari root direktori atau backend:
```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
Buka browser dan akses: [http://localhost:8000](http://localhost:8000)

---

## 🔒 Catatan Keamanan (.env)
Jangan mengunggah file `.env` atau kredensial sensitif ke repository publik. Gunakan `.gitignore` yang sudah disediakan untuk menjaga keamanan data lokal.

---

## 📄 Lisensi
Didistribusikan di bawah lisensi MIT. Silakan gunakan dan kembangkan sesuai kebutuhan.
>>>>>>> 26d97d6 (initial commit)
