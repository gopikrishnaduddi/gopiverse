// Offer codes that work at checkout (Review page). Edit or add your own here.
export const OFFERS = [
  { code: 'CINE10', icon: '🎟️', title: '10% off tickets', desc: 'Up to ₹150 off on tickets', ok: () => true, why: '', calc: ({ tick }) => Math.min(150, Math.round(tick * 0.1)) },
  { code: 'GOPI50', icon: '🎬', title: '₹50 off', desc: 'Flat ₹50 off when you book 2 or more tickets', ok: ({ nT }) => nT >= 2, why: 'Needs 2 or more tickets', calc: ({ nT }) => (nT >= 2 ? 50 : 0) },
  { code: 'SNACK20', icon: '🍿', title: '20% off snacks', desc: 'Up to ₹100 off on food & drinks', ok: ({ food }) => food > 0, why: 'Add snacks to use this', calc: ({ food }) => Math.min(100, Math.round(food * 0.2)) },
]
