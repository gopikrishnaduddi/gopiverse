import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useStore, useUI, toast } from '../store/useStore'
import { MOVIES, BY_ID, FEATURED } from '../data/movies'
import { ALL_EVENTS } from '../data/events'
import { CITIES, TH_NAMES, AMEN } from '../data/cities'
import { usePoster, useCityImg, useCastImg, useEventImg } from '../lib/media'
import { getShows, dayInfo, showTime } from '../lib/util'
import { EventModal } from './Cards'
import { bookShow, showAvail, fullness } from './QtyModal'
import { CloseX } from './Overlays'
import * as I from './Icons'

const SOLID_TOP = ['/movie/']
function MThumb({ m }) { const src = usePoster(m); return <img src={src} alt="" /> }
function EThumb({ e }) { const src = useEventImg(e); return <img src={src} alt="" className="wide" /> }
function PThumb({ name }) { const src = useCastImg(name); return src ? <img src={src} alt="" className="round" /> : <span className="ph round">{name.split(' ').filter((x) => /^[A-Z]/.test(x)).map((x) => x[0]).slice(0, 2).join('')}</span> }
const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)

// highlight the matching part of a result
function Hl({ text, q }) {
  const s = q.trim(), i = s ? text.toLowerCase().indexOf(s.toLowerCase()) : -1
  return i < 0 ? text : <>{text.slice(0, i)}<mark>{text.slice(i, i + s.length)}</mark>{text.slice(i + s.length)}</>
}

/* Search across movies, people, theatres and events.
   Every result has go() so mouse, Enter and arrow keys all do the same thing. */
function useGroups(q, done) {
  const city = useStore((s) => s.city), nav = useNavigate(), open = useUI((s) => s.openModal)
  const s = q.trim().toLowerCase()
  const to = (path, state) => () => { done(); nav(path, state ? { state } : undefined) }
  if (!s) return [{ k: 'Trending in ' + city, items: FEATURED.map((id) => BY_ID[id]).filter((m) => m && m.status === 'now').slice(0, 5)
    .map((m) => ({ id: 'm' + m.id, thumb: <MThumb m={m} />, title: m.title, sub: `${m.lang} · ${m.genres.join(', ')}`, tag: '★ ' + m.rating, go: to('/movie/' + m.id) })) }]
  const score = (m) => (m.title.toLowerCase().startsWith(s) ? 3 : m.title.toLowerCase().includes(s) ? 2 : 1)
  const movies = MOVIES.filter((m) => (m.title + ' ' + (m.short || '') + ' ' + m.genres.join(' ') + ' ' + m.langs.join(' ') + ' ' + m.cast.join(' ') + ' ' + m.dir).toLowerCase().includes(s))
    .sort((a, b) => score(b) - score(a) || b.rating - a.rating).slice(0, 5)
  const people = new Map()
  MOVIES.forEach((m) => [...m.cast.map((n) => [n, 'Actor']), [m.dir, 'Director']].forEach(([n, role]) => {
    if (!n.toLowerCase().includes(s)) return
    const p = people.get(n) || { n, role, movies: [] }; p.movies.push(m); people.set(n, p)
  }))
  const theatres = TH_NAMES.filter((t) => t.toLowerCase().includes(s)).slice(0, 3)
  const events = ALL_EVENTS.filter((e) => (e.n + ' ' + e.g + ' ' + e.v).toLowerCase().includes(s)).slice(0, 4)
  return [
    { k: 'Movies', items: movies.map((m) => ({ id: 'm' + m.id, thumb: <MThumb m={m} />, title: m.title, sub: `${m.lang} · ${m.genres.join(', ')}`, tag: m.status === 'prebook' ? 'Pre-book' : 'Now showing', go: to('/movie/' + m.id) })) },
    { k: 'People', items: [...people.values()].slice(0, 4).map((p) => ({ id: 'p' + p.n, thumb: <PThumb name={p.n} />, title: p.n, sub: `${p.role} · ${p.movies.slice(0, 2).map((m) => m.title).join(', ')}`, go: to('/movie/' + p.movies[0].id) })) },
    { k: 'Theatres in ' + city, items: theatres.map((t) => ({ id: 't' + t, thumb: <span className="ph">🎬</span>, title: t, sub: 'Cinema · see what\'s playing today', go: () => { done(); open(<TheatreModal name={t} />) } })) },
    { k: 'Events, plays & sports', items: events.map((e) => ({ id: 'e' + e.id, thumb: <EThumb e={e} />, title: e.n, sub: `${e.g} · ${e.d}`, go: () => { done(); open(<EventModal e={e} />) } })) },
  ].filter((g) => g.items.length)
}

