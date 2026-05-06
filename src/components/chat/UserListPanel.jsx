import { useState, useEffect } from 'react'
import { useMemberList, useFriends } from '../../hooks/useChat'
import { subscribeUserProfile } from '../../services/userService'
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

function MemberRow({ member, myUid, isFriend, onOpenDM }) {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const unsub = subscribeUserProfile(member.uid, setProfile)
    return unsub
  }, [member.uid])

  const isSelf   = member.uid === myUid
  const name     = profile?.nickname || profile?.fullName || member.displayName || 'Kullanıcı'
  const photo    = profile?.photoURL
  const online   = profile?.online === true
  const initial  = name[0]?.toUpperCase() ?? '?'
  const color    = avatarColor(member.uid)

  function handleClick() {
    if (isSelf || !isFriend) return
    onOpenDM(member.uid, name, photo)
  }

  return (
    <div
      onClick={handleClick}
      className={[
        'w-full flex items-center gap-2 px-1.5 py-[5px] rounded-md transition-colors duration-100',
        isSelf || !isFriend ? 'cursor-default' : 'cursor-pointer hover:bg-[#35373C]',
        !online ? 'opacity-60' : '',
      ].join(' ')}
    >
      <div className="relative shrink-0">
        {photo ? (
          <img src={photo} className="w-8 h-8 rounded-full object-cover" alt="" />
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ backgroundColor: color }}>
            {initial}
          </div>
        )}
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-[1.5px] border-[#2B2D31] ${online ? 'bg-green-400' : 'bg-[#767a7e]'}`} />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-[13px] font-medium truncate text-[#DCDDDE]">{name}</p>
        {isSelf ? (
          <p className="text-[10px] text-[#5865F2] leading-none">sen</p>
        ) : !isFriend ? (
          <p className="text-[10px] text-[#72767d] leading-none">Arkadaş değil</p>
        ) : null}
      </div>
    </div>
  )
}

export default function UserListPanel({ serverId, onOpenDM }) {
  const members    = useMemberList(serverId)
  const myUid      = useAuthStore((s) => s.uid)
  const friends    = useFriends(myUid)
  const friendUids = new Set(friends.map((f) => f.uid))

  async function handleOpenDM(partnerUid, partnerName, partnerPhotoURL) {
    if (!myUid || !partnerUid) return
    const dmId = await getOrCreateDM(myUid, partnerUid)
    onOpenDM({ type: 'dm', dmId, partnerUid, partnerName, partnerPhotoURL })
  }

  if (!serverId) return null

  return (
    <div className="w-[200px] bg-[#2B2D31] flex flex-col shrink-0 border-l border-[#1e1f22]">
      <div className="px-3 py-3 shrink-0">
        <h2 className="text-[10px] font-bold text-[#72767d] uppercase tracking-widest">
          Üyeler — {members.length}
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto pb-2 px-1.5">
        {members.length === 0 ? (
          <p className="text-xs text-[#949BA4] px-2 py-3">Henüz üye yok</p>
        ) : (
          members.map((m) => (
            <MemberRow
              key={m.uid}
              member={m}
              myUid={myUid}
              isFriend={friendUids.has(m.uid)}
              onOpenDM={handleOpenDM}
            />
          ))
        )}
      </div>
    </div>
  )
}
