/*
  THEATRE MODE — full-screen trailer.
  The picture "lights up" the room around it: every few frames the current frame is copied
  into a tiny canvas that is blurred and scaled behind the screen (ambient light),
  the screen reflects on a glossy floor, and a row of seat backs sits in front of you.
  Trailer file: public/assets/trailers/<movie-id>.mp4  (otherwise animated poster art + ambience)
*/
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import Trailer from './Trailer'
import { drone } from '../lib/audio'
import * as I from './Icons'

const fmt = (s) => (isFinite(s) ? Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') : '0:00')
function SeatRow() {
  const seats = Array.from({ length: 13 }, (_, i) => i)
  return <svg className="tm-seats" viewBox="0 0 1300 170" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs><linearGradient id="tmS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a1d22" /><stop offset=".35" stopColor="#140d10" /><stop offset="1" stopColor="#050304" /></linearGradient>
      <linearGradient id="tmH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgba(255,255,255,.16)" /><stop offset="1" stopColor="rgba(255,255,255,0)" /></linearGradient></defs>
    {seats.map((i) => { const x = i * 100 - 2, y = 40 + Math.pow((i - 6) / 6, 2) * 26
      return <g key={i}><rect x={x + 6} y={y} width="88" height="160" rx="26" fill="url(#tmS)" /><rect x={x + 16} y={y + 4} width="68" height="18" rx="9" fill="url(#tmH)" /></g> })}
  </svg>
}

export default function TheatreMode({ m, onClose, onBook }) {
  const root = useRef(), glow = useRef(), tr = useRef(), bar = useRef(), time = useRef(), hideT = useRef(), hv = useRef(false)
  const [sound, setSound] = useState(true), [playing, setPlaying] = useState(true), [idle, setIdle] = useState(false), [hasVid, setHasVid] = useState(false)
  const close = () => gsap.to(root.current, { autoAlpha: 0, duration: 0.35, ease: 'power2.in', onComplete: onClose })
  useEffect(() => {
    window.__lenis?.stop(); document.documentElement.classList.add('locked')
    const ctx = gsap.context(() => {
      gsap.fromTo(root.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45 })
      gsap.fromTo('.tm-screen', { scale: 0.82, rotateX: 14, y: 40 }, { scale: 1, rotateX: 0, y: 0, duration: 1.1, ease: 'power3.out', transformPerspective: 1200 })
      gsap.fromTo('.tm-seats', { yPercent: 40 }, { yPercent: 0, duration: 1.2, ease: 'power3.out' })
    }, root)
    return () => { ctx.revert(); window.__lenis?.start(); document.documentElement.classList.remove('locked'); drone.stop() }
  }, [])
  // controls fade out while watching; any mouse move brings them back
  useEffect(() => {
    const wake = () => { setIdle(false); clearTimeout(hideT.current); hideT.current = setTimeout(() => setIdle(true), 2600) }
    wake(); addEventListener('pointermove', wake); addEventListener('keydown', wake)
    return () => { clearTimeout(hideT.current); removeEventListener('pointermove', wake); removeEventListener('keydown', wake) }
  }, [])
  // sound (the click that opened theatre mode allows audio)
  useEffect(() => {
    const t = setTimeout(() => { const h = tr.current; if (!h) return
      if (h.hasVideo) { h.setMuted(!sound); drone.stop() } else sound && playing ? drone.start() : drone.stop() }, 120)
    return () => clearTimeout(t)
  }, [sound, playing, hasVid])
  // ambient light + progress bar
  useEffect(() => {
    const g = glow.current, ctx = g.getContext('2d'); let raf, last = 0
    const f = (now) => {
      raf = requestAnimationFrame(f)
      const el = tr.current?.el?.(), v = !!tr.current?.hasVideo
      if (v !== hv.current) { hv.current = v; setHasVid(v) }
      if (el && el.tagName === 'VIDEO' && bar.current) { bar.current.style.transform = `scaleX(${el.duration ? el.currentTime / el.duration : 0})`; if (time.current) time.current.textContent = fmt(el.currentTime) + ' / ' + fmt(el.duration) }
      if (now - last < 80 || !el) return; last = now
      try { ctx.globalAlpha = 0.35; ctx.drawImage(el, 0, 0, g.width, g.height) } catch (e) { /* frame not ready */ }
    }
    raf = requestAnimationFrame(f); return () => cancelAnimationFrame(raf)
  }, [])
  const togglePlay = () => { const h = tr.current; if (!h) return; if (playing) h.pause(); else h.play(); setPlaying(!playing) }
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') close(); if (e.key === ' ' || e.key === 'k') { e.preventDefault(); togglePlay() } if (e.key === 'm') setSound((s) => !s) }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  })
  const seek = (e) => { const el = tr.current?.el?.(); if (!el || el.tagName !== 'VIDEO' || !el.duration) return; const r = e.currentTarget.getBoundingClientRect(); el.currentTime = ((e.clientX - r.left) / r.width) * el.duration }
  return createPortal(<div className={'tmode' + (idle ? ' idle' : '')} ref={root} role="dialog" aria-label={m.title + ' trailer'}>
    <canvas className="tm-glow" ref={glow} width="48" height="27" />
    <div className="tm-room" />
    <div className="tm-stage">
      <div className="tm-screen" onClick={togglePlay}><Trailer m={m} ref={tr} />
        {!playing && <div className="tm-paused"><span><I.Play /></span></div>}
        {!hasVid && <div className="tm-soon">Official trailer coming soon</div>}
      </div>
    </div>
    <SeatRow />
    <div className="tm-top"><div><b>{m.title}</b><small>{m.cert} · {m.langs.slice(0, 3).join(' · ')} · {m.dur}</small></div>
      <button className="tm-x" onClick={close} aria-label="Close theatre mode">✕</button></div>
    <div className="tm-bar">
      <button className="tm-b" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg> : <I.Play />}</button>
      <button className="tm-b" onClick={() => setSound(!sound)} aria-label={sound ? 'Mute' : 'Unmute'}>{sound ? <I.Sound /> : <I.Mute />}</button>
      {hasVid ? <><div className="tm-prog" onClick={seek}><i ref={bar} /></div><span className="tm-time mono" ref={time}>0:00</span></> : <div style={{ flex: 1 }} />}
      {onBook && <button className="btn btn-red btn-pill" onClick={() => { close(); setTimeout(onBook, 380) }}>{m.status === 'prebook' ? 'Pre-book' : 'Book tickets'}</button>}
    </div>
  </div>, document.body)
}
