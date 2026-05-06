import { ref, set, get, update, onValue, remove } from 'firebase/database'
import { db } from './firebase'

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function ensureFriendCode(uid) {
  const snap = await get(ref(db, `users/${uid}/friendCode`))
  if (snap.exists()) return snap.val()
  let code
  // eslint-disable-next-line no-constant-condition
  while (true) {
    code = genCode()
    const taken = await get(ref(db, `friendCodes/${code}`))
    if (!taken.exists()) break
  }
  await set(ref(db, `friendCodes/${code}`), uid)
  await update(ref(db, `users/${uid}`), { friendCode: code })
  return code
}

export async function findUserByFriendCode(code) {
  const snap = await get(ref(db, `friendCodes/${code.toUpperCase().trim()}`))
  if (!snap.exists()) return null
  const uid = snap.val()
  const uSnap = await get(ref(db, `users/${uid}`))
  return uSnap.exists() ? { uid, ...uSnap.val() } : null
}

export async function sendFriendRequest(fromUid, toUid) {
  const fromSnap = await get(ref(db, `users/${fromUid}`))
  const from = fromSnap.val() || {}
  await set(ref(db, `friendRequests/${toUid}/${fromUid}`), {
    fromUid,
    fromName:     from.nickname || from.fullName || 'Kullanıcı',
    fromPhotoURL: from.photoURL || null,
    timestamp:    Date.now(),
    status:       'pending',
  })
}

export async function acceptFriendRequest(myUid, fromUid) {
  await Promise.all([
    set(ref(db, `friends/${myUid}/${fromUid}`), { since: Date.now() }),
    set(ref(db, `friends/${fromUid}/${myUid}`), { since: Date.now() }),
    remove(ref(db, `friendRequests/${myUid}/${fromUid}`)),
  ])
}

export async function rejectFriendRequest(myUid, fromUid) {
  await remove(ref(db, `friendRequests/${myUid}/${fromUid}`))
}

export function subscribeFriendRequests(uid, callback) {
  return onValue(ref(db, `friendRequests/${uid}`), (snap) => {
    const reqs = []
    snap.forEach((c) => reqs.push({ id: c.key, ...c.val() }))
    callback(reqs)
  })
}

export function subscribeFriends(uid, callback) {
  return onValue(ref(db, `friends/${uid}`), (snap) => {
    const friends = []
    snap.forEach((c) => friends.push({ uid: c.key, ...c.val() }))
    callback(friends)
  })
}
