import { useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { usePoster, useEventImg } from '../lib/media'
import { useStore, useUI, toast } from '../store/useStore'
import { inr } from '../lib/util'
import { useTilt } from './useTilt'
import { CloseX } from './Overlays'
import * as I from './Icons'

const fadeIn = (e) => e.currentTarget.classList.add('ld')
export function Poster({ m, ...p }) { const src = usePoster(m); return <img src={src} alt={m.title + ' poster'} onLoad={fadeIn} {...p} /> }
export function EventImg({ e, ...p }) { const src = useEventImg(e); return <img src={src} alt="" onLoad={fadeIn} {...p} /> }

export function MovieCard({ m }) {
  const nav = useNavigate(), tilt = useRef()
  const interested = useStore((s) => s.interested.includes(m.id)), toggle = useStore((s) => s.toggleInterested)
  useTilt(tilt)
  return <div className="pc" onClick={() => nav('/movie/' + m.id)}>
    <div className="pw tilt" ref={tilt}><Poster m={m} loading="lazy" />
      {m.status === 'prebook' ? <span className="badge pb">PRE-BOOK</span> : <span className="badge"><span className="star">★</span> {m.rating}/10</span>}
      {m.status === 'prebook' && <button className={'heart' + (interested ? ' on' : '')} aria-label="I'm interested" onClick={(e) => { e.stopPropagation(); toggle(m.id); if (!interested) toast('♥ Added to your list — we\'ll keep it handy') }}>{interested ? '♥' : '♡'}</button>}
    </div>
    <h5>{m.title}</h5><p>{m.cert} · {m.genres.join(', ')}</p></div>
}

// ticket tiers for events (price = base × factor)
const TIERS = [['General', 1, 'Standing / free seating'], ['Fan zone', 1.8, 'Closer to the stage'], ['VIP lounge', 3.2, 'Best view, lounge access, F&B']]
export function EventModal({ e }) {
  const [q, setQ] = useState(2), [tier, setTier] = useState(0)
  const city = useStore((s) => s.city), setBooking = useStore((s) => s.setBooking), close = useUI((s) => s.closeModal), nav = useNavigate()
  const price = Math.round((e.p * TIERS[tier][1]) / 10) * 10
  return <><CloseX /><EventImg e={e} style={{ width: '100%', borderRadius: 12, margin: '14px 0', aspectRatio: '16/10', objectFit: 'cover' }} /><h3>{e.n}</h3><p className="mut" style={{ fontSize: 13 }}>{e.g} · {e.v}, {city} · {e.d}</p>
    <div className="tiers">{TIERS.map(([n, f, d], i) => <button key={n} className={i === tier ? 'on' : ''} onClick={() => setTier(i)}><span><b>{n}</b><small>{d}</small></span><b>{inr(Math.round((e.p * f) / 10) * 10)}</b></button>)}</div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 0' }}><span style={{ fontWeight: 700 }}>Tickets</span>
      <div className="qty"><button onClick={() => setQ(Math.max(1, q - 1))}>−</button><span>{q}</span><button onClick={() => setQ(Math.min(10, q + 1))}>+</button></div></div>
    <button className="btn btn-y" style={{ width: '100%', height: 46 }} onClick={() => { setBooking({ kind: 'event', ev: { ...e, p: price, tier: TIERS[tier][0] }, qty: q, city, dateLabel: e.d, snacks: {} }); close(); nav('/book/review') }}>Continue · {inr(price * q)}</button></>
}
export function EventCard({ e }) {
  const city = useStore((s) => s.city), open = useUI((s) => s.openModal), tilt = useRef()
  useTilt(tilt, { max: 5, scale: 1.01 })
  return <div className="ec tilt" ref={tilt} onClick={() => open(<EventModal e={e} />)}>
    <div className="ei"><EventImg e={e} loading="lazy" /></div>
    <div className="eb"><b>{e.n}</b><p>{e.g} · {e.v}, {city}</p><div className="r"><span style={{ fontSize: 12.5, color: '#cfd3dc' }}>📅 {e.d}</span><b style={{ fontSize: 14 }}>{inr(e.p)} <small className="mut" style={{ fontWeight: 600 }}>onwards</small></b></div></div></div>
}

export function Footer() {
  return <footer className="foot"><div className="wrap"><div className="fr">
    <div style={{ maxWidth: 320 }}><Link className="logo" to="/" style={{ marginBottom: 12 }}><i><I.LogoMark /></i>GOPIVERSE</Link><p style={{ lineHeight: 1.7 }}>Book movies, events, plays and sports — and pick your seat inside a real 3D cinema hall before you go.</p></div>
    <div><h6>Movies</h6><Link to="/movies">Now showing</Link><Link to="/movies">Coming soon</Link><Link to="/tickets">My tickets</Link></div>
    <div><h6>Explore</h6><Link to="/events">Events</Link><Link to="/plays">Plays</Link><Link to="/sports">Sports</Link></div>
    <div><h6>Help</h6><Link to="/">About GopiVerse</Link><Link to="/">Terms</Link><Link to="/">Privacy</Link></div></div>
    <p style={{ marginTop: 34, fontSize: 12, color: '#565c69' }}>© 2026 GopiVerse · Demo project with sample data. Press <kbd>Ctrl</kbd> + <kbd>K</kbd> to search.</p></div></footer>
}

export function StepsBar({ i }) {
  const s = ['Movie', 'Theatre & time', 'Seats', 'Snacks', 'Review', 'Pay']
  return <div className="steps">{s.map((x, k) => <span key={x} style={{ display: 'contents' }}><span className={k < i ? 'dn' : k === i ? 'on' : ''}>{x}</span>{k < s.length - 1 && <span>›</span>}</span>)}</div>
}
