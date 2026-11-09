import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useStore, useUI } from '../store/useStore'
import { PAYMENTS } from '../data/payments'
import { inr, showKey, showTime } from '../lib/util'
import { usePayLogo } from '../lib/media'
import { hashStr } from '../lib/posterArt'
import { StepsBar } from '../components/Cards'
import { OrderSummary, totals, snackLines } from '../components/Order'
import HoldTimer from '../components/HoldTimer'
import { confetti } from '../components/confetti'

// logo: public/assets/payments/<id>.png, or the `logo` link in src/data/payments.js, else the emoji
function PayLogo({ p }) { const img = usePayLogo(p); return <span className="ic">{img ? <img src={img} alt={p.name} /> : p.emoji}</span> }
const STEPS = ['Verifying payment', 'Confirming your seats with the theatre', 'Generating your M-ticket']
function Processing({ step }) {
  return <div className="proc"><div className="spin" /><h3>Confirming your booking…</h3><p className="mut" style={{ fontSize: 12.5, marginTop: 4 }}>Please don't close this window</p>
    <ul>{STEPS.map((s, i) => <li key={s} className={i < step ? 'done' : i === step ? 'now' : ''}><i>{i < step ? '✓' : ''}</i>{s}</li>)}</ul></div>
}
export default function Pay() {
  const { booking: b, addTicket } = useStore(), { openModal, closeModal } = useUI(), nav = useNavigate()
  const [pm, setPm] = useState('upi'), [opt, setOpt] = useState({}), done = useRef(false)
  if (!b) return done.current ? null : <Navigate to="/" replace />
  if (!b.contact) return <Navigate to="/book/review" replace />
  const T = totals(b)
  const finish = () => {
    const id = 'GV' + (Date.now().toString(36) + Math.random().toString(36).slice(2, 4)).toUpperCase().slice(-8)
    const t = { id, kind: b.kind, created: Date.now(), status: 'confirmed', total: T.total, pm, pmOpt: opt[pm] || null, contact: b.contact, city: b.city, dateLabel: b.dateLabel,
      snacks: snackLines(b).map((l) => ({ n: l.name, q: l.q })), delivery: b.delivery || 'seat', protect: !!b.protect, promo: b.promo || null }
    if (b.kind === 'movie') Object.assign(t, { movieId: b.movieId, theatre: b.theatre, area: b.area, time: b.time, fmt: b.fmt, lang: b.lang, day: b.day, fill: b.fill,
      seats: b.seats.map((s) => s.label), seatIds: b.seats.map((s) => s.id), key: showKey(b), showAt: showTime(b.day, b.time), screen: 'Screen ' + (1 + (hashStr(b.theatre) % 5)) })
    else Object.assign(t, { ev: b.ev, qty: b.qty })
    done.current = true
    addTicket(t, b.kind === 'movie' ? showKey(b) : null, b.kind === 'movie' ? b.seats.map((s) => s.id) : [])
    closeModal(); nav('/ticket/' + id, { replace: true }); setTimeout(confetti, 450)
  }
  // ▸ Replace this with your payment gateway (Razorpay / Stripe / PhonePe …) and call finish() on success.
  const pay = () => {
    let step = 0; openModal(<Processing step={0} />)
    const tick = () => { step++; if (step < STEPS.length) { openModal(<Processing step={step} />); setTimeout(tick, 750) } else finish() }
    setTimeout(tick, 750)
  }
  return <div className="wrap co"><div>
    <div className="co-top">{b.kind === 'movie' && <StepsBar i={5} />}<HoldTimer /></div>
    <h1 className="page-h">Payment</h1><p className="page-sub">Choose how you'd like to pay.</p>
    <div style={{ marginTop: 22 }}>{PAYMENTS.map((p) => <div key={p.id} className={'pmw' + (p.id === pm ? ' on' : '')}>
      <button className={'pm' + (p.id === pm ? ' on' : '')} onClick={() => setPm(p.id)}><PayLogo p={p} /><span><b>{p.name}</b><small>{p.sub}</small></span><span className="rd" /></button>
      {p.id === pm && <div className="pm-more"><div className="pm-opts">{p.options.map((o) => <button key={o} className={opt[p.id] === o ? 'on' : ''} onClick={() => setOpt({ ...opt, [p.id]: o })}>{o}</button>)}</div><small>{p.note}</small></div>}
    </div>)}</div>
    <p className="demo">🔒 Demo checkout — no payment details are collected and no money is charged. Plug your payment gateway into <code>src/pages/Pay.jsx</code>.</p></div>
    <aside className="sum"><div className="card"><OrderSummary b={b} /><button className="btn btn-y" style={{ width: '100%', height: 50, marginTop: 16, fontSize: 15 }} onClick={pay}>Pay {inr(T.total)}</button>
      <p style={{ fontSize: 11.5, color: 'var(--mut)', textAlign: 'center', marginTop: 10 }}>🔒 Secure checkout · 100% safe</p></div></aside></div>
}
