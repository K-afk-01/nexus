import { useState, useEffect } from 'react'
import {
  subscribeToMessages,
  subscribeToChannels,
  subscribeToMembers,
  subscribeToUserServers,
  sendMessage as svcSend,
} from '../services/chatService'
import {
  subscribeDMMessages,
  subscribeDMs,
  sendDMMessage,
} from '../services/dmService'
import {
  subscribeFriendRequests,
  subscribeFriends,
} from '../services/friendService'
import { subscribeChannelMembers } from '../services/userService'
import useAuthStore from '../store/useAuthStore'

export function useMessages(channelId) {
  const [messages, setMessages] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!channelId) { setMessages([]); setLoading(false); return }
    setLoading(true)
    const unsub = subscribeToMessages(channelId, (msgs) => {
      setMessages(msgs)
      setLoading(false)
    })
    return unsub
  }, [channelId])

  return { messages, loading }
}

export function useChannels(serverId) {
  const [channels, setChannels] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!serverId) { setChannels([]); setLoading(false); return }
    setLoading(true)
    const unsub = subscribeToChannels(serverId, (chs) => {
      setChannels(chs)
      setLoading(false)
    })
    return unsub
  }, [serverId])

  return { channels, loading }
}

export function useMembers(serverId) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!serverId) return
    return subscribeToMembers(serverId, setCount)
  }, [serverId])

  return count
}

export function useMemberList(serverId) {
  const [members, setMembers] = useState([])

  useEffect(() => {
    if (!serverId) return
    return subscribeChannelMembers(serverId, setMembers)
  }, [serverId])

  return members
}

export function useSendMessage() {
  const [sending, setSending] = useState(false)
  const uid      = useAuthStore((s) => s.uid)
  const fullName = useAuthStore((s) => s.fullName)
  const nickname = useAuthStore((s) => s.nickname)

  const sendMessage = async (channelId, content, extras = {}) => {
    if ((!content?.trim() && !extras.fileURL) || !uid || sending) return
    setSending(true)
    try {
      await svcSend(channelId, content?.trim() ?? '', {
        uid,
        displayName: nickname || fullName || 'Kullanıcı',
        ...extras,
      })
    } finally {
      setSending(false)
    }
  }

  return { sendMessage, sending }
}

export function useDMMessages(dmId) {
  const [messages, setMessages] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!dmId) { setMessages([]); setLoading(false); return }
    setLoading(true)
    const unsub = subscribeDMMessages(dmId, (msgs) => {
      setMessages(msgs)
      setLoading(false)
    })
    return unsub
  }, [dmId])

  return { messages, loading }
}

export function useSendDM() {
  const [sending, setSending] = useState(false)
  const uid      = useAuthStore((s) => s.uid)
  const fullName = useAuthStore((s) => s.fullName)
  const nickname = useAuthStore((s) => s.nickname)

  const sendMessage = async (dmId, content, extras = {}) => {
    if ((!content?.trim() && !extras.fileURL) || !uid || sending) return
    setSending(true)
    try {
      await sendDMMessage(dmId, content?.trim() ?? '', {
        uid,
        displayName: nickname || fullName || 'Kullanıcı',
        ...extras,
      })
    } finally {
      setSending(false)
    }
  }

  return { sendMessage, sending }
}

export function useDMList(uid) {
  const [dms, setDms] = useState([])
  useEffect(() => {
    if (!uid) return
    return subscribeDMs(uid, setDms)
  }, [uid])
  return dms
}

export function useFriends(uid) {
  const [friends, setFriends] = useState([])
  useEffect(() => {
    if (!uid) return
    return subscribeFriends(uid, setFriends)
  }, [uid])
  return friends
}

export function useFriendRequests(uid) {
  const [requests, setRequests] = useState([])
  useEffect(() => {
    if (!uid) return
    return subscribeFriendRequests(uid, setRequests)
  }, [uid])
  return requests
}

export function useUserServers(userId) {
  const [servers, setServers] = useState([])
  useEffect(() => {
    if (!userId) return
    return subscribeToUserServers(userId, setServers)
  }, [userId])
  return servers
}