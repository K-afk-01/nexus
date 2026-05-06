import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#313338] text-[#DCDDDE] flex flex-col">

      {/* Navbar */}
      <header className="bg-[#2B2D31] px-6 py-4 flex items-center gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm overflow-hidden">
            <img src="/logo.png" className="w-7 h-7 object-contain" alt="Nexus" />
          </div>
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
          <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center shadow-2xl shadow-[#5865F2]/20">
            <img src="/logo.png" className="w-16 h-16 object-contain" alt="Nexus" />
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
