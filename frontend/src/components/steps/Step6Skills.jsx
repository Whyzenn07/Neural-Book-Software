/**
 * Step 6 - AI Skills & Directives Download Center
 * Clean, modern, high-end professional UI with static Lucide SVG icons.
 * Features instant client-side Blob & JSZip downloads and zero-latency preview.
 * Provides All-in-One Master Directives for Claude, Antigravity, and ChatGPT.
 */
import { useState } from 'react'
import {
  Download,
  Package,
  Eye,
  Copy,
  Check,
  BookOpen,
  Info,
  X,
  ArrowLeft,
  ArrowRight,
  Video,
  ExternalLink,
} from 'lucide-react'
import {
  SKILLS_DATA,
  downloadMarkdownFile,
  downloadSkillPackageZip,
  downloadAllSkillsBundleZip,
} from './skillsData'

export default function Step6Skills({ state, update, next, back }) {
  const [selectedSkillForModal, setSelectedSkillForModal] = useState(null)
  const [copiedSkillId, setCopiedSkillId] = useState(null)
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState(null)

  const showSuccess = (msg) => {
    setDownloadSuccessMsg(msg)
    setTimeout(() => setDownloadSuccessMsg(null), 3500)
  }

  // Handle Download Single SKILL.MD
  const handleDownloadSkillMd = (skill) => {
    const filename = `${skill.id}_skills.md`
    downloadMarkdownFile(filename, skill.skillMd)
    showSuccess(`File ${filename} downloaded successfully!`)
  }

  // Handle Download Single Skill ZIP Package
  const handleDownloadZipPackage = async (skill) => {
    try {
      await downloadSkillPackageZip(skill)
      showSuccess(`Package ${skill.id}.zip downloaded successfully! Ready for Claude & Codex upload.`)
    } catch (err) {
      alert('Failed to generate ZIP package: ' + err.message)
    }
  }

  // Handle Download All Skills ZIP Bundle
  const handleDownloadAllBundle = async () => {
    try {
      await downloadAllSkillsBundleZip()
      showSuccess('Package AI_Skills_Directives_Package.zip downloaded successfully!')
    } catch (err) {
      alert('Failed to download all skills: ' + err.message)
    }
  }

  // Copy Skill Directive to Clipboard
  const handleCopySkill = async (skill) => {
    try {
      await navigator.clipboard.writeText(skill.skillMd)
      setCopiedSkillId(skill.id)
      showSuccess(`Directive for ${skill.title} copied to clipboard! Ready to paste to Claude / Codex.`)
      setTimeout(() => setCopiedSkillId(null), 3000)
    } catch (err) {
      alert('Failed to copy directive to clipboard')
    }
  }

  return (
    <div className="step6-skills-container">
      {/* Toast Alert Notification */}
      {downloadSuccessMsg && (
        <div className="toast-success-banner">
          <Check size={18} className="toast-check" />
          <span>{downloadSuccessMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="step-header-text">
        <div className="header-flex-row">
          <div>
            <h2 className="step-title">
              <BookOpen size={24} className="title-svg-icon" /> AI Agent Skills &amp; Directives (skills.md)
            </h2>
            <p className="step-subtitle">
              Download official <code>skills.md</code> prompt files or complete package bundles (.zip) for Claude, Antigravity, and ChatGPT / Codex. Easily process raw markdown chapters into publication-grade final OCR Markdown files.
            </p>
          </div>
          <div className="header-action-wrap">
            <button
              type="button"
              className="btn-download-all-skills"
              onClick={handleDownloadAllBundle}
            >
              <Package size={16} /> Download All Skills (.zip)
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          HEADER INSTRUCTION BANNER & YOUTUBE TUTORIALS
          ═══════════════════════════════════════════════════════════════ */}
      <div className="usage-guide-card header-guide">
        <div className="guide-header">
          <Info size={22} className="guide-icon-svg" />
          <div className="guide-content-wrap">
            <h4 className="guide-title">
              How to Install &amp; Use skills.md (All-in-One: Claude, Codex / ChatGPT, Antigravity)
            </h4>
            <p className="guide-sub">
              • <strong>Claude Upload</strong>: Upload the single <code>academic-ebook-creator.zip</code> package (or <code>skills.md</code>) to Claude Projects / Chat alongside raw chapter markdown files to immediately generate the final OCR Markdown file.<br />
              • <strong>Codex / ChatGPT</strong>: Attach the package or paste the directive into Custom Instructions / Prompt along with your raw markdown input.<br />
              • <strong>Antigravity IDE</strong>: Place the downloaded <code>skills.md</code> under <code>.agents/skills/academic-ebook-creator/SKILL.md</code>.
            </p>

            <div className="guide-video-links">
              <span className="video-label">Video Tutorials:</span>
              <a
                href="https://youtu.be/4mnP1lRdUm8?si=OA5XwQIfe1I_DdR1"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-video-guide antigravity"
              >
                <Video size={15} /> Antigravity Guide <ExternalLink size={13} />
              </a>
              <a
                href="https://youtu.be/jCGrOwCwaIc?si=Hv5QemzDxCbKIgbu"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-video-guide claude"
              >
                <Video size={15} /> Install in Claude Guide <ExternalLink size={13} />
              </a>
              <a
                href="https://youtu.be/MsJzacfjzp8?si=cPXQ6-gC7dQ25OfO"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-video-guide chatgpt"
              >
                <Video size={15} /> ChatGPT / Codex Guide <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          PRIMARY PUBLISHING ENGINES (ALL-IN-ONE MASTER SUITES)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="skills-section-block">
        <div className="section-label-bar">
          <span className="section-label-tag">ALL-IN-ONE MASTER PUBLISHING ENGINES</span>
          <span className="section-count-badge">{SKILLS_DATA.length} Master Skills</span>
        </div>

        <div className="skills-primary-grid">
          {SKILLS_DATA.map((skill) => (
            <div key={skill.id} className={`skill-hero-card primary-${skill.badgeClass}`}>
              <div className="skill-card-top">
                <span className={`skill-tag-pill ${skill.badgeClass}`}>{skill.tag}</span>
                <span className="skill-cmd-badge">{skill.command}</span>
              </div>

              <div className="skill-body-content">
                <h3 className="skill-title">{skill.title}</h3>
                <p className="skill-desc">{skill.description}</p>

                <div className="skill-features-list">
                  {skill.features.map((feat, idx) => (
                    <span key={idx} className="feat-chip">
                      {feat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="skill-card-actions">
                <div className="action-buttons-group">
                  <button
                    type="button"
                    className={`btn-skill-download ${skill.badgeClass}`}
                    onClick={() => handleDownloadSkillMd(skill)}
                  >
                    <Download size={15} /> Download skills.md
                  </button>
                  <button
                    type="button"
                    className="btn-skill-pkg"
                    onClick={() => handleDownloadZipPackage(skill)}
                    title="Download ZIP package with root SKILL.md + references for Claude & Codex upload"
                  >
                    <Package size={15} /> {skill.id}.zip
                  </button>
                </div>

                <div className="action-buttons-group secondary">
                  <button
                    type="button"
                    className="btn-skill-action"
                    onClick={() => setSelectedSkillForModal(skill)}
                  >
                    <Eye size={15} /> Preview
                  </button>
                  <button
                    type="button"
                    className={`btn-skill-action ${copiedSkillId === skill.id ? 'copied' : ''}`}
                    onClick={() => handleCopySkill(skill)}
                  >
                    {copiedSkillId === skill.id ? <Check size={15} /> : <Copy size={15} />}
                    {copiedSkillId === skill.id ? 'Copied' : 'Copy Directive'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL LIVE PREVIEW */}
      {selectedSkillForModal && (
        <div className="modal-overlay" onClick={() => setSelectedSkillForModal(null)}>
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="modal-badge">SKILL.MD PREVIEW</span>
                <h3 className="modal-title">{selectedSkillForModal.title}</h3>
              </div>
              <div className="modal-actions-right">
                <button
                  type="button"
                  className="btn-modal-dl"
                  onClick={() => handleDownloadSkillMd(selectedSkillForModal)}
                >
                  <Download size={14} /> Download File (.md)
                </button>
                <button
                  type="button"
                  className="btn-modal-close"
                  onClick={() => setSelectedSkillForModal(null)}
                  title="Close Preview"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="modal-body">
              <pre className="markdown-raw-preview">{selectedSkillForModal.skillMd}</pre>
            </div>

            <div className="modal-footer">
              <span className="modal-meta-hint">Format: Markdown with root YAML Frontmatter (---)</span>
              <button
                type="button"
                className="btn-modal-copy"
                onClick={() => handleCopySkill(selectedSkillForModal)}
              >
                {copiedSkillId === selectedSkillForModal.id ? <Check size={15} /> : <Copy size={15} />}
                {copiedSkillId === selectedSkillForModal.id ? 'Copied' : 'Copy File Content'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="action-bar" style={{ marginTop: 36 }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={back}
        >
          <ArrowLeft size={16} /> Back to Output Folders (Step 5)
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={next}
        >
          Next: MD to PDF Converter (Step 7) <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
