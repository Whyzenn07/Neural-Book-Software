/**
 * Step 1 - Upload PDF
 * Clean single-focus upload zone with validation warning modals
 */
import { useState, useRef } from 'react'
import { getApiUrl } from '../../apiConfig'

export default function Step1Upload({ state, update, next }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [modalError, setModalError] = useState(null) // { title, message, type }
  const inputRef = useRef(null)

  const { fileName, pageCount, jobId } = state

  const handleLoadDemo = () => {
    update({
      jobId: 'demo-sample-job',
      fileName: 'Sample_Academic_Book.pdf',
      cleanName: 'Sample_Academic_Book',
      pageCount: 30,
      startPage: 1,
      endPage: 30,
      indexPage: 3,
      removedPages: [],
      filteredPages: Array.from({ length: 30 }, (_, i) => i + 1),
      chapters: [
        { heading: "Chapter 1", title: "Introduction to Neural Networks", start_page: 1, end_page: 10, page_count: 10 },
        { heading: "Chapter 2", title: "Deep Learning Architectures", start_page: 11, end_page: 20, page_count: 10 },
        { heading: "Chapter 3", title: "Practical Implementation & Cases", start_page: 21, end_page: 30, page_count: 10 }
      ],
    })
    next()
  }

  const handleFile = async (file) => {
    if (!file) return

    // Validation: File format
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setModalError({
        title: 'Invalid File Format',
        message: 'This application only supports PDF files (.pdf). Please select a valid PDF document.',
        type: 'format_error',
      })
      return
    }

    // Validation: File size
    if (file.size > 100 * 1024 * 1024) {
      setModalError({
        title: 'File Too Large',
        message: 'The file exceeds the maximum limit of 100 MB. Please compress your PDF first.',
        type: 'size_error',
      })
      return
    }

    setModalError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(getApiUrl('/api/upload'), { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `Upload failed (${res.status})`)
      }

      const data = await res.json()
      const totalPages = data.page_count
      update({
        jobId: data.job_id,
        fileName: data.filename,
        cleanName: data.clean_name,
        pageCount: totalPages,
        startPage: 1,
        endPage: totalPages,
        indexPage: Math.min(5, totalPages),
        removedPages: [],
        filteredPages: Array.from({ length: totalPages }, (_, i) => i + 1),
        chapters: [],
      })
    } catch (err) {
      setModalError({
        title: 'Upload Failed',
        message: err.message || 'An error occurred while processing your PDF on the server.',
        type: 'upload_error',
      })
    } finally {
      setUploading(false)
    }
  }

  const onDragOver = (e) => {
    e.preventDefault()
    setDragging(true)
  }

  const onDragLeave = () => setDragging(false)

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleProceed = () => {
    if (!jobId && !fileName) {
      setModalError({
        title: 'No PDF Uploaded',
        message: 'Please upload a PDF file before proceeding to the next step.',
        type: 'missing_file',
      })
      return
    }
    next()
  }

  return (
    <div className="step1-container">
      <div className="step-header-text">
        <h2 className="step-title">
          <i className="fas fa-file-pdf text-amber"></i> Upload PDF Document
        </h2>
        <p className="step-subtitle">
          Upload your book or course material PDF to split it by chapter and extract content to Markdown.
        </p>
      </div>

      {/* Upload Zone Card */}
      <div
        className={`upload-zone${dragging ? ' dragging' : ''}${fileName ? ' has-file' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <div className="upload-icon-wrapper">
          {uploading ? (
            <div className="spinner-navy"></div>
          ) : fileName ? (
            <div className="file-success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
          ) : (
            <div className="upload-cloud-icon">
              <i className="fas fa-cloud-upload-alt"></i>
            </div>
          )}
        </div>

        <h3 className="upload-headline">
          {uploading
            ? 'Uploading & analyzing PDF...'
            : fileName
            ? fileName
            : 'Drop your PDF here or click to browse'}
        </h3>

        <p className="upload-subtext">
          {uploading
            ? 'Please wait a moment...'
            : fileName
            ? `Document ready • ${pageCount} pages detected`
            : 'Supports .pdf up to 100 MB'}
        </p>

        {fileName && (
          <div className="file-success-badge">
            <i className="fas fa-file-pdf"></i>
            <span>{pageCount} Pages Loaded</span>
            <button
              type="button"
              className="btn-reupload"
              onClick={(e) => {
                e.stopPropagation()
                inputRef.current?.click()
              }}
            >
              <i className="fas fa-sync-alt"></i> Replace File
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          className="file-input-hidden"
          accept=".pdf,application/pdf"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {/* Action Bar */}
      <div className="action-bar" style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleLoadDemo}
          style={{ minWidth: 200 }}
        >
          <i className="fas fa-play-circle text-amber"></i> Coba Live Demo (Sample)
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={handleProceed}
          disabled={uploading}
          style={{ minWidth: 220 }}
        >
          Next: Range &amp; Filter <i className="fas fa-arrow-right"></i>
        </button>
      </div>

      {/* Modal Popup Warning */}
      {modalError && (
        <div className="modal-overlay" onClick={() => setModalError(null)}>
          <div className="modal-card modal-warning" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-badge warning">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3 className="modal-title">{modalError.title}</h3>
            <p className="modal-desc">{modalError.message}</p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-modal-primary"
                onClick={() => {
                  setModalError(null)
                  if (modalError.type === 'missing_file' || modalError.type === 'format_error') {
                    inputRef.current?.click()
                  }
                }}
              >
                {modalError.type === 'missing_file' ? 'Select PDF File' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
