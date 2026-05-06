export default function StepIndicator({ currentStep, steps }) {
  return (
    <div className="flex items-center justify-center mb-10">
      {steps.map((label, i) => {
        const num    = i + 1
        const done   = num < currentStep
        const active = num === currentStep
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={[
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300',
                  done   ? 'bg-[#5865F2] border-[#5865F2] text-white'                                                          : '',
                  active ? 'bg-[#5865F2] border-[#5865F2] text-white shadow-[0_0_0_4px_rgba(88,101,242,0.25)]'                : '',
                  !done && !active ? 'bg-transparent border-[#949BA4]/40 text-[#949BA4]'                                       : '',
                ].join(' ')}
              >
                {done ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : num}
              </div>
              <span className={`text-xs font-medium transition-colors ${active ? 'text-white' : 'text-[#949BA4]'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-20 h-0.5 mx-2 mb-5 rounded-full transition-all duration-500 ${
                  done ? 'bg-[#5865F2]' : 'bg-[#949BA4]/25'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
