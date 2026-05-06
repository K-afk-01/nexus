import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      uid:             null,
      fullName:        null,
      verified:        false,
      tcNo:            null,
      birthDate:       null,
      idFrontImage:    null,
      idBackImage:     null,
      // Profile
      email:           null,
      phone:           null,
      nickname:        null,
      photoURL:        null,
      status:          'online',
      friendCode:      null,
      profileComplete: false,

      setUser:     (data) => set({ ...data }),
      setVerified: (val)  => set({ verified: val }),
      setIdData:   (data) => set(data),
      setProfile:  (data) => set({ ...data, profileComplete: true }),
      reset: () => set({
        uid: null, fullName: null, verified: false,
        tcNo: null, birthDate: null,
        idFrontImage: null, idBackImage: null,
        email: null, phone: null, nickname: null,
        photoURL: null, status: 'online', friendCode: null,
        profileComplete: false,
      }),
    }),
    {
      name:    'nexus-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        uid:             state.uid,
        fullName:        state.fullName,
        verified:        state.verified,
        email:           state.email,
        phone:           state.phone,
        nickname:        state.nickname,
        photoURL:        state.photoURL,
        status:          state.status,
        friendCode:      state.friendCode,
        profileComplete: state.profileComplete,
      }),
    }
  )
)

export default useAuthStore
