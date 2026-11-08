import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// App state (saved in localStorage)
export const useStore = create(persist((set, get) => ({
  city: 'Chennai',
  user: null,
  tickets: [],
  sold: {},          // showKey -> [seatIds] booked on this device
  booking: null,     // the booking in progress
  setCity: (city) => set({ city }),
  setUser: (user) => set({ user }),
  setBooking: (booking) => set({ booking }),
  patchBooking: (p) => set({ booking: { ...get().booking, ...p } }),
  addTicket: (t, key, seatIds) => set((s) => ({
    tickets: [t, ...s.tickets], booking: null,
    sold: key ? { ...s.sold, [key]: [...(s.sold[key] || []), ...seatIds] } : s.sold,
  })),
}), { name: 'gopiverse', storage: createJSONStorage(() => localStorage) }))

// UI state: toast + modal
export const useUI = create((set) => ({
  toastMsg: '', toastKey: 0, modal: null,
  toast: (m) => set((s) => ({ toastMsg: m, toastKey: s.toastKey + 1 })),
  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),
}))
export const toast = (m) => useUI.getState().toast(m)
