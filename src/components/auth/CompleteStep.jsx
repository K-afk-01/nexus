import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ref, set, serverTimestamp } from 'firebase/database'
import { signInAnonymously } from 'firebase/auth'
import { auth, db } from '../../services/firebase'
import useAuthStore from '../../store/useAuthStore'

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function saveVerification() {
  try {
    const { tcNo, fullName, birthDate } = useAuthStore.getState()

    let currentUser = auth.currentUser
    if (!currentUser) {
      const cred = await signInAnonymously(auth)
      currentUser = cred.user
    }
    const uid = currentUser.uid

    const tcHash = await sha256(tcNo ?? 'UNKNOWN')

    await set(ref(db, `users/${uid}`), {
      tcHash,
      fullName:   fullName   || 'Bilinmiyor',
      birthDate:  birthDate  || null,
      verifiedAt: serverTimestamp(),
      verified:   true,
    })

    return uid  // caller uses this — don't setUser here
  } catch (err) {
    console.error('Save error:', err)
    return null
  }
}

export default function CompleteStep() {
  const navigate  = useNavigate()
  const fullName  = useAuthStore((s) => s.fullName)

  const [visible,  setVisible]  = useState(false)
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  async function handleComplete() {
    setLoading(true)

    // saveVerification handles sign-in + Firebase write, returns uid (or null on failure)
    const savedUid = await saveVerification()

    const { fullName } = useAuthStore.getState()
    const uid = savedUid || `offline-${Date.now()}`

    // profileComplete: false ensures ProfileSetup always shows after fresh verification
    useAuthStore.getState().setUser({ uid, fullName, verified: true, profileComplete: false })

    // Write to localStorage explicitly — Zustand persist may not flush before unmount
    localStorage.setItem('nexus-auth', JSON.stringify({
      state: { uid, fullName, verified: true, profileComplete: false },
      version: 0,
    }))

    await new Promise((r) => setTimeout(r, 150))
    navigate('/profile-setup', { replace: true })
  }

  return (
    <div
      className={`flex flex-col items-center gap-6 py-8 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {/* Checkmark circle */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse-once">
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/40">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-white">Kimliğin Doğrulandı ✓</h2>
        <p className="text-sm text-[#949BA4]">Nexus'a güvenli erişim kazandın</p>
      </div>

      {/* Verified badge */}
      <div className="bg-[#383A40] border border-[#5865F2]/30 rounded-2xl px-6 py-4 flex items-center gap-4 w-full max-w-xs">
        <div className="w-12 h-12 rounded-full bg-[#5865F2] flex items-center justify-center shrink-0 text-white font-bold text-lg">
          {(fullName ?? '?')[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-white truncate">{fullName ?? 'Kullanıcı'}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <svg className="w-3.5 h-3.5 text-[#5865F2]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-[#5865F2] font-medium">Doğrulanmış</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={loading ? undefined : handleComplete}
        disabled={loading}
        className={[
          'w-full max-w-xs py-3.5 rounded-xl font-bold text-sm transition-all duration-200',
          loading
            ? 'bg-[#383A40] text-[#949BA4] cursor-not-allowed'
            : 'bg-[#5865F2] hover:bg-[#4752C4] text-white active:scale-[0.98] cursor-pointer shadow-lg shadow-[#5865F2]/30',
        ].join(' ')}
      >
        {loading ? 'Kaydediliyor…' : "Nexus'a Gir →"}
      </button>
    </div>
  )
}
