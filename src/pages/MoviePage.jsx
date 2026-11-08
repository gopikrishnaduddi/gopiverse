import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import gsap from 'gsap'
import { BY_ID } from '../data/movies'
import { useStore } from '../store/useStore'
import { Poster, Footer } from '../components/Cards'
import Trailer from '../components/Trailer'
import { useReveal } from '../components/useReveal'
import { dayInfo, getShows } from '../lib/util'
import { mixHex } from '../lib/posterArt'
import { drone } from '../lib/audio'
import { useCastImg } from '../lib/media'
import { scrollToEl } from '../lib/scroll'
import * as I from '../components/Icons'

const COLS = ['#e85d3a', '#3a8be8', '#9b5de5', '#21c58e', '#f7b928', '#ef476f']
// Cast photo: public/assets/cast/<name-in-lowercase-with-dashes>.jpg  (e.g. cast/yash.jpg, cast/geetu-mohandas.jpg)
function CastPerson({ name, role, i }) {
  const img = useCastImg(name)
  return <div>
    <i style={{ background: role === 'Director' ? 'linear-gradient(135deg,#444,#111)' : `linear-gradient(135deg,${COLS[i % 6]},${mixHex(COLS[i % 6], '#000000', 0.55)})` }}>
      {img ? <img src={img} alt={name} /> : initials(name)}
    </i><b>{name}</b><small>{role}</small></div>
}
const initials = (n) => n.split(' ').filter((x) => /^[A-Z]/.test(x)).map((x) => x[0]).slice(0, 2).join('')

