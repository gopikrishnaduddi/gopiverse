import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { SNACKS } from '../data/snacks'
import { useStore } from '../store/useStore'
import { useSnackImg } from '../lib/media'
import { inr } from '../lib/util'
import { StepsBar } from '../components/Cards'
import { OrderSummary, SIZES, snackLines, totals } from '../components/Order'
import HoldTimer from '../components/HoldTimer'
import { useTilt } from '../components/useTilt'

const BEST = ['c1', 'p2', 'b2']   // "Bestseller" ribbon
function Food({ s, cart, set }) {
  const img = useSnackImg(s), sizes = SIZES[s.cat], tilt = useRef()   // photo: public/assets/snacks/<id>.jpg — emoji until you add one
  const [size, setSize] = useState('R')
  useTilt(tilt, { max: 5, scale: 1.015 })
  const key = size === 'R' ? s.id : s.id + '|' + size, q = cart[key] || 0
  const price = s.p + (sizes ? sizes.find((z) => z[0] === size)[2] : 0)
  return <div className="food tilt" ref={tilt}>
    <div className="fi" style={{ background: `radial-gradient(circle at 50% 60%,${s.bg[1]},${s.bg[0]})` }}>{img ? <img className="snack-photo" src={img} alt={s.n} /> : s.e}<span className={'vg' + (s.v ? '' : ' nv')} />{BEST.includes(s.id) && <span className="best">★ Bestseller</span>}</div>
    <div className="fb"><b>{s.n}</b><p>{s.d}</p>
      {sizes && <div className="sizes">{sizes.map(([k, n, add]) => <button key={k} className={k === size ? 'on' : ''} onClick={() => setSize(k)}>{n}{add ? ` +₹${add}` : ''}</button>)}</div>}
      <div className="fr"><b>{inr(price)}</b>
        {q ? <div className="fq"><button onClick={() => set(key, q - 1)}>−</button><span>{q}</span><button onClick={() => set(key, q + 1)}>+</button></div> : <button className="add" onClick={() => set(key, 1)}>ADD</button>}</div></div></div>
}
export default function Snacks() {
  const { booking: b, patchBooking } = useStore(), nav = useNavigate()
  const [cat, setCat] = useState('Combos'), [veg, setVeg] = useState(false)
  if (!b || b.kind !== 'movie') return <Navigate to="/" replace />
  if (!b.seats.length) return <Navigate to="/book/seats" replace />
  const cart = b.snacks || {}
  const set = (key, q) => patchBooking({ snacks: { ...cart, [key]: Math.max(0, Math.min(10, q)) } })
  const lines = snackLines(b), count = lines.reduce((a, l) => a + l.q, 0), T = totals(b)
  const inCat = (c) => lines.filter((l) => l.s.cat === c).reduce((a, l) => a + l.q, 0)
  const deliv = b.delivery || 'seat'
  return <div className="wrap co">
    <div>
      <div className="co-top"><StepsBar i={3} /><HoldTimer /></div>
      <h1 className="page-h">Grab a bite</h1><p className="page-sub">Pre-order and skip the queue.</p>
      <div className="deliv">{[['seat', '🪑', 'Deliver to my seat', 'At the interval'], ['counter', '🛍️', 'Pick up at counter', 'Show your M-ticket']].map(([k, ic, t, d]) =>
        <button key={k} className={deliv === k ? 'on' : ''} onClick={() => patchBooking({ delivery: k })}><span>{ic}</span><b>{t}</b><small>{d}</small></button>)}</div>
      <div className="tabs">{['Combos', 'Popcorn', 'Snacks', 'Beverages'].map((c) => <button key={c} className={'chip' + (c === cat ? ' on' : '')} onClick={() => setCat(c)}>{c}{inCat(c) > 0 && <em>{inCat(c)}</em>}</button>)}
        <button className={'chip vegchip' + (veg ? ' on' : '')} onClick={() => setVeg(!veg)}><span className="vg" /> Veg only</button></div>
      <div className="fgrid">{SNACKS.filter((s) => s.cat === cat && (!veg || s.v)).map((s) => <Food key={s.id} s={s} cart={cart} set={set} />)}</div>
    </div>
    <aside className="sum"><div className="card"><OrderSummary b={b} />
      <button className="btn btn-y" style={{ width: '100%', height: 48, marginTop: 16 }} onClick={() => nav('/book/review')}>{count ? 'Continue to review' : 'Skip snacks · Review'}</button>
      <button className="btn btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => nav('/book/seats')}>← Change seats</button></div></aside>
    <div className="mcart"><span>{count ? <><b>{count} item{count > 1 ? 's' : ''}</b> · {inr(T.food)}</> : 'No snacks added'}</span><button className="btn btn-y" onClick={() => nav('/book/review')}>{count ? 'Continue →' : 'Skip →'}</button></div>
  </div>
}
