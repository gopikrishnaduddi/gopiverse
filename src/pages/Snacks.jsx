import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { SNACKS } from '../data/snacks'
import { useStore } from '../store/useStore'
import { useSnackImg } from '../lib/media'
import { inr } from '../lib/util'
import { StepsBar } from '../components/Cards'
import { OrderSummary } from '../components/Order'

function Food({ s, q, set }) {
  const img = useSnackImg(s)   // public/assets/snacks/<id>.jpg — emoji until you add one
  return <div className="food">
    <div className="fi" style={{ background: `radial-gradient(circle at 50% 60%,${s.bg[1]},${s.bg[0]})` }}>{img ? <img className="snack-photo" src={img} alt={s.n} /> : s.e}<span className={'vg' + (s.v ? '' : ' nv')} /></div>
    <div className="fb"><b>{s.n}</b><p>{s.d}</p><div className="fr"><b>{inr(s.p)}</b>
      {q ? <div className="fq"><button onClick={() => set(q - 1)}>−</button><span>{q}</span><button onClick={() => set(q + 1)}>+</button></div> : <button className="add" onClick={() => set(1)}>ADD</button>}</div></div></div>
}
export default function Snacks() {
  const { booking: b, patchBooking } = useStore(), nav = useNavigate()
  const [cat, setCat] = useState('Combos')
  if (!b || b.kind !== 'movie') return <Navigate to="/" replace />
  if (!b.seats.length) return <Navigate to="/book/seats" replace />
  const set = (id, q) => patchBooking({ snacks: { ...b.snacks, [id]: Math.max(0, Math.min(10, q)) } })
  const any = Object.values(b.snacks).some((x) => x)
  return <div className="wrap co"><div><StepsBar i={3} /><h1 className="page-h">Grab a bite</h1><p className="page-sub">Pre-order and skip the queue — delivered to your seat at the interval.</p>
    <div className="tabs">{['Combos', 'Popcorn', 'Snacks', 'Beverages'].map((c) => <button key={c} className={'chip' + (c === cat ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>)}</div>
    <div className="fgrid">{SNACKS.filter((s) => s.cat === cat).map((s) => <Food key={s.id} s={s} q={b.snacks[s.id] || 0} set={(q) => set(s.id, q)} />)}</div></div>
    <aside className="sum"><div className="card"><OrderSummary b={b} />
      <button className="btn btn-y" style={{ width: '100%', height: 48, marginTop: 16 }} onClick={() => nav('/book/review')}>{any ? 'Continue to review' : 'Skip snacks · Review'}</button>
      <button className="btn btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => nav('/book/seats')}>← Change seats</button></div></aside></div>
}
