import { useState } from "react"
import Stepper from "./components/Stepper"
import Step1Upload from "./components/steps/Step1Upload"
import Step2PageRanges from "./components/steps/Step2PageRanges"
import Step3DefineChapters from "./components/steps/Step3DefineChapters"
import Step4Confirm from "./components/steps/Step4Confirm"
import Step5Output from "./components/steps/Step5Output"

const STEPS = [
  { id: 1, label: "Upload & Grid" },
  { id: 2, label: "Range & Filter" },
  { id: 3, label: "Index & Chapters" },
  { id: 4, label: "Confirm" },
  { id: 5, label: "Output Folders" },
]

const INITIAL_STATE = {
  step: 1,
  jobId: null,
  fileName: null,
  pageCount: 100,
  startPage: 1,
  endPage: 100,
  indexPage: 5,
  filteredPages: Array.from({ length: 100 }, (_, i) => i + 1),
  matrixCols: 12,
  chapterCount: 3,
  chapters: [
    { title: "Chapter 1", startPage: 1, endPage: 33 },
    { title: "Chapter 2", startPage: 34, endPage: 66 },
    { title: "Chapter 3", startPage: 67, endPage: 100 },
  ],
}

export default function App() {
  const [state, setState] = useState(INITIAL_STATE)

  const update = (patch) => setState((prev) => ({ ...prev, ...patch }))
  const next = () => update({ step: state.step + 1 })
  const back = () => update({ step: state.step - 1 })
  const reset = () => setState(INITIAL_STATE)

  return (
    <div className="app">
      {/* HEADER WITH SKIPS UNIVERSITY LOGO */}
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
            <div className="brand-tagline">PDF Chapter Extractor</div>
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
        {state.step === 4 && <Step4Confirm state={state} update={update} next={next} back={back} />}
        {state.step === 5 && <Step5Output state={state} update={update} reset={reset} />}
      </div>
    </div>
  )
}

