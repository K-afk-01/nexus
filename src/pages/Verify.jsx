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
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm overflow-hidden">
            <img src="/logo.png" className="w-7 h-7 object-contain" alt="Nexus" />
          </div>
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
