import { ref, set, remove, onValue } from 'firebase/database'
import { db } from './firebase'

export function joinVoicePresence(channelId, userId, displayName) {
  return set(ref(db, `voicePresence/${channelId}/${userId}`), {
    displayName,
    joinedAt: Date.now(),
    muted: false,
  })
}

export function leaveVoicePresence(channelId, userId) {
  return remove(ref(db, `voicePresence/${channelId}/${userId}`))
}

export function setMutedState(channelId, userId, muted) {
  return set(ref(db, `voicePresence/${channelId}/${userId}/muted`), muted)
}

export function subscribeToVoicePresence(channelId, callback) {
  return onValue(ref(db, `voicePresence/${channelId}`), (snap) => {
    const users = []
    snap.forEach((child) => users.push({ uid: child.key, ...child.val() }))
    callback(users)
  })
}
