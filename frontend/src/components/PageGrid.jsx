/**
 * PageGrid - reusable PDF page grid with matrix selector
 * Matches reference HTML layout and styling 1:1
 */
export default function PageGrid({
  pages = [],
  cols = 12,
  indexPage = null,
  filteredOutSet = null,
  onColsChange,
  showControls = true,
  maxHeight = 400,
}) {
  const MATRIX_OPTIONS = [4, 6, 8, 12]

  return (
    <div>
      {showControls && (
        <div className="matrix-controls">
          <label>
            <i className="fas fa-th" style={{ marginRight: 6 }}></i> Matrix:
          </label>
          <div className="matrix-btn-group">
            {MATRIX_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                className={`matrix-btn${cols === c ? ' active' : ''}`}
                onClick={() => onColsChange && onColsChange(c)}
              >
                {c}×{c}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className={`pdf-grid-wrapper${pages.length > 0 ? ' has-pages' : ''}`}
        style={{ maxHeight }}
      >
        {pages.length === 0 ? (
          <div className="grid-placeholder">
            <i className="fas fa-file-pdf" style={{ marginRight: 8, opacity: 0.5 }}></i>
            Upload a PDF to see the page grid
          </div>
        ) : (
          <div
            className="pdf-grid"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {pages.map((pageNum) => {
              const isHighlight = indexPage !== null && pageNum === indexPage
              const isFilteredOut = filteredOutSet ? !filteredOutSet.has(pageNum) : false

              let cls = 'page-tile'
              if (isHighlight) cls += ' highlight'
              if (isFilteredOut) cls += ' filtered-out'

              return (
                <div key={pageNum} className={cls}>
                  {isHighlight && <span className="badge">IDX</span>}
                  <span className="page-icon">
                    <i className="fas fa-file-pdf"></i>
                  </span>
                  <span className="page-num">{pageNum}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
