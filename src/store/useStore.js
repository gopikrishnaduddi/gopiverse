import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// App state (saved in localStorage)
export const useStore = create(persist((set, get) => ({
  city: 'Chennai',
  user: null,
  tickets: [],
  sold: {},          // showKey -> [seatIds] booked on this device
  booking: null,     // the booking in progress
  favs: [],          // favourite theatres
  interested: [],    // "I'm interested" movies (coming soon)
  recent: [],        // recent searches
  setCity: (city) => set({ city }),
  setUser: (user) => set({ user }),
  setBooking: (booking) => set({ booking }),
  patchBooking: (p) => set({ booking: { ...get().booking, ...p } }),
  addTicket: (t, key, seatIds) => set((s) => ({
    tickets: [t, ...s.tickets], booking: null,
    sold: key ? { ...s.sold, [key]: [...(s.sold[key] || []), ...seatIds] } : s.sold,
  })),
  // cancel → seats go back on sale; refund 100% with cancellation protection, else 80% of tickets (demo rule)
  cancelTicket: (id) => set((s) => {
    const t = s.tickets.find((x) => x.id === id); if (!t || t.status === 'cancelled') return {}
    const sold = { ...s.sold }
    if (t.key && t.seatIds) sold[t.key] = (sold[t.key] || []).filter((x) => !t.seatIds.includes(x))
    const refund = Math.round(t.protect ? t.total : t.total * 0.8)
    return { sold, tickets: s.tickets.map((x) => (x.id === id ? { ...x, status: 'cancelled', refund, cancelledAt: Date.now() } : x)) }
  }),
  toggleFav: (name) => set((s) => ({ favs: s.favs.includes(name) ? s.favs.filter((x) => x !== name) : [...s.favs, name] })),
  toggleInterested: (id) => set((s) => ({ interested: s.interested.includes(id) ? s.interested.filter((x) => x !== id) : [...s.interested, id] })),
  addRecent: (q) => { q = (q || '').trim(); if (q.length < 2) return; set((s) => ({ recent: [q, ...s.recent.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 6) })) },
  clearRecent: () => set({ recent: [] }),
}), { name: 'cineverse', storage: createJSONStorage(() => localStorage) }))

// UI state: toast + modal
export const useUI = create((set) => ({
  toastMsg: '', toastKey: 0, modal: null,
  toast: (m) => set((s) => ({ toastMsg: m, toastKey: s.toastKey + 1 })),
  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),
}))
export const toast = (m) => useUI.getState().toast(m)
