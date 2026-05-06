import { useState, useEffect, useRef, useCallback } from 'react'
import AgoraRTC from 'agora-rtc-sdk-ng'
import useAuthStore from '../../store/useAuthStore'
import {
  joinVoicePresence, leaveVoicePresence,
  setMutedState, subscribeToVoicePresence,
} from '../../services/voiceService'

const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID

/* ── Avatar ────────────────────────────────────────────────── */
const COLORS = [
  '#5865F2','#3BA55C','#FAA61A','#EB459E','#ED4245',
  '#00B0F4','#F47FFF','#57F287','#FF7043','#26C6DA',
]
function avatarColor(uid = '') {
  let h = 0
  for (let i = 0; i < uid.length; i++) h = uid.charCodeAt(i) + ((h << 5) - h)
  return COLORS[Math.abs(h) % COLORS.length]
}

function UserTile({ user, isMe }) {
  return (
    <div className="flex flex-col items-center gap-2 p-3">
      <div className="relative">
        <div
          className={[
            'w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-2xl transition-opacity',
            user.muted ? 'opacity-50' : '',
          ].join(' ')}
          style={{ backgroundColor: avatarColor(user.uid) }}
        >
          {(user.displayName || '?')[0].toUpperCase()}
        </div>
        {!user.muted && (
          <span className="absolute inset-0 rounded-full ring-2 ring-green-400/70" />
        )}
        {user.muted && (
          <span className="absolute -bottom-0.5 -right-0.5 bg-[#1e1f22] rounded-full p-1">
            <MicOffIcon className="w-3 h-3 text-red-400" />
          </span>
        )}
      </div>
      <span className="text-xs text-[#DCDDDE] font-medium">
        {user.displayName}{isMe ? <span className="text-[#949BA4]"> (Sen)</span> : ''}
      </span>
    </div>
  )
}

/* ── Icons ─────────────────────────────────────────────────── */
function MicIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  )
}

function MicOffIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
    </svg>
  )
}

function PhoneOffIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
    </svg>
  )
}

