/**
 * Step 5 - Output Folders & Professional Status & Download Notifications
 * Filename format:
 * - <book>_chapter_PDF.zip
 * - <book>_chapter_Markdown.zip
 * Example: Finance_Management_chapter_PDF.zip
 */
import { useEffect, useState, useRef } from 'react'

const POLL_INTERVAL_MS = 1200

export default function Step5Output({ state, update, reset }) {
  const { jobId, chapters, fileName } = state
  const [status, setStatus] = useState('processing')
  const [pdfReady, setPdfReady] = useState(false)
  const [ocrReady, setOcrReady] = useState(false)
  const [serverCleanName, setServerCleanName] = useState('')
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)
  const [notifications, setNotifications] = useState([])
  const prevPdfReady = useRef(false)
  const prevOcrReady = useRef(false)
  const pollRef = useRef(null)

  // Derive exact clean book name from uploaded document
  const localCleanName = (fileName || 'Book')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || 'Book'

  const activeName = serverCleanName || localCleanName
  const pdfZipName = `${activeName}_chapter_PDF.zip`
  const ocrZipName = `${activeName}_chapter_Markdown.zip`

  // Toast notification helper
  const addNotification = (title, message, type = 'success') => {
    const id = Date.now() + Math.random()
    setNotifications((prev) => [...prev, { id, title, message, type }])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 4500)
  }

  useEffect(() => {
    if (!jobId) {
      // Demo mode simulation
      const t1 = setTimeout(() => {
        setPdfReady(true)
        addNotification('PDF Ready', 'All chapter PDF files are ready to download.', 'pdf')
      }, 700)

      const t2 = setTimeout(() => {
        setOcrReady(true)
        setStatus('done')
        addNotification('OCR Ready', 'All chapter Markdown files are ready to download.', 'ocr')
      }, 2000)

      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }

    const poll = async () => {
      try {
        const res = await fetch(`/api/status/${jobId}`)
        if (!res.ok) throw new Error('Status check failed')

        const data = await res.json()
        setStatus(data.status)
        if (data.clean_name) setServerCleanName(data.clean_name)
        setProgress(data.progress || 0)
        setTotal(data.total || 0)

        // Trigger notification when PDF becomes ready
        if (data.pdf_ready && !prevPdfReady.current) {
          prevPdfReady.current = true
          setPdfReady(true)
          addNotification('PDF Ready', 'All chapter PDF files are ready to download.', 'pdf')
        }

        // Trigger notification when OCR becomes ready
        if (data.ocr_ready && !prevOcrReady.current) {
          prevOcrReady.current = true
          setOcrReady(true)
          addNotification('OCR Ready', 'All chapter Markdown files are ready to download.', 'ocr')
        }

        if (data.status === 'done' || data.status === 'error') {
          clearInterval(pollRef.current)
        }
      } catch (err) {
        console.warn('Status poll warning:', err)
      }
    }

    poll()
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS)
    return () => clearInterval(pollRef.current)
  }, [jobId])

  const handleDownloadClick = (type) => {
    const filename = type === 'pdf' ? pdfZipName : ocrZipName
    addNotification('Download Started', `${filename} sedang diunduh ke komputer Anda.`, 'download')
  }

  const pct = total > 0 ? Math.round((progress / total) * 100) : 0

  return (
    <div style={{ position: 'relative' }}>
      {/* Sleek Floating Toast Notification Container */}
      <div
        style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          maxWidth: 380,
          width: '90%',
          pointerEvents: 'none',
        }}
      >
        {notifications.map((n) => (
          <div
            key={n.id}
            style={{
              background: '#ffffff',
              borderLeft:
                n.type === 'pdf'
                  ? '5px solid var(--amber)'
                  : n.type === 'download'
                  ? '5px solid #28a745'
                  : '5px solid var(--navy)',
              boxShadow: '0 10px 30px rgba(0,60,87,0.18)',
              borderRadius: 12,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              animation: 'slideInRight 0.35s ease',
              pointerEvents: 'auto',
            }}
          >
            <i
              className={
                n.type === 'pdf'
                  ? 'fas fa-check-circle'
                  : n.type === 'download'
                  ? 'fas fa-arrow-alt-circle-down'
                  : 'fas fa-check-circle'
              }
              style={{
                fontSize: 20,
                color:
                  n.type === 'pdf'
                    ? 'var(--amber)'
                    : n.type === 'download'
                    ? '#28a745'
                    : 'var(--navy)',
                marginTop: 2,
              }}
            ></i>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>
                {n.title}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                {n.message}
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="step-title">
        <i className="fas fa-folder-open"></i> Output Folders
      </h2>
      <p className="step-subtitle">
        Your split chapter PDFs and OCR Markdown copies are ready in the following folders.
      </p>

      {/* Realtime Extraction Progress Banner */}
      {status === 'processing' && !ocrReady && (
        <div
          style={{
            background: '#f8fafc',
            border: '2px solid #e2e8f0',
            borderRadius: 18,
            padding: '16px 22px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div className="spinner-navy" style={{ width: 22, height: 22, flexShrink: 0 }}></div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontWeight: 600, color: 'var(--navy)', fontSize: 14 }}>
              {!pdfReady ? 'Preparing and splitting chapter PDFs...' : 'Extracting chapter Markdown text in parallel...'}
            </div>
            {total > 0 && (
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                {progress} of {total} pages processed ({pct}%)
              </div>
            )}
          </div>
          {total > 0 && (
            <div style={{ width: 120, flexShrink: 0 }}>
              <div className="progress-wrap" style={{ height: 6 }}>
                <div className="progress-bar" style={{ width: `${pct}%` }}></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clean & Professional Output Folder Cards (No Badges) */}
      <div className="folder-grid">
        {/* Card 1: PDFs */}
        <div
          className="folder-card"
          style={{
            borderColor: pdfReady ? 'var(--navy)' : '#e2e8f0',
            boxShadow: pdfReady ? '0 8px 24px rgba(0,60,87,0.06)' : 'none',
            transition: 'all 0.3s ease',
          }}
        >
          <i
            className="fas fa-file-pdf folder-icon"
            style={{ color: 'var(--amber)', fontSize: 48 }}
          ></i>
          <h4>📄 PDFs</h4>
          <p>All {chapters.length} split chapter PDFs</p>
          <div className="folder-tag">
            <i className="fas fa-file-archive" style={{ marginRight: 6 }}></i>
            {pdfZipName}
          </div>

          <div style={{ marginTop: 24 }}>
            {pdfReady ? (
              <a
                href={`/api/download/pdf/${jobId || 'demo'}/${pdfZipName}`}
                download={pdfZipName}
                className="btn-accent"
                onClick={() => handleDownloadClick('pdf')}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  fontSize: 15,
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxSizing: 'border-box',
                }}
              >
                <i className="fas fa-download" style={{ marginRight: 8 }}></i> Download PDF (ZIP)
              </a>
            ) : (
              <button
                type="button"
                className="btn-secondary"
                style={{ width: '100%', padding: '12px 20px', fontSize: 14, fontWeight: 600 }}
                disabled
              >
                <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i> Processing PDF...
              </button>
            )}
          </div>
        </div>

        {/* Card 2: OCR Copies */}
        <div
          className="folder-card"
          style={{
            borderColor: ocrReady ? 'var(--navy)' : '#e2e8f0',
            boxShadow: ocrReady ? '0 8px 24px rgba(0,60,87,0.06)' : 'none',
            transition: 'all 0.3s ease',
          }}
        >
          <i
            className="fas fa-file-alt folder-icon"
            style={{ color: 'var(--navy)', fontSize: 48 }}
          ></i>
          <h4>📝 OCR copies</h4>
          <p>Text‑extracted Markdown (.md) files</p>
          <div className="folder-tag">
            <i className="fas fa-file-archive" style={{ marginRight: 6 }}></i>
            {ocrZipName}
          </div>

          <div style={{ marginTop: 24 }}>
            {ocrReady ? (
              <a
                href={`/api/download/ocr/${jobId || 'demo'}/${ocrZipName}`}
                download={ocrZipName}
                className="btn-primary"
                onClick={() => handleDownloadClick('ocr')}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  fontSize: 15,
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxSizing: 'border-box',
                }}
              >
                <i className="fas fa-download" style={{ marginRight: 8 }}></i> Download OCR (ZIP)
              </a>
            ) : (
              <button
                type="button"
                className="btn-secondary"
                style={{ width: '100%', padding: '12px 20px', fontSize: 14, fontWeight: 600 }}
                disabled
              >
                <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i> Processing OCR...
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar" style={{ marginTop: 34 }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={reset}
        >
          <i className="fas fa-redo"></i> Start Over
        </button>
      </div>
    </div>
  )
}
