import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useStore, useUI } from '../store/useStore'
import { SNACKS } from '../data/snacks'
import { inr, showKey } from '../lib/util'
import { hashStr } from '../lib/posterArt'
import { StepsBar } from '../components/Cards'
import { OrderSummary, totals } from '../components/Order'
import { confetti } from '../components/confetti'

const METHODS = [
  ['upi',    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzJY4fScAG2pt7dOCjMKNWSNNVDn9CreSNmnMBy5cqHw&s=10',    'UPI',                 'GPay, PhonePe, Paytm or any UPI app'],
  ['card',   'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTi8i33o9CjGWfNPxU0BFDUvXwmJ6lgSuCgcPmOvvfmCA&s=10',   'Credit / Debit card', 'Visa, Mastercard, RuPay'],
  ['nb',     'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRr5_mrzTlXXl7QLfhTODsF_5x3BxxzEyJUCjZxlLbdhQ&s=10',   'Net banking',         'All major banks'],
  ['wallet', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRKFRiWVnACGmlDhe3rFY-dVvEjmAnpWxtT8CDaGUv-YA&s=10', 'Wallets',             'Amazon Pay, Mobikwik'],
]

export default function Pay() {
  const { booking: b, addTicket } = useStore(), { openModal, closeModal } = useUI(), nav = useNavigate()
  const [pm, setPm] = useState('upi'), done = useRef(false)
  if (!b) return done.current ? null : <Navigate to="/" replace />
  if (!b.contact) return <Navigate to="/book/review" replace />
  const T = totals(b)
  const pay = () => {
    openModal(<div style={{ textAlign: 'center', padding: '20px 0' }}><div className="spin" /><h3>Confirming your booking…</h3><p className="mut" style={{ fontSize: 13, marginTop: 6 }}>Don't close this window</p></div>)
    // ▸ Replace this timeout with your payment gateway (Razorpay / Stripe / PhonePe …) and confirm on success.
    setTimeout(() => {
      const id = 'CV' + (Date.now().toString(36) + Math.random().toString(36).slice(2, 4)).toUpperCase().slice(-8)
      const t = { id, kind: b.kind, created: Date.now(), total: T.total, pm, contact: b.contact, city: b.city, dateLabel: b.dateLabel,
        snacks: Object.entries(b.snacks || {}).filter(([, q]) => q).map(([i, q]) => ({ n: SNACKS.find((s) => s.id === i).n, q })) }
      if (b.kind === 'movie') Object.assign(t, { movieId: b.movieId, theatre: b.theatre, area: b.area, time: b.time, fmt: b.fmt, lang: b.lang, seats: b.seats.map((s) => s.label), screen: 'Screen ' + (1 + (hashStr(b.theatre) % 5)) })
      else Object.assign(t, { ev: b.ev, qty: b.qty })
      done.current = true
      addTicket(t, b.kind === 'movie' ? showKey(b) : null, b.kind === 'movie' ? b.seats.map((s) => s.id) : [])
      closeModal(); nav('/ticket/' + id, { replace: true }); setTimeout(confetti, 300)
    }, 1600)
  }
  return <div className="wrap co"><div>{b.kind === 'movie' && <StepsBar i={5} />}<h1 className="page-h">Payment</h1><p className="page-sub">Choose how you'd like to pay.</p>
    <div style={{ marginTop: 22 }}>{METHODS.map((x) => <button key={x[0]} className={'pm' + (x[0] === pm ? ' on' : '')} onClick={() => setPm(x[0])}><span className="ic">{x[1].includes('/') ? <img src={x[1]} alt={x[2]} /> : x[1]}</span><span><b>{x[2]}</b><small>{x[3]}</small></span><span className="rd" /></button>)}</div>
    <p className="demo">🔒 Demo checkout — no payment details are collected and no money is charged. Plug your payment gateway into <code>src/pages/Pay.jsx</code>.</p></div>
    <aside className="sum"><div className="card"><OrderSummary b={b} /><button className="btn btn-y" style={{ width: '100%', height: 50, marginTop: 16, fontSize: 15 }} onClick={pay}>Pay {inr(T.total)}</button>
      <p style={{ fontSize: 11.5, color: 'var(--mut)', textAlign: 'center', marginTop: 10 }}>Seats are held for 10:00 minutes</p></div></aside></div>
}
