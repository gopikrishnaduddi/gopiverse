import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useStore, useUI, toast } from '../store/useStore'
import { MOVIES } from '../data/movies'
import { CITIES, TH_NAMES } from '../data/cities'
import { usePoster, useCityImg } from '../lib/media'
import { CloseX } from './Overlays'
import * as I from './Icons'

const SOLID_TOP = ['/movie/']
function Thumb({ m }) { const src = usePoster(m); return <img src={src} alt="" /> }

export function SearchResults({ q, onPick }) {
  const city = useStore((s) => s.city)
  const s = q.trim().toLowerCase()
  const ms = MOVIES.filter((m) => !s || (m.title + ' ' + m.cast.join(' ') + ' ' + m.genres.join(' ') + ' ' + m.langs.join(' ') + ' ' + m.dir).toLowerCase().includes(s)).slice(0, 7)
  const th = s ? TH_NAMES.filter((t) => t.toLowerCase().includes(s)).slice(0, 3) : []
  return <>
    {ms.map((m) => <Link key={m.id} to={`/movie/${m.id}`} onClick={onPick}><Thumb m={m} /><span><b>{m.title}</b><small>{m.lang} · {m.genres.join(', ')} · {m.status === 'prebook' ? 'Pre-booking' : 'Now showing'}</small></span></Link>)}
    {th.map((t) => <Link key={t} to="/movies" onClick={onPick}><span style={{ width: 34, height: 34, borderRadius: 8, background: '#1d2130', display: 'grid', placeItems: 'center' }}>🎬</span><span><b>{t}</b><small>Theatre · {city}</small></span></Link>)}
    {!ms.length && !th.length && <div style={{ padding: 14, color: 'var(--mut)', fontSize: 13 }}>No results for “{q}”</div>}
  </>
}

// City icon: public/assets/cities/<city>.png (falls back to the emoji in src/data/cities.js)
function CityIcon({ c }) { const img = useCityImg(c); return img ? <img src={img} alt="" /> : <span>{c.e}</span> }

export function CityModal() {
  const { city, setCity } = useStore(), close = useUI((s) => s.closeModal)
  return <><CloseX /><h3>Select your city</h3><p className="mut" style={{ fontSize: 13 }}>Showtimes and theatres update for the city you pick.</p>
    <div className="cities">{CITIES.map((c) => <button key={c.n} className={c.n === city ? 'on' : ''} onClick={() => { setCity(c.n); close(); toast('📍 Showing movies in ' + c.n) }}><CityIcon c={c} />{c.n}</button>)}</div></>
}
export function SignModal({ after }) {
  const setUser = useStore((s) => s.setUser), close = useUI((s) => s.closeModal)
  const submit = (e) => { e.preventDefault(); const f = new FormData(e.target); const u = { name: f.get('n').trim(), phone: f.get('p') }; setUser(u); close(); toast('👋 Welcome, ' + u.name); after && after() }
  return <><CloseX /><h3>Sign in</h3><p className="mut" style={{ fontSize: 13, marginBottom: 18 }}>Save your tickets and book faster next time.</p>
    <form onSubmit={submit}><label className="field"><span>Your name</span><input name="n" required placeholder="e.g. Sathish" maxLength={30} autoFocus /></label>
      <label className="field"><span>Mobile number</span><input name="p" inputMode="numeric" placeholder="10-digit mobile" maxLength={10} pattern="[0-9]{10}" required /></label>
      <button className="btn btn-y" style={{ width: '100%', height: 46, marginTop: 6 }}>Continue</button>
      <p className="demo">Demo — connect your own auth/OTP provider here. Details are stored only in this browser.</p></form></>
}
function UserModal() {
  const { user, tickets, setUser } = useStore(), close = useUI((s) => s.closeModal)
  return <><CloseX /><h3>Hi, {user.name}</h3><p className="mut" style={{ fontSize: 13 }}>+91 {user.phone}</p>
    <div style={{ display: 'grid', gap: 10, marginTop: 18 }}><Link className="btn btn-ghost" to="/tickets" onClick={close}>🎟️ My tickets ({tickets.length})</Link>
      <button className="btn btn-ghost" onClick={() => { setUser(null); close(); toast('Signed out') }}>Sign out</button></div></>
}
function MobileSearch() {
  const [q, setQ] = useState(''), close = useUI((s) => s.closeModal)
  return <><CloseX /><h3>Search</h3><div className="search" style={{ width: '100%', marginTop: 14 }}><I.Search /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search movies, theatres..." />
    <div className="sres open" style={{ position: 'static', marginTop: 10, boxShadow: 'none' }}><SearchResults q={q} onPick={close} /></div></div></>
}

