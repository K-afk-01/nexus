import { useRef, useEffect, useState } from 'react'
import { useMessages, useSendMessage, useDMMessages, useSendDM } from '../../hooks/useChat'
import {
  deleteMessage, addReaction, removeReaction, createInvite,
} from '../../services/chatService'
import {
  deleteDMMessage, addDMReaction, removeDMReaction,
} from '../../services/dmService'
import { uploadAttachment } from '../../services/storageService'
import { getUserProfile } from '../../services/userService'
import MessageBubble from './MessageBubble'
import useAuthStore from '../../store/useAuthStore'

const GROUP_WINDOW_MS = 5 * 60 * 1000

/* ── Icons ───────────────────────────────────────────────── */
function HashIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
    </svg>
  )
}

/* ── Invite modal ────────────────────────────────────────── */
function InviteModal({ code, onClose }) {
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}/verify?invite=${code}`
  function copy() {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-[#2B2D31] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Sunucuya Davet Et</h3>
          <button onClick={onClose} className="text-[#949BA4] hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-[#949BA4] text-sm">Bu bağlantıyı paylaşarak arkadaşlarını sunucuya davet edebilirsin</p>
        <div className="flex gap-2">
          <input readOnly value={link}
            className="flex-1 bg-[#1e1f22] text-[#DCDDDE] text-xs rounded-lg px-3 py-2.5 outline-none truncate" />
          <button onClick={copy}
            className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium rounded-lg transition-colors shrink-0">
            {copied ? 'Kopyalandı!' : 'Kopyala'}
          </button>
        </div>
        <p className="text-xs text-[#949BA4]">Davet kodu: <span className="font-mono font-bold text-white">{code}</span></p>
      </div>
    </div>
  )
}

/* ── DM header ───────────────────────────────────────────── */
function DMHeader({ partnerUid, partnerName, partnerPhotoURL }) {
  const [profile, setProfile] = useState(null)
  useEffect(() => {
    if (partnerUid) getUserProfile(partnerUid).then(setProfile)
  }, [partnerUid])

  const name  = profile?.nickname || profile?.fullName || partnerName || 'Kullanıcı'
  const photo = profile?.photoURL || partnerPhotoURL
  const initC = name[0]?.toUpperCase() ?? '?'

  return (
    <div className="hidden lg:flex items-center gap-3 px-4 py-3 border-b border-[#1e1f22] shrink-0 shadow-sm">
      <div className="relative shrink-0">
        {photo ? (
          <img src={photo} className="w-6 h-6 rounded-full object-cover" alt="" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-[#5865F2] flex items-center justify-center text-xs font-bold text-white">
            {initC}
          </div>
        )}
        {profile?.online && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#313338]" />
        )}
      </div>
      <span className="font-bold text-white">{name}</span>
      {profile?.online && <span className="text-xs text-green-400 ml-1">Çevrimiçi</span>}
    </div>
  )
}

/* ── Pending file preview ───────────────────────────────── */
function FilePreview({ file, onRemove }) {
  const isImage = file.type.startsWith('image/')
  const [src, setSrc] = useState(null)
  useEffect(() => {
    if (!isImage) return
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file, isImage])

  return (
    <div className="flex items-center gap-2 bg-[#2B2D31] px-3 py-2 rounded-xl mb-2">
      {isImage && src
        ? <img src={src} className="w-12 h-12 rounded-lg object-cover" alt="" />
        : <div className="w-12 h-12 bg-[#383A40] rounded-lg flex items-center justify-center text-[#949BA4]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </div>
      }
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-medium truncate">{file.name}</p>
        <p className="text-[#949BA4] text-[10px]">{(file.size / 1024).toFixed(0)} KB</p>
      </div>
      <button onClick={onRemove} className="text-[#949BA4] hover:text-red-400 transition-colors p-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

/* ── Empty / no-channel states ──────────────────────────── */
function NoChannelState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#313338]">
      <div className="text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-[#5865F2]/15 flex items-center justify-center mx-auto">
          <HashIcon className="w-10 h-10 text-[#5865F2]" />
        </div>
        <p className="text-white font-semibold text-lg">Bir kanal seçin</p>
        <p className="text-[#949BA4] text-sm">Sol menüden bir kanala tıklayın.</p>
      </div>
    </div>
  )
}

function EmptyChannelState({ channelName }) {
  return (
    <div className="flex flex-col items-center justify-end pb-6 gap-4 flex-1">
      <div className="w-20 h-20 rounded-full bg-[#383A40] flex items-center justify-center">
        <HashIcon className="w-10 h-10 text-[#949BA4]" />
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-white">#{channelName} kanalına hoş geldiniz!</p>
        <p className="text-[#949BA4] text-sm mt-1">İlk mesajı sen gönder!</p>
      </div>
    </div>
  )
}

/* ── Main ────────────────────────────────────────────────── */
export default function ChatArea({ chat, serverId, memberCount = 0 }) {
  const isDM      = chat?.type === 'dm'
  const chatId    = isDM ? chat.dmId : chat?.id
  const chatName  = isDM ? (chat.partnerName || 'Mesaj') : (chat?.name || '')

  const { messages: chMsgs, loading: chLoading } = useMessages(isDM ? null : chatId)
  const { messages: dmMsgs, loading: dmLoading }  = useDMMessages(isDM ? chatId : null)
  const { sendMessage: sendCh, sending: sendingCh } = useSendMessage()
  const { sendMessage: sendDM, sending: sendingDM } = useSendDM()

  const messages = isDM ? dmMsgs : chMsgs
  const loading  = isDM ? dmLoading : chLoading
  const sending  = isDM ? sendingDM : sendingCh

  const myUid = useAuthStore((s) => s.uid)

  const [text,        setText]        = useState('')
  const [pendingFile, setPendingFile] = useState(null)
  const [uploading,   setUploading]   = useState(false)
  const [inviteCode,  setInviteCode]  = useState(null)
  const [showInvite,  setShowInvite]  = useState(false)

  const bottomRef   = useRef(null)
  const textareaRef = useRef(null)
  const listRef     = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (isNearBottom || messages.length <= 50) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    if (!text && textareaRef.current) textareaRef.current.style.height = 'auto'
  }, [text])

  async function handleSend() {
    if ((!text.trim() && !pendingFile) || sending || uploading || !chatId) return

    let fileURL = null
    let fileName = null
    let type = 'text'

    if (pendingFile) {
      setUploading(true)
      try {
        fileURL  = await uploadAttachment(chatId, pendingFile)
        fileName = pendingFile.name
        type     = pendingFile.type.startsWith('image/') ? 'image'
                 : pendingFile.type.startsWith('video/') ? 'video'
                 : 'file'
      } finally {
        setUploading(false)
        setPendingFile(null)
      }
    }

    if (isDM) {
      await sendDM(chatId, text, { type, fileURL, fileName })
    } else {
      await sendCh(chatId, text, { type, fileURL, fileName })
    }
    setText('')
    textareaRef.current?.focus()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInput(e) {
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 144) + 'px'
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (file) setPendingFile(file)
    e.target.value = ''
  }

  async function handleDelete(msgId) {
    if (isDM) await deleteDMMessage(chatId, msgId)
    else      await deleteMessage(chatId, msgId)
  }

  async function handleReact(msgId, emoji, action) {
    if (!myUid || !chatId) return
    if (isDM) {
      if (action === 'add')    await addDMReaction(chatId, msgId, emoji, myUid)
      else                     await removeDMReaction(chatId, msgId, emoji, myUid)
    } else {
      if (action === 'add')    await addReaction(chatId, msgId, emoji, myUid)
      else                     await removeReaction(chatId, msgId, emoji, myUid)
    }
  }

  async function handleInvite() {
    if (!serverId) return
    const code = await createInvite(serverId, myUid)
    setInviteCode(code)
    setShowInvite(true)
  }

  if (!chatId) return <NoChannelState />

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#313338]">
      {/* Header */}
      {isDM ? (
        <DMHeader partnerUid={chat.partnerUid} partnerName={chat.partnerName} partnerPhotoURL={chat.partnerPhotoURL} />
      ) : (
        <div className="hidden lg:flex items-center gap-3 px-4 py-3 border-b border-[#1e1f22] shrink-0 shadow-sm">
          <HashIcon className="w-5 h-5 text-[#949BA4] shrink-0" />
          <span className="font-bold text-white">{chatName}</span>
          <div className="ml-auto flex items-center gap-3">
            {/* Invite button */}
            <button onClick={handleInvite}
              title="Davet Et"
              className="flex items-center gap-1.5 text-[#949BA4] hover:text-white text-xs transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Davet Et
            </button>
            <div className="flex items-center gap-1.5 text-xs text-[#949BA4]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{memberCount} üye</span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#313338] border-b border-[#1e1f22] lg:hidden">
        <span className="font-bold text-white text-sm">{isDM ? chatName : `#${chatName}`}</span>
      </div>

      {/* Message list */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-2 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#5865F2] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          isDM ? (
            <div className="flex-1 flex items-end pb-6 justify-center">
              <p className="text-[#949BA4] text-sm">Konuşmayı başlatmak için bir mesaj gönder!</p>
            </div>
          ) : (
            <EmptyChannelState channelName={chatName} />
          )
        ) : (
          <>
            {messages.map((msg, i) => {
              const prev    = messages[i - 1]
              const compact = !!prev
                && prev.authorId === msg.authorId
                && (msg.timestamp ?? 0) - (prev.timestamp ?? 0) < GROUP_WINDOW_MS
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  compact={compact}
                  onDelete={handleDelete}
                  onReact={handleReact}
                />
              )
            })}
            <div ref={bottomRef} className="h-4 shrink-0" />
          </>
        )}
      </div>

      {/* Input */}
      <div className="px-4 pb-5 pt-0 bg-[#313338] shrink-0">
        {pendingFile && (
          <FilePreview file={pendingFile} onRemove={() => setPendingFile(null)} />
        )}
        <div className="bg-[#383A40] rounded-xl flex items-end gap-2 px-3 py-3">
          {/* Attach file */}
          <button onClick={() => fileInputRef.current?.click()}
            className="text-[#949BA4] hover:text-white transition-colors shrink-0 p-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*,.pdf,.doc,.docx"
            onChange={handleFileChange} />

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder={isDM ? `${chatName}'a mesaj gönder` : `#${chatName} kanalına mesaj gönder`}
            rows={1}
            className="flex-1 bg-transparent text-[#DCDDDE] placeholder-[#949BA4]/60 text-sm resize-none outline-none leading-5 max-h-36"
          />

          {/* Send */}
          <button onClick={handleSend}
            disabled={(!text.trim() && !pendingFile) || sending || uploading}
            className={[
              'p-1.5 rounded-lg transition-all duration-150 shrink-0',
              (text.trim() || pendingFile) && !sending && !uploading
                ? 'text-[#5865F2] hover:bg-[#5865F2] hover:text-white'
                : 'text-[#949BA4]/40 cursor-not-allowed',
            ].join(' ')}>
            {uploading ? (
              <div className="w-5 h-5 border-2 border-[#5865F2] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-[10px] text-[#949BA4]/40 mt-1.5 ml-1 select-none">
          Enter ile gönder · Shift+Enter ile yeni satır
        </p>
      </div>

      {showInvite && inviteCode && (
        <InviteModal code={inviteCode} onClose={() => setShowInvite(false)} />
      )}
    </div>
  )
}