// Language dropdown styled to match the site (replaces the browser's default <select>)
function LangSelect({ value, options, onChange }) {
  const [open, setOpen] = useState(false), box = useRef()
  useEffect(() => {
    const close = (e) => !box.current?.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [])
  return <div className={'dd' + (open ? ' open' : '')} ref={box}>
    <button type="button" className="dd-btn" onClick={() => setOpen(!open)} aria-haspopup="listbox" aria-expanded={open}>
      <span className="dd-ic">🗣</span>{value}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m6 9 6 6 6-6" /></svg>
    </button>
    {open && <ul className="dd-menu" role="listbox">{options.map((o) => <li key={o} role="option" aria-selected={o === value} className={o === value ? 'on' : ''} onClick={() => { onChange(o); setOpen(false) }}>{o}{o === value && <span>✓</span>}</li>)}</ul>}
  </div>
}

function Showtimes({ m }) {
  const { city, setBooking } = useStore(), nav = useNavigate()
  const [day, setDay] = useState(0), [fmt, setFmt] = useState('All'), [lang, setLang] = useState(m.lang)
  const list = getShows(m, city, day, lang).map((t) => ({ ...t, shows: t.shows.filter((s) => fmt === 'All' || s.fmt === fmt) })).filter((t) => t.shows.length)
  const book = (t, s) => {
    const d = dayInfo(day)
    setBooking({ kind: 'movie', movieId: m.id, theatre: t.short, area: t.area, city, day, dateLabel: d.label, time: s.t, fmt: s.fmt, lang, fill: s.fill, seats: [], snacks: {} })
    nav('/book/seats')
  }
  return <div>
    <div className="dates" data-lenis-prevent-horizontal>{[0, 1, 2, 3, 4, 5, 6].map((i) => { const d = dayInfo(i); return <button key={i} className={'dt' + (i === day ? ' on' : '')} onClick={() => setDay(i)}><small>{d.dow}</small><b>{d.num}</b><small>{d.mon.toUpperCase()}</small></button> })}</div>
    <div className="st-filters"><LangSelect value={lang} options={m.langs} onChange={setLang} />
      {['All', '2D', 'IMAX', '4DX', 'Dolby Atmos'].map((f) => <button key={f} className={'chip' + (f === fmt ? ' on' : '')} onClick={() => setFmt(f)}>{f === 'All' ? 'All formats' : f}</button>)}</div>
    <div className="legend"><span><i style={{ background: 'var(--green)' }} />Available</span><span><i style={{ background: 'var(--y)' }} />Filling fast</span><span><i style={{ background: 'var(--red)' }} />Almost full</span></div>
    {list.map((t) => <div className="th" key={t.name}><div><b>{t.name}</b><p>{t.dist} km away · Cancellation available</p><div className="am">{t.amen.map((a) => <span key={a}>{a}</span>)}</div></div>
      <div className="times">{t.shows.map((s) => <button key={s.t} className={'tm' + (s.fill > 0.85 ? ' a' : s.fill > 0.65 ? ' f' : '')} onClick={() => book(t, s)}><b>{s.t}</b><small>{s.fmt.toUpperCase()}</small></button>)}</div></div>)}
    {!list.length && <p className="mut" style={{ padding: '20px 0' }}>No shows for this format on this day. Try another date or format.</p>}
  </div>
}

export default function MoviePage() {
  const { id } = useParams(), m = BY_ID[id], loc = useLocation()
  const city = useStore((s) => s.city)
  const root = useRef(), shows = useRef(), tr = useRef(), heroIn = useRef()
  const [sound, setSound] = useState(false)
  useReveal(root, [id])
  useEffect(() => () => drone.stop(), [id])
  useLayoutEffect(() => {
    if (!m) return
    const ctx = gsap.context(() => {
      gsap.from('.mh-in .wrap > .mh-row > *', { y: 40, autoAlpha: 0, duration: 1, stagger: 0.12, ease: 'power3.out', delay: 0.15 })
      gsap.to('.mhero .trailer', { scale: 1.12, yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.mhero', start: 'top top', end: 'bottom top', scrub: true } })
    }, root)
    return () => ctx.revert()
  }, [id])
  useEffect(() => { if (m && loc.state?.shows) setTimeout(() => scrollToEl(shows.current), 600) }, [id])
  if (!m) return <Navigate to="/" replace />
  const toggleSound = () => {
    const on = !sound; setSound(on)
    if (tr.current?.hasVideo) tr.current.setMuted(!on); else on ? drone.start() : drone.stop()
  }
  return <div ref={root}>
    <div className="mhero"><Trailer m={m} ref={tr} key={m.id} /><div className="shade" />
      <div className="mh-in" ref={heroIn}><div className="wrap"><div className="mh-row"><div className="thumb"><Poster m={m} /></div>
        <div style={{ minWidth: 0 }}><div className="mh-lab">{m.status === 'prebook' ? 'TEASER' : 'OFFICIAL TRAILER'} <span className="pill">{m.cert}</span> <span className="x">{m.langs.slice(0, 2).join(' · ')} · {m.dur}</span></div>
          <h1 className="mh-t">{m.title}</h1>
          <div className="mh-meta"><span><span className="star" style={{ color: 'var(--red)' }}>★</span> {m.rating}</span><span className="sep" /><span>{m.genres.join(' · ')}</span><span className="sep" /><span>{m.cast.slice(0, 2).join(', ')} · Dir. {m.dir}</span></div></div>
        <div className="mh-acts"><button className="btn btn-ghost btn-pill" onClick={toggleSound}>{sound ? <><I.Mute /> Sound off</> : <><I.Sound /> Sound on</>}</button>
          <button className="btn btn-red btn-pill" onClick={() => scrollToEl(shows.current)}>{m.status === 'prebook' ? 'Pre-book' : 'Book tickets'} ↓</button></div></div></div></div>
      <div className="scroll-cue" /></div>
    <div className="wrap"><div className="mbody"><div>
      <div className="about reveal"><h4 className="h" style={{ marginTop: 0 }}>About the movie</h4><p>{m.about}</p></div>
      <h4 className="h reveal">Cast & crew</h4>
      <div className="cast reveal" data-lenis-prevent-horizontal>{m.cast.map((c, i) => <CastPerson key={c} name={c} role="Actor" i={i} />)}
        <CastPerson name={m.dir} role="Director" i={0} /></div>
      <div ref={shows} style={{ scrollMarginTop: 90 }}><h4 className="h">{m.status === 'prebook' ? 'Pre-book opening shows' : 'Showtimes'} in {city}</h4><Showtimes m={m} key={m.id + city} /></div>
    </div>
      <aside><div className="card" style={{ position: 'sticky', top: 96 }}><div className="facts">
        <div><small>Rating</small><b><span className="star">★</span> {m.rating}/10</b></div><div><small>Votes</small><b>{m.votes}</b></div>
        <div><small>Certificate</small><b>{m.cert}</b></div><div><small>Runtime</small><b>{m.dur}</b></div>
        <div style={{ gridColumn: '1/-1' }}><small>Languages</small><b>{m.langs.join(', ')}</b></div>
        <div style={{ gridColumn: '1/-1' }}><small>Formats</small><b>2D · IMAX · 4DX · Dolby Atmos</b></div></div>
        <button className="btn btn-y" style={{ width: '100%', marginTop: 18, height: 46 }} onClick={() => scrollToEl(shows.current)}>{m.status === 'prebook' ? 'Pre-book now' : 'Book tickets'}</button></div></aside>
    </div></div><Footer /></div>
}