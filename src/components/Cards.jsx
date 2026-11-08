import { useNavigate, Link } from 'react-router-dom'
import { usePoster, useEventImg } from '../lib/media'
import { useStore, useUI } from '../store/useStore'
import { inr } from '../lib/util'
import { CloseX } from './Overlays'
import { useState } from 'react'
import * as I from './Icons'

export function Poster({ m, ...p }) { const src = usePoster(m); return <img src={src} alt={m.title + ' poster'} {...p} /> }
export function EventImg({ e, ...p }) { const src = useEventImg(e); return <img src={src} alt="" {...p} /> }

export function MovieCard({ m }) {
  const nav = useNavigate()
  return <div className="pc" onClick={() => nav('/movie/' + m.id)}>
    <div className="pw"><Poster m={m} loading="lazy" />{m.status === 'prebook' ? <span className="badge pb">PRE-BOOK</span> : <span className="badge"><span className="star">★</span> {m.rating}/10</span>}</div>
    <h5>{m.title}</h5><p>{m.cert} · {m.genres.join(', ')}</p></div>
}

function EventModal({ e }) {
  const [q, setQ] = useState(2), city = useStore((s) => s.city), setBooking = useStore((s) => s.setBooking), close = useUI((s) => s.closeModal), nav = useNavigate()
  return <><CloseX /><EventImg e={e} style={{ width: '100%', borderRadius: 12, margin: '14px 0' }} /><h3>{e.n}</h3><p className="mut" style={{ fontSize: 13 }}>{e.g} · {e.v}, {city} · {e.d}</p>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0' }}><span style={{ fontWeight: 700 }}>Tickets</span>
      <div className="qty"><button onClick={() => setQ(Math.max(1, q - 1))}>−</button><span>{q}</span><button onClick={() => setQ(Math.min(10, q + 1))}>+</button></div></div>
    <button className="btn btn-y" style={{ width: '100%', height: 46 }} onClick={() => { setBooking({ kind: 'event', ev: e, qty: q, city, dateLabel: e.d, snacks: {} }); close(); nav('/book/review') }}>Continue · {inr(e.p * q)}</button></>
}
export function EventCard({ e }) {
  const city = useStore((s) => s.city), open = useUI((s) => s.openModal)
  return <div className="ec" onClick={() => open(<EventModal e={e} />)}>
    <div className="ei"><EventImg e={e} loading="lazy" /></div>
    <div className="eb"><b>{e.n}</b><p>{e.g} · {e.v}, {city}</p><div className="r"><span style={{ fontSize: 12.5, color: '#cfd3dc' }}>📅 {e.d}</span><b style={{ fontSize: 14 }}>{inr(e.p)} <small className="mut" style={{ fontWeight: 600 }}>onwards</small></b></div></div></div>
}

export function Footer() {
  return <footer className="foot"><div className="wrap"><div className="fr">
    <div style={{ maxWidth: 320 }}><Link className="logo" to="/" style={{ marginBottom: 12 }}><i><I.LogoMark /></i>GOPIVERSE</Link><p style={{ lineHeight: 1.7 }}>Book movies, events, plays and sports — and pick your seat inside a real 3D cinema hall before you go.</p></div>
    <div><h6>Movies</h6><Link to="/movies">Now showing</Link><Link to="/movies">Coming soon</Link><Link to="/tickets">My tickets</Link></div>
    <div><h6>Explore</h6><Link to="/events">Events</Link><Link to="/plays">Plays</Link><Link to="/sports">Sports</Link></div>
    <div><h6>Help</h6><Link to="/">About GopiVerse</Link><Link to="/">Terms</Link><Link to="/">Privacy</Link></div></div>
    <p style={{ marginTop: 34, fontSize: 12, color: '#565c69' }}>© 2026 GopiVerse · Demo project with sample data.</p></div></footer>
}

export function StepsBar({ i }) {
  const s = ['Movie', 'Theatre & time', 'Seats', 'Snacks', 'Review', 'Pay']
  return <div className="steps">{s.map((x, k) => <span key={x} style={{ display: 'contents' }}><span className={k < i ? 'dn' : k === i ? 'on' : ''}>{x}</span>{k < s.length - 1 && <span>›</span>}</span>)}</div>
}
