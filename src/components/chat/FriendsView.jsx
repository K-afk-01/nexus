import { useState, useEffect } from 'react'
import { useFriends, useFriendRequests } from '../../hooks/useChat'
import {
  acceptFriendRequest,
  rejectFriendRequest,
  sendFriendRequest,
  findUserByFriendCode,
} from '../../services/friendService'
import { getUserProfile } from '../../services/userService'
import { getOrCreateDM } from '../../services/dmService'
import useAuthStore from '../../store/useAuthStore'

const COLORS = [
  '#5865F2','#3BA55C','#FAA61A','#EB459E','#ED4245',
  '#00B0F4','#F47FFF','#57F287','#FF7043','#26C6DA',
]
function avatarColor(uid = '') {
  let h = 0
  for (let i = 0; i < uid.length; i++) h = uid.charCodeAt(i) + ((h << 5) - h)
  return COLORS[Math.abs(h) % COLORS.length]
}

function Avatar({ uid, photoURL, name, size = 'md' }) {
  const sz    = size === 'lg' ? 'w-12 h-12 text-lg' : 'w-9 h-9 text-sm'
  const color = avatarColor(uid)
  const init  = (name || '?')[0].toUpperCase()
  if (photoURL) return <img src={photoURL} className={`${sz} rounded-full object-cover shrink-0`} alt="" />
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ backgroundColor: color }}>
      {init}
    </div>
  )
}

