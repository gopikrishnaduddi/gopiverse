import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import gsap from 'gsap'
import { BY_ID, MOVIES } from '../data/movies'
import { SEAT_CLASSES } from '../data/seatClasses'
import { useStore, toast } from '../store/useStore'
import { Poster, Footer, MovieCard } from '../components/Cards'
import Trailer from '../components/Trailer'
import TheatreMode from '../components/TheatreMode'
import { availClass, showAvail, bookShow, fullness } from '../components/QtyModal'
import { useReveal } from '../components/useReveal'
import { availLabel, UPHOLSTERY } from '../three/hall/layout'
import { dayInfo, getShows, hourOf, todOf, showTime, inr } from '../lib/util'
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

// hover a showtime (desktop) → seat prices and how full each class is
function ShowPop({ pop }) {
  if (!pop) return null
  return <div className={'spop' + (pop.below ? ' below' : '')} style={{ left: pop.x, top: pop.y }}>
    <div className="spop-h"><b>{pop.s.t}</b><span>{pop.s.fmt}</span></div>
    {SEAT_CLASSES.map((c) => { const a = pop.avail[c.k], lab = availLabel(a.pct)
      return <div className="spop-r" key={c.k}><i style={{ background: UPHOLSTERY[c.k] }} /><span>{c.name}</span><b>{inr(c.price)}</b><em className={availClass(lab)}>{lab}</em></div> })}
    <p>Click to choose seats</p>
  </div>
}
const TOD = [['all', 'Any time', ''], ['morning', 'Morning', '🌅'], ['afternoon', 'Afternoon', '☀️'], ['evening', 'Evening', '🌇'], ['night', 'Night', '🌙']]
const canHover = () => typeof matchMedia !== 'undefined' && matchMedia('(hover: hover) and (pointer: fine)').matches
const PRICES = SEAT_CLASSES.map((c) => c.price)