function Panel({ q, groups, act, setAct, setQ }) {
  const recent = useStore((s) => s.recent), clear = useStore((s) => s.clearRecent)
  let idx = 0
  const count = groups.reduce((n, g) => n + g.items.length, 0)
  return <>
    {!q.trim() && recent.length > 0 && <div className="sg"><div className="sg-h">Recent searches<button onMouseDown={(e) => e.preventDefault()} onClick={clear}>Clear</button></div>
      <div className="sg-chips">{recent.map((r) => <button key={r} onMouseDown={(e) => e.preventDefault()} onClick={() => setQ(r)}>🕘 {r}</button>)}</div></div>}
    {groups.map((g) => <div className="sg" key={g.k}><div className="sg-h">{g.k}</div>
      {g.items.map((it) => { const i = idx++
        return <button key={it.id} className={'sr' + (i === act ? ' on' : '')} onMouseEnter={() => setAct(i)} onMouseDown={(e) => e.preventDefault()} onClick={it.go}>
          {it.thumb}<span className="sr-t"><b><Hl text={it.title} q={q} /></b><small>{it.sub}</small></span>{it.tag && <em>{it.tag}</em>}</button> })}</div>)}
    {q.trim() && !count && <div className="sr-none">No results for “{q}”.<br /><span>Try a movie, actor, theatre or event.</span></div>}
    <div className="sr-keys"><span><kbd>↑</kbd><kbd>↓</kbd> to move</span><span><kbd>Enter</kbd> to open</span><span><kbd>Esc</kbd> to close</span></div>
  </>
}
// keyboard handling shared by the desktop box and the mobile modal
function useSearchBox(done) {
  const [q, setQRaw] = useState(''), [act, setAct] = useState(-1)
  const addRecent = useStore((s) => s.addRecent)
  const finish = () => { addRecent(q); setQRaw(''); setAct(-1); done() }
  const groups = useGroups(q, finish)
  const flat = groups.flatMap((g) => g.items)
  const setQ = (v) => { setQRaw(v); setAct(-1) }
  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setAct((a) => Math.min(flat.length - 1, a + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setAct((a) => Math.max(-1, a - 1)) }
    else if (e.key === 'Enter') { const it = flat[act >= 0 ? act : 0]; if (it) it.go() }
  }
  return { q, setQ, act, setAct, groups, onKeyDown }
}

