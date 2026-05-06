import { useState, useEffect, useRef } from 'react'
import { createChannel, createUserServer, joinServerById, joinByInvite } from '../../services/chatService'
import { auth } from '../../services/firebase'
import { signInAnonymously } from 'firebase/auth'
import { useChannels, useDMList, useFriendRequests } from '../../hooks/useChat'
import { getUserProfile } from '../../services/userService'
import useAuthStore from '../../store/useAuthStore'
import ProfileModal from '../profile/ProfileModal'


/* ── Helpers ─────────────────────────────────────────────── */
const COLORS = [
  '#5865F2','#3BA55C','#FAA61A','#EB459E','#ED4245',
  '#00B0F4','#F47FFF','#57F287','#FF7043','#26C6DA',
]
function avatarColor(uid = '') {
  let h = 0
  for (let i = 0; i < uid.length; i++) h = uid.charCodeAt(i) + ((h << 5) - h)
  return COLORS[Math.abs(h) % COLORS.length]
}

const STATUS_CFG = {
  online:    { dot: 'bg-green-400',  label: 'Çevrimiçi' },
  away:      { dot: 'bg-yellow-400', label: 'Uzakta' },
  busy:      { dot: 'bg-red-500',    label: 'Rahatsız Etmeyin' },
  invisible: { dot: 'bg-gray-500',   label: 'Görünmez' },
}

/* ── Avatar ──────────────────────────────────────────────── */
function Avatar({ uid, photoURL, name, size = 'md' }) {
  const sz      = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-9 h-9 text-sm'
  const color   = avatarColor(uid)
  const initial = (name || '?')[0].toUpperCase()
  if (photoURL) return (
    <img src={photoURL} alt="" className={`${sz} rounded-full object-cover shrink-0`} />
  )
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ backgroundColor: color }}>
      {initial}
    </div>
  )
}

