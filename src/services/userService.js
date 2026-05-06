import { ref, update, get, onValue } from 'firebase/database'
import { db } from './firebase'

export async function updateUserProfile(uid, data) {
  return update(ref(db, `users/${uid}`), data)
}

export async function getUserProfile(uid) {
  const snap = await get(ref(db, `users/${uid}`))
  return snap.exists() ? { uid, ...snap.val() } : null
}

export function subscribeUserProfile(uid, callback) {
  return onValue(ref(db, `users/${uid}`), (snap) => {
    callback(snap.exists() ? { uid, ...snap.val() } : null)
  })
}

export function subscribeChannelMembers(serverId, callback) {
  return onValue(ref(db, `members/${serverId}`), (snap) => {
    const members = []
    snap.forEach((c) => members.push({ uid: c.key, ...c.val() }))
    callback(members)
  })
}
