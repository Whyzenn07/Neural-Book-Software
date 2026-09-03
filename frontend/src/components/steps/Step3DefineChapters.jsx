/**
 * Step 3 - Index & Chapter Details
 * Left side: Real visual preview of the Index Page (Table of Contents)
 * Right side: Automatic TOC detection from Index Page + manual chapter editing
 */
import { useState, useEffect, useMemo } from 'react'

export default function Step3DefineChapters({ state, update, next, back }) {
  const {
    jobId,
    indexPage = 5,
    startPage = 1,
    endPage = 100,
    pageCount = 100,
    filteredPages = [],
    removedPages = [],
  } = state

  // ── Filtered Pages & Continuous Book Page Mapping ──────────────────────────
  const effectiveFilteredPages = useMemo(() => {
    const idx = parseInt(indexPage) || 0
    const s = parseInt(startPage) || 1
    const e = parseInt(endPage) || pageCount
    const removed = new Set((removedPages || []).map(Number))

    if (filteredPages && filteredPages.length > 0) {
      return filteredPages.map(Number).filter((p) => p !== idx && !removed.has(p))
    }

    return Array.from({ length: e - s + 1 }, (_, i) => s + i).filter(
      (p) => !removed.has(p) && p !== idx
    )
  }, [filteredPages, startPage, endPage, pageCount, removedPages, indexPage])

  const totalBookPages = Math.max(1, effectiveFilteredPages.length)
  const firstPdfPage = effectiveFilteredPages[0] ?? parseInt(startPage) ?? 1
  const lastPdfPage = effectiveFilteredPages[effectiveFilteredPages.length - 1] ?? parseInt(endPage) ?? pageCount

  const bookPageToPdfPage = (bookPage) => {
    const i = Math.max(0, Math.min(parseInt(bookPage) - 1, totalBookPages - 1))
    return effectiveFilteredPages[i] ?? effectiveFilteredPages[totalBookPages - 1] ?? 1
  }

  // ── Default Slice Generator (Fallback) ─────────────────────────────────────
  const generateDefaultEntries = (count, total = totalBookPages) => {
    const n = Math.max(1, parseInt(count) || 1)
    const step = Math.max(1, Math.floor(total / n))

    return Array.from({ length: n }, (_, i) => {
      const bookStart = i === 0 ? 1 : i * step + 1
      const bookEnd = i === n - 1 ? total : Math.min(total, (i + 1) * step)
      return {
        title: `Chapter ${i + 1}`,
        startPage: bookStart,
        endPage: Math.max(bookStart, bookEnd),
      }
    })
  }

  const [chapterCount, setChapterCount] = useState(
    state.chapters && state.chapters.length > 0 ? state.chapters.length : state.chapterCount || 5
  )
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectMsg, setDetectMsg] = useState(null)

  const [entries, setEntries] = useState(() => {
    if (state.chapters && state.chapters.length > 0) {
      return state.chapters.map((ch, idx) => ({
        title: ch.title || `Chapter ${idx + 1}`,
        startPage: Math.max(1, Math.min(parseInt(ch.startPage ?? ch.book_start_page) || 1, totalBookPages)),
        endPage: Math.max(1, Math.min(parseInt(ch.endPage ?? ch.book_end_page) || totalBookPages, totalBookPages)),
      }))
    }
    return generateDefaultEntries(chapterCount, totalBookPages)
  })

  // ── Automatic TOC Detection from Index Page ───────────────────────────────
  const detectTocFromIndexPage = async () => {
    if (!jobId) return
    setIsDetecting(true)
    setDetectMsg(null)

    try {
      const res = await fetch(`/api/detect-toc/${jobId}/${indexPage}`)
      if (res.ok) {
        const data = await res.json()
        if (data.detected && data.chapters && data.chapters.length > 0) {
          const detectedEntries = data.chapters.map((ch, idx) => {
            const sp = Math.max(1, Math.min(parseInt(ch.startPage) || 1, totalBookPages))
            const ep = Math.max(sp, Math.min(parseInt(ch.endPage) || totalBookPages, totalBookPages))
            return {
              title: ch.title || `Chapter ${idx + 1}`,
              startPage: sp,
              endPage: ep,
            }
          })
          setEntries(detectedEntries)
          setChapterCount(detectedEntries.length)
          setDetectMsg(`Auto-detected ${detectedEntries.length} chapters from Table of Contents.`)
          update({ chapterCount: detectedEntries.length, chapters: detectedEntries })
          return
        }
      }
      setDetectMsg('Could not parse chapters automatically from this page. Edit manually below.')
    } catch (err) {
      console.error('TOC detection error:', err)
      setDetectMsg('Auto-detect error. Please use manual entry.')
    } finally {
      setIsDetecting(false)
    }
  }

  // Auto-detect on first load if chapters are not already set
  useEffect(() => {
    if (!state.chapters || state.chapters.length === 0) {
      detectTocFromIndexPage()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, indexPage])

  const handleGenerate = (customCount = chapterCount) => {
    const n = Math.max(1, parseInt(customCount) || 1)
    const generated = generateDefaultEntries(n, totalBookPages)
    setEntries(generated)
    update({ chapterCount: n, chapters: generated })
  }

  const updateEntry = (idx, field, value) => {
    const val = field === 'title' ? value : parseInt(value) || ''
    const nextEntries = entries.map((e, i) => (i === idx ? { ...e, [field]: val } : e))
    setEntries(nextEntries)
    update({ chapters: nextEntries })
  }

  const handleProceedToReview = () => {
    const enrichedChapters = entries.map((e, i) => {
      const bStart = Math.max(1, Math.min(parseInt(e.startPage) || 1, totalBookPages))
      const bEnd = Math.max(bStart, Math.min(parseInt(e.endPage) || totalBookPages, totalBookPages))
      const pdfStart = bookPageToPdfPage(bStart)
      const pdfEnd = bookPageToPdfPage(bEnd)
      const chPdfPages = effectiveFilteredPages.slice(bStart - 1, bEnd)

      return {
        title: e.title || `Chapter ${i + 1}`,
        startPage: bStart,
        endPage: bEnd,
        book_start_page: bStart,
        book_end_page: bEnd,
        start_page: pdfStart,
        end_page: pdfEnd,
        pages: chPdfPages,
      }
    })

    update({
      chapterCount: enrichedChapters.length,
      chapters: enrichedChapters,
      filteredPagesSnapshot: effectiveFilteredPages,
    })
    next()
  }

  return (
    <div className="step4-chapters-container">
      <div className="step-header-text">
        <h2 className="step-title">
          <i className="fas fa-book-open text-navy"></i> Index &amp; Chapter Details
        </h2>
        <p className="step-subtitle">
          The left panel shows the Table of Contents (Index Page). On the right, define chapter boundaries in <strong>Book Page numbers</strong> (1 to {totalBookPages}).
        </p>
      </div>

      {/* Professional Stats / Continuous Numbering Card */}
      <div className="step-summary-card">
        <div className="summary-card-header">
          <div className="summary-card-title">
            <i className="fas fa-info-circle text-navy"></i>
            <span>Continuous Book Page Configuration</span>
          </div>
          <span className="summary-tag">Active Mapping</span>
        </div>
        
        <div className="summary-pills-grid">
          <div className="summary-pill-item">
            <span className="pill-label">Start Page</span>
            <span className="pill-value">
              Page <strong>{firstPdfPage}</strong> &rarr; Book Pg <strong>1</strong>
            </span>
          </div>

          <div className="summary-pill-item">
            <span className="pill-label">Index / TOC</span>
            <span className="pill-value">
              Page <strong>{indexPage}</strong> <small className="pill-muted">(Excluded)</small>
            </span>
          </div>

          <div className="summary-pill-item highlight">
            <span className="pill-label">Total Book Content</span>
            <span className="pill-value">
              <strong>{totalBookPages} Pages</strong> <small className="pill-muted">(Pages {firstPdfPage}&ndash;{lastPdfPage})</small>
            </span>
          </div>
        </div>
      </div>

      <div className="split-layout">
        {/* Left: Table of Contents Real Thumbnail */}
        <div className="split-left">
          <div className="index-visual-card">
            <div className="index-card-header">
              <i className="fas fa-bookmark text-navy"></i>
              <span>Table of Contents (Page {indexPage})</span>
            </div>

            <div className="index-visual-img-wrapper">
              {jobId ? (
                <img
                  src={`/api/page-image/${jobId}/${indexPage}?dpi=150`}
                  alt={`Index Page ${indexPage}`}
                  className="index-real-img"
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    if (e.target.nextSibling) {
                      e.target.nextSibling.style.display = 'flex'
                    }
                  }}
                />
              ) : null}
              <div className="index-fallback-box" style={{ display: jobId ? 'none' : 'flex' }}>
                <i className="fas fa-file-alt"></i>
                <span>Index Page {indexPage}</span>
              </div>
            </div>

            <div className="index-card-footer">
              <button
                type="button"
                className="btn-autodetect-toc"
                onClick={detectTocFromIndexPage}
                disabled={isDetecting}
              >
                <i className={`fas ${isDetecting ? 'fa-spinner fa-spin' : 'fa-magic'}`}></i>{' '}
                {isDetecting ? 'Reading Table of Contents...' : 'Auto-Detect from Index Page'}
              </button>
              {detectMsg && (
                <div className="toc-status-feedback">
                  <i className="fas fa-check-circle"></i>
                  <span>{detectMsg}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Chapter Definitions & Manual Generate */}
        <div className="split-right">
          <div className="chapter-generator-card">
            <div className="generator-header-line">
              <label className="generator-label" htmlFor="chapterCountInput">
                <i className="fas fa-layer-group text-navy"></i> Number of Chapters
              </label>
              <span className="generator-hint">Adjust count and click generate or edit each below</span>
            </div>
            
            <div className="generator-input-row">
              <input
                id="chapterCountInput"
                type="number"
                min="1"
                max="50"
                value={chapterCount}
                onChange={(e) => {
                  setChapterCount(e.target.value)
                  if (parseInt(e.target.value) > 0) {
                    handleGenerate(e.target.value)
                  }
                }}
                className="generator-input"
                placeholder="e.g. 5"
              />
              <button
                type="button"
                className="btn-generator"
                onClick={() => handleGenerate(chapterCount)}
              >
                <i className="fas fa-sync-alt"></i> Manual Generate Chapters
              </button>
            </div>
          </div>

          {/* List of Chapter Input Rows */}
          <div className="chapter-entries-scroll">
            {entries.map((entry, idx) => {
              const bookStart = Math.max(1, parseInt(entry.startPage) || 1)
              const bookEnd = Math.max(bookStart, Math.min(parseInt(entry.endPage) || totalBookPages, totalBookPages))
              const pdfStart = bookPageToPdfPage(bookStart)
              const pdfEnd = bookPageToPdfPage(bookEnd)
              const pageCountInCh = Math.max(1, bookEnd - bookStart + 1)

              return (
                <div key={idx} className="chapter-entry-card">
                  <div className="ch-title-box">
                    <span className="ch-badge">Ch {idx + 1}</span>
                    <input
                      type="text"
                      className="ch-title-input"
                      value={entry.title || `Chapter ${idx + 1}`}
                      onChange={(e) => updateEntry(idx, 'title', e.target.value)}
                      placeholder={`Chapter ${idx + 1} title`}
                    />
                  </div>
                  <div className="ch-range-inputs">
                    <div className="ch-range-field">
                      <label>Start</label>
                      <input
                        type="number"
                        min={1}
                        max={totalBookPages}
                        value={entry.startPage}
                        onChange={(e) => updateEntry(idx, 'startPage', e.target.value)}
                      />
                    </div>
                    <span className="ch-range-dash">–</span>
                    <div className="ch-range-field">
                      <label>End</label>
                      <input
                        type="number"
                        min={1}
                        max={totalBookPages}
                        value={entry.endPage}
                        onChange={(e) => updateEntry(idx, 'endPage', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="ch-pdf-hint">
                    <i className="fas fa-file-pdf"></i>
                    <span>
                      Maps to <strong>Pages {pdfStart}–{pdfEnd}</strong> ({pageCountInCh} {pageCountInCh === 1 ? 'page' : 'pages'})
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar" style={{ marginTop: 24 }}>
        <button type="button" className="btn-secondary" onClick={back}>
          <i className="fas fa-arrow-left"></i> Back to Range &amp; Filter (Step 2)
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={handleProceedToReview}
          disabled={entries.length === 0}
        >
          Next: Review Pages &amp; Zoom (Step 4) <i className="fas fa-arrow-right"></i>
        </button>
      </div>
    </div>
  )
}