/* ── Server Modal ────────────────────────────────────────── */
function ServerModal({ onClose, onSuccess }) {
  const uid      = useAuthStore((s) => s.uid)
  const fullName = useAuthStore((s) => s.fullName)
  const nickname = useAuthStore((s) => s.nickname)
  const displayName = nickname || fullName || 'Kullanıcı'

  const [tab,     setTab]     = useState('create')
  const [name,    setName]    = useState('')
  const [joinId,  setJoinId]  = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) return
    setLoading(true)
    setError('')
    try {
      const result = await createUserServer(trimmed, uid, displayName)
      onSuccess(result)
      onClose()
    } catch {
      setError('Sunucu oluşturulurken hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
  const trimmed = joinId.trim()
  if (!trimmed) return
  setLoading(true)
  setError('')
  try {
    const sid = await joinByInvite(trimmed, uid, displayName) // ✅
    onSuccess({ serverId: sid, defaultChannelId: null })
    onClose()
  } catch (e) {
    setError(e.message || 'Sunucuya katılırken hata oluştu.')
  } finally {
    setLoading(false)
  }
}

  const inputCls = 'w-full bg-[#1e1f22] text-white text-sm rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-[#5865F2] placeholder-[#949BA4]/50'

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#313338] rounded-xl p-6 w-80 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-white font-bold text-lg">Sunucu Ekle</h2>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#1e1f22] rounded-lg p-1">
          {['create','join'].map((t) => (
            <button key={t} onClick={() => { setTab(t); setError('') }}
              className={[
                'flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors',
                tab === t ? 'bg-[#5865F2] text-white' : 'text-[#949BA4] hover:text-white',
              ].join(' ')}>
              {t === 'create' ? 'Sunucu Oluştur' : 'Sunucuya Katıl'}
            </button>
          ))}
        </div>

        {tab === 'create' ? (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-semibold text-[#949BA4] uppercase tracking-widest block mb-1.5">
                Sunucu Adı
              </label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="Yeni sunucum"
                className={inputCls}
                autoFocus
              />
            </div>
            <button onClick={handleCreate} disabled={loading || !name.trim()}
              className="w-full py-2 bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 text-white text-sm rounded-md font-medium transition-colors">
              {loading ? 'Oluşturuluyor…' : 'Oluştur'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-semibold text-[#949BA4] uppercase tracking-widest block mb-1.5">
                Sunucu ID
              </label>
              <input
                type="text" value={joinId} onChange={(e) => setJoinId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                placeholder="Sunucu ID'sini girin"
                className={inputCls}
                autoFocus
              />
              <p className="text-[10px] text-[#949BA4] mt-1">
                Sunucu sahibinden ID'yi isteyin.
              </p>
            </div>
            <button onClick={handleJoin} disabled={loading || !joinId.trim()}
              className="w-full py-2 bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 text-white text-sm rounded-md font-medium transition-colors">
              {loading ? 'Katılınıyor…' : 'Katıl'}
            </button>
          </div>
        )}

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <button onClick={onClose} className="w-full py-1.5 bg-[#383A40] hover:bg-[#404249] text-[#DCDDDE] text-sm rounded-md transition-colors">
          İptal
        </button>
      </div>
    </div>
  )
}

/* ── Server Rail (72 px) ─────────────────────────────────── */
function ServerRail({ mode, setMode, badgeCount, servers, activeServerId, onSelectServer, onAddServer }) {
  const btnBase = 'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-150 relative shrink-0'
  const dmActive  = 'bg-[#5865F2] !rounded-xl'
  const dmIdle    = 'bg-[#313338] hover:bg-[#5865F2] hover:!rounded-xl text-[#949BA4] hover:text-white'

  return (
    <div className="w-[72px] bg-[#1e1f22] flex flex-col items-center py-3 gap-2 shrink-0 overflow-y-auto">
      {/* DM / Home */}
      <button onClick={() => setMode('dms')} title="Mesajlar"
        className={`${btnBase} ${mode === 'dms' ? dmActive : dmIdle}`}>
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
        {badgeCount > 0 && (
          <span className="absolute -bottom-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center px-1">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      <div className="w-8 h-px bg-[#383A40] shrink-0" />

      {/* Dynamic server list */}
      {servers.map((server) => {
        const isActive = server.id === activeServerId && mode === 'servers'
        const initials = (server.name || '?').slice(0, 2).toUpperCase()
        const color    = avatarColor(server.id)
        return (
          <button
            key={server.id}
            onClick={() => { setMode('servers'); onSelectServer(server.id) }}
            title={server.name}
            style={{ backgroundColor: isActive ? '#5865F2' : color }}
            className={`${btnBase} font-bold text-white text-sm ${isActive ? '!rounded-xl' : 'hover:!rounded-xl'}`}
          >
            {initials}
          </button>
        )
      })}

      {/* Add server button */}
      <button
        onClick={onAddServer}
        title="Sunucu Ekle"
        className={`${btnBase} bg-[#313338] hover:bg-[#3BA55C] hover:!rounded-xl text-[#3BA55C] hover:text-white`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}

/* ── Channel row ─────────────────────────────────────────── */
function ChannelRow({ channel, active, onClick }) {
  return (
    <button onClick={onClick} className={[
      'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left',
      active ? 'bg-[#404249] text-white' : 'text-[#949BA4] hover:bg-[#35373C] hover:text-[#DCDDDE]',
    ].join(' ')}>
      {channel.type === 'voice' ? (
        <span className="text-sm shrink-0">🔊</span>
      ) : (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
        </svg>
      )}
      <span className="truncate">{channel.name}</span>
    </button>
  )
}

/* ── DM row ──────────────────────────────────────────────── */
function DMRow({ dm, active, onClick }) {
  const [partner, setPartner] = useState(null)

  useEffect(() => {
    if (!dm.partnerUid) return
    getUserProfile(dm.partnerUid).then(setPartner)
  }, [dm.partnerUid])

  const name = partner?.nickname || partner?.fullName || 'Kullanıcı'
  return (
    <button onClick={onClick} className={[
      'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors text-left',
      active ? 'bg-[#404249] text-white' : 'text-[#949BA4] hover:bg-[#35373C] hover:text-[#DCDDDE]',
    ].join(' ')}>
      <div className="relative shrink-0">
        <Avatar uid={dm.partnerUid} photoURL={partner?.photoURL} name={name} size="sm" />
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#2B2D31] ${partner?.online ? 'bg-green-400' : 'bg-gray-500'}`} />
      </div>
      <span className="truncate font-medium">{name}</span>
    </button>
  )
}

/* ── Skeleton ────────────────────────────────────────────── */
function ChannelSkeleton() {
  return (
    <div className="space-y-1 px-2">
      {[80, 60, 72, 55].map((w, i) => (
        <div key={i} className="h-8 rounded-md bg-[#383A40] animate-pulse" style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}

/* ── Profile bar ─────────────────────────────────────────── */
function ProfileBar({ onSettingsClick }) {
  const uid      = useAuthStore((s) => s.uid)
  const fullName = useAuthStore((s) => s.fullName)
  const nickname = useAuthStore((s) => s.nickname)
  const photoURL = useAuthStore((s) => s.photoURL)
  const status   = useAuthStore((s) => s.status) || 'online'

  const displayName = nickname || fullName || 'Kullanıcı'
  const cfg         = STATUS_CFG[status] || STATUS_CFG.online

  return (
    <div className="bg-[#232428] px-2 py-2 flex items-center gap-2 shrink-0">
      <div className="relative cursor-pointer" onClick={onSettingsClick}>
        <Avatar uid={uid} photoURL={photoURL} name={displayName} size="sm" />
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#232428] ${cfg.dot}`} />
      </div>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onSettingsClick}>
        <p className="text-xs font-semibold text-white truncate leading-tight">{displayName}</p>
        <p className="text-[10px] text-[#949BA4] truncate">{cfg.label}</p>
      </div>
      <button onClick={onSettingsClick} title="Ayarlar"
        className="text-[#949BA4] hover:text-white transition-colors shrink-0 p-1 rounded hover:bg-[#35373C]">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  )
}

/* ── Main ────────────────────────────────────────────────── */
export default function Sidebar({ serverId, servers = [], onSelectServer, selectedChat, onSelectChat }) {
  const uid = useAuthStore((s) => s.uid)

  const [mode,            setMode]            = useState('servers')
  const [profileOpen,     setProfileOpen]     = useState(false)
  const [serverModalOpen, setServerModalOpen] = useState(false)
  const [creating,        setCreating]        = useState(false)
  const [newName,         setNewName]         = useState('')
  const [chError,         setChError]         = useState('')
  const [chSaving,        setChSaving]        = useState(false)
  const [channelType,     setChannelType]     = useState('text')
  const inputRef    = useRef(null)
  const onSelectRef = useRef(onSelectChat)
  useEffect(() => { onSelectRef.current = onSelectChat }, [onSelectChat])

  const { channels, loading } = useChannels(serverId)
  console.log('serverId:', serverId)
  const dms            = useDMList(uid)
  const friendRequests = useFriendRequests(uid)

  // Auto-select #genel on first load or server switch
  useEffect(() => {
    if (mode !== 'servers' || loading || channels.length === 0) return
    if (selectedChat?.type === 'channel') return
    const ch = channels.find((c) => c.name === 'genel') ?? channels[0]
    onSelectRef.current({ type: 'channel', id: ch.id, name: ch.name, channelType: ch.type ?? 'text' })
  }, [channels, loading, mode, selectedChat?.type])

  useEffect(() => {
    if (creating) inputRef.current?.focus()
  }, [creating])

  const textChannels  = channels.filter((c) => c.type === 'text')
  const voiceChannels = channels.filter((c) => c.type === 'voice')

  function openCreate(type = 'text') {
    setChannelType(type)
    setCreating(true)
    setNewName('')
    setChError('')
  }

  function cancelCreate() {
    setCreating(false)
    setNewName('')
    setChError('')
    setChannelType('text')
  }

  async function handleCreateChannel() {
    const name = newName.trim().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-ğüşıöç]/g, '')
    if (!name) { setChError('Geçerli bir isim gir'); return }
    if (!serverId) return
    setChSaving(true)
    setChError('')
    try {
      if (!auth.currentUser) await signInAnonymously(auth)
      const newChannelId = await createChannel(serverId, name, channelType)
      setNewName('')
      setCreating(false)
      setChannelType('text')
      onSelectChat({ type: 'channel', id: newChannelId, name, channelType })
    } catch (e) {
      setChError('Kanal oluşturulamadı, tekrar dene')
      console.error('[createChannel]', e)
    } finally {
      setChSaving(false)
    }
  }

  const activeServer = servers.find((s) => s.id === serverId)

  return (
    <div className="flex h-full shrink-0">
      <ServerRail
        mode={mode} setMode={setMode}
        badgeCount={friendRequests.length}
        servers={servers}
        activeServerId={serverId}
        onSelectServer={onSelectServer}
        onAddServer={() => setServerModalOpen(true)}
      />

      <div className="w-60 bg-[#2B2D31] flex flex-col h-full select-none">
        {mode === 'servers' ? (
          <>
            {/* Header */}
            <div className="flex items-center px-4 py-3 border-b border-[#1e1f22] shadow-md shrink-0">
              <h1 className="font-bold text-white text-sm truncate flex-1">
                {activeServer?.name ?? 'Sunucu'}
              </h1>
            </div>

            {/* Channel list */}
            <div className="flex-1 overflow-y-auto py-3 space-y-4">
              {/* Text channels */}
              <div>
                <div className="flex items-center justify-between px-4 mb-1">
                  <span className="text-[10px] font-semibold text-[#949BA4] uppercase tracking-widest">Kanallar</span>
                  <button onClick={() => openCreate('text')} title="Metin Kanalı Oluştur"
                    className="text-[#949BA4] hover:text-white transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-0.5 px-2">
                  {loading ? <ChannelSkeleton /> : textChannels.map((ch) => (
                    <ChannelRow
                      key={ch.id} channel={ch}
                      active={selectedChat?.type === 'channel' && selectedChat.id === ch.id}
                      onClick={() => onSelectChat({ type: 'channel', id: ch.id, name: ch.name, channelType: 'text' })}
                    />
                  ))}
                </div>
              </div>

              {/* Voice channels */}
              <div>
                <div className="flex items-center justify-between px-4 mb-1">
                  <span className="text-[10px] font-semibold text-[#949BA4] uppercase tracking-widest">Ses Kanalları</span>
                  <button onClick={() => openCreate('voice')} title="Ses Kanalı Oluştur"
                    className="text-[#949BA4] hover:text-white transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-0.5 px-2">
                  {loading ? null : voiceChannels.length === 0 ? (
                    <p className="text-[10px] text-[#6d6f78] px-2 py-1">Henüz ses kanalı yok</p>
                  ) : voiceChannels.map((ch) => (
                    <ChannelRow
                      key={ch.id} channel={ch}
                      active={selectedChat?.type === 'channel' && selectedChat.id === ch.id}
                      onClick={() => onSelectChat({ type: 'channel', id: ch.id, name: ch.name, channelType: 'voice' })}
                    />
                  ))}
                </div>
              </div>

              {/* Create channel form */}
              {creating && (
                <div className="px-2 space-y-1.5">
                  {/* Type toggle */}
                  <div className="flex gap-1 bg-[#1e1f22] rounded-lg p-1">
                    {[
                      { value: 'text',  label: '# Metin' },
                      { value: 'voice', label: '🔊 Ses' },
                    ].map(({ value, label }) => (
                      <button key={value} onClick={() => setChannelType(value)}
                        className={[
                          'flex-1 py-1 rounded-md text-[11px] font-semibold transition-colors',
                          channelType === value
                            ? 'bg-[#5865F2] text-white'
                            : 'text-[#949BA4] hover:text-white',
                        ].join(' ')}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <input
                    ref={inputRef} type="text" value={newName}
                    onChange={(e) => { setNewName(e.target.value); setChError('') }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter')  handleCreateChannel()
                      if (e.key === 'Escape') cancelCreate()
                    }}
                    placeholder={channelType === 'voice' ? 'ses-kanalı' : 'yeni-kanal'}
                    className="w-full bg-[#1e1f22] text-white text-xs rounded-md px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-[#5865F2] placeholder-[#949BA4]/50"
                  />
                  {chError && <p className="text-red-400 text-[10px] px-0.5">{chError}</p>}
                  <div className="flex gap-1.5">
                    <button onClick={handleCreateChannel} disabled={chSaving}
                      className="flex-1 py-1 bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 text-white text-xs rounded-md font-medium transition-colors">
                      {chSaving ? '…' : 'Oluştur'}
                    </button>
                    <button onClick={cancelCreate}
                      className="flex-1 py-1 bg-[#383A40] hover:bg-[#404249] text-[#DCDDDE] text-xs rounded-md transition-colors">
                      İptal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* DM Header */}
            <div className="px-3 pt-3 shrink-0">
              <button
                onClick={() => onSelectChat({ type: 'friends' })}
                className={[
                  'w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-sm font-medium transition-colors text-left',
                  selectedChat?.type === 'friends'
                    ? 'bg-[#404249] text-white'
                    : 'text-[#949BA4] hover:bg-[#35373C] hover:text-[#DCDDDE]',
                ].join(' ')}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="flex-1">Arkadaşlar</span>
                {friendRequests.length > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {friendRequests.length}
                  </span>
                )}
              </button>
            </div>

            {/* DM list */}
            <div className="flex-1 overflow-y-auto px-2 pb-2 mt-2">
              {dms.length > 0 && (
                <>
                  <div className="px-2 mb-1">
                    <span className="text-[10px] font-semibold text-[#949BA4] uppercase tracking-widest">Doğrudan Mesajlar</span>
                  </div>
                  <div className="space-y-0.5">
                    {dms.map((dm) => (
                      <DMRow
                        key={dm.id} dm={dm}
                        active={selectedChat?.type === 'dm' && selectedChat.dmId === dm.id}
                        onClick={() => onSelectChat({ type: 'dm', dmId: dm.id, partnerUid: dm.partnerUid })}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        <ProfileBar onSettingsClick={() => setProfileOpen(true)} />
      </div>

      {profileOpen     && <ProfileModal onClose={() => setProfileOpen(false)} />}
      {serverModalOpen && (
        <ServerModal
          onClose={() => setServerModalOpen(false)}
          onSuccess={({ serverId: newSid, defaultChannelId }) => {
            onSelectServer(newSid)
            if (defaultChannelId) {
              onSelectChat({ type: 'channel', id: defaultChannelId, name: 'genel' })
            }
            setMode('servers')
          }}
        />
      )}
    </div>
  )
}