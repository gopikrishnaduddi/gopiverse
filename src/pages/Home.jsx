import { useEffect, useRef, useState, Suspense } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import gsap from 'gsap'
import { MOVIES, BY_ID, FEATURED, LANGS } from '../data/movies'
import { EVENTS } from '../data/events'
import { useStore } from '../store/useStore'
import { MovieCard, EventCard, Footer, Poster } from '../components/Cards'
import { useReveal } from '../components/useReveal'
import { mixHex, rng } from '../lib/posterArt'
import HeroRing, { useRingController } from '../three/HeroRing'
import * as I from '../components/Icons'

const meta = (m) => <><span className="pill">{m.cert}</span> {m.lang} · {m.genres.join(', ')} · {m.dur} · <span className="star">★&nbsp;{m.rating}</span></>

function Hero() {
  const nav = useNavigate()
  const movies = FEATURED.map((id) => BY_ID[id])
  const [cur, setCur] = useState(3)
  const prog = useRef(), stage = useRef(), stars = useRef(), card = useRef()
  const cb = useRef({ change: setCur, progress: (p) => prog.current && (prog.current.style.width = p + '%') })
  const ring = useRingController(movies.length, cb)
  const mobile = typeof innerWidth !== 'undefined' && innerWidth < 820
  const m = movies[cur]

  useEffect(() => ring.bindDrag(stage.current, () => (innerWidth < 820 ? 120 : 160)), [])
  useEffect(() => { document.documentElement.style.setProperty('--sky', m.sky || mixHex(m.pal[1], m.pal[2], 0.3)) }, [cur])
  useEffect(() => { // hero card text swap animation
    gsap.fromTo(card.current.querySelectorAll('.hc-info > *'), { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.05, duration: 0.45, ease: 'power2.out' })
  }, [cur])
  useEffect(() => { // starfield
    const c = stars.current, x = c.getContext('2d'); c.width = c.clientWidth; c.height = c.clientHeight; const r = rng(9)
    for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(255,255,255,${r() * 0.7})`; const s = r() < 0.08 ? 2 : 1; x.fillRect(r() * c.width, r() * c.height * 0.75, s, s) }
  }, [])
  const open = (i, shows) => nav('/movie/' + movies[i].id, { state: { shows } })
  const pick = (i) => (i === ring.state.cur ? open(i, false) : ring.goTo(i))

  return (
    <div className="hero">
      <canvas className="stars" ref={stars} /><div className="planet" /><div className="beam" />
      <div className="hero-title"><h1>CINE<span>VERSE</span></h1><p>DRAG TO EXPLORE · TAP A SCREEN TO BOOK</p></div>
      <div className="r3f-stage" ref={stage}>
        <Suspense fallback={null}><HeroRing movies={movies} state={ring.state} onTick={ring.onTick} onPick={pick} mobile={mobile} /></Suspense>
      </div>
      <div className="floor" />
      <div className="hero-card-wrap">
        <button className="rbtn" aria-label="Previous" onClick={() => ring.next(-1)}><I.Left /></button>
        <div className="hero-card" ref={card} onMouseEnter={() => (ring.state.hover = true)} onMouseLeave={() => (ring.state.hover = false)}>
          <div className="hero-count mono"><b>{String(cur + 1).padStart(2, '0')}</b> / {String(movies.length).padStart(2, '0')}</div>
          <div className="hc-info"><div className={'st' + (m.status === 'prebook' ? '' : ' now')}>{m.status === 'prebook' ? 'PRE-BOOKING OPEN' : 'NOW SHOWING'}</div><h2>{m.title}</h2><div className="meta">{meta(m)}</div></div>
          <div className="acts"><button className="btn btn-ghost btn-pill" onClick={() => open(cur, false)}><I.Play /> Trailer</button><button className="btn btn-y btn-pill" onClick={() => open(cur, true)}>{m.status === 'prebook' ? 'Pre-book' : 'Book tickets'}</button></div>
          <div className="prog"><i ref={prog} /></div>
        </div>
        <button className="rbtn" aria-label="Next" onClick={() => ring.next(1)}><I.Right /></button>
      </div>
    </div>
  )
}

// "Now showing" — CSS 3D cylinder spun by the GSAP ticker
function NowShowing() {
  const city = useStore((s) => s.city), nav = useNavigate()
  const [lang, setLang] = useState('All')
  const car = useRef(), cyl = useRef()
  let list = MOVIES.filter((m) => m.status === 'now' && (lang === 'All' || m.langs.includes(lang)))
  if (lang !== 'All') list = [...list].sort((a, b) => (b.lang === lang) - (a.lang === lang))
  let cards = list.slice(); while (cards.length < 9 && list.length) cards = cards.concat(list); cards = cards.slice(0, Math.max(9, Math.min(cards.length, 14)))
  const n = cards.length

  useEffect(() => {
    const els = [...cyl.current.children], cw = innerWidth < 700 ? 170 : 190, R = Math.round(((cw + 26) * n) / (2 * Math.PI))
    let rot = 0, vel = 0.06, drag = false, lx = 0, hov = false, moved = 0
    const el = car.current
    const enter = (e) => { if (e.pointerType === 'mouse') hov = true }, leave = () => (hov = false)
    const down = (e) => { drag = true; lx = e.clientX; moved = 0; el.classList.add('drag') }
    const move = (e) => { if (!drag) return; const dx = e.clientX - lx; lx = e.clientX; moved += Math.abs(dx); rot += dx * 0.18; vel = dx * 0.18 }
    const up = (e) => {
      if (!drag) return; drag = false; el.classList.remove('drag')
      if (moved < 6) { const t = document.elementFromPoint(e.clientX, e.clientY); const b = t?.closest('[data-book]'), c = t?.closest('.mc'); if (b) nav('/movie/' + b.dataset.book, { state: { shows: true } }); else if (c) nav('/movie/' + c.dataset.id) }
    }
    el.addEventListener('pointerenter', enter); el.addEventListener('pointerleave', leave); el.addEventListener('pointerdown', down); addEventListener('pointermove', move); addEventListener('pointerup', up)
    const tick = () => {
      if (!drag) { vel += ((hov ? 0 : 0.06) - vel) * 0.04; rot += vel }
      els.forEach((c, i) => { const a = (i * 360) / n + rot, cs = Math.cos((a * Math.PI) / 180); c.style.transform = `translateZ(${-R}px) rotateY(${a}deg) translateZ(${R}px)`; c.style.opacity = cs < -0.05 ? 0 : Math.min(1, 0.25 + cs); c.style.pointerEvents = cs > 0.6 ? 'auto' : 'none' })
    }
    gsap.ticker.add(tick)
    return () => { gsap.ticker.remove(tick); el.removeEventListener('pointerenter', enter); el.removeEventListener('pointerleave', leave); el.removeEventListener('pointerdown', down); removeEventListener('pointermove', move); removeEventListener('pointerup', up) }
  }, [lang, n])

  return (
    <section className="sec ns">
      <div className="wrap"><div className="sec-h reveal"><div><h3>Now showing in {city}</h3><p>Book tickets for movies running in theatres near you</p></div><Link className="see" to="/movies">See all ({MOVIES.filter((m) => m.status === 'now').length}) ›</Link></div>
        <div className="chips">{['All', ...LANGS].map((l) => <button key={l} className={'chip' + (l === lang ? ' on' : '')} onClick={() => setLang(l)}>{l}</button>)}</div></div>
      <div className="carousel" ref={car}><div className="cyl" ref={cyl}>
        {cards.map((m, i) => <div className="mc" data-id={m.id} key={m.id + i}><Poster m={m} draggable={false} /><div className="sh" /><span className="rk">{String(list.indexOf(m) + 1).padStart(2, '0')}</span><span className="rt"><span className="star">★</span>{m.rating}<small>{m.votes}</small></span>
          <div className="bt"><div className="g"><span className="pill">{m.cert}</span>{m.genres.join(' / ')}</div><h4>{m.short || m.title}</h4><div className="l">{m.langs.join(' · ')}</div><button className="btn btn-y" data-book={m.id}>Book tickets →</button></div></div>)}
      </div></div>
      <div className="marq"><div>{[0, 1, 2, 3].map((k) => <span key={k}><span>Your seat is <span className="y">waiting.</span></span><span className="d">✦</span><span>Lights down.</span><span className="d">✦</span><span className="y">Phones off.</span><span className="d">✦</span><span>Every format.</span><span className="d">✦</span><span className="y">IMAX · 4DX · Atmos.</span><span className="d">✦</span></span>)}</div></div>
      <p className="hint">DRAG TO SPIN · HOVER TO PAUSE</p>
    </section>
  )
}

export default function Home() {
  const root = useRef()
  useReveal(root)
  const soon = MOVIES.filter((m) => m.status === 'prebook').concat(MOVIES.filter((m) => ['kalki', 'kantara', 'jailer2', 'toxic'].includes(m.id)))
  return (
    <div ref={root}>
      <Hero />
      <NowShowing />
      <section className="sec" style={{ paddingTop: 20 }}><div className="wrap"><div className="sec-h reveal"><div><h3>Coming soon · Pre-book now</h3><p>Lock your seats for opening day</p></div></div>
        <div className="hscroll reveal" data-lenis-prevent-horizontal>{soon.map((m) => <MovieCard key={m.id} m={m} />)}</div></div></section>
      <section className="sec" style={{ paddingTop: 10 }}><div className="wrap"><div className="sec-h reveal"><div><h3>Live events near you</h3><p>Concerts, comedy, theatre and matchdays</p></div><Link className="see" to="/events">Explore ›</Link></div>
        <div className="egrid reveal">{[...EVENTS.events.slice(0, 2), EVENTS.plays[0], EVENTS.sports[0]].map((e) => <EventCard key={e.id} e={e} />)}</div></div></section>
      <Footer />
    </div>
  )
}