/* ── Main ───────────────────────────────────────────────────── */
export default function VoiceChannel({ channel }) {
  const uid         = useAuthStore((s) => s.uid)
  const nickname    = useAuthStore((s) => s.nickname)
  const fullName    = useAuthStore((s) => s.fullName)
  const displayName = nickname || fullName || 'Kullanıcı'

  const [joined,  setJoined]  = useState(false)
  const [muted,   setMuted]   = useState(false)
  const [users,   setUsers]   = useState([])
  const [error,   setError]   = useState('')
  const [joining, setJoining] = useState(false)

  const clientRef    = useRef(null)
  const localTrack   = useRef(null)
  const channelIdRef = useRef(channel.id)
  channelIdRef.current = channel.id

  // Firebase presence subscription
  useEffect(() => {
    return subscribeToVoicePresence(channel.id, setUsers)
  }, [channel.id])

  // Leave on unmount
  useEffect(() => {
    return () => {
      const cid = channelIdRef.current
      localTrack.current?.stop()
      localTrack.current?.close()
      clientRef.current?.leave().catch(() => {})
      if (uid) leaveVoicePresence(cid, uid).catch(() => {})
    }
  }, [uid])

  const join = useCallback(async () => {
    if (!AGORA_APP_ID) {
      setError('Agora App ID eksik. .env dosyasına VITE_AGORA_APP_ID ekle.')
      return
    }
    setJoining(true)
    setError('')
    try {
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
      clientRef.current = client

      client.on('user-published', async (remoteUser, mediaType) => {
        await client.subscribe(remoteUser, mediaType)
        if (mediaType === 'audio') remoteUser.audioTrack?.play()
      })

      client.on('user-unpublished', (remoteUser, mediaType) => {
        if (mediaType === 'audio') remoteUser.audioTrack?.stop()
      })

      await client.join(AGORA_APP_ID, channel.id, null, null)

      const track = await AgoraRTC.createMicrophoneAudioTrack()
      localTrack.current = track
      await client.publish([track])

      // Presence write non-fatal — Firebase rules hatası ses bağlantısını engellemesin
      joinVoicePresence(channel.id, uid, displayName).catch((e) =>
        console.warn('[VoiceChannel] presence yazılamadı (Firebase kuralları?):', e.message)
      )
      setJoined(true)
    } catch (e) {
      console.error('[VoiceChannel]', e)
      setError('Bağlanılamadı: ' + (e.message || 'Bilinmeyen hata'))
      clientRef.current?.leave().catch(() => {})
      clientRef.current = null
    } finally {
      setJoining(false)
    }
  }, [channel.id, uid, displayName])

  const leave = useCallback(async () => {
    localTrack.current?.stop()
    localTrack.current?.close()
    localTrack.current = null
    await clientRef.current?.leave().catch(() => {})
    clientRef.current = null
    await leaveVoicePresence(channel.id, uid)
    setJoined(false)
    setMuted(false)
    setError('')
  }, [channel.id, uid])

  const toggleMute = useCallback(async () => {
    if (!localTrack.current) return
    const next = !muted
    await localTrack.current.setMuted(next)
    await setMutedState(channel.id, uid, next)
    setMuted(next)
  }, [muted, channel.id, uid])

  return (
    <div className="flex-1 flex flex-col bg-[#313338] min-h-0">
      {/* Header */}
      <div className="hidden lg:flex items-center gap-2 px-4 py-3 border-b border-[#1e1f22] shrink-0 shadow-sm">
        <svg className="w-5 h-5 text-[#949BA4] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15.536 8.464a5 5 0 010 7.072M12 6a7.071 7.071 0 010 12M8.464 8.464a5 5 0 000 7.072" />
        </svg>
        <span className="font-bold text-white">{channel.name}</span>
        <span className="ml-2 text-xs text-[#949BA4]">{users.length} kişi</span>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">

        {/* Users grid */}
        {users.length === 0 ? (
          <div className="text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-[#383A40] flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-[#949BA4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15.536 8.464a5 5 0 010 7.072M12 6a7.071 7.071 0 010 12M8.464 8.464a5 5 0 000 7.072" />
              </svg>
            </div>
            <p className="text-[#949BA4] text-sm">Henüz kimse bağlı değil</p>
            <p className="text-[#6d6f78] text-xs">Kanala katılarak sesli sohbeti başlat!</p>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-4 max-w-2xl">
            {users.map((u) => (
              <UserTile key={u.uid} user={u} isMe={u.uid === uid} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm text-center max-w-xs bg-red-500/10 px-4 py-2 rounded-lg">
            {error}
          </p>
        )}

        {/* Controls */}
        {!joined ? (
          <button
            onClick={join}
            disabled={joining}
            className="flex items-center gap-2 px-8 py-3 bg-[#3BA55C] hover:bg-[#2D9151] disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.536 8.464a5 5 0 010 7.072M12 6a7.071 7.071 0 010 12M8.464 8.464a5 5 0 000 7.072" />
            </svg>
            {joining ? 'Bağlanıyor…' : 'Kanala Katıl'}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMute}
              title={muted ? 'Sesi Aç' : 'Sesi Kapat'}
              className={[
                'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors',
                muted
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-[#383A40] hover:bg-[#404249] text-[#DCDDDE]',
              ].join(' ')}
            >
              {muted ? <MicOffIcon className="w-4 h-4" /> : <MicIcon className="w-4 h-4" />}
              {muted ? 'Sesi Aç' : 'Sesi Kapat'}
            </button>
            <button
              onClick={leave}
              title="Kanaldan Ayrıl"
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium text-sm transition-colors"
            >
              <PhoneOffIcon className="w-4 h-4" />
              Ayrıl
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
