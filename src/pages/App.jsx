import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'
import Sidebar from '../components/chat/Sidebar'
import ChatArea from '../components/chat/ChatArea'
import UserListPanel from '../components/chat/UserListPanel'
import FriendsView from '../components/chat/FriendsView'
import VoiceChannel from '../components/chat/VoiceChannel'
import { updateUserProfile } from '../services/userService'
import { useMembers, useUserServers } from '../hooks/useChat'
import { auth } from '../services/firebase'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'

function AppShell({ serverId, selectedChat, onSelectChat, memberCount }) {
  const isDM          = selectedChat?.type === 'dm'
  const isFriends     = selectedChat?.type === 'friends'
  const isChannel     = selectedChat?.type === 'channel'
  const isVoice       = isChannel && selectedChat?.channelType === 'voice'
  const isTextChannel = isChannel && !isVoice

  return (
    <div className="flex flex-1 min-w-0 min-h-0">
      {isFriends ? (
        <FriendsView onSelectChat={onSelectChat} />
      ) : isVoice ? (
        <VoiceChannel channel={selectedChat} />
      ) : (
        <>
          <ChatArea
            chat={selectedChat}
            serverId={isTextChannel ? serverId : null}
            memberCount={memberCount}
          />
          {isTextChannel && (
            <UserListPanel
              serverId={serverId}
              onOpenDM={onSelectChat}
            />
          )}
        </>
      )}
    </div>
  )
}

export default function App() {
  const navigate = useNavigate()
  const [ready,         setReady]         = useState(false)
  const [serverId,      setServerId]      = useState(null)
  const [selectedChat,  setSelectedChat]  = useState(null)
  const [sidebarOpen,   setSidebarOpen]   = useState(false)

  const uid     = useAuthStore((s) => s.uid)
  const servers = useUserServers(uid)

  const memberCount = useMembers(selectedChat?.type === 'channel' ? serverId : null)

  // ✅ FIX: servers yüklenince ilk sunucuyu otomatik seç
  useEffect(() => {
    if (servers.length > 0 && !serverId) {
      setServerId(servers[0].id)
    }
  }, [servers, serverId])

  useEffect(() => {
    async function check() {
      // Firebase anonim auth, abonelikler kurulmadan önce hazır olmalı
      try {
        const storeUid = useAuthStore.getState().uid
        if (!auth.currentUser && storeUid && !storeUid.startsWith('offline-')) {
          await signInAnonymously(auth)
        }
      } catch {
        // ignore - onAuthStateChanged effect will retry
      }

      try {
        const raw = localStorage.getItem('nexus-auth')
        if (raw) {
          const { uid, verified, profileComplete } = JSON.parse(raw).state || {}
          if (verified && uid) {
            if (!profileComplete) { navigate('/profile-setup', { replace: true }); return }
            setReady(true)
            return
          }
        }
      } catch (e) {
        console.error('[App] localStorage parse error:', e)
      }

      const { verified, uid, profileComplete } = useAuthStore.getState()
      if (verified && uid) {
        if (!profileComplete) { navigate('/profile-setup', { replace: true }); return }
        setReady(true)
      } else {
        navigate('/verify', { replace: true })
      }
    }
    const t = setTimeout(check, 150)
    return () => clearTimeout(t)
  }, [])

  // Ensure Firebase anonymous auth is always active
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        const { uid } = useAuthStore.getState()
        if (uid && !uid.startsWith('offline-')) {
          signInAnonymously(auth).catch(() => {})
        }
      }
    })
    return unsub
  }, [])

  // Mark online when app loads
  useEffect(() => {
    const { uid } = useAuthStore.getState()
    if (!uid) return
    updateUserProfile(uid, { online: true })
    const handleUnload = () => updateUserProfile(uid, { online: false })
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [])

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#313338]">
        <div className="w-8 h-8 border-2 border-[#5865F2] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#313338] overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={[
        'fixed md:relative z-20 h-full transition-transform duration-200 flex-shrink-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      ].join(' ')}>
        <Sidebar
          serverId={serverId}
          servers={servers}
          onSelectServer={(sid) => {
            setServerId(sid)
            setSelectedChat(null)
          }}
          selectedChat={selectedChat}
          onSelectChat={(chat) => {
            setSelectedChat(chat)
            setSidebarOpen(false)
          }}
        />
      </div>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        {/* Mobile topbar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#313338] border-b border-[#1e1f22] md:hidden shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-[#b5bac1] hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-white font-semibold text-sm">
            {selectedChat?.type === 'channel'
              ? (selectedChat.channelType === 'voice' ? `🔊 ${selectedChat.name}` : `#${selectedChat.name}`)
              : selectedChat?.type === 'dm' ? selectedChat.partnerName : 'Nexus'}
          </span>
        </div>

        {selectedChat ? (
          <AppShell
            serverId={serverId}
            selectedChat={selectedChat}
            onSelectChat={setSelectedChat}
            memberCount={memberCount}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[#949BA4] text-sm">
              {servers.length === 0
                ? 'Başlamak için sol panelden bir sunucu oluştur veya katıl'
                : 'Bir kanal seçin'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}