import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

async function uploadFile(file, path) {
  const r        = sRef(storage, path)
  const snapshot = await uploadBytes(r, file)
  return getDownloadURL(snapshot.ref)
}

export function uploadAvatar(uid, file) {
  return uploadFile(file, `avatars/${uid}/photo`)
}

export function uploadAttachment(chatId, file) {
  const name = `${Date.now()}_${file.name}`
  return uploadFile(file, `attachments/${chatId}/${name}`)
}
