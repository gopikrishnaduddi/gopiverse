import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useStore, toast } from '../store/useStore'
import { inr } from '../lib/util'
import { StepsBar } from '../components/Cards'
import { OrderSummary, totals } from '../components/Order'

export default function Review() {
  const { booking: b, patchBooking, user, setUser } = useStore(), nav = useNavigate()
  const [code, setCode] = useState(b?.promo || ''), [err, setErr] = useState('')
  const [name, setName] = useState(b?.contact?.name || user?.name || ''), [phone, setPhone] = useState(b?.contact?.phone || user?.phone || '')
  if (!b || (b.kind === 'movie' && !b.seats.length)) return <Navigate to="/" replace />
  const apply = () => { if (code.trim().toUpperCase() === 'CINE10') { patchBooking({ promo: 'CINE10' }); setErr(''); toast('🎉 10% off applied (max ₹150)') } else setErr("That code isn't valid. Try CINE10.") }
  const go = (e) => { e.preventDefault(); const c = { name: name.trim(), phone }; patchBooking({ contact: c }); if (!user) setUser(c); nav('/book/pay') }
  return <form className="wrap co" onSubmit={go}><div>{b.kind === 'movie' && <StepsBar i={4} />}<h1 className="page-h">Review your booking</h1><p className="page-sub">Check everything before you pay.</p>
    <div className="card" style={{ marginTop: 22 }}><h4 style={{ fontSize: 15, marginBottom: 14 }}>Contact details</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}><label className="field"><span>Name</span><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></label>
        <label className="field"><span>Mobile</span><input required inputMode="numeric" pattern="[0-9]{10}" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" /></label></div>
      <p className="mut" style={{ fontSize: 12 }}>Your M-ticket will be saved under “My tickets”.</p></div>
    <div className="card" style={{ marginTop: 16 }}><h4 style={{ fontSize: 15 }}>Offers</h4><div className="promo"><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter code — try CINE10" /><button type="button" className="btn btn-ghost" onClick={apply}>Apply</button></div><div className="msg">{err}</div></div>
    <div className="card" style={{ marginTop: 16, fontSize: 13, color: 'var(--mut)', lineHeight: 1.7 }}><b style={{ color: '#fff' }}>Before you go</b><br />• Carry a valid ID for A-certified films. • Outside food is not allowed. • Tickets can be cancelled up to 2 hours before the show for an 80% refund.</div></div>
    <aside className="sum"><div className="card"><OrderSummary b={b} /><button className="btn btn-y" style={{ width: '100%', height: 48, marginTop: 16 }}>Proceed to pay · {inr(totals(b).total)}</button>
      {b.kind === 'movie' && <button type="button" className="btn btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => nav('/book/snacks')}>← Edit snacks</button>}</div></aside></form>
}
