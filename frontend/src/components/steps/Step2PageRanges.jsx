/**
 * Step 2 - Define Page Ranges
 * Automatically updates filtered range and highlights index page.
 */
import { useState, useMemo, useEffect } from 'react'
import PageGrid from '../PageGrid'

export default function Step2PageRanges({ state, update, next, back }) {
  const { pageCount, matrixCols } = state

  const total = pageCount || 100
  const [startPage, setStartPage] = useState(state.startPage || 1)
  const [endPage, setEndPage] = useState(state.endPage || total)
  const [indexPage, setIndexPage] = useState(state.indexPage || 5)

  const allPages = useMemo(
    () => Array.from({ length: total }, (_, i) => i + 1),
    [total]
  )

  const filteredSet = useMemo(() => {
    const s = Math.max(1, parseInt(startPage) || 1)
    const e = Math.min(total, parseInt(endPage) || total)
    return new Set(allPages.filter((p) => p >= s && p <= e))
  }, [startPage, endPage, allPages, total])

  const applyFilter = (sVal = startPage, eVal = endPage, idxVal = indexPage) => {
    const s = Math.max(1, parseInt(sVal) || 1)
    const e = Math.min(total, parseInt(eVal) || total)
    const idx = Math.max(1, parseInt(idxVal) || 5)

    const filtered = allPages.filter((p) => p >= s && p <= e)
    update({
      startPage: s,
      endPage: e,
      indexPage: idx,
      filteredPages: filtered,
    })
  }

  // Auto-apply whenever start, end, or index page changes
  useEffect(() => {
    applyFilter(startPage, endPage, indexPage)
  }, [startPage, endPage, indexPage, total])

  const s = parseInt(startPage) || 0
  const e = parseInt(endPage) || 0
  const idx = parseInt(indexPage) || 0
  const hasError = s < 1 || e > total || s > e || idx < 1

  const handleNext = () => {
    applyFilter()
    next()
  }

  return (
    <div>
      <h2 className="step-title">
        <i className="fas fa-arrows-alt-h"></i> Define Page Ranges
      </h2>
      <p className="step-subtitle">
        Enter the start, end, and index page numbers. Pages not in the index range will be filtered out.
      </p>

      {/* Range Form */}
      <div className="range-form">
        <div className="field">
          <label>Start Page</label>
          <input
            type="number"
            min={1}
            max={total}
            value={startPage}
            onChange={(e) => setStartPage(e.target.value)}
            placeholder="e.g. 1"
          />
        </div>
        <div className="field">
          <label>End Page</label>
          <input
            type="number"
            min={1}
            max={total}
            value={endPage}
            onChange={(e) => setEndPage(e.target.value)}
            placeholder={`e.g. ${total}`}
          />
        </div>
        <div className="field">
          <label>Index Page (single)</label>
          <input
            type="number"
            min={1}
            max={total}
            value={indexPage}
            onChange={(e) => setIndexPage(e.target.value)}
            placeholder="e.g. 5"
          />
        </div>
        <button
          type="button"
          className="btn-accent"
          onClick={() => applyFilter()}
          disabled={hasError}
        >
          <i className="fas fa-filter"></i> Apply Filter
        </button>
      </div>

      {hasError && (
        <div className="info-box error">
          <i className="fas fa-exclamation-triangle"></i>
          <span>Check your range values: Start ≥ 1, End ≤ {total}, Start ≤ End</span>
        </div>
      )}

      {/* Filtered Grid */}
      <PageGrid
        pages={allPages}
        cols={matrixCols}
        indexPage={parseInt(indexPage) || null}
        filteredOutSet={filteredSet}
        onColsChange={(c) => update({ matrixCols: c })}
        showControls={true}
        maxHeight={340}
      />

      {/* Action Bar */}
      <div className="action-bar">
        <button type="button" className="btn-secondary" onClick={back}>
          <i className="fas fa-arrow-left"></i> Back
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={handleNext}
          disabled={hasError}
        >
          Next: Index &amp; Chapters <i className="fas fa-arrow-right"></i>
        </button>
      </div>
    </div>
  )
}
