export default function Stepper({ steps, currentStep }) {
  return (
    <div className="step-progress">
      {steps.map((step) => {
        const isActive = step.id === currentStep
        const isDone = step.id < currentStep
        let cls = "step-dot"
        if (isActive) cls += " active"
        if (isDone) cls += " completed"

        return (
          <div key={step.id} className={cls}>
            <div className="circle">
              {isDone ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : step.id}
            </div>
            <span className="label">{step.label}</span>
          </div>
        )
      })}
    </div>
  )
}
