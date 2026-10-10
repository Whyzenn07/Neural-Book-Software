/**
 * Step 5 - Output Folders & Split ZIP Downloads
 * Automatically starts chapter splitting and OCR text extraction.
 * Provides direct downloads of <Book>_chapter_PDF.zip & <Book>_chapter_Markdown.zip
 * Clean static Lucide SVG icons.
 */
import { useState, useEffect, useRef } from 'react'
import { getApiUrl } from '../../apiConfig'
import {
  FileText,
  Download,
  CheckCircle2,
  FolderOpen,
  Book,
  ArrowLeft,
  ArrowRight,
  Layers,
} from 'lucide-react'

const POLL_INTERVAL_MS = 600

export default function Step5Confirm({ state, update, next, back }) {
  const {
    jobId,
    chapters = [],
    pageCount = 100,
    fileName,
    startPage = 1,
    endPage = 100,
    indexPage = 5,
    filteredPages = [],
    filteredPagesSnapshot = [],
    removedPages = [],
  } = state

  // ── Book Page → PDF Page conversion ────────────────────────────────────────
  // Step 4 stores chapter ranges in BOOK page numbers (matching the TOC).
  // We convert them here to PDF page numbers before sending to the backend.
  const resolvedFilteredPages = (() => {
    // Prefer the snapshot saved by Step 4 (most accurate)
    if (filteredPagesSnapshot && filteredPagesSnapshot.length > 0) return filteredPagesSnapshot.map(Number)
    if (filteredPages && filteredPages.length > 0) return filteredPages.map(Number)
    // Fallback: sequential range minus removed pages
    const s = parseInt(startPage) || 1
    const e = parseInt(endPage) || pageCount
    const removed = new Set((removedPages || []).map(Number))
    return Array.from({ length: e - s + 1 }, (_, i) => s + i).filter((p) => !removed.has(p))
  })()

  const bookPageToPdfPage = (bookPage) => {
    const total = resolvedFilteredPages.length
    if (total === 0) return parseInt(bookPage) || 1
    const idx = Math.max(0, Math.min(parseInt(bookPage) - 1, total - 1))
    return resolvedFilteredPages[idx] ?? resolvedFilteredPages[total - 1] ?? 1
  }

  const [status, setStatus] = useState('processing')
  const [pdfReady, setPdfReady] = useState(false)
  const [ocrReady, setOcrReady] = useState(false)
  const [serverCleanName, setServerCleanName] = useState('')
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [hasStartedProcess, setHasStartedProcess] = useState(false)
  const prevPdfReady = useRef(false)
  const prevOcrReady = useRef(false)
  const pollRef = useRef(null)

  const localCleanName = (fileName || 'Book')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || 'Book'

  const activeName = serverCleanName || localCleanName
  const mergedPdfName = `${activeName}_Merged.pdf`
  const pdfZipName = `${activeName}_chapter_PDF.zip`
  const ocrZipName = `${activeName}_chapter_Markdown.zip`

  const addNotification = (title, message, type = 'success') => {
    const id = Date.now() + Math.random()
    setNotifications((prev) => [...prev, { id, title, message, type }])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 5000)
  }

  // Trigger processing on step mount
  useEffect(() => {
    let isMounted = true

    const startProcessing = async () => {
      if (!jobId || String(jobId).startsWith('demo')) {
        setTimeout(() => {
          if (isMounted) {
            setPdfReady(true)
            addNotification('Merged PDF Ready', 'Single merged PDF file is ready to download.', 'pdf')
          }
        }, 700)
        setTimeout(() => {
          if (isMounted) {
            setOcrReady(true)
            setStatus('done')
            setProgress(100)
            setTotal(100)
            addNotification('Markdown OCR Complete', 'All chapter text has been extracted to Markdown.', 'ocr')
          }
        }, 2000)
        return
      }

      try {
        const res = await fetch(getApiUrl('/api/process'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_id: jobId,
            chapters: (chapters && chapters.length > 0
              ? chapters
              : [{ title: 'Chapter 1', startPage: 1, endPage: resolvedFilteredPages.length || pageCount || 100 }]
            ).map((ch, idx) => {
              const bookStart = Math.max(1, parseInt(ch.startPage ?? ch.book_start_page) || 1)
              const bookEnd = Math.max(bookStart, parseInt(ch.endPage ?? ch.book_end_page) || (resolvedFilteredPages.length || pageCount || 100))
              const pdfStart = bookPageToPdfPage(bookStart)
              const pdfEnd = bookPageToPdfPage(bookEnd)
              const chPages = ch.pages && ch.pages.length > 0
                ? ch.pages
                : resolvedFilteredPages.slice(bookStart - 1, bookEnd)

              return {
                title: ch.title || `Chapter ${idx + 1}`,
                start_page: pdfStart,
                end_page: pdfEnd,
                book_start_page: bookStart,
                book_end_page: bookEnd,
                pages: chPages,
              }
            }),
          }),
        })

        if (res.ok) {
          const data = await res.json()
          if (data.clean_name) setServerCleanName(data.clean_name)
          setPdfReady(Boolean(data.pdf_ready))
          setOcrReady(Boolean(data.ocr_ready))
          setStatus(data.status || 'done')
          const tot = data.total || pageCount || 100
          setTotal(tot)
          setProgress(data.progress || tot)
        }
      } catch (err) {
        console.error('Process error:', err)
      } finally {
        if (isMounted) setHasStartedProcess(true)
      }
    }

    startProcessing()

    return () => {
      isMounted = false
    }
  }, [jobId])

  // Poll status while processing
  useEffect(() => {
    if (!jobId) return

    const poll = async () => {
      try {
        const res = await fetch(getApiUrl(`/api/status/${jobId}`))
        if (!res.ok) return
        const data = await res.json()

        if (data.clean_name) setServerCleanName(data.clean_name)
        setStatus(data.status || 'processing')
        setPdfReady(Boolean(data.pdf_ready))
        setOcrReady(Boolean(data.ocr_ready))
        if (data.total > 0) setTotal(data.total)
        setProgress(data.progress || 0)

        if (data.pdf_ready && !prevPdfReady.current) {
          prevPdfReady.current = true
          addNotification('Merged PDF Ready', `${data.clean_name || localCleanName}_Merged.pdf is ready to download!`, 'pdf')
        }

        if (data.ocr_ready && !prevOcrReady.current) {
          prevOcrReady.current = true
          addNotification('Markdown OCR Complete', `${data.clean_name || localCleanName}_chapter_Markdown.zip is ready to download!`, 'ocr')
        }

        if (data.status === 'done' || data.ocr_ready) {
          if (data.total) setProgress(data.total)
          clearInterval(pollRef.current)
        }
      } catch {
        // ignore
      }
    }

    poll()
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS)
    return () => clearInterval(pollRef.current)
  }, [jobId, hasStartedProcess])

  const isDone = ocrReady || status === 'done'
  const isPdfReady = pdfReady || isDone
  const isOcrReady = ocrReady || isDone

  const percent = isDone
    ? 100
    : (total > 0 ? Math.max(5, Math.min(99, Math.round((progress / total) * 100))) : (status === 'processing' ? 25 : 0))

  return (
    <div className="step6-output-container">
      {/* Toast Notifications */}
      <div className="notification-container">
        {notifications.map((n) => (
          <div key={n.id} className={`notif-card ${n.type}`}>
            <div className="notif-icon">
              {n.type === 'pdf' ? <FileText size={16} /> : <CheckCircle2 size={16} />}
            </div>
            <div className="notif-text">
              <strong>{n.title}</strong>
              <p>{n.message}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="step-header-text">
        <h2 className="step-title">
          <FolderOpen size={24} className="title-svg-icon" /> Output Folders &amp; Chapter Downloads
        </h2>
        <p className="step-subtitle">
          Download your split PDF chapters and extracted Markdown files directly. Once downloaded, proceed to Step 6 for AI Agent Skills (skills.md) and Step 7 for the MD-to-PDF Merger.
        </p>
      </div>

      {/* Progress Card */}
      <div className="output-status-card">
        <div className="output-status-header">
          <div className="status-badge-live">
            <span className={`pulse-dot ${isDone ? 'done' : 'active'}`}></span>
            <span>{isDone ? 'Extraction Complete (100%)' : 'Processing High-Speed Extraction...'}</span>
          </div>
          <span className="progress-percent">{percent}%</span>
        </div>

        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${percent}%` }}></div>
        </div>

        <div className="progress-details">
          <span>
            {isDone
              ? `All ${chapters.length || 1} chapters processed successfully.`
              : `Processing page text: ${progress} / ${total || pageCount || 100} pages`}
          </span>
          <span className="clean-name-tag">{activeName}</span>
        </div>
      </div>

      {/* Download Action Cards Grid */}
      <div className="download-cards-grid" style={{ marginTop: 24 }}>
        {/* SPLIT PDF ZIP CARD */}
        <div className={`download-card ${isPdfReady ? 'ready' : 'loading'}`}>
          <div className="download-card-icon pdf">
            <FileText size={28} />
          </div>
          <div className="download-card-body">
            <h4 className="card-filename">{pdfZipName}</h4>
            <p className="card-desc">Individual PDF chapters split cleanly according to your chapter ranges.</p>
            <span className="card-badge">Format: PDF Chapters (.zip)</span>
          </div>
          <div className="download-card-action">
            {isPdfReady ? (
              <a
                href={jobId ? getApiUrl(`/api/download/pdf/${jobId}/${pdfZipName}`) : '#'}
                download={pdfZipName}
                className="btn-download-pdf"
              >
                <Download size={15} /> Download PDF ZIP
              </a>
            ) : (
              <button disabled className="btn-disabled">
                Preparing PDF...
              </button>
            )}
          </div>
        </div>

        {/* OCR MARKDOWN ZIP CARD */}
        <div className={`download-card ${isOcrReady ? 'ready' : 'loading'}`}>
          <div className="download-card-icon md">
            <FileText size={28} />
          </div>
          <div className="download-card-body">
            <h4 className="card-filename">{ocrZipName}</h4>
            <p className="card-desc">Clean extracted Markdown (.md) chapter files with formatted text, mathematical formulas &amp; tables.</p>
            <span className="card-badge md">Format: Markdown (.zip)</span>
          </div>
          <div className="download-card-action">
            {isOcrReady ? (
              <a
                href={jobId ? getApiUrl(`/api/download/ocr/${jobId}/${ocrZipName}`) : '#'}
                download={ocrZipName}
                className="btn-download-md"
              >
                <Download size={15} /> Download Markdown ZIP
              </a>
            ) : (
              <button disabled className="btn-disabled">
                Extracting Markdown...
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Direct Merged PDF Download Option */}
      {isPdfReady && (
        <div className="quick-ocr-convert-box" style={{ marginTop: 16 }}>
          <div className="quick-ocr-info">
            <Layers size={18} className="quick-ocr-svg" />
            <span>
              Or download all chapters unified as a <strong>Single Merged PDF file</strong>:
            </span>
          </div>
          <a
            href={jobId ? getApiUrl(`/api/download/merged-pdf/${jobId}/${mergedPdfName}`) : '#'}
            download={mergedPdfName}
            className="btn-cloudconvert-download"
          >
            <Download size={15} /> Download {mergedPdfName} (.pdf)
          </a>
        </div>
      )}

      {/* Confirmation & Chapter Overview Panel */}
      <div className="confirm-box" style={{ marginTop: 24 }}>
        <div className="confirm-header-row">
          <div className="confirm-title">
            <Book size={18} /> Chapter Summary ({chapters.length} Chapters)
          </div>
          <span className="confirm-total-badge">Document: {fileName || 'Book.pdf'}</span>
        </div>

        <div className="confirm-stats-grid">
          <div className="confirm-stat-card">
            <span className="stat-label">Page Range</span>
            <span className="stat-val">{startPage || 1} – {endPage || pageCount}</span>
          </div>
          <div className="confirm-stat-card">
            <span className="stat-label">Index Page (TOC)</span>
            <span className="stat-val">Page {indexPage || 5}</span>
          </div>
          <div className="confirm-stat-card">
            <span className="stat-label">Total Document Pages</span>
            <span className="stat-val">{pageCount} Pages</span>
          </div>
          <div className="confirm-stat-card">
            <span className="stat-label">Split PDF Status</span>
            <span className="stat-val text-green">{isPdfReady ? 'Ready for Download' : 'Processing...'}</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar" style={{ marginTop: 28 }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={back}
        >
          <ArrowLeft size={16} /> Back to Step 4 (Zoom & Review)
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={next}
        >
          Next: AI Skills &amp; Directives (Step 6) <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