export default function Nav() {
  const { city, user } = useStore(), open = useUI((s) => s.openModal)
  const loc = useLocation(), nav = useNavigate()
  const [solid, setSolid] = useState(false), [q, setQ] = useState(''), [sOpen, setSOpen] = useState(false)
  const box = useRef()
  const transparentTop = loc.pathname === '/' || SOLID_TOP.some((p) => loc.pathname.startsWith(p))
  useEffect(() => { const f = () => setSolid(scrollY > 30); f(); addEventListener('scroll', f, { passive: true }); return () => removeEventListener('scroll', f) }, [])
  useEffect(() => { setQ(''); setSOpen(false) }, [loc.pathname])
  useEffect(() => { const f = (e) => !box.current?.contains(e.target) && setSOpen(false); document.addEventListener('mousedown', f); return () => document.removeEventListener('mousedown', f) }, [])
  const acc = () => open(user ? <UserModal /> : <SignModal />)
  return (
    <header className={'nav' + (solid || !transparentTop ? ' solid' : '')}>
      <div className="nav-in">
        <Link to="/" className="logo"><i><I.LogoMark /></i>GOPIVERSE</Link>
        <nav className="nav-links">
          {['movies', 'events', 'plays', 'sports'].map((k) => <NavLink key={k} to={'/' + k} className={({ isActive }) => (isActive || (k === 'movies' && loc.pathname.startsWith('/movie/')) ? 'on' : '')}>{k[0].toUpperCase() + k.slice(1)}</NavLink>)}
        </nav>
        <div className="nav-sp" />
        <div className="search" ref={box}>
          <I.Search />
          <input value={q} onChange={(e) => { setQ(e.target.value); setSOpen(true) }} onFocus={() => setSOpen(true)} placeholder="Search movies, theatres..."
            onKeyDown={(e) => { if (e.key === 'Enter') { const a = box.current.querySelector('.sres a'); if (a) nav(a.getAttribute('href')) } if (e.key === 'Escape') setSOpen(false) }} />
          <div className={'sres' + (sOpen ? ' open' : '')} data-lenis-prevent><SearchResults q={q} onPick={() => setSOpen(false)} /></div>
        </div>
        <Link to="/tickets" className="navbtn t-txt"><I.TicketIc />My tickets</Link>
        <button className="navbtn c-txt" onClick={() => open(<CityModal />)}><I.Pin cls="pin" /><span>{city}</span><I.Chevron /></button>
        <button className="btn btn-y" id="signBtn" onClick={acc}>{user ? 'Hi, ' + user.name.split(' ')[0] : 'Sign in'}</button>
        <div className="nav-ico">
          <button aria-label="Search" onClick={() => open(<MobileSearch />)}><I.Search /></button>
          <button aria-label="My tickets" onClick={() => nav('/tickets')}><I.TicketIc /></button>
          <button aria-label="City" onClick={() => open(<CityModal />)}><I.Pin fill="#f7b928" /></button>
          <button aria-label="Account" className="me" onClick={acc}><I.User /></button>
        </div>
      </div>
    </header>
  )
}