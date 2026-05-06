import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'
import { updateUserProfile } from '../services/userService'
import { uploadAvatar } from '../services/storageService'
import { ensureFriendCode } from '../services/friendService'

export default function ProfileSetup() {
  const navigate = useNavigate()
  const uid            = useAuthStore((s) => s.uid)
  const fullName       = useAuthStore((s) => s.fullName)
  const profileComplete = useAuthStore((s) => s.profileComplete)

  useEffect(() => {
    if (!uid) { navigate('/verify', { replace: true }); return }
  }, [uid, navigate])

  useEffect(() => {
    if (profileComplete) navigate('/app', { replace: true })
  }, [profileComplete, navigate])

  const [nickname,     setNickname]     = useState(fullName || '')
  const [email,        setEmail]        = useState('')
  const [phone,        setPhone]        = useState('')
  const [photoFile,    setPhotoFile]    = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const fileRef = useRef(null)

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit() {
    if (!nickname.trim()) { setError('Kullanıcı adı zorunludur'); return }
    setLoading(true)
    setError('')
    try {
      let photoURL = null
      if (photoFile) photoURL = await uploadAvatar(uid, photoFile)
      const friendCode = await ensureFriendCode(uid)
      await updateUserProfile(uid, {
        nickname:        nickname.trim(),
        email:           email.trim() || null,
        phone:           phone.trim() || null,
        photoURL,
        status:          'online',
        friendCode,
        profileComplete: true,
      })
      useAuthStore.getState().setProfile({
        nickname:  nickname.trim(),
        email:     email.trim() || null,
        phone:     phone.trim() || null,
        photoURL,
        status:    'online',
        friendCode,
      })
      navigate('/app', { replace: true })
    } catch (err) {
      console.error(err)
      setError('Bir hata oluştu, tekrar dene')
      setLoading(false)
    }
  }

  const initial = (nickname || fullName || '?')[0].toUpperCase()

  return (
    <div className="min-h-screen bg-[#313338] text-[#DCDDDE] flex flex-col">
      <header className="bg-[#2B2D31] px-6 py-3.5 flex items-center gap-3 shadow-lg shrink-0">
        <svg className="w-7 h-7 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
        </svg>
        <span className="text-lg font-bold text-white">Nexus</span>
        <div className="ml-auto text-xs text-[#949BA4]">Profil Oluştur</div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white">Profilini Oluştur</h1>
            <p className="text-sm text-[#949BA4] mt-1">Başlamadan önce birkaç bilgi</p>
          </div>

          <div className="bg-[#2B2D31] rounded-2xl p-6 shadow-2xl space-y-5">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-2">
              <div
                className="relative w-20 h-20 rounded-full overflow-hidden cursor-pointer group"
                onClick={() => fileRef.current?.click()}
              >
                {photoPreview ? (
                  <img src={photoPreview} className="w-full h-full object-cover" alt="avatar" />
                ) : (
                  <div className="w-full h-full bg-[#5865F2] flex items-center justify-center text-3xl font-bold text-white">
                    {initial}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              <p className="text-xs text-[#949BA4]">Fotoğraf seç (isteğe bağlı)</p>
            </div>

            {/* Nickname */}
            <div>
              <label className="block text-xs font-semibold text-[#949BA4] uppercase tracking-widest mb-1.5">
                Kullanıcı Adı <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                placeholder="örn: ahmet42"
                maxLength={32}
                className="w-full bg-[#1e1f22] text-white rounded-lg px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#5865F2] placeholder-[#949BA4]/50"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#949BA4] uppercase tracking-widest mb-1.5">
                E-posta <span className="text-[#949BA4]/50 font-normal normal-case">(isteğe bağlı)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@mail.com"
                className="w-full bg-[#1e1f22] text-white rounded-lg px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#5865F2] placeholder-[#949BA4]/50"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-[#949BA4] uppercase tracking-widest mb-1.5">
                Telefon <span className="text-[#949BA4]/50 font-normal normal-case">(isteğe bağlı)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+90 5xx xxx xx xx"
                className="w-full bg-[#1e1f22] text-white rounded-lg px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#5865F2] placeholder-[#949BA4]/50"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              onClick={loading ? undefined : handleSubmit}
              disabled={loading}
              className={[
                'w-full py-3 rounded-xl font-bold text-sm transition-all duration-200',
                loading
                  ? 'bg-[#383A40] text-[#949BA4] cursor-not-allowed'
                  : 'bg-[#5865F2] hover:bg-[#4752C4] text-white active:scale-[0.98] cursor-pointer shadow-lg shadow-[#5865F2]/30',
              ].join(' ')}
            >
              {loading ? 'Kaydediliyor…' : "Nexus'a Gir →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
