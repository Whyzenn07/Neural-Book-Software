# 📚 Neural Book Software (SKIPS - PDF Chapter Extractor)

A modern, high-performance web application designed for splitting PDF books into custom chapters, performing ultra-fast parallel multi-threaded OCR text extraction, and batch exporting chapters into organized PDF and Markdown (.zip) formats.

---

## ✨ Key Features

- 📖 **Smart PDF Chapter Splitting**: Detect and define custom chapter page ranges seamlessly.
- ⚡ **Multi-Threaded OCR Extraction**: Blazing-fast parallel OCR processing powered by background worker threads.
- 📦 **Automated ZIP Export**:
  - PDF Format: `<BookTitle>_chapter_PDF.zip`
  - Markdown Format: `<BookTitle>_chapter_Markdown.zip`
- 🖥️ **Full-Stack Single Server**: Integrated FastAPI backend that directly serves the optimized React production UI.
- 🔄 **Session Recovery & Persistence**: Automatic disk session recovery to prevent data loss.
- 🚀 **One-Click Local Launcher**: Pre-configured `run_local.bat` script for instant Windows launch.

---

## 🛠️ Tech Stack

### **Backend**
- **Framework**: Python 3.10+ / [FastAPI](https://fastapi.tiangolo.com/)
- **ASGI Server**: [Uvicorn](https://www.uvicorn.org/)
- **PDF & Document Engine**: `xhtml2pdf`, `markdown`, `aiofiles`, `python-multipart`

### **Frontend**
- **Framework / Bundler**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: Modern Responsive UI (CSS3 with dark/light themed components)

---

## 📁 Directory Structure

```text
Neural_Book_Software/
├── backend/
│   ├── services/
│   │   ├── pdf_service.py       # PDF splitting, rendering & page extraction
│   │   ├── ocr_service.py       # OCR pipeline & text conversion
│   │   └── export_service.py    # Multi-format ZIP archiving
│   ├── main.py                  # FastAPI application entry & API endpoints
│   └── requirements.txt         # Backend Python dependencies
├── frontend/
│   ├── src/                     # React application components & state
│   ├── public/                  # Static assets & logos
│   ├── package.json             # Frontend Node.js dependencies
│   └── vite.config.js           # Vite build configuration
├── .gitignore                   # Ignored files & runtime directories
├── run_local.bat                # Windows one-click local launcher
└── README.md                    # Project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed on your machine:
- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/) *(Only needed if you modify or rebuild the frontend UI)*
- [Git](https://git-scm.com/)

---

### 2. Backend Setup
1. Navigate to the backend directory and create a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   ```
2. Activate the virtual environment:
   - **Windows**:
     ```bash
     .\venv\Scripts\activate
     ```
   - **macOS / Linux**:
     ```bash
     source venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

---

### 3. Frontend Setup (Optional - If Modifying UI)
If you make changes to the React source code in `frontend/src`:
```bash
cd frontend
npm install
npm run build
```

---

## 💻 Running the Application

### ⚡ Quick Start (Windows)
Double-click the **`run_local.bat`** file in the root folder. The backend server will start and automatically open your default browser at `http://localhost:8000`.

### 🛠️ Manual Execution
From the root or `backend` folder:
```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
Open your browser and navigate to: [http://localhost:8000](http://localhost:8000)

---

## 🔒 Security Note (.env)
Never commit `.env` files, API keys, or sensitive credentials to a public repository. The provided `.gitignore` is pre-configured to keep your local environment files secure.

---

## 📄 License
This project is licensed under the MIT License. Feel free to use, modify, and distribute as needed.