/* ── Request card ────────────────────────────────────────── */
function RequestCard({ req, myUid }) {
  const [loading, setLoading] = useState(false)

  async function handle(accept) {
    setLoading(true)
    if (accept) await acceptFriendRequest(myUid, req.fromUid)
    else        await rejectFriendRequest(myUid, req.fromUid)
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-[#2B2D31] rounded-xl border border-[#383A40]/50 hover:border-[#404249] transition-colors">
      <Avatar uid={req.fromUid} photoURL={req.fromPhotoURL} name={req.fromName} size="lg" />
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm truncate">{req.fromName}</p>
        <p className="text-xs text-[#949BA4]">Arkadaşlık isteği gönderdi</p>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button onClick={() => handle(true)} disabled={loading}
          className="w-8 h-8 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-full flex items-center justify-center transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <button onClick={() => handle(false)} disabled={loading}
          className="w-8 h-8 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-full flex items-center justify-center transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

/* ── Friend card ─────────────────────────────────────────── */
function FriendCard({ friend, myUid, onMessage }) {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    getUserProfile(friend.uid).then(setProfile)
  }, [friend.uid])

  const name   = profile?.nickname || profile?.fullName || 'Kullanıcı'
  const online = profile?.online === true

  async function handleMessage() {
    const dmId = await getOrCreateDM(myUid, friend.uid)
    onMessage({ type: 'dm', dmId, partnerUid: friend.uid, partnerName: name, partnerPhotoURL: profile?.photoURL })
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-[#2B2D31] hover:bg-[#32353B] rounded-xl transition-colors duration-100 group border border-transparent hover:border-[#404249]/50">
      <div className="relative shrink-0">
        <Avatar uid={friend.uid} photoURL={profile?.photoURL} name={name} size="lg" />
        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#313338] ${online ? 'bg-green-400' : 'bg-gray-500'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm truncate">{name}</p>
        <p className="text-xs text-[#949BA4]">{online ? 'Çevrimiçi' : 'Çevrimdışı'}</p>
      </div>
      <button onClick={handleMessage}
        className="opacity-0 group-hover:opacity-100 p-2 bg-[#404249] hover:bg-[#5865F2] text-[#949BA4] hover:text-white rounded-full transition-all">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      </button>
    </div>
  )
}

/* ── Main ────────────────────────────────────────────────── */
export default function FriendsView({ onSelectChat }) {
  const myUid = useAuthStore((s) => s.uid)

  const friends  = useFriends(myUid)
  const requests = useFriendRequests(myUid)

  const [tab,        setTab]        = useState('all')   // 'all' | 'pending' | 'add'
  const [codeInput,  setCodeInput]  = useState('')
  const [addStatus,  setAddStatus]  = useState(null)    // null | 'loading' | 'sent' | 'error' | string
  const [addError,   setAddError]   = useState('')

  async function handleAddFriend() {
    if (!codeInput.trim()) return
    setAddStatus('loading')
    setAddError('')
    try {
      const found = await findUserByFriendCode(codeInput.trim())
      if (!found) { setAddStatus('error'); setAddError('Bu koda sahip kullanıcı bulunamadı'); return }
      if (found.uid === myUid) { setAddStatus('error'); setAddError('Kendini ekleyemezsin'); return }
      await sendFriendRequest(myUid, found.uid)
      setAddStatus('sent')
      setCodeInput('')
    } catch {
      setAddStatus('error')
      setAddError('Bir hata oluştu')
    }
  }

  const tabBtn = (key, label, badge) => (
    <button onClick={() => setTab(key)}
      className={[
        'px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-100 relative',
        tab === key
          ? 'bg-[#404249] text-white'
          : 'text-[#72767d] hover:text-[#DCDDDE] hover:bg-[#35373C]',
      ].join(' ')}>
      {label}
      {badge > 0 && (
        <span className="ml-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  )

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[#313338]">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-[#1e1f22] shrink-0 shadow-sm">
        <svg className="w-5 h-5 text-[#949BA4] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="font-bold text-white">Arkadaşlar</span>
        <div className="w-px h-5 bg-[#3f4147] mx-1" />
        <div className="flex gap-0.5">
          {tabBtn('all', 'Tümü', 0)}
          {tabBtn('pending', 'Bekleyen', requests.length)}
          {tabBtn('add', 'Arkadaş Ekle', 0)}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {tab === 'pending' && (
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold text-[#949BA4] uppercase tracking-widest mb-3">
              Bekleyen İstekler — {requests.length}
            </p>
            {requests.length === 0 ? (
              <p className="text-[#949BA4] text-sm">Bekleyen arkadaşlık isteği yok</p>
            ) : (
              requests.map((r) => <RequestCard key={r.id} req={r} myUid={myUid} />)
            )}
          </div>
        )}

        {tab === 'all' && (
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold text-[#949BA4] uppercase tracking-widest mb-3">
              Tüm Arkadaşlar — {friends.length}
            </p>
            {friends.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#949BA4]">Henüz arkadaşın yok</p>
                <button onClick={() => setTab('add')}
                  className="mt-3 px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium rounded-lg transition-colors">
                  Arkadaş Ekle
                </button>
              </div>
            ) : (
              friends.map((f) => <FriendCard key={f.uid} friend={f} myUid={myUid} onMessage={onSelectChat} />)
            )}
          </div>
        )}

        {tab === 'add' && (
          <div className="max-w-md">
            <p className="text-xs font-semibold text-[#949BA4] uppercase tracking-widest mb-1">Arkadaşlık Kodu ile Ekle</p>
            <p className="text-[#949BA4] text-sm mb-4">Arkadaşının 8 haneli kodunu gir</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setAddStatus(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddFriend() }}
                placeholder="ABCD1234"
                maxLength={8}
                className="flex-1 bg-[#1e1f22] text-white rounded-lg px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#5865F2] placeholder-[#949BA4]/50 font-mono tracking-widest"
              />
              <button onClick={handleAddFriend} disabled={addStatus === 'loading' || !codeInput.trim()}
                className="px-4 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                {addStatus === 'loading' ? '…' : 'Ekle'}
              </button>
            </div>
            {addStatus === 'sent' && (
              <p className="mt-2 text-green-400 text-sm">Arkadaşlık isteği gönderildi!</p>
            )}
            {addStatus === 'error' && (
              <p className="mt-2 text-red-400 text-sm">{addError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
