import { useState, useRef, useEffect } from 'react'
import useAuthStore from '../../store/useAuthStore'
import { updateUserProfile } from '../../services/userService'
import { uploadAvatar } from '../../services/storageService'
import { ensureFriendCode } from '../../services/friendService'

const COLORS = [
  '#5865F2','#3BA55C','#FAA61A','#EB459E','#ED4245',
  '#00B0F4','#F47FFF','#57F287','#FF7043','#26C6DA',
]
function avatarColor(uid = '') {
  let h = 0
  for (let i = 0; i < uid.length; i++) h = uid.charCodeAt(i) + ((h << 5) - h)
  return COLORS[Math.abs(h) % COLORS.length]
}

const STATUS_OPTIONS = [
  { value: 'online',    dot: 'bg-green-400',  label: 'Çevrimiçi' },
  { value: 'away',      dot: 'bg-yellow-400', label: 'Uzakta' },
  { value: 'busy',      dot: 'bg-red-500',    label: 'Rahatsız Etmeyin' },
  { value: 'invisible', dot: 'bg-gray-500',   label: 'Görünmez' },
]

export default function ProfileModal({ onClose }) {
  const uid      = useAuthStore((s) => s.uid)
  const fullName = useAuthStore((s) => s.fullName)

  const [nickname,     setNickname]     = useState(useAuthStore.getState().nickname || fullName || '')
  const [email,        setEmail]        = useState(useAuthStore.getState().email || '')
  const [phone,        setPhone]        = useState(useAuthStore.getState().phone || '')
  const [status,       setStatus]       = useState(useAuthStore.getState().status || 'online')
  const [photoURL,     setPhotoURL]     = useState(useAuthStore.getState().photoURL || null)
  const [friendCode,   setFriendCode]   = useState(useAuthStore.getState().friendCode || null)
  const [photoFile,    setPhotoFile]    = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [saving,       setSaving]       = useState(false)
  const [copied,       setCopied]       = useState(false)
  const [showStatus,   setShowStatus]   = useState(false)
  const fileRef = useRef(null)

  // Ensure friend code exists
  useEffect(() => {
    if (!friendCode && uid) {
      ensureFriendCode(uid).then((code) => {
        setFriendCode(code)
        useAuthStore.getState().setUser({ friendCode: code })
      })
    }
  }, [uid, friendCode])

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!nickname.trim()) return
    setSaving(true)
    try {
      let newPhotoURL = photoURL
      if (photoFile) newPhotoURL = await uploadAvatar(uid, photoFile)
      await updateUserProfile(uid, {
        nickname:  nickname.trim(),
        email:     email.trim() || null,
        phone:     phone.trim() || null,
        photoURL:  newPhotoURL,
        status,
      })
      useAuthStore.getState().setUser({
        nickname:  nickname.trim(),
        email:     email.trim() || null,
        phone:     phone.trim() || null,
        photoURL:  newPhotoURL,
        status,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  function copyCode() {
    if (!friendCode) return
    navigator.clipboard.writeText(friendCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayName  = nickname || fullName || 'Kullanıcı'
  const initial      = displayName[0]?.toUpperCase() ?? '?'
  const color        = avatarColor(uid)
  const currentStatus = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0]
  const previewSrc   = photoPreview || photoURL

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-[#2B2D31] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">

        {/* Banner */}
        <div className="h-24 bg-gradient-to-br from-[#5865F2] to-[#4752C4] relative">
          <button onClick={onClose}
            className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {/* Avatar over banner */}
          <div className="absolute -bottom-10 left-5">
            <div className="relative cursor-pointer" onClick={() => fileRef.current?.click()}>
              <div className="w-20 h-20 rounded-full border-4 border-[#2B2D31] overflow-hidden">
                {previewSrc ? (
                  <img src={previewSrc} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
                    style={{ backgroundColor: color }}>
                    {initial}
                  </div>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center border-4 border-[#2B2D31]">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

        {/* Content */}
        <div className="px-5 pt-14 pb-5 space-y-4">
          {/* Status picker */}
          <div className="relative">
            <button onClick={() => setShowStatus((v) => !v)}
              className="flex items-center gap-2 bg-[#383A40] hover:bg-[#404249] px-3 py-1.5 rounded-lg text-sm transition-colors">
              <span className={`w-2.5 h-2.5 rounded-full ${currentStatus.dot}`} />
              <span className="text-white font-medium">{currentStatus.label}</span>
              <svg className="w-3.5 h-3.5 text-[#949BA4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showStatus && (
              <div className="absolute left-0 top-full mt-1 bg-[#1e1f22] rounded-lg shadow-xl z-10 overflow-hidden min-w-[200px]">
                {STATUS_OPTIONS.map((opt) => (
                  <button key={opt.value}
                    onClick={() => { setStatus(opt.value); setShowStatus(false) }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-[#35373C] ${status === opt.value ? 'text-white' : 'text-[#949BA4]'}`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${opt.dot}`} />
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fields */}
          <div className="bg-[#1e1f22] rounded-xl p-4 space-y-3">
            <Field label="Kullanıcı Adı" value={nickname} onChange={setNickname} placeholder="kullanici_adi" />
            <Field label="E-posta" value={email} onChange={setEmail} placeholder="ornek@mail.com" type="email" />
            <Field label="Telefon" value={phone} onChange={setPhone} placeholder="+90 5xx xxx xx xx" type="tel" />
          </div>

          {/* Friend code */}
          <div className="bg-[#1e1f22] rounded-xl p-4">
            <p className="text-xs font-semibold text-[#949BA4] uppercase tracking-widest mb-2">Arkadaşlık Kodu</p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-white font-bold tracking-widest text-sm flex-1">
                {friendCode || '…'}
              </span>
              <button onClick={copyCode}
                className="px-3 py-1.5 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-medium rounded-lg transition-colors">
                {copied ? 'Kopyalandı!' : 'Kopyala'}
              </button>
            </div>
            <p className="text-xs text-[#949BA4] mt-1.5">Bu kodu paylaşarak arkadaşlarını ekleyebilirsin</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 bg-[#383A40] hover:bg-[#404249] text-[#DCDDDE] text-sm font-medium rounded-lg transition-colors">
              İptal
            </button>
            <button onClick={saving ? undefined : handleSave} disabled={saving}
              className={[
                'flex-1 py-2.5 text-white text-sm font-medium rounded-lg transition-colors',
                saving ? 'bg-[#383A40] text-[#949BA4] cursor-not-allowed' : 'bg-[#5865F2] hover:bg-[#4752C4]',
              ].join(' ')}>
              {saving ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#949BA4] uppercase tracking-widest mb-1">{label}</label>
      <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#2B2D31] text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#5865F2] placeholder-[#949BA4]/50" />
    </div>
  )
}
