/**
 * Step 1 - Upload PDF & Choose View
 * Matches reference HTML layout and functionality
 */
import { useState, useRef, useMemo } from 'react'
import PageGrid from '../PageGrid'

export default function Step1Upload({ state, update, next }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const { pageCount, fileName, matrixCols } = state

  // Build pages array from pageCount (or mock 100 pages if not uploaded yet but demoing)
  const pages = useMemo(
    () => Array.from({ length: pageCount || 0 }, (_, i) => i + 1),
    [pageCount]
  )

  const handleFile = async (file) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a PDF file.')
      return
    }
    if (file.size > 100 * 1024 * 1024) {
      setError('File too large. Maximum 100 MB.')
      return
    }

    setError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `Upload failed (${res.status})`)
      }

      const data = await res.json()
      const totalPages = data.page_count
      update({
        jobId: data.job_id,
        fileName: data.filename,
        pageCount: totalPages,
        startPage: 1,
        endPage: totalPages,
        indexPage: Math.min(5, totalPages),
        filteredPages: Array.from({ length: totalPages }, (_, i) => i + 1),
        chapters: [],
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)
  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleProceed = () => {
    next()
  }

  return (
    <div>
      <h2 className="step-title">
        <i className="fas fa-file-pdf"></i> Upload PDF &amp; Choose View
      </h2>
      <p className="step-subtitle">
        Upload your PDF, then select a matrix layout to view all pages.
      </p>

      {/* Upload Zone */}
      <div
        className={`upload-zone${dragging ? ' dragging' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <div className="upload-icon">
          {uploading ? (
            <div className="spinner-navy"></div>
          ) : (
            <i className="fas fa-cloud-upload-alt"></i>
          )}
        </div>
        <h4>
          {uploading
            ? 'Uploading and processing PDF...'
            : 'Drop your PDF here or click to browse'}
        </h4>
        <p>{uploading ? 'Please wait a moment' : 'Supports .pdf up to 100 MB'}</p>

        {fileName && (
          <div className="file-name-pill">
            <i className="fas fa-file-pdf" style={{ marginRight: 6 }}></i>
            {fileName} ({pageCount} pages)
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          className="file-input-hidden"
          accept=".pdf"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {/* Error notification */}
      {error && (
        <div className="info-box error">
          <i className="fas fa-exclamation-triangle" style={{ marginTop: 2 }}></i>
          <span>{error}</span>
        </div>
      )}

      {/* Page Grid */}
      <PageGrid
        pages={pages}
        cols={matrixCols}
        indexPage={state.indexPage}
        onColsChange={(c) => update({ matrixCols: c })}
        showControls={true}
        maxHeight={400}
      />

      {/* Action Bar */}
      <div className="action-bar">
        <button
          type="button"
          className="btn-primary"
          onClick={handleProceed}
          disabled={uploading}
        >
          Next: Define Ranges <i className="fas fa-arrow-right"></i>
        </button>
      </div>
    </div>
  )
}
