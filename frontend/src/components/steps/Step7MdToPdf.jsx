/**
 * Step 7 - MD to Merged PDF Converter (SKIPS University Academic Engine)
 * Features:
 * - Direct conversion of extracted or custom .md files into a single Unified PDF
 * - Synthesis guided by academic-ebook-creator standard
 * - Cover Image (Sampul Buku) & Executive Typographic Cover generation
 * - Graphic Charts (Mermaid.js Vector Diagrams & high-res image figures)
 * - Academic Booktabs Tables & KaTeX MathJax Formula rendering
 * - Drag-and-drop file reordering & Smart Natural Auto-Sorting
 * - Duplicate file name detection & warning
 * - Crisp static Lucide icons
 */
import { useState, useRef } from 'react'
import {
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  ChevronUp,
  ChevronDown,
  X,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  GripVertical,
  Layers,
  Sparkles,
  Image as ImageIcon,
  BookOpen,
  BarChart3,
  Table as TableIcon,
  Plus,
} from 'lucide-react'

export default function Step7MdToPdf({ state, update, reset, back }) {
  const { jobId, chapters = [], fileName } = state

  // MD-to-PDF State
  const [customMdFiles, setCustomMdFiles] = useState([])
  const [duplicateWarning, setDuplicateWarning] = useState(null)
  const [convertingMd, setConvertingMd] = useState(false)
  const [mergedPdfResult, setMergedPdfResult] = useState(null)
  const [jobMergedResult, setJobMergedResult] = useState(null)
  const [convertingJobMd, setConvertingJobMd] = useState(false)
  const [draggedIdx, setDraggedIdx] = useState(null)
  const [dragOverIdx, setDragOverIdx] = useState(null)
  const [notifications, setNotifications] = useState([])

  // Cover Page & Visual Assets State
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [visualAssets, setVisualAssets] = useState([])
  const [generateCover, setGenerateCover] = useState(true)

  const mdInputRef = useRef(null)
  const coverInputRef = useRef(null)
  const assetInputRef = useRef(null)

  // Smart Natural Sort (FM/TOC first, followed by Chapter 1, Chapter 2 ... Chapter 10)
  const sortFilesNaturally = (fileList, ascending = true) => {
    const sorted = [...fileList].sort((a, b) => {
      const aIsFm = a.name.startsWith('FM_') || a.name.toLowerCase().includes('front_matter') || a.name.toLowerCase().includes('toc')
      const bIsFm = b.name.startsWith('FM_') || b.name.toLowerCase().includes('front_matter') || b.name.toLowerCase().includes('toc')
      if (aIsFm && !bIsFm) return -1
      if (!aIsFm && bIsFm) return 1
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    })
    return ascending ? sorted : sorted.reverse()
  }

  const addNotification = (title, message, type = 'success') => {
    const id = Date.now() + Math.random()
    setNotifications((prev) => [...prev, { id, title, message, type }])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 5000)
  }

  // Handle uploaded custom MD files with automatic smart natural sorting
  const handleMdFilesUpload = (fileList) => {
    if (!fileList || fileList.length === 0) return

    const incoming = Array.from(fileList).filter((f) =>
      f.name.toLowerCase().endsWith('.md') || f.name.toLowerCase().endsWith('.markdown') || f.name.toLowerCase().endsWith('.txt')
    )

    if (incoming.length === 0) {
      alert('Silakan pilih file dengan ekstensi .md, .markdown, atau .txt')
      return
    }

    // Check duplicate names against each other and existing files
    const allCombined = [...customMdFiles, ...incoming]
    const nameCounts = {}
    const duplicateNames = []

    allCombined.forEach((f) => {
      nameCounts[f.name] = (nameCounts[f.name] || 0) + 1
      if (nameCounts[f.name] === 2) {
        duplicateNames.push(f.name)
      }
    })

    if (duplicateNames.length > 0) {
      setDuplicateWarning(`Peringatan: Nama file duplikat terdeteksi: [${duplicateNames.join(', ')}]. File duplikat akan diindeks otomatis saat digabungkan.`)
    } else {
      setDuplicateWarning(null)
    }

    // Auto-sort naturally on add
    const sorted = sortFilesNaturally(allCombined)
    setCustomMdFiles(sorted)
    setMergedPdfResult(null)
  }

  // Handle Cover Image Upload
  const handleCoverUpload = (fileList) => {
    if (!fileList || fileList.length === 0) return
    const file = fileList[0]
    if (!file.type.startsWith('image/') && !file.name.match(/\.(png|jpg|jpeg|webp|svg)$/i)) {
      alert('Silakan pilih file gambar untuk sampul (.png, .jpg, .jpeg, .webp, .svg)')
      return
    }
    setCoverFile(file)
    const previewUrl = URL.createObjectURL(file)
    setCoverPreview(previewUrl)
    setMergedPdfResult(null)
    addNotification('Sampul Terpasang', `Gambar sampul "${file.name}" berhasil diunggah.`, 'success')
  }

  const removeCover = () => {
    if (coverPreview) {
      URL.revokeObjectURL(coverPreview)
    }
    setCoverFile(null)
    setCoverPreview(null)
    setMergedPdfResult(null)
  }

  // Handle Visual Assets / Diagram Upload
  const handleVisualAssetsUpload = (fileList) => {
    if (!fileList || fileList.length === 0) return
    const incoming = Array.from(fileList).filter((f) =>
      f.type.startsWith('image/') ||
      f.name.match(/\.(png|jpg|jpeg|webp|svg|zip)$/i)
    )
    if (incoming.length === 0) {
      alert('Pilih file gambar (.png, .jpg, .svg) atau arsip (.zip) visual assets.')
      return
    }
    setVisualAssets((prev) => [...prev, ...incoming])
    setMergedPdfResult(null)
    addNotification('Asset Visual Ditambahkan', `${incoming.length} file visual berhasil dilampirkan.`, 'success')
  }

  const removeVisualAsset = (index) => {
    setVisualAssets((prev) => prev.filter((_, i) => i !== index))
    setMergedPdfResult(null)
  }

  // Drag and Drop Reordering Handlers
  const handleItemDragStart = (e, index) => {
    setDraggedIdx(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index)
  }

  const handleItemDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIdx !== index) {
      setDragOverIdx(index)
    }
  }

  const handleItemDrop = (e, targetIdx) => {
    e.preventDefault()
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null)
      setDragOverIdx(null)
      return
    }

    const updated = [...customMdFiles]
    const [movedItem] = updated.splice(draggedIdx, 1)
    updated.splice(targetIdx, 0, movedItem)

    setCustomMdFiles(updated)
    setDraggedIdx(null)
    setDragOverIdx(null)
    setMergedPdfResult(null)
  }

  const handleItemDragEnd = () => {
    setDraggedIdx(null)
    setDragOverIdx(null)
  }

  // Quick Move Up / Move Down
  const moveFile = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= customMdFiles.length) return
    const updated = [...customMdFiles]
    const [item] = updated.splice(fromIdx, 1)
    updated.splice(toIdx, 0, item)
    setCustomMdFiles(updated)
    setMergedPdfResult(null)
  }

  // Convert uploaded custom MD files + cover + visual assets to single merged PDF
  const handleConvertUploadedMd = async () => {
    if (customMdFiles.length === 0) return
    setConvertingMd(true)

    try {
      const formData = new FormData()
      customMdFiles.forEach((file) => {
        formData.append('files', file)
      })

      if (coverFile) {
        const coverName = coverFile.name.toLowerCase().includes('cover')
          ? coverFile.name
          : `00_cover_${coverFile.name}`
        const renamedCover = new File([coverFile], coverName, { type: coverFile.type })
        formData.append('files', renamedCover)
      }

      visualAssets.forEach((file) => {
        formData.append('files', file)
      })

      const queryUrl = `/api/convert-md-to-pdf?generate_cover=${generateCover && !coverFile ? 'true' : 'false'}`
      const res = await fetch(queryUrl, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || 'Gagal mengonversi file Markdown ke PDF')
      }

      const data = await res.json()
      setMergedPdfResult(data)
      addNotification('Merge PDF Berhasil', `File ${data.filename} siap diunduh.`, 'pdf')
    } catch (err) {
      alert(`Conversion error: ${err.message}`)
    } finally {
      setConvertingMd(false)
    }
  }

  // Convert extracted OCR markdown to single merged PDF directly
  const handleConvertJobOcrToMergedPdf = async () => {
    if (!jobId) return
    setConvertingJobMd(true)

    try {
      const res = await fetch(`/api/convert-job-md-to-pdf/${jobId}`, {
        method: 'POST',
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || 'Gagal menggabungkan bab Markdown ke PDF')
      }

      const data = await res.json()
      setJobMergedResult(data)
      addNotification('Single Merged PDF Berhasil', `File ${data.filename} telah digabungkan menjadi satu buku PDF.`, 'pdf')
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setConvertingJobMd(false)
    }
  }

  return (
    <div className="step6-output-container">
      {/* Toast Notifications */}
      <div className="notification-container">
        {notifications.map((n) => (
          <div key={n.id} className={`notif-card ${n.type}`}>
            <div className="notif-icon">
              {n.type === 'pdf' ? <FileText size={16} /> : <CheckCircle2 size={16} />}
            </div>
            <div className="notif-text">
              <strong>{n.title}</strong>
              <p>{n.message}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="step-header-text">
        <div className="header-flex-row">
          <div>
            <h2 className="step-title">
              <FileText size={24} className="title-svg-icon" /> Markdown (MD) to Single Merged PDF
            </h2>
            <p className="step-subtitle">
              Konversi dan satukan bab Markdown menjadi <strong>Single Merged PDF (.pdf)</strong> publikasi lengkap dengan <strong>Gambar Sampul</strong>, <strong>Grafik/Diagram Vektor</strong>, <strong>Tabel Presisi</strong>, dan <strong>Rumus Matematika KaTeX</strong>.
            </p>
          </div>
          <div className="header-action-wrap">
            <span className="active-skill-badge">
              <span className="badge-dot"></span> Active Directive: /academic-ebook-creator
            </span>
          </div>
        </div>
      </div>

      {/* Feature Capabilities Bar */}
      <div className="feature-pills-row">
        <div className="feature-pill active">
          <BookOpen size={14} /> Gambar Sampul (Cover Page)
        </div>
        <div className="feature-pill active">
          <BarChart3 size={14} /> Grafik &amp; Bagan (Mermaid.js SVG)
        </div>
        <div className="feature-pill active">
          <TableIcon size={14} /> Tabel Presisi (Booktabs Academic)
        </div>
        <div className="feature-pill active">
          <Sparkles size={14} /> Rumus KaTeX / MathJax
        </div>
        <div className="feature-pill active">
          <ImageIcon size={14} /> Gambar &amp; Exhibit Resolusi Penuh
        </div>
      </div>

      {/* MD TO SINGLE MERGED PDF CONVERTER */}
      <div className="cloudconvert-section">
        <div className="cloudconvert-card">
          <div className="cloudconvert-header">
            <div className="cloudconvert-title-wrap">
              <div className="cloudconvert-logo">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="cloudconvert-title">Converter: Markdown (MD) to Single Merged PDF (.pdf)</h3>
                <p className="cloudconvert-subtitle">
                  Satukan seluruh bab Markdown dan elemen visual menjadi satu dokumen buku PDF standar akademik penerbitan.
                </p>
              </div>
            </div>

            {/* Visual Conversion Badge */}
            <div className="conversion-flow-badge">
              <div className="badge-pill md">
                <FileText size={14} /> Markdown (MD) + Visuals
              </div>
              <div className="badge-arrow">
                <ArrowRight size={14} />
              </div>
              <div className="badge-pill pdf">
                <FileText size={14} /> Single Merged PDF (.pdf)
              </div>
            </div>
          </div>

          {/* Quick Option 1: Convert extracted OCR Markdown from current book */}
          {jobId && (
            <div className="quick-ocr-convert-box">
              <div className="quick-ocr-info">
                <Layers size={18} className="quick-ocr-svg" />
                <span>
                  Gabungkan seluruh <strong>{chapters.length || 'hasil ekstraksi'} Bab</strong> buku ini (lengkap dengan visual &amp; sampul) ke <strong>Single Merged PDF</strong>:
                </span>
              </div>
              {jobMergedResult ? (
                <a
                  href={jobMergedResult.download_url}
                  download={jobMergedResult.filename}
                  className="btn-cloudconvert-download"
                >
                  <Download size={15} /> Download {jobMergedResult.filename} (.pdf)
                </a>
              ) : (
                <button
                  type="button"
                  className="btn-cloudconvert-action"
                  onClick={handleConvertJobOcrToMergedPdf}
                  disabled={convertingJobMd}
                >
                  {convertingJobMd ? (
                    <>
                      <div className="spinner-small" style={{ marginRight: 8 }}></div> Menggabungkan ke Single PDF...
                    </>
                  ) : (
                    <>
                      <FileText size={15} /> Gabungkan Bab Buku Ini ke Single PDF (.pdf)
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Duplicate Filename Warning Alert */}
          {duplicateWarning && (
            <div className="duplicate-alert-banner">
              <div className="dup-icon">
                <AlertTriangle size={18} />
              </div>
              <div className="dup-text">
                <strong>Peringatan: Nama File Duplikat Terdeteksi</strong>
                <p>
                  File berikut memiliki nama yang sama. File duplikat akan diindeks otomatis agar isi tidak tertimpa.
                </p>
                <div className="dup-names">
                  {duplicateWarning
                    .replace(/.*\[/, '')
                    .replace(/\].*/, '')
                    .split(',')
                    .map((name) => name.trim())
                    .filter(Boolean)
                    .map((name, i) => (
                      <span key={i} className="dup-name-chip">
                        <FileText size={12} /> {name}
                      </span>
                    ))}
                </div>
              </div>
              <button className="dup-dismiss" onClick={() => setDuplicateWarning(null)} title="Tutup peringatan">
                <X size={16} />
              </button>
            </div>
          )}

          {/* Option 2: Upload Custom MD Chapters */}
          <div
            className="md-dropzone"
            onClick={() => mdInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (e.dataTransfer.files) handleMdFilesUpload(e.dataTransfer.files)
            }}
          >
            <div className="md-drop-icon">
              <UploadCloud size={32} />
            </div>
            <h4>Pilih atau Tarik File Bab .MD ke Sini</h4>
            <p>Unggah file Markdown bab per bab untuk digabungkan menjadi dokumen buku PDF yang utuh</p>
            <button type="button" className="btn-browse-md" onClick={(e) => { e.stopPropagation(); mdInputRef.current?.click(); }}>
              Browse File Markdown
            </button>
            <input
              ref={mdInputRef}
              type="file"
              multiple
              accept=".md,.markdown,.txt"
              style={{ display: 'none' }}
              onChange={(e) => handleMdFilesUpload(e.target.files)}
            />
          </div>

          {/* Visual Assets & Cover Image Section */}
          <div className="visual-assets-section">
            <div className="visual-assets-section-title">
              <ImageIcon size={18} /> Visual Assets &amp; Gambar Sampul (Opsional)
            </div>
            <div className="visual-assets-section-desc">
              Tambahkan gambar sampul kustom atau lampiran grafik/diagram untuk disematkan ke dalam buku PDF.
            </div>

            <div className="visual-assets-grid">
              {/* Card 1: Gambar Sampul Buku */}
              <div className="visual-asset-card">
                <div className="visual-asset-card-header">
                  <div className="visual-card-title">
                    <BookOpen size={16} /> Gambar Sampul (Cover Page)
                  </div>
                </div>

                {coverPreview ? (
                  <div className="cover-preview-wrapper">
                    <img src={coverPreview} alt="Cover Preview" className="cover-preview-thumb" />
                    <div className="cover-preview-meta">
                      <div className="cover-preview-name">{coverFile?.name}</div>
                      <span className="cover-preview-tag">✓ Sampul Terpasang</span>
                    </div>
                    <button type="button" className="btn-remove-cover" onClick={removeCover} title="Hapus Sampul">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div
                      className="visual-dropzone-compact"
                      onClick={() => coverInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        if (e.dataTransfer.files) handleCoverUpload(e.dataTransfer.files)
                      }}
                    >
                      <ImageIcon size={24} style={{ color: '#0284c7' }} />
                      <p><strong>Pilih Gambar Sampul</strong> (.png, .jpg)</p>
                    </div>
                    <label className="cover-toggle-label">
                      <input
                        type="checkbox"
                        checked={generateCover}
                        onChange={(e) => setGenerateCover(e.target.checked)}
                      />
                      Otomatis buat sampul akademik jika gambar tidak diunggah
                    </label>
                  </div>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*,.png,.jpg,.jpeg,.webp"
                  style={{ display: 'none' }}
                  onChange={(e) => handleCoverUpload(e.target.files)}
                />
              </div>

              {/* Card 2: Gambar Grafik, Diagram & Bagan */}
              <div className="visual-asset-card">
                <div className="visual-asset-card-header">
                  <div className="visual-card-title">
                    <BarChart3 size={16} /> Gambar Grafik, Bagan &amp; Exhibit ({visualAssets.length})
                  </div>
                  {visualAssets.length > 0 && (
                    <button
                      type="button"
                      className="btn-sort-md"
                      onClick={() => setVisualAssets([])}
                      style={{ padding: '2px 8px', fontSize: '11px' }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div
                  className="visual-dropzone-compact"
                  onClick={() => assetInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (e.dataTransfer.files) handleVisualAssetsUpload(e.dataTransfer.files)
                  }}
                >
                  <Plus size={20} style={{ color: '#0284c7' }} />
                  <p><strong>Lampirkan Gambar / ZIP Visual</strong> (.png, .jpg, .svg, .zip)</p>
                </div>
                <input
                  ref={assetInputRef}
                  type="file"
                  multiple
                  accept="image/*,.png,.jpg,.jpeg,.webp,.svg,.zip"
                  style={{ display: 'none' }}
                  onChange={(e) => handleVisualAssetsUpload(e.target.files)}
                />

                {visualAssets.length > 0 && (
                  <div className="asset-chip-list">
                    {visualAssets.map((asset, idx) => (
                      <span key={idx} className="asset-chip">
                        <ImageIcon size={12} />
                        <span>{asset.name}</span>
                        <button
                          type="button"
                          className="btn-remove-asset"
                          onClick={() => removeVisualAsset(idx)}
                          title="Hapus"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selected MD files list with Drag & Drop Reordering */}
          {customMdFiles.length > 0 && (
            <div className="selected-md-list-box">
              <div className="selected-md-header">
                <div className="md-header-left">
                  <span>
                    <FileText size={16} /> <strong>{customMdFiles.length}</strong> Bab dalam Antrean Penggabungan
                  </span>
                  <span className="drag-hint-badge">
                    Drag &amp; Drop untuk atur urutan
                  </span>
                </div>
                <div className="md-header-actions">
                  <button
                    type="button"
                    className="btn-sort-md"
                    onClick={() => {
                      setCustomMdFiles(sortFilesNaturally(customMdFiles, true))
                      setMergedPdfResult(null)
                    }}
                    title="Urutkan A ke Z secara alami (Bab 1, 2...)"
                  >
                    Auto-Sort A-Z
                  </button>
                  <button
                    type="button"
                    className="btn-sort-md"
                    onClick={() => {
                      setCustomMdFiles(sortFilesNaturally(customMdFiles, false))
                      setMergedPdfResult(null)
                    }}
                    title="Urutan Terbalik Z ke A"
                  >
                    Reverse Z-A
                  </button>
                  <button
                    type="button"
                    className="btn-clear-md"
                    onClick={() => {
                      setCustomMdFiles([])
                      setDuplicateWarning(null)
                      setMergedPdfResult(null)
                    }}
                  >
                    <X size={14} /> Clear
                  </button>
                </div>
              </div>

              {/* Draggable File List */}
              <div className="md-draggable-list">
                {customMdFiles.map((file, idx) => {
                  const isDragging = draggedIdx === idx
                  const isOver = dragOverIdx === idx

                  return (
                    <div
                      key={`${file.name}-${idx}`}
                      draggable
                      onDragStart={(e) => handleItemDragStart(e, idx)}
                      onDragOver={(e) => handleItemDragOver(e, idx)}
                      onDrop={(e) => handleItemDrop(e, idx)}
                      onDragEnd={handleItemDragEnd}
                      className={`md-drag-card ${isDragging ? 'is-dragging' : ''} ${isOver ? 'is-drag-over' : ''}`}
                    >
                      <div className="drag-grip" title="Tarik untuk memindahkan urutan">
                        <GripVertical size={16} />
                      </div>

                      <div className="order-number-pill">
                        {idx + 1}
                      </div>

                      <div className="md-card-icon">
                        <FileText size={16} />
                      </div>

                      <div className="md-card-info">
                        <span className="md-card-name" title={file.name}>{file.name}</span>
                        {file.size > 0 && (
                          <span className="md-card-size">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        )}
                      </div>

                      {/* Quick Move Arrows */}
                      <div className="card-quick-actions">
                        <button
                          type="button"
                          className="btn-move-arrow"
                          disabled={idx === 0}
                          onClick={() => moveFile(idx, idx - 1)}
                          title="Pindah ke Atas"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-move-arrow"
                          disabled={idx === customMdFiles.length - 1}
                          onClick={() => moveFile(idx, idx + 1)}
                          title="Pindah ke Bawah"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-remove-item"
                          onClick={() => {
                            const nextList = customMdFiles.filter((_, i) => i !== idx)
                            setCustomMdFiles(nextList)
                          }}
                          title="Hapus file"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Conversion Action Button & Download */}
              <div className="md-convert-action-row">
                {mergedPdfResult ? (
                  <div className="merged-pdf-success-box">
                    <div className="merged-success-title">
                      <CheckCircle2 size={20} className="text-green" />
                      <span>{mergedPdfResult.filename} Berhasil Dibuat!</span>
                    </div>
                    <a
                      href={mergedPdfResult.download_url}
                      download={mergedPdfResult.filename}
                      className="btn-download-merged-pdf"
                    >
                      <Download size={16} /> Download {mergedPdfResult.filename} (.pdf)
                    </a>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-execute-merge"
                    onClick={handleConvertUploadedMd}
                    disabled={convertingMd}
                  >
                    {convertingMd ? (
                      <>
                        <div className="spinner-small" style={{ marginRight: 8 }}></div>
                        Menggabungkan {customMdFiles.length} Bab &amp; Visual ke 1 PDF...
                      </>
                    ) : (
                      <>
                        <FileText size={16} /> Gabungkan Semua ke Single PDF ({customMdFiles.length} Bab{coverFile ? ' + Sampul' : ''}{visualAssets.length > 0 ? ` + ${visualAssets.length} Gambar` : ''})
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar" style={{ marginTop: 36 }}>
        <button type="button" className="btn-secondary" onClick={back}>
          <ArrowLeft size={16} /> Kembali ke AI Skills (Step 6)
        </button>
        <button type="button" className="btn-primary" onClick={reset} style={{ minWidth: 240 }}>
          <RotateCcw size={16} /> Proses Buku PDF Baru
        </button>
      </div>
    </div>
  )
}
