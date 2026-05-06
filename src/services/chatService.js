import {
  ref, push, set, get, update, remove, onValue,
  query, orderByChild, limitToLast,
  serverTimestamp,
} from 'firebase/database'
import { db } from './firebase'

/* ── Servers ───────────────────────────────────────────────── */

export async function createServer(name, userId) {
  const r = push(ref(db, 'servers'))
  await set(r, {
    name,
    ownerId: userId,
    createdAt: Date.now(), // 🔥 FIX
    serverTime: serverTimestamp(),
  })
  return r.key
}

export async function createChannel(serverId, name, type = 'text') {
  const r = push(ref(db, `servers/${serverId}/channels`))
  await set(r, { name, type, createdAt: Date.now() })
  return r.key
}

export async function createDefaultServer(userId) {
  const sid = await createServer('Nexus Ana Sunucu', userId)
  await Promise.all([
    createChannel(sid, 'genel',     'text'),
    createChannel(sid, 'duyurular', 'text'),
    createChannel(sid, 'oyun',      'text'),
    createChannel(sid, 'müzik',     'voice'),
  ])
  return sid
}

export async function getOrCreateDefaultServer(userId, options = {}) {
  const metaRef = ref(db, 'meta/defaultServerId')
  const snap    = await get(metaRef)

  let sid
  if (snap.exists()) {
    sid = snap.val()
  } else {
    sid = await createDefaultServer(userId)
    await set(metaRef, sid)
  }

  if (options.displayName) {
    await joinServer(sid, userId, options)
  }

  const channelsSnap = await get(ref(db, `servers/${sid}/channels`))
  let defaultChannelId = null
  channelsSnap.forEach((child) => {
    if (!defaultChannelId && child.val().name?.toLowerCase().includes('genel')) {
      defaultChannelId = child.key
    }
  })
  if (!defaultChannelId) {
    channelsSnap.forEach((child) => { if (!defaultChannelId) defaultChannelId = child.key })
  }

  return { serverId: sid, defaultChannelId }
}

/* ── Members ───────────────────────────────────────────────── */

export function joinServer(serverId, userId, { displayName }) {
  return Promise.all([
    set(ref(db, `members/${serverId}/${userId}`), {
      joinedAt: Date.now(),
      serverTime: serverTimestamp(),
      verified: true,
      displayName: displayName || 'Kullanıcı',
    }),
    set(ref(db, `userServers/${userId}/${serverId}`), { joinedAt: Date.now() }),
  ])
}

export function subscribeToUserServers(userId, callback) {
  return onValue(ref(db, `userServers/${userId}`), (snap) => {
    if (!snap.exists()) { callback([]); return }
    const serverIds = Object.keys(snap.val())
    Promise.all(
      serverIds.map((sid) =>
        get(ref(db, `servers/${sid}`)).then((s) =>
          s.exists() ? { id: sid, ...s.val() } : null
        )
      )
    ).then((results) => callback(results.filter(Boolean)))
  })
}

export async function createUserServer(name, userId, displayName) {
  const serverId = await createServer(name, userId)
  await Promise.all([
    createChannel(serverId, 'genel', 'text'),
    createChannel(serverId, 'duyurular', 'text'),
  ])
  await joinServer(serverId, userId, { displayName })
  const channelsSnap = await get(ref(db, `servers/${serverId}/channels`))
  let defaultChannelId = null
  channelsSnap.forEach((child) => { if (!defaultChannelId) defaultChannelId = child.key })
  return { serverId, defaultChannelId }
}

export async function joinServerById(serverId, userId, displayName) {
  const snap = await get(ref(db, `servers/${serverId}`))
  if (!snap.exists()) throw new Error('Sunucu bulunamadı')
  await joinServer(serverId, userId, { displayName })
  const channelsSnap = await get(ref(db, `servers/${serverId}/channels`))
  let defaultChannelId = null
  channelsSnap.forEach((child) => { if (!defaultChannelId) defaultChannelId = child.key })
  return { serverId, defaultChannelId }
}

/* ── Messages ──────────────────────────────────────────────── */

export function sendMessage(channelId, content, { uid, displayName, type = 'text', fileURL = null, fileName = null }) {
  const r = push(ref(db, `messages/${channelId}`))
  return set(r, {
    content: content || '',
    authorId: uid,
    authorName: displayName || 'Kullanıcı',
    verified: true,

    // 🔥🔥🔥 KRİTİK FIX
    timestamp: Date.now(),         // sorting için
    serverTime: serverTimestamp(), // gerçek zaman için

    edited: false,
    type,
    fileURL,
    fileName,
    deleted: false,
  })
}

export async function deleteMessage(channelId, msgId) {
  await update(ref(db, `messages/${channelId}/${msgId}`), {
    deleted: true,
    content: '',
    fileURL: null,
  })
}

export async function addReaction(channelId, msgId, emoji, uid) {
  await set(ref(db, `messages/${channelId}/${msgId}/reactions/${emoji}/${uid}`), true)
}

export async function removeReaction(channelId, msgId, emoji, uid) {
  await remove(ref(db, `messages/${channelId}/${msgId}/reactions/${emoji}/${uid}`))
}

/* ── Invites ───────────────────────────────────────────────── */

export async function createInvite(serverId, createdBy) {
  const code = Math.random().toString(36).substr(2, 8).toUpperCase()
  await set(ref(db, `invites/${code}`), {
    serverId,
    createdBy,
    createdAt: Date.now(), // 🔥 FIX
    serverTime: serverTimestamp(),
    uses: 0,
  })
  return code
}

export async function joinByInvite(code, userId, displayName) {
  const snap = await get(ref(db, `invites/${code.toUpperCase()}`))
  if (!snap.exists()) throw new Error('Geçersiz davet kodu')
  const invite = snap.val()

  await joinServer(invite.serverId, userId, { displayName })

  await update(ref(db, `invites/${code.toUpperCase()}`), {
    uses: (invite.uses || 0) + 1,
  })

  return invite.serverId
}

/* ── Subscriptions ─────────────────────────────────────────── */

export function subscribeToMessages(channelId, callback) {
  const q = query(
    ref(db, `messages/${channelId}`),
    orderByChild('timestamp'), // artık stabil
    limitToLast(50),
  )

  return onValue(q, (snap) => {
    const msgs = []
    snap.forEach((child) => {
      const val = child.val()

      // 🔥 ekstra güvenlik (bozuk timestamp skip)
      if (typeof val.timestamp !== 'number') return

      msgs.push({
        id: child.key,
        ...val,
      })
    })

    callback(msgs)
  })
}

export function subscribeToChannels(serverId, callback) {
  return onValue(ref(db, `servers/${serverId}/channels`), (snap) => {
    const channels = []
    snap.forEach((child) => channels.push({ id: child.key, ...child.val() }))
    callback(channels)
  })
}

export function subscribeToMembers(serverId, callback) {
  return onValue(ref(db, `members/${serverId}`), (snap) => {
    callback(snap.exists() ? Object.keys(snap.val()).length : 0)
  })
}