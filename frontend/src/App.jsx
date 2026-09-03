import { useState } from "react"
import Stepper from "./components/Stepper"
import Step1Upload from "./components/steps/Step1Upload"
import Step2PageRanges from "./components/steps/Step2PageRanges"
import Step3DefineChapters from "./components/steps/Step3DefineChapters"
import Step4PreviewResult from "./components/steps/Step4PreviewResult"
import Step5Confirm from "./components/steps/Step5Confirm"
import Step6Skills from "./components/steps/Step6Skills"
import Step7MdToPdf from "./components/steps/Step7MdToPdf"

const STEPS = [
  { id: 1, label: "Upload PDF" },
  { id: 2, label: "Range & Filter" },
  { id: 3, label: "Index & Chapters" },
  { id: 4, label: "Zoom & Review" },
  { id: 5, label: "Output Folders" },
  { id: 6, label: "AI Skills (.md)" },
  { id: 7, label: "MD to PDF" },
]

const INITIAL_STATE = {
  step: 1,
  jobId: null,
  fileName: null,
  cleanName: "Book",
  pageCount: 100,
  startPage: 1,
  endPage: 100,
  indexPage: 5,
  removedPages: [],
  filteredPages: Array.from({ length: 100 }, (_, i) => i + 1),
  chapterCount: 5,
  chapters: [],
}

export default function App() {
  const [state, setState] = useState(INITIAL_STATE)

  const update = (patch) => setState((prev) => ({ ...prev, ...patch }))
  const next = () => update({ step: state.step + 1 })
  const back = () => update({ step: Math.max(1, state.step - 1) })
  const reset = () => setState(INITIAL_STATE)

  return (
    <div className="app">
      {/* HEADER */}
      <header className="app-header">
        <div className="brand">
          <img
            src="/skips-logo.png"
            alt="SKIPS University"
            className="brand-logo-img"
            onError={(e) => {
              e.target.style.display = "none"
              const fallback = document.getElementById("brandIconFallback")
              if (fallback) fallback.style.display = "flex"
            }}
          />
          <div id="brandIconFallback" className="brand-icon" style={{ display: "none" }}>
            SK
          </div>
          <div className="brand-text">
            <div className="brand-name">
              SKIPS <small>University</small>
            </div>
            <div className="brand-tagline">PDF Chapter Extractor &amp; OCR Maker</div>
          </div>
        </div>
        <div className="step-counter">Step {state.step} of {STEPS.length}</div>
      </header>

      {/* STEP PROGRESS */}
      <Stepper steps={STEPS} currentStep={state.step} />

      {/* STEP CONTENT */}
      <div className="step-content">
        {state.step === 1 && <Step1Upload state={state} update={update} next={next} />}
        {state.step === 2 && <Step2PageRanges state={state} update={update} next={next} back={back} />}
        {state.step === 3 && <Step3DefineChapters state={state} update={update} next={next} back={back} />}
        {state.step === 4 && <Step4PreviewResult state={state} update={update} next={next} back={back} />}
        {state.step === 5 && <Step5Confirm state={state} update={update} next={next} back={back} />}
        {state.step === 6 && <Step6Skills state={state} update={update} next={next} back={back} />}
        {state.step === 7 && <Step7MdToPdf state={state} update={update} reset={reset} back={back} />}
      </div>
    </div>
  )
}