function Showtimes({ m }) {
  const { city, favs, toggleFav } = useStore(), nav = useNavigate()
  const [day, setDay] = useState(0), [fmt, setFmt] = useState('All'), [lang, setLang] = useState(m.lang), [tod, setTod] = useState('all'), [pop, setPop] = useState(null)
  const d = dayInfo(day), now = Date.now()
  const list = getShows(m, city, day, lang)
    .map((t) => ({ ...t, fav: favs.includes(t.name), shows: t.shows.filter((s) => (fmt === 'All' || s.fmt === fmt) && (tod === 'all' || todOf(hourOf(s.t)) === tod) && (day > 0 || showTime(0, s.t) > now)) }))
    .filter((t) => t.shows.length).sort((a, b) => b.fav - a.fav || a.dist - b.dist)
  const nShows = list.reduce((n, t) => n + t.shows.length, 0)
  const draft = (t, s) => ({ kind: 'movie', movieId: m.id, theatre: t.short, area: t.area, city, day, dateLabel: d.label, time: s.t, fmt: s.fmt, lang, fill: s.fill, seats: [], snacks: {} })
  const book = (t, s) => { setPop(null); bookShow(draft(t, s), `${t.name} · ${d.label} · ${s.t} · ${s.fmt}`, nav) }
  const hover = (e, t, s) => {
    if (!canHover()) return
    const r = e.currentTarget.getBoundingClientRect(), below = r.top < 300
    setPop({ x: Math.min(innerWidth - 150, Math.max(150, r.left + r.width / 2)), y: below ? r.bottom + 10 : r.top - 10, below, s, avail: showAvail(draft(t, s)) })
  }
  useEffect(() => { const f = () => setPop(null); addEventListener('scroll', f, { passive: true }); return () => removeEventListener('scroll', f) }, [])
  const fav = (t) => { toggleFav(t.name); toast(t.fav ? 'Removed from favourites' : '♥ ' + t.short + ' saved — it will show first') }
  return <div>
    <div className="st-sticky">
      <div className="dates" data-lenis-prevent-horizontal>{[0, 1, 2, 3, 4, 5, 6].map((i) => { const x = dayInfo(i); return <button key={i} className={'dt' + (i === day ? ' on' : '')} onClick={() => setDay(i)}><small>{x.dow}</small><b>{x.num}</b><small>{x.mon.toUpperCase()}</small></button> })}</div>
      <div className="st-filters" data-lenis-prevent-horizontal><LangSelect value={lang} options={m.langs} onChange={setLang} />
        {['All', '2D', 'IMAX', '4DX', 'Dolby Atmos'].map((f) => <button key={f} className={'chip' + (f === fmt ? ' on' : '')} onClick={() => setFmt(f)}>{f === 'All' ? 'All formats' : f}</button>)}</div>
      <div className="st-filters tod" data-lenis-prevent-horizontal>{TOD.map(([k, n, e]) => <button key={k} className={'chip' + (k === tod ? ' on' : '')} onClick={() => setTod(k)}>{e && <span>{e}</span>}{n}</button>)}</div>
    </div>
    <div className="st-sum"><span>{list.length} theatre{list.length === 1 ? '' : 's'} · {nShows} show{nShows === 1 ? '' : 's'} · {d.label}</span><span>Tickets {inr(Math.min(...PRICES))} – {inr(Math.max(...PRICES))}</span></div>
    <div className="legend"><span><i style={{ background: 'var(--green)' }} />Available</span><span><i style={{ background: 'var(--y)' }} />Filling fast</span><span><i style={{ background: 'var(--red)' }} />Almost full</span><span>♥ Favourite theatres show first</span></div>
    {list.map((t) => <div className={'th' + (t.fav ? ' isfav' : '')} key={t.name}>
      <div className="th-l"><button className={'fav' + (t.fav ? ' on' : '')} onClick={() => fav(t)} aria-label={(t.fav ? 'Remove ' : 'Add ') + t.short + ' to favourites'}>{t.fav ? '♥' : '♡'}</button>
        <div><b>{t.name}</b><p>{t.dist} km away · Cancellation available</p><div className="am">{t.amen.map((a) => <span key={a}>{a}</span>)}</div></div></div>
      <div className="times">{t.shows.map((s) => <button key={s.t} className={'tm' + fullness(showAvail(draft(t, s)))} onClick={() => book(t, s)} onMouseEnter={(e) => hover(e, t, s)} onMouseLeave={() => setPop(null)}><b>{s.t}</b><small>{s.fmt.toUpperCase()}</small></button>)}</div></div>)}
    {!list.length && <div className="st-empty"><b>No shows match</b><p className="mut">{day === 0 ? "Today's shows may have started. " : ''}Try another date, time or format.</p>
      <button className="btn btn-ghost" onClick={() => { setFmt('All'); setTod('all'); if (day === 0) setDay(1) }}>{day === 0 ? 'See tomorrow' : 'Clear filters'}</button></div>}
    <ShowPop pop={pop} />
  </div>
}

function AlsoLike({ m }) {
  const list = useMemo(() => MOVIES.filter((x) => x.id !== m.id)
    .map((x) => ({ x, s: x.genres.filter((g) => m.genres.includes(g)).length * 2 + (x.lang === m.lang ? 1.5 : 0) + x.rating / 10 }))
    .sort((a, b) => b.s - a.s).slice(0, 10).map((o) => o.x), [m.id])
  return <section className="also"><h4 className="h reveal">You might also like</h4>
    <div className="hscroll reveal" data-lenis-prevent-horizontal>{list.map((x) => <MovieCard key={x.id} m={x} />)}</div></section>
}