// what's playing today at one cinema (opened from search)
export function TheatreModal({ name }) {
  const city = useStore((s) => s.city), nav = useNavigate(), c = CITIES.find((x) => x.n === city) || CITIES[0]
  const d = dayInfo(0), now = Date.now()
  const rows = MOVIES.filter((m) => m.status === 'now').map((m) => { const t = getShows(m, city, 0).find((x) => x.short === name); return t && { m, t, shows: t.shows.filter((s) => showTime(0, s.t) > now) } }).filter((r) => r && r.shows.length)
  const area = rows[0]?.t.area || c.areas[TH_NAMES.indexOf(name) % c.areas.length]
  return <div className="thm"><CloseX /><h3>{name}</h3><p className="mut" style={{ fontSize: 13 }}>{area}, {city} · {d.label}</p>
    <div className="am" style={{ margin: '10px 0 16px' }}>{AMEN[TH_NAMES.indexOf(name) % AMEN.length].map((a) => <span key={a}>{a}</span>)}</div>
    {rows.length ? rows.map(({ m, t, shows }) => <div className="thm-r" key={m.id}><MThumb m={m} /><div><b onClick={() => { useUI.getState().closeModal(); nav('/movie/' + m.id) }}>{m.title}</b><small>{m.cert} · {m.lang} · {m.dur}</small>
      <div className="times">{shows.map((s) => { const b = { kind: 'movie', movieId: m.id, theatre: t.short, area: t.area, city, day: 0, dateLabel: d.label, time: s.t, fmt: s.fmt, lang: m.lang, fill: s.fill, seats: [], snacks: {} }
        return <button key={s.t} className={'tm' + fullness(showAvail(b))} onClick={() => bookShow(b, `${t.name} · ${s.t} · ${s.fmt}`, nav)}><b>{s.t}</b><small>{s.fmt.toUpperCase()}</small></button> })}</div></div></div>)
      : <p className="mut" style={{ padding: '18px 0' }}>No more shows here today.</p>}
  </div>
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
export function UserModal() {
  const { user, tickets, interested, favs, setUser, toggleFav, toggleInterested } = useStore(), close = useUI((s) => s.closeModal)
  const upcoming = tickets.filter((t) => t.status !== 'cancelled' && (!t.showAt || t.showAt > Date.now())).length
  if (!user) return <SignModal />
  return <div className="um"><CloseX />
    <div className="um-h"><i>{user.name[0].toUpperCase()}</i><div><h3>Hi, {user.name}</h3><p className="mut">+91 {user.phone}</p></div></div>
    <div className="um-stats"><div><b>{upcoming}</b><small>Upcoming</small></div><div><b>{tickets.length}</b><small>Bookings</small></div><div><b>{interested.length}</b><small>Interested</small></div></div>
    {favs.length > 0 && <><small className="um-l">Favourite theatres</small><div className="um-tags">{favs.map((f) => <span key={f}>♥ {f}<button onClick={() => toggleFav(f)} aria-label={'Remove ' + f}>✕</button></span>)}</div></>}
    {interested.length > 0 && <><small className="um-l">Movies you're interested in</small><div className="um-tags">{interested.map((id) => BY_ID[id] && <span key={id}><Link to={'/movie/' + id} onClick={close}>{BY_ID[id].title}</Link><button onClick={() => toggleInterested(id)} aria-label="Remove">✕</button></span>)}</div></>}
    <div style={{ display: 'grid', gap: 10, marginTop: 20 }}><Link className="btn btn-ghost" to="/tickets" onClick={close}>🎟️ My tickets</Link>
      <button className="btn btn-ghost" onClick={() => { setUser(null); close(); toast('Signed out') }}>Sign out</button></div></div>
}
export function MobileSearch() {
  const close = useUI((s) => s.closeModal)
  const box = useSearchBox(close)
  return <><CloseX /><h3>Search</h3><div className="search" style={{ width: '100%', marginTop: 14 }}><I.Search />
    <input autoFocus value={box.q} onChange={(e) => box.setQ(e.target.value)} onKeyDown={box.onKeyDown} placeholder="Movies, actors, theatres, events…" enterKeyHint="search" />
    <div className="sres open static"><Panel {...box} /></div></div></>
}

export default function Nav() {
  const { city, user } = useStore(), open = useUI((s) => s.openModal)
  const loc = useLocation()
  const [solid, setSolid] = useState(false), [sOpen, setSOpen] = useState(false)
  const box = useRef(), input = useRef()
  const sb = useSearchBox(() => { setSOpen(false); input.current?.blur() })
  const transparentTop = loc.pathname === '/' || SOLID_TOP.some((p) => loc.pathname.startsWith(p))
  useEffect(() => { const f = () => setSolid(scrollY > 30); f(); addEventListener('scroll', f, { passive: true }); return () => removeEventListener('scroll', f) }, [])
  useEffect(() => { sb.setQ(''); setSOpen(false) }, [loc.pathname])
  useEffect(() => { const f = (e) => !box.current?.contains(e.target) && setSOpen(false); document.addEventListener('mousedown', f); return () => document.removeEventListener('mousedown', f) }, [])
  // Ctrl+K / ⌘K or "/" opens search from anywhere
  useEffect(() => {
    const k = (e) => {
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !isTyping(e.target))) {
        e.preventDefault()
        if (input.current && input.current.offsetParent) { input.current.focus(); setSOpen(true) } else open(<MobileSearch />)
      }
    }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  }, [])
  const acc = () => open(user ? <UserModal /> : <SignModal />)
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  return (
    <header className={'nav' + (solid || !transparentTop ? ' solid' : '')}>
      <div className="nav-in">
        <Link to="/" className="logo"><i><I.LogoMark /></i>GOPIVERSE</Link>
        <nav className="nav-links">
          {['movies', 'events', 'plays', 'sports'].map((k) => <NavLink key={k} to={'/' + k} className={({ isActive }) => (isActive || (k === 'movies' && loc.pathname.startsWith('/movie/')) ? 'on' : '')}>{k[0].toUpperCase() + k.slice(1)}</NavLink>)}
        </nav>
        <div className="nav-sp" />
        <div className={'search' + (sOpen ? ' focus' : '')} ref={box}>
          <I.Search />
          <input ref={input} value={sb.q} onChange={(e) => { sb.setQ(e.target.value); setSOpen(true) }} onFocus={() => setSOpen(true)} placeholder="Search movies & events"
            onKeyDown={(e) => { if (e.key === 'Escape') { setSOpen(false); input.current.blur() } else sb.onKeyDown(e) }} aria-label="Search" />
          {!sb.q && !sOpen && <span className="kbd-hint"><kbd>{mac ? '⌘' : 'Ctrl'}</kbd><kbd>K</kbd></span>}
          <div className={'sres' + (sOpen ? ' open' : '')} data-lenis-prevent><Panel {...sb} /></div>
        </div>
        <Link to="/tickets" className="navbtn t-txt"><I.TicketIc />My tickets</Link>
        <button className="navbtn c-txt" onClick={() => open(<CityModal />)}><I.Pin cls="pin" /><span>{city}</span><I.Chevron /></button>
        <button className="btn btn-y" id="signBtn" onClick={acc}>{user ? 'Hi, ' + user.name.split(' ')[0] : 'Sign in'}</button>
        <div className="nav-ico">
          <button aria-label="Search" onClick={() => open(<MobileSearch />)}><I.Search /></button>
          <button aria-label="City" className="city" onClick={() => open(<CityModal />)}><I.Pin fill="#f7b928" /><span>{city}</span></button>
        </div>
      </div>
    </header>
  )
}
