import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { getStorage } from 'firebase/storage'

// Replace with your actual Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyAZrSo5juR4iW3HIA9twDmstw0Bb0O5eKQ",
  authDomain: "nexus-da3a9.firebaseapp.com",
  databaseURL: "https://nexus-da3a9-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "nexus-da3a9",
  storageBucket: "nexus-da3a9.firebasestorage.app",
  messagingSenderId: "169859122605",
  appId: "1:169859122605:web:0e149a406680fa989d4d24",
}

const app  = initializeApp(firebaseConfig)
export const auth    = getAuth(app)
export const db      = getDatabase(app)
export const storage = getStorage(app)
export default app
