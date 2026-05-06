import { useState } from 'react'
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

function formatTime(ts) {
  if (!ts) return ''
  const d         = new Date(ts)
  const now       = new Date()
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterday = today - 86_400_000
  const msgDay    = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const hhmm      = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  if (msgDay === today)     return `bugün ${hhmm}`
  if (msgDay === yesterday) return `dün ${hhmm}`
  return `${d.toLocaleDateString('tr-TR')} ${hhmm}`
}

/* ── Verified badge ─────────────────────────────────────── */
function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 bg-green-500/15 text-green-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
      <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
      Doğrulandı
    </span>
  )
}

/* ── Reaction pill ──────────────────────────────────────── */
function ReactionPill({ emoji, uids, myUid, onToggle }) {
  const count   = Object.keys(uids || {}).length
  const isMine  = !!uids?.[myUid]
  if (count === 0) return null
  return (
    <button onClick={() => onToggle(emoji, isMine)}
      className={[
        'inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border transition-colors',
        isMine
          ? 'bg-[#5865F2]/20 border-[#5865F2]/60 text-white'
          : 'bg-[#383A40] border-[#383A40] text-[#949BA4] hover:border-[#5865F2]/40',
      ].join(' ')}>
      <span>{emoji}</span>
      <span className="font-medium">{count}</span>
    </button>
  )
}

/* ── Emoji picker (hover) ───────────────────────────────── */
const QUICK_EMOJIS = ['👍','❤️','😂','😮','😢','🔥','🎉','💯']

function EmojiPicker({ onPick }) {
  return (
    <div className="absolute right-0 -top-10 bg-[#1e1f22] border border-[#383A40] rounded-xl shadow-xl flex gap-0.5 px-1.5 py-1 z-10">
      {QUICK_EMOJIS.map((e) => (
        <button key={e} onClick={() => onPick(e)}
          className="text-base hover:scale-125 transition-transform leading-none p-0.5">
          {e}
        </button>
      ))}
    </div>
  )
}

/* ── Media attachment ───────────────────────────────────── */
function MediaAttachment({ message }) {
  const { fileURL, fileName, type } = message
  if (!fileURL) return null

  if (type === 'image') return (
    <a href={fileURL} target="_blank" rel="noreferrer" className="block mt-1.5">
      <img src={fileURL} alt={fileName || 'görsel'}
        className="max-w-xs max-h-64 rounded-lg object-cover hover:opacity-90 transition-opacity" />
    </a>
  )

  if (type === 'video') return (
    <video src={fileURL} controls className="max-w-xs max-h-64 rounded-lg mt-1.5" />
  )

  // Generic file
  return (
    <a href={fileURL} target="_blank" rel="noreferrer"
      className="inline-flex items-center gap-2 mt-1.5 bg-[#383A40] hover:bg-[#404249] px-3 py-2 rounded-lg text-sm text-[#DCDDDE] transition-colors">
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      </svg>
      {fileName || 'Dosya'}
    </a>
  )
}

