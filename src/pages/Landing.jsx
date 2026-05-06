import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#313338] text-[#DCDDDE] flex flex-col">

      {/* Navbar */}
      <header className="bg-[#2B2D31] px-6 py-4 flex items-center gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <svg
            className="w-8 h-8 text-[#5865F2]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
          </svg>
          <span className="text-xl font-bold text-white tracking-wide">Nexus</span>
        </div>

        <div className="ml-auto flex gap-4">
          <button
            onClick={() => navigate('/verify')}
            className="text-sm text-[#DCDDDE] hover:text-white transition-colors"
          >
            Giriş Yap
          </button>
          <button
            onClick={() => navigate('/verify')}
            className="text-sm bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-1.5 rounded-full transition-colors font-medium"
          >
            Kayıt Ol
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-8">
        <div className="flex flex-col items-center gap-6 max-w-2xl">
          <div className="w-20 h-20 rounded-2xl bg-[#5865F2] flex items-center justify-center shadow-2xl shadow-[#5865F2]/30">
            <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
          </div>

          <h1 className="text-5xl font-extrabold text-white leading-tight tracking-tight">
            Güvenli.{' '}
            <span className="text-[#5865F2]">Doğrulanmış.</span>{' '}
            Özgür.
          </h1>

          <p className="text-lg text-[#949BA4] max-w-md leading-relaxed">
            Nexus, kimlik doğrulaması zorunlu, gerçek insanlarla iletişim kurulan güvenli bir platform sunar.
          </p>

          <button
            onClick={() => navigate('/verify')}
            className="mt-2 bg-[#5865F2] hover:bg-[#4752C4] active:scale-95 text-white font-semibold text-lg px-8 py-3.5 rounded-xl shadow-lg shadow-[#5865F2]/30 transition-all duration-150"
          >
            Kimliğini Doğrula ve Başla
          </button>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 w-full max-w-3xl">
          {[
            {
              icon: '🛡️',
              title: 'Kimlik Doğrulama',
              desc: 'Yüz tanıma ve belge analizi ile güvenli kayıt.',
            },
            {
              icon: '💬',
              title: 'Gerçek Zamanlı Sohbet',
              desc: 'Sunucular ve kanallar üzerinden anlık mesajlaşma.',
            },
            {
              icon: '🔒',
              title: 'Uçtan Uca Güvenlik',
              desc: 'Tüm veriler şifrelenmiş, gizliliğiniz korunuyor.',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-[#2B2D31] rounded-xl p-5 flex flex-col gap-2 text-left hover:bg-[#383A40] transition-colors"
            >
              <span className="text-2xl">{f.icon}</span>
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="text-sm text-[#949BA4]">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#2B2D31] text-center text-xs text-[#949BA4] py-4">
        © 2026 Nexus — Güvenli iletişimin adresi
      </footer>
    </div>
  )
}
