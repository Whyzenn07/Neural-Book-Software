/**
 * Step 3 - Index & Chapter Details
 * Automatically generates distributed chapter ranges and syncs state.
 */
import { useState, useEffect } from 'react'

export default function Step3DefineChapters({ state, update, next, back }) {
  const { indexPage, startPage, endPage, pageCount } = state

  const [chapterCount, setChapterCount] = useState(
    state.chapters && state.chapters.length > 0 ? state.chapters.length : (state.chapterCount || 3)
  )

  const generateDefaultEntries = (count, sp, ep) => {
    const s = parseInt(sp) || 1
    const e = parseInt(ep) || (pageCount || 100)
    const n = Math.max(1, parseInt(count) || 1)
    const range = Math.max(1, e - s + 1)
    const step = Math.max(1, Math.floor(range / n))

    return Array.from({ length: n }, (_, i) => {
      const chStart = s + i * step
      const chEnd = i === n - 1 ? e : Math.min(e, s + (i + 1) * step - 1)
      return {
        title: `Chapter ${i + 1}`,
        startPage: chStart,
        endPage: Math.max(chStart, chEnd),
      }
    })
  }

  const [entries, setEntries] = useState(() => {
    if (state.chapters && state.chapters.length > 0) {
      return state.chapters
    }
    return generateDefaultEntries(chapterCount, startPage, endPage)
  })

  // Function to generate chapters and sync with global state
  const handleGenerate = (customCount = chapterCount) => {
    const n = Math.max(1, parseInt(customCount) || 1)
    const generated = generateDefaultEntries(n, startPage, endPage)
    setEntries(generated)
    update({
      chapterCount: n,
      chapters: generated,
    })
  }

  // Auto-generate if chapters were empty
  useEffect(() => {
    if (!state.chapters || state.chapters.length === 0) {
      handleGenerate(chapterCount)
    }
  }, [])

  const updateEntry = (idx, field, value) => {
    const nextEntries = entries.map((e, i) =>
      i === idx ? { ...e, [field]: value } : e
    )
    setEntries(nextEntries)
    update({ chapters: nextEntries })
  }

  const handleNext = () => {
    update({
      chapterCount: entries.length,
      chapters: entries.map((e, i) => ({
        title: e.title || `Chapter ${i + 1}`,
        startPage: parseInt(e.startPage) || startPage,
        endPage: parseInt(e.endPage) || endPage,
      })),
    })
    next()
  }

  return (
    <div>
      <h2 className="step-title">
        <i className="fas fa-book-open"></i> Index &amp; Chapter Details
      </h2>
      <p className="step-subtitle">
        On the left you see the Index page; on the right, define the number of chapters and their page ranges.
      </p>

      <div className="split-layout">
        {/* Left Side: Index Preview */}
        <div className="split-left">
          <div className="index-preview">
            <i className="fas fa-file-alt index-preview-icon"></i>
            <div className="index-preview-page">Index Page</div>
            <div className="index-preview-sub">
              Page <span>{indexPage || 5}</span>
            </div>
            <div className="index-preview-content">
              <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--navy)' }}>
                <i className="fas fa-list-ul" style={{ marginRight: 6 }}></i>
                Simulated Chapter Index:
              </div>
              {entries.slice(0, 10).map((entry, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span style={{ fontWeight: 500 }}>{entry.title || `Chapter ${idx + 1}`}</span>
                  <span style={{ color: 'var(--muted)' }}>p. {entry.startPage}</span>
                </div>
              ))}
              {entries.length > 10 && (
                <div style={{ color: '#8a9aa8', fontStyle: 'italic', marginTop: 4 }}>
                  + {entries.length - 10} more chapters...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Chapter Count & Dynamic Entries */}
        <div className="split-right">
          <div className="form-group">
            <label htmlFor="chapterCountInput">
              How many chapters does this book have?
            </label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                id="chapterCountInput"
                type="number"
                min="1"
                max="100"
                value={chapterCount}
                onChange={(e) => {
                  setChapterCount(e.target.value)
                  if (parseInt(e.target.value) > 0) {
                    handleGenerate(e.target.value)
                  }
                }}
                placeholder="e.g. 12"
              />
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => handleGenerate(chapterCount)}
              style={{ marginTop: 10 }}
            >
              <i className="fas fa-sync"></i> Generate chapter fields
            </button>
          </div>

          <div style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
            {entries.map((entry, idx) => (
              <div key={idx} className="chapter-entry">
                <span className="ch-label">Chapter {idx + 1} :</span>
                <input
                  type="number"
                  placeholder="Start"
                  min="1"
                  value={entry.startPage}
                  onChange={(e) => updateEntry(idx, 'startPage', e.target.value)}
                />
                <span>–</span>
                <input
                  type="number"
                  placeholder="End"
                  min="1"
                  value={entry.endPage}
                  onChange={(e) => updateEntry(idx, 'endPage', e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        <button type="button" className="btn-secondary" onClick={back}>
          <i className="fas fa-arrow-left"></i> Back
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={handleNext}
          disabled={entries.length === 0}
        >
          Next: Confirm <i className="fas fa-arrow-right"></i>
        </button>
      </div>
    </div>
  )
}
