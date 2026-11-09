import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useStore, toast } from '../store/useStore'
import { OFFERS } from '../data/offers'
import { inr } from '../lib/util'
import { StepsBar } from '../components/Cards'
import { OrderSummary, totals } from '../components/Order'
import HoldTimer from '../components/HoldTimer'

export default function Review() {
  const { booking: b, patchBooking, user, setUser } = useStore(), nav = useNavigate()
  const [code, setCode] = useState(''), [err, setErr] = useState('')
  const [name, setName] = useState(b?.contact?.name || user?.name || ''), [phone, setPhone] = useState(b?.contact?.phone || user?.phone || '')
  if (!b || (b.kind === 'movie' && !b.seats.length)) return <Navigate to="/" replace />
  const T = totals(b), base = { tick: T.tick, nT: T.nT, food: T.food }
  const apply = (c) => {
    const o = OFFERS.find((x) => x.code === c.trim().toUpperCase())
    if (!o) return setErr("That code isn't valid. Try one of the offers above.")
    if (!o.ok(base)) return setErr(o.why)
    patchBooking({ promo: o.code }); setErr(''); setCode(''); toast('🎉 ' + o.title + ' applied')
  }
  const go = (e) => { e.preventDefault(); const c = { name: name.trim(), phone }; patchBooking({ contact: c }); if (!user) setUser(c); nav('/book/pay') }
  return <form className="wrap co" onSubmit={go}><div>
    <div className="co-top">{b.kind === 'movie' && <StepsBar i={4} />}<HoldTimer /></div>
    <h1 className="page-h">Review your booking</h1><p className="page-sub">Check everything before you pay.</p>
    <div className="card" style={{ marginTop: 22 }}><h4 style={{ fontSize: 15, marginBottom: 14 }}>Contact details</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}><label className="field"><span>Name</span><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></label>
        <label className="field"><span>Mobile</span><input required inputMode="numeric" pattern="[0-9]{10}" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" /></label></div>
      <p className="mut" style={{ fontSize: 12 }}>Your M-ticket will be saved under “My tickets”.</p></div>
    <div className="card" style={{ marginTop: 16 }}><h4 style={{ fontSize: 15, marginBottom: 12 }}>Offers for you</h4>
      <div className="offers">{OFFERS.map((o) => { const on = b.promo === o.code, ok = o.ok(base)
        return <div key={o.code} className={'offer' + (on ? ' on' : '') + (ok ? '' : ' no')}><span className="oi">{o.icon}</span><div><b>{o.code}</b><small>{o.desc}</small></div>
          {on ? <button type="button" onClick={() => patchBooking({ promo: null })}>Remove</button> : <button type="button" disabled={!ok} onClick={() => apply(o.code)}>{ok ? 'Apply' : o.why}</button>}</div> })}</div>
      <div className="promo"><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Have a code? Enter it here" /><button type="button" className="btn btn-ghost" onClick={() => apply(code)}>Apply</button></div><div className="msg">{err}</div></div>
    {b.kind === 'movie' && <label className={'card protect' + (b.protect ? ' on' : '')} style={{ marginTop: 16 }}>
      <input type="checkbox" checked={!!b.protect} onChange={(e) => patchBooking({ protect: e.target.checked })} />
      <span className="pt-box">{b.protect ? '✓' : ''}</span>
      <div><b>Cancellation protection · {inr(19)} per ticket</b><small>Cancel up to 2 hours before the show and get a 100% refund (80% without it).</small></div></label>}
    <div className="card" style={{ marginTop: 16, fontSize: 13, color: 'var(--mut)', lineHeight: 1.7 }}><b style={{ color: '#fff' }}>Before you go</b><br />• Carry a valid ID for A-certified films. • Outside food is not allowed. • Please arrive 15 minutes early.</div></div>
    <aside className="sum"><div className="card"><OrderSummary b={b} /><button className="btn btn-y" style={{ width: '100%', height: 48, marginTop: 16 }}>Proceed to pay · {inr(T.total)}</button>
      {b.kind === 'movie' && <button type="button" className="btn btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => nav('/book/snacks')}>← Edit snacks</button>}</div></aside></form>
}
