import {
  ref, set, push, get, update, onValue,
  query, orderByChild, limitToLast, remove,
} from 'firebase/database'
import { db } from './firebase'

export function getDMId(uid1, uid2) {
  return [uid1, uid2].sort().join('_')
}

export async function getOrCreateDM(uid1, uid2) {
  const dmId = getDMId(uid1, uid2)
  const snap = await get(ref(db, `dms/${dmId}`))
  if (!snap.exists()) {
    await set(ref(db, `dms/${dmId}`), {
      participants: { [uid1]: true, [uid2]: true },
      createdAt:    Date.now(),
    })
  }
  return dmId
}

export function sendDMMessage(dmId, content, { uid, displayName, type = 'text', fileURL = null, fileName = null }) {
  const r = push(ref(db, `dmMessages/${dmId}`))
  return set(r, {
    content:    content || '',
    authorId:   uid,
    authorName: displayName,
    timestamp:  Date.now(),
    type,
    fileURL,
    fileName,
    deleted:    false,
  })
}

export async function deleteDMMessage(dmId, msgId) {
  await update(ref(db, `dmMessages/${dmId}/${msgId}`), { deleted: true, content: '' })
}

export async function addDMReaction(dmId, msgId, emoji, uid) {
  await set(ref(db, `dmMessages/${dmId}/${msgId}/reactions/${emoji}/${uid}`), true)
}

export async function removeDMReaction(dmId, msgId, emoji, uid) {
  await remove(ref(db, `dmMessages/${dmId}/${msgId}/reactions/${emoji}/${uid}`))
}

export function subscribeDMMessages(dmId, callback) {
  const q = query(
    ref(db, `dmMessages/${dmId}`),
    orderByChild('timestamp'),
    limitToLast(50),
  )
  return onValue(q, (snap) => {
    const msgs = []
    snap.forEach((c) => msgs.push({ id: c.key, ...c.val() }))
    callback(msgs)
  })
}

export function subscribeDMs(uid, callback) {
  return onValue(ref(db, 'dms'), (snap) => {
    const dms = []
    snap.forEach((c) => {
      const dm = c.val()
      if (dm.participants?.[uid]) {
        const partnerUid = Object.keys(dm.participants).find((k) => k !== uid)
        dms.push({ id: c.key, partnerUid, ...dm })
      }
    })
    callback(dms)
  })
}
