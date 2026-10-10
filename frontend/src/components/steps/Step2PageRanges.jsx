/**
 * Step 2 - Range & Filter (iLovePDF Style)
 * Left: Scrollable real PDF page visual thumbnails with interactive remove toggle
 * Right: Sidebar with Start Page, End Page, Index Page, and Pages to Remove controls
 */
import { useState, useMemo } from 'react'
import { getApiUrl } from '../../apiConfig'

export default function Step2PageRanges({ state, update, next, back }) {
  const { jobId, pageCount = 100 } = state

  const [startPage, setStartPage] = useState(state.startPage || 1)
  const [endPage, setEndPage] = useState(state.endPage || pageCount)
  const [indexPage, setIndexPage] = useState(state.indexPage || 5)
  const [removedPages, setRemovedPages] = useState(state.removedPages || [])
  const [removeInputText, setRemoveInputText] = useState(
    (state.removedPages || []).join(', ')
  )
  const [toastMessage, setToastMessage] = useState(null)
  const [cols, setCols] = useState(6) // 4, 6, 8 columns

  const allPages = useMemo(
    () => Array.from({ length: pageCount }, (_, i) => i + 1),
    [pageCount]
  )

  // Parse removed pages input text
  const parseRemovedText = (text) => {
    if (!text || !text.trim()) return []
    const parts = text.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean)
    const list = []
    parts.forEach((p) => {
      if (p.includes('-')) {
        const [a, b] = p.split('-').map((v) => parseInt(v.trim()))
        if (!isNaN(a) && !isNaN(b)) {
          const min = Math.min(a, b)
          const max = Math.max(a, b)
          for (let i = min; i <= max; i++) {
            if (i >= 1 && i <= pageCount && !list.includes(i)) list.push(i)
          }
        }
      } else {
        const num = parseInt(p)
        if (!isNaN(num) && num >= 1 && num <= pageCount && !list.includes(num)) {
          list.push(num)
        }
      }
    })
    return list.sort((a, b) => a - b)
  }

  // Toggle single page removal when clicking on a thumbnail
  const toggleRemovePage = (pageNum) => {
    let nextRemoved
    if (removedPages.includes(pageNum)) {
      nextRemoved = removedPages.filter((p) => p !== pageNum)
    } else {
      nextRemoved = [...removedPages, pageNum].sort((a, b) => a - b)
    }
    setRemovedPages(nextRemoved)
    setRemoveInputText(nextRemoved.join(', '))
  }

  // Apply Filter Handler
  const handleApplyFilter = () => {
    const s = Math.max(1, parseInt(startPage) || 1)
    const e = Math.min(pageCount, parseInt(endPage) || pageCount)
    const idx = Math.max(1, Math.min(pageCount, parseInt(indexPage) || 1))
    const removedList = parseRemovedText(removeInputText)

    setRemovedPages(removedList)
    setRemoveInputText(removedList.join(', '))

    // Calculate final included pages (exclude removed list AND index/TOC page)
    const filtered = allPages.filter(
      (p) => p >= s && p <= e && !removedList.includes(p) && p !== idx
    )

    update({
      startPage: s,
      endPage: e,
      indexPage: idx,
      removedPages: removedList,
      filteredPages: filtered,
    })

    // Show success toast popup
    showToast(`Filter applied! ${filtered.length} active content pages (Page ${s} → Book Page 1, Page ${e} → Book Page ${filtered.length}).`)
  }

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 4000)
  }

  const handleNext = () => {
    handleApplyFilter()
    next()
  }

  const sVal = parseInt(startPage) || 1
  const eVal = parseInt(endPage) || pageCount
  const hasError = sVal < 1 || eVal > pageCount || sVal > eVal

  return (
    <div className="step2-ilovepdf-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          <div className="toast-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="toast-content">
            <div className="toast-title">Success</div>
            <div className="toast-msg">{toastMessage}</div>
          </div>
          <button className="toast-close" onClick={() => setToastMessage(null)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Main 2-Column Split: Visual Grid Left & Control Sidebar Right */}
      <div className="ilovepdf-split-layout">
        {/* LEFT: Scrollable Page Visual Grid */}
        <div className="ilovepdf-left-pane">
          <div className="pane-header">
            <div className="pane-header-title">
              <i className="fas fa-th-large text-navy"></i>
              <span>Document Pages ({pageCount} Pages)</span>
            </div>
            <div className="pane-grid-options">
              <span className="grid-label">Columns:</span>
              {[4, 6, 8].map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`btn-col-size ${cols === c ? 'active' : ''}`}
                  onClick={() => setCols(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="ilovepdf-scroll-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {allPages.map((pageNum) => {
              const isOutRange = pageNum < sVal || pageNum > eVal
              const isRemoved = removedPages.includes(pageNum) || isOutRange
              const isIndex = parseInt(indexPage) === pageNum

              let cardClass = 'ilovepdf-page-card'
              if (isRemoved) cardClass += ' is-removed'
              if (isIndex) cardClass += ' is-index'

              return (
                <div
                  key={pageNum}
                  className={cardClass}
                  onClick={() => toggleRemovePage(pageNum)}
                  title={`Click to ${isRemoved ? 'restore' : 'exclude'} Page ${pageNum}`}
                >
                  {/* Thumbnail Image */}
                  <div className="page-img-wrapper">
                    {jobId ? (
                      <img
                        src={getApiUrl(`/api/page-image/${jobId}/${pageNum}?dpi=35`)}
                        alt={`Page ${pageNum}`}
                        className="page-thumbnail-img"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div className="page-fallback-thumb" style={{ display: jobId ? 'none' : 'flex' }}>
                      <i className="fas fa-file-pdf"></i>
                      <span>{pageNum}</span>
                    </div>

                    {/* Removed Overlay */}
                    {isRemoved && (
                      <div className="removed-overlay">
                        <i className="fas fa-times-circle"></i>
                        <span>Excluded</span>
                      </div>
                    )}

                    {/* Index Badge */}
                    {isIndex && !isRemoved && (
                      <div className="index-tag-badge">
                        <i className="fas fa-bookmark"></i> IDX
                      </div>
                    )}
                  </div>

                  {/* Page Footer Label */}
                  <div className="page-card-footer">
                    <span className="page-footer-text">Page {pageNum}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT: iLovePDF Style Sidebar Panel */}
        <div className="ilovepdf-right-sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-title">
              <i className="fas fa-sliders-h text-red"></i> Filter &amp; Remove Pages
            </h3>

            <div className="sidebar-info-banner">
              <i className="fas fa-info-circle"></i>
              <span>Click any page thumbnail on the left to exclude or restore it from extraction.</span>
            </div>

            <div className="sidebar-stat-row">
              <span className="stat-label">Total Pages:</span>
              <span className="stat-value">{pageCount}</span>
            </div>

            <div className="sidebar-form-divider"></div>

            {/* Start Page & End Page */}
            <div className="sidebar-form-group">
              <label>
                <i className="fas fa-step-forward text-navy"></i> Start Page
              </label>
              <input
                type="number"
                min={1}
                max={pageCount}
                value={startPage}
                onChange={(e) => setStartPage(e.target.value)}
                className="sidebar-input"
                placeholder="1"
              />
            </div>

            <div className="sidebar-form-group">
              <label>
                <i className="fas fa-step-backward text-navy"></i> End Page
              </label>
              <input
                type="number"
                min={1}
                max={pageCount}
                value={endPage}
                onChange={(e) => setEndPage(e.target.value)}
                className="sidebar-input"
                placeholder={`${pageCount}`}
              />
            </div>

            <div className="sidebar-form-group">
              <label>
                <i className="fas fa-bookmark text-amber"></i> Index Page (Table of Contents)
              </label>
              <input
                type="number"
                min={1}
                max={pageCount}
                value={indexPage}
                onChange={(e) => setIndexPage(e.target.value)}
                className="sidebar-input"
                placeholder="5"
              />
              <small className="field-hint">Page reference for the book's table of contents</small>
            </div>

            <div className="sidebar-form-group">
              <label>
                <i className="fas fa-trash-alt text-red"></i> Pages to Remove:
              </label>
              <input
                type="text"
                value={removeInputText}
                onChange={(e) => {
                  setRemoveInputText(e.target.value)
                  setRemovedPages(parseRemovedText(e.target.value))
                }}
                className="sidebar-input"
                placeholder="e.g. 1, 2, 5, 141"
              />
              <small className="field-hint">Comma-separated or range (e.g. 1-3, 140)</small>
            </div>

            {hasError && (
              <div className="sidebar-error">
                <i className="fas fa-exclamation-circle"></i> Invalid page range!
              </div>
            )}

            {/* Apply Filter Big Button */}
            <button
              type="button"
              className="btn-ilovepdf-apply"
              onClick={handleApplyFilter}
              disabled={hasError}
            >
              <i className="fas fa-filter"></i> Apply Filter
            </button>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar" style={{ marginTop: 24 }}>
        <button type="button" className="btn-secondary" onClick={back}>
          <i className="fas fa-arrow-left"></i> Back to Upload
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={handleNext}
          disabled={hasError}
        >
          Next: Index &amp; Chapters (Step 3) <i className="fas fa-arrow-right"></i>
        </button>
      </div>
    </div>
  )
}
