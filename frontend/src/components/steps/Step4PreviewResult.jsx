/**
 * Step 4 - Zoom & Final Chapter Page Review
 * Real visual result of filtered pages with Zoom In/Out, size controls, and Instant HD Lightbox Inspector.
 * Features chapter badge tags on each page card and triggers the Cross-Check Modal before Step 5.
 */
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'

export default function Step4PreviewResult({ state, update, next, back }) {
  const {
    jobId,
    filteredPages = [],
    pageCount = 100,
    indexPage = 5,
    chapters = [],
    startPage = 1,
    endPage = 100,
  } = state

  const [zoomLevel, setZoomLevel] = useState(100)
  const [activeModalPage, setActiveModalPage] = useState(null)
  const [hdLoaded, setHdLoaded] = useState(false)
  const [showCrossCheckModal, setShowCrossCheckModal] = useState(false)
  const preloadedMap = useRef(new Set())

  const displayPages = useMemo(() => {
    if (filteredPages && filteredPages.length > 0) return filteredPages.map(Number)
    return Array.from({ length: Number(pageCount) || 100 }, (_, i) => i + 1)
  }, [filteredPages, pageCount])

  const totalBookPages = displayPages.length

  // Map each book page index (1..N) to its chapter
  const getChapterForBookPage = useCallback((bookPageNum) => {
    if (!chapters || chapters.length === 0) return null
    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i]
      const s = parseInt(ch.startPage ?? ch.book_start_page) || 1
      const e = parseInt(ch.endPage ?? ch.book_end_page) || totalBookPages
      if (bookPageNum >= s && bookPageNum <= e) {
        return { index: i + 1, title: ch.title || `Chapter ${i + 1}` }
      }
    }
    return null
  }, [chapters, totalBookPages])

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 20, 200))
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 20, 60))
  const handleResetZoom = () => setZoomLevel(100)

  const openModal = (pageNum) => {
    setHdLoaded(false)
    setActiveModalPage(Number(pageNum))
  }
  const closeModal = () => setActiveModalPage(null)

  const currentIdx = useMemo(() => {
    if (activeModalPage === null) return -1
    return displayPages.findIndex((p) => Number(p) === Number(activeModalPage))
  }, [displayPages, activeModalPage])

  const handleNextPageModal = useCallback((e) => {
    if (e && e.stopPropagation) e.stopPropagation()
    if (currentIdx >= 0 && currentIdx < displayPages.length - 1) {
      setHdLoaded(false)
      setActiveModalPage(displayPages[currentIdx + 1])
    }
  }, [currentIdx, displayPages])

  const handlePrevPageModal = useCallback((e) => {
    if (e && e.stopPropagation) e.stopPropagation()
    if (currentIdx > 0) {
      setHdLoaded(false)
      setActiveModalPage(displayPages[currentIdx - 1])
    }
  }, [currentIdx, displayPages])

  // Preload adjacent pages for instant navigation
  useEffect(() => {
    if (!jobId || activeModalPage === null) return
    const pagesToPreload = [
      displayPages[currentIdx + 1],
      displayPages[currentIdx - 1],
    ].filter(Boolean)
    pagesToPreload.forEach((p) => {
      if (!preloadedMap.current.has(p)) {
        preloadedMap.current.add(p)
        const img = new Image()
        img.src = `/api/page-image/${jobId}/${p}?dpi=120`
      }
    })
  }, [activeModalPage, currentIdx, displayPages, jobId])

  // Keyboard navigation
  useEffect(() => {
    if (activeModalPage === null) return
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNextPageModal()
      else if (e.key === 'ArrowLeft') handlePrevPageModal()
      else if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeModalPage, handleNextPageModal, handlePrevPageModal])

  const handleConfirmAndProceedToOutput = () => {
    setShowCrossCheckModal(false)
    next()
  }

  return (
    <div className="step3-preview-container">
      {/* Header */}
      <div className="step-header-text">
        <h2 className="step-title">
          <i className="fas fa-search-plus text-navy"></i> Visual Page Inspection &amp; Chapter Review
        </h2>
        <p className="step-subtitle">
          Showing <strong>{displayPages.length} active content pages</strong> (Book Pages 1 to {displayPages.length}).
          Review pages and verify chapter assignments before generating outputs.
        </p>
      </div>

      {/* Toolbar */}
      <div className="preview-toolbar">
        <div className="preview-summary-badge">
          <i className="fas fa-layer-group text-navy"></i>
          <span>
            Showing <strong>{displayPages.length}</strong> of <strong>{pageCount}</strong> pages ({pageCount - displayPages.length} excluded)
          </span>
        </div>

        <div className="zoom-control-group">
          <span className="zoom-label">
            <i className="fas fa-search"></i> Zoom:
          </span>
          <button
            type="button"
            className="btn-zoom"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 60}
            title="Zoom Out"
          >
            <i className="fas fa-minus"></i>
          </button>
          <span className="zoom-percentage">{zoomLevel}%</span>
          <button
            type="button"
            className="btn-zoom"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 200}
            title="Zoom In"
          >
            <i className="fas fa-plus"></i>
          </button>
          <button
            type="button"
            className="btn-zoom-reset"
            onClick={handleResetZoom}
            title="Reset to 100%"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Visual Scroll Container */}
      <div className="preview-scroll-viewport">
        {displayPages.length === 0 ? (
          <div className="preview-empty-state">
            <i className="fas fa-exclamation-triangle"></i>
            <h4>No pages selected</h4>
            <p>All pages have been excluded. Please go back and adjust your page range.</p>
            <button type="button" className="btn-secondary" onClick={back} style={{ marginTop: 12 }}>
              <i className="fas fa-arrow-left"></i> Back to Step 3
            </button>
          </div>
        ) : (
          <div
            className="preview-dynamic-grid"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(${Math.round(150 * (zoomLevel / 100))}px, 1fr))`,
            }}
          >
            {displayPages.map((pageNum, idx) => {
              const bookPageNum = idx + 1
              const chInfo = getChapterForBookPage(bookPageNum)

              return (
                <div
                  key={pageNum}
                  className="preview-page-card"
                  onClick={() => openModal(pageNum)}
                  title={`Click to enlarge Page ${bookPageNum} (Original PDF Page ${pageNum})`}
                >
                  <div className="preview-img-container">
                    {jobId ? (
                      <img
                        src={`/api/page-image/${jobId}/${pageNum}?dpi=35`}
                        alt={`Book Page ${bookPageNum}`}
                        className="preview-img"
                        loading="eager"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'flex'
                          }
                        }}
                      />
                    ) : null}
                    <div className="preview-fallback" style={{ display: jobId ? 'none' : 'flex' }}>
                      <i className="fas fa-file-pdf"></i>
                      <span>Page {bookPageNum}</span>
                    </div>

                    {/* Hover overlay */}
                    <div className="card-hover-overlay">
                      <i className="fas fa-search-plus"></i>
                      <span>Click to Zoom</span>
                    </div>

                    {/* Chapter indicator badge */}
                    {chInfo && (
                      <div className="preview-index-tag" style={{ background: 'linear-gradient(135deg, #003c57, #0284c7)' }}>
                        <i className="fas fa-bookmark"></i> Ch {chInfo.index}
                      </div>
                    )}
                  </div>

                  <div className="preview-card-footer">
                    <span className="page-badge-number">
                      Book Page {bookPageNum}{' '}
                      {pageNum !== bookPageNum ? <small style={{ opacity: 0.7, fontWeight: 'normal' }}>(Page {pageNum})</small> : null}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Verify box */}
      <div className="preview-verify-box">
        <i className="fas fa-check-double text-green"></i>
        <div>
          <strong>Page Verification:</strong> Make sure all chapter pages are included and chapter badges are correctly assigned. Proceed when everything looks correct.
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar" style={{ marginTop: 24 }}>
        <button type="button" className="btn-secondary" onClick={back}>
          <i className="fas fa-arrow-left"></i> Back to Chapters (Step 3)
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setShowCrossCheckModal(true)}
          disabled={displayPages.length === 0}
        >
          Next: Confirm &amp; Generate Outputs (Step 5) <i className="fas fa-arrow-right"></i>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          HD LIGHTBOX MODAL (original structure)
          ═══════════════════════════════════════════════════════════════ */}
      {activeModalPage !== null && (
        <div className="lightbox-overlay" onClick={closeModal}>
          <div className="lightbox-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-header">
              <div className="lightbox-title">
                <i className="fas fa-file-pdf text-navy"></i> Book Page {currentIdx + 1} — Full Zoom
                <small style={{ fontWeight: 500, color: 'var(--muted)', marginLeft: 8 }}>
                  (Source Page {activeModalPage})
                </small>
              </div>
              <div className="lightbox-actions">
                <button
                  type="button"
                  className="btn-lightbox-nav"
                  onClick={handlePrevPageModal}
                  disabled={currentIdx <= 0}
                  title="Previous Page (or Left Arrow)"
                >
                  <i className="fas fa-chevron-left"></i> Prev
                </button>
                <span className="lightbox-counter">
                  {currentIdx >= 0 ? currentIdx + 1 : 1} / {displayPages.length}
                </span>
                <button
                  type="button"
                  className="btn-lightbox-nav"
                  onClick={handleNextPageModal}
                  disabled={currentIdx < 0 || currentIdx >= displayPages.length - 1}
                  title="Next Page (or Right Arrow)"
                >
                  Next <i className="fas fa-chevron-right"></i>
                </button>
                <button
                  type="button"
                  className="btn-lightbox-close"
                  onClick={closeModal}
                  title="Close (Esc)"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            <div className="lightbox-body">
              {jobId ? (
                <div className="lightbox-img-holder">
                  {/* Instant cached thumbnail */}
                  <img
                    src={`/api/page-image/${jobId}/${activeModalPage}?dpi=90`}
                    alt={`Page ${activeModalPage}`}
                    className="lightbox-base-img"
                  />
                  {/* HD upgrade fades in */}
                  <img
                    src={`/api/page-image/${jobId}/${activeModalPage}?dpi=150`}
                    alt={`High Res Page ${activeModalPage}`}
                    className={`lightbox-hd-img ${hdLoaded ? 'loaded' : ''}`}
                    onLoad={() => setHdLoaded(true)}
                  />
                </div>
              ) : (
                <div className="lightbox-demo-content">
                  <h3>Page {activeModalPage} Preview</h3>
                  <p>The original document will be rendered in high resolution here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          CROSS-CHECK VERIFICATION MODAL (SKIPS BLUE & WHITE THEME)
          ═══════════════════════════════════════════════════════════════ */}
      {showCrossCheckModal && (
        <div className="cc-modal-overlay" onClick={() => setShowCrossCheckModal(false)}>
          <div className="cc-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cc-modal-header">
              <div className="cc-header-icon-wrap">
                <div className="cc-header-icon">
                  <i className="fas fa-clipboard-check"></i>
                </div>
              </div>
              <div className="cc-header-text">
                <h3 className="cc-title">Chapter Page Verification</h3>
                <p className="cc-subtitle">Please cross-check chapter page numbers before generating outputs</p>
              </div>
              <button
                className="cc-close-btn"
                type="button"
                onClick={() => setShowCrossCheckModal(false)}
                aria-label="Close"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="cc-notice-box">
              <i className="fas fa-info-circle cc-notice-icon"></i>
              <p className="cc-notice-text">
                Continuous Book Pages: <strong>1 to {totalBookPages}</strong> ({totalBookPages} active pages total).
                Clicking &quot;Ok - Generate&quot; will split PDF chapters and extract Markdown OCR.
              </p>
            </div>

            {/* Chapter summary list */}
            <div className="cc-chapter-list">
              {(chapters && chapters.length > 0 ? chapters : [{ title: 'Complete Book', startPage: 1, endPage: totalBookPages }]).map((ch, idx) => {
                const bookStart = Math.max(1, parseInt(ch.startPage ?? ch.book_start_page) || 1)
                const bookEnd = Math.max(bookStart, Math.min(parseInt(ch.endPage ?? ch.book_end_page) || totalBookPages, totalBookPages))
                const pages = Math.max(1, bookEnd - bookStart + 1)
                const pdfStart = ch.start_page ?? displayPages[bookStart - 1] ?? bookStart
                const pdfEnd = ch.end_page ?? displayPages[bookEnd - 1] ?? bookEnd

                return (
                  <div key={idx} className="cc-chapter-row">
                    <div className="cc-ch-number">
                      <span>{idx + 1}</span>
                    </div>
                    <div className="cc-ch-info">
                      <span className="cc-ch-name">{ch.title || `Chapter ${idx + 1}`}</span>
                      <span className="cc-ch-range">
                        Book Pages <strong>{bookStart} — {bookEnd}</strong>
                        <span className="cc-pdf-pages"> (Pages {pdfStart}–{pdfEnd})</span>
                      </span>
                    </div>
                    <div className="cc-ch-pages-badge">
                      <i className="fas fa-file-alt"></i>
                      <span>{pages} pgs</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Summary footer */}
            <div className="cc-summary-footer">
              <i className="fas fa-layer-group"></i>
              <span>
                Total: <strong>{chapters.length} Chapters</strong> — {totalBookPages} Book Pages
              </span>
            </div>

            {/* Action buttons */}
            <div className="cc-modal-actions">
              <button
                type="button"
                className="cc-btn-cancel"
                onClick={() => setShowCrossCheckModal(false)}
              >
                <i className="fas fa-pencil-alt"></i>
                <span>Cancel — Edit</span>
              </button>
              <button
                type="button"
                className="cc-btn-confirm"
                onClick={handleConfirmAndProceedToOutput}
              >
                <i className="fas fa-check-circle"></i>
                <span>Ok - Generate Outputs</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