/* ── Action bar (hover) ─────────────────────────────────── */
function ActionBar({ message, isOwnMsg, onDelete, onPickEmoji, showEmoji, onToggleEmoji }) {
  return (
    <div className="absolute right-2 -top-4 hidden group-hover:flex items-center gap-0.5 bg-[#2B2D31] border border-[#383A40] rounded-lg shadow-lg px-1 py-0.5 z-10">
      {/* Emoji react */}
      <div className="relative">
        <button onClick={onToggleEmoji}
          className="text-[#949BA4] hover:text-white p-1 rounded transition-colors text-sm leading-none">
          😀
        </button>
        {showEmoji && <EmojiPicker onPick={onPickEmoji} />}
      </div>
      {/* Delete (own only) */}
      {isOwnMsg && (
        <button onClick={onDelete}
          className="text-[#949BA4] hover:text-red-400 p-1 rounded transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  )
}

/* ── Full bubble (avatar + header) ─────────────────────── */
function FullBubble({ message, onDelete, onReact }) {
  const { authorId, authorName, content, timestamp, verified, reactions, deleted } = message
  const myUid   = useAuthStore((s) => s.uid)
  const color   = avatarColor(authorId)
  const initial = (authorName ?? '?')[0].toUpperCase()
  const isOwn   = authorId === myUid

  const [showEmoji, setShowEmoji] = useState(false)

  function handlePickEmoji(emoji) {
    setShowEmoji(false)
    onReact(message.id, emoji, reactions?.[emoji]?.[myUid] ? 'remove' : 'add')
  }

  return (
    <div className="group relative flex items-start gap-3 py-1 px-2 -mx-2 rounded-lg hover:bg-white/[0.03] transition-colors mt-3 first:mt-0">
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 mt-0.5 select-none"
        style={{ backgroundColor: color }}>
        {initial}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="font-semibold text-white text-sm leading-none">{authorName}</span>
          {verified && <VerifiedBadge />}
          <span className="text-[10px] text-[#949BA4] leading-none">{formatTime(timestamp)}</span>
        </div>

        {deleted ? (
          <p className="text-sm text-[#949BA4] italic">Bu mesaj silindi.</p>
        ) : (
          <>
            {content && <p className="text-sm text-[#DCDDDE] leading-[1.4] whitespace-pre-wrap break-words">{content}</p>}
            <MediaAttachment message={message} />
          </>
        )}

        {/* Reactions */}
        {!deleted && reactions && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {Object.entries(reactions).map(([emoji, uids]) => (
              <ReactionPill key={emoji} emoji={emoji} uids={uids} myUid={myUid}
                onToggle={(e, isMine) => onReact(message.id, e, isMine ? 'remove' : 'add')} />
            ))}
          </div>
        )}
      </div>

      {!deleted && (
        <ActionBar
          message={message} isOwnMsg={isOwn}
          onDelete={() => onDelete(message.id)}
          showEmoji={showEmoji}
          onToggleEmoji={() => setShowEmoji((v) => !v)}
          onPickEmoji={handlePickEmoji}
        />
      )}
    </div>
  )
}

/* ── Compact bubble ─────────────────────────────────────── */
function CompactBubble({ message, onDelete, onReact }) {
  const { content, timestamp, reactions, deleted } = message
  const myUid  = useAuthStore((s) => s.uid)
  const isOwn  = message.authorId === myUid
  const hhmm   = timestamp
    ? new Date(timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : ''

  const [showEmoji, setShowEmoji] = useState(false)

  function handlePickEmoji(emoji) {
    setShowEmoji(false)
    onReact(message.id, emoji, reactions?.[emoji]?.[myUid] ? 'remove' : 'add')
  }

  return (
    <div className="group relative flex items-start gap-3 py-0.5 px-2 -mx-2 rounded-lg hover:bg-white/[0.03] transition-colors">
      <div className="w-10 shrink-0 flex justify-center pt-0.5">
        <span className="text-[10px] text-[#949BA4] opacity-0 group-hover:opacity-100 transition-opacity select-none">
          {hhmm}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        {deleted ? (
          <p className="text-sm text-[#949BA4] italic">Bu mesaj silindi.</p>
        ) : (
          <>
            {content && <p className="text-sm text-[#DCDDDE] leading-[1.4] whitespace-pre-wrap break-words">{content}</p>}
            <MediaAttachment message={message} />
          </>
        )}
        {!deleted && reactions && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {Object.entries(reactions).map(([emoji, uids]) => (
              <ReactionPill key={emoji} emoji={emoji} uids={uids} myUid={myUid}
                onToggle={(e, isMine) => onReact(message.id, e, isMine ? 'remove' : 'add')} />
            ))}
          </div>
        )}
      </div>
      {!deleted && (
        <ActionBar
          message={message} isOwnMsg={isOwn}
          onDelete={() => onDelete(message.id)}
          showEmoji={showEmoji}
          onToggleEmoji={() => setShowEmoji((v) => !v)}
          onPickEmoji={handlePickEmoji}
        />
      )}
    </div>
  )
}

export default function MessageBubble({ message, compact = false, onDelete, onReact }) {
  return compact
    ? <CompactBubble message={message} onDelete={onDelete} onReact={onReact} />
    : <FullBubble    message={message} onDelete={onDelete} onReact={onReact} />
}
