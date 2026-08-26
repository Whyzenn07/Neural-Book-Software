/**
 * Step 4 - Confirmation
 * Matches reference HTML layout and alert flow 1:1
 */
import { useState } from 'react'

export default function Step4Confirm({ state, update, next, back }) {
  const { jobId, startPage, endPage, indexPage, chapters, pageCount } = state
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  const handleStartOCR = async () => {
    // Show alert confirmation dialog matching reference HTML
    window.alert('Based on your selected page numbers, we will split the PDF and provide OCR copies and PDFs. Please cross-verify your entries.')

    setError(null)
    setProcessing(true)

    try {
      if (jobId) {
        const res = await fetch('/api/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_id: jobId,
            chapters: chapters.map((ch, idx) => ({
              title: ch.title || `Chapter ${idx + 1}`,
              start_page: parseInt(ch.startPage) || 1,
              end_page: parseInt(ch.endPage) || (pageCount || 100),
            })),
          }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.detail || `Failed to start process (${res.status})`)
        }
      }

      next()
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div>
      <h2 className="step-title">
        <i className="fas fa-check-circle"></i> Confirmation
      </h2>
      <p className="step-subtitle">
        Review your selections. We will split the PDF and provide OCR copies and PDFs.
      </p>

      {/* Confirmation Box with Amber Left Border */}
      <div className="confirm-box">
        <p>
          <i
            className="fas fa-info-circle"
            style={{ color: 'var(--amber)', marginRight: 8 }}
          ></i>
          Based on your selected page numbers, we will split the PDF and provide
          OCR copies and PDFs. Please cross‑verify your entries.
        </p>

        <div className="confirm-stats">
          <span>
            <strong>Start:</strong> {startPage || 1}
          </span>
          <span>
            <strong>End:</strong> {endPage || pageCount || 100}
          </span>
          <span>
            <strong>Index:</strong> {indexPage || 5}
          </span>
          <span>
            <strong>Chapters:</strong> {chapters.length}
          </span>
        </div>
      </div>

      {/* Chapter Breakdown Summary */}
      <div
        style={{
          background: 'var(--bg-muted)',
          borderRadius: 18,
          padding: '20px 24px',
          marginBottom: 20,
        }}
      >
        <h4
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--navy)',
            marginBottom: 12,
          }}
        >
          <i className="fas fa-list" style={{ marginRight: 6 }}></i> Chapter
          Breakdown ({chapters.length})
        </h4>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 10,
          }}
        >
          {chapters.map((ch, idx) => (
            <div
              key={idx}
              style={{
                background: '#fff',
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--navy)' }}>
                {ch.title || `Chapter ${idx + 1}`}
              </span>
              <span style={{ color: 'var(--muted)' }}>
                pp. {ch.startPage}–{ch.endPage}
              </span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="info-box error">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="action-bar">
        <button
          type="button"
          className="btn-secondary"
          onClick={back}
          disabled={processing}
        >
          <i className="fas fa-arrow-left"></i> Back
        </button>
        <button
          type="button"
          className="btn-accent"
          onClick={handleStartOCR}
          disabled={processing}
        >
          {processing ? (
            <>
              <div className="spinner" style={{ marginRight: 8 }}></div>
              Starting OCR...
            </>
          ) : (
            <>
              <i className="fas fa-check"></i> Proceed to Output
            </>
          )}
        </button>
      </div>
    </div>
  )
}
