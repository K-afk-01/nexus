import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'
import useAuthStore from '../store/useAuthStore'

export function useAuth() {
  const { user, setUser, clearAuth } = useAuthStore()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) setUser(firebaseUser)
      else clearAuth()
    })
    return unsub
  }, [])

  return { user }
}