export default function MoviePage() {
  const { id } = useParams(), m = BY_ID[id], loc = useLocation()
  const city = useStore((s) => s.city), interested = useStore((s) => s.interested.includes(id)), toggleInterested = useStore((s) => s.toggleInterested)
  const root = useRef(), shows = useRef(), tr = useRef(), heroIn = useRef()
  const [sound, setSound] = useState(false), [theatre, setTheatre] = useState(false)
  useReveal(root, [id])
  useEffect(() => () => drone.stop(), [id])
  useEffect(() => { setSound(false); setTheatre(false) }, [id])
  useLayoutEffect(() => {
    if (!m) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.mh-in .wrap > .mh-row > *', { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, stagger: 0.12, ease: 'power3.out', delay: 0.15, clearProps: 'transform,opacity,visibility' })
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
  const openTheatre = () => { if (sound) { setSound(false); tr.current?.setMuted(true); drone.stop() } tr.current?.pause(); setTheatre(true) }
  const closeTheatre = () => { setTheatre(false); tr.current?.play() }
  const share = async () => {
    const data = { title: m.title + ' · GopiVerse', text: `Book ${m.title} on GopiVerse`, url: location.href }
    try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(location.href); toast('🔗 Link copied') } } catch (e) { /* closed */ }
  }
  const pre = m.status === 'prebook'
  return <div ref={root}>
    <div className="mhero"><Trailer m={m} ref={tr} key={m.id} /><div className="shade" />
      <button className="mh-play" onClick={openTheatre} aria-label="Watch trailer in theatre mode"><span><I.Play /></span><small>Watch trailer</small></button>
      <div className="mh-in" ref={heroIn}><div className="wrap"><div className="mh-row"><div className="thumb"><Poster m={m} /></div>
        <div style={{ minWidth: 0 }}><div className="mh-lab">{pre ? 'TEASER' : 'OFFICIAL TRAILER'} <span className="pill">{m.cert}</span> <span className="x">{m.langs.slice(0, 2).join(' · ')} · {m.dur}</span></div>
          <h1 className="mh-t">{m.title}</h1>
          <div className="mh-meta"><span><span className="star" style={{ color: 'var(--red)' }}>★</span> {m.rating}</span><span className="sep" /><span>{m.genres.join(' · ')}</span><span className="sep" /><span>{m.cast.slice(0, 2).join(', ')} · Dir. {m.dir}</span></div></div>
        <div className="mh-acts">
          <button className="btn btn-ghost btn-pill" onClick={openTheatre}><I.Play /> Trailer</button>
          <button className="btn btn-ghost btn-pill" onClick={toggleSound}>{sound ? <><I.Mute /> Sound off</> : <><I.Sound /> Sound on</>}</button>
          {pre && <button className={'btn btn-ghost btn-pill' + (interested ? ' on' : '')} onClick={() => { toggleInterested(m.id); if (!interested) toast("♥ Added to your list — we'll keep it handy") }}>{interested ? '♥ Interested' : '♡ Interested'}</button>}
          <button className="btn btn-ghost btn-pill icon" onClick={share} aria-label="Share">↗</button>
          <button className="btn btn-red btn-pill" onClick={() => scrollToEl(shows.current)}>{pre ? 'Pre-book' : 'Book tickets'} ↓</button></div></div></div></div>
      <div className="scroll-cue" /></div>
    <div className="wrap"><div className="mbody"><div>
      <div className="about reveal"><h4 className="h" style={{ marginTop: 0 }}>About the movie</h4><p>{m.about}</p></div>
      <h4 className="h reveal">Cast & crew</h4>
      <div className="cast reveal" data-lenis-prevent-horizontal>{m.cast.map((c, i) => <CastPerson key={c} name={c} role="Actor" i={i} />)}
        <CastPerson name={m.dir} role="Director" i={0} /></div>
      <div ref={shows} style={{ scrollMarginTop: 90 }}><h4 className="h">{pre ? 'Pre-book opening shows' : 'Showtimes'} in {city}</h4><Showtimes m={m} key={m.id + city} /></div>
    </div>
      <aside><div className="card" style={{ position: 'sticky', top: 96 }}><div className="facts">
        <div><small>Rating</small><b><span className="star">★</span> {m.rating}/10</b></div><div><small>Votes</small><b>{m.votes}</b></div>
        <div><small>Certificate</small><b>{m.cert}</b></div><div><small>Runtime</small><b>{m.dur}</b></div>
        <div style={{ gridColumn: '1/-1' }}><small>Languages</small><b>{m.langs.join(', ')}</b></div>
        <div style={{ gridColumn: '1/-1' }}><small>Formats</small><b>2D · IMAX · 4DX · Dolby Atmos</b></div>
        <div style={{ gridColumn: '1/-1' }}><small>Tickets from</small><b>{inr(Math.min(...PRICES))} <span className="mut" style={{ fontWeight: 500 }}>· recliners {inr(Math.max(...PRICES))}</span></b></div></div>
        <button className="btn btn-y" style={{ width: '100%', marginTop: 18, height: 46 }} onClick={() => scrollToEl(shows.current)}>{pre ? 'Pre-book now' : 'Book tickets'}</button>
        <button className="btn btn-ghost" style={{ width: '100%', marginTop: 10, height: 42 }} onClick={openTheatre}><I.Play /> Watch trailer</button></div></aside>
    </div><AlsoLike m={m} /></div><Footer />
    {theatre && <TheatreMode m={m} onClose={closeTheatre} onBook={() => scrollToEl(shows.current)} />}
  </div>
}
