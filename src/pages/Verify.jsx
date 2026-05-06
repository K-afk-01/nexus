import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StepIndicator from '../components/auth/StepIndicator'
import IdScanStep    from '../components/auth/IdScanStep'
import FaceMatchStep from '../components/auth/FaceMatchStep'
import CompleteStep  from '../components/auth/CompleteStep'

const STEPS = ['Kimlik Tarama', 'Yüz Eşleme', 'Tamamlandı']

export default function Verify() {
  const navigate     = useNavigate()
  const [step, setStep] = useState(1)

  return (
    <div className="min-h-screen bg-[#313338] text-[#DCDDDE] flex flex-col">
      {/* Topbar */}
      <header className="bg-[#2B2D31] px-6 py-3.5 flex items-center gap-3 shadow-lg shrink-0">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <svg className="w-7 h-7 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
          </svg>
          <span className="text-lg font-bold text-white">Nexus</span>
        </button>
        <div className="ml-auto text-xs text-[#949BA4]">Kimlik Doğrulama</div>
      </header>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 py-10">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white leading-tight">Kimliğini Doğrula</h1>
            <p className="text-sm text-[#949BA4] mt-1">
              Hesabını güvence altına almak için 3 adımı tamamla
            </p>
          </div>

          <StepIndicator currentStep={step} steps={STEPS} />

          {/* Step card */}
          <div className="bg-[#2B2D31] rounded-2xl p-6 shadow-2xl">
            {/* Step header */}
            <div className="mb-5 pb-4 border-b border-[#383A40]">
              <p className="text-xs font-semibold text-[#5865F2] uppercase tracking-widest">
                Adım {step} / {STEPS.length}
              </p>
              <h2 className="text-lg font-bold text-white mt-0.5">{STEPS[step - 1]}</h2>
            </div>

            {/* Animated step content */}
            <div key={step} className="animate-fade-in">
              {step === 1 && <IdScanStep    onNext={() => setStep(2)} />}
              {step === 2 && <FaceMatchStep onNext={() => setStep(3)} />}
              {step === 3 && <CompleteStep />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
