/*
  Opening "film leader" — 3 · 2 · 1 countdown like an old projector reel, then the logo.
  Plays once per browser session on the home page. Click, tap or any key skips it.
  Not shown when the device asks for reduced motion. Add ?nointro to the URL to skip it.
*/
import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'

const want = () => {
  try { return location.pathname === '/' && !sessionStorage.getItem('gv-intro') && !/[?&]nointro/.test(location.search) && !matchMedia('(prefers-reduced-motion: reduce)').matches }
  catch (e) { return false }
}
export default function Intro() {
  const [show, setShow] = useState(want), root = useRef(), num = useRef()
  useLayoutEffect(() => {
    if (!show) return
    try { sessionStorage.setItem('gv-intro', '1') } catch (e) {}
    const el = root.current, q = gsap.utils.selector(el)
    const raf = requestAnimationFrame(() => window.__lenis?.stop())
    const tl = gsap.timeline({ onComplete: () => { window.__lenis?.start(); setShow(false) } })
    ;[3, 2, 1].forEach((n, i) => {
      const t = 0.15 + i * 0.62
      tl.call(() => { if (num.current) num.current.textContent = n }, null, t)
      tl.fromTo(q('.il-sweep'), { '--a': '0deg' }, { '--a': '360deg', duration: 0.62, ease: 'none' }, t)
      tl.fromTo(num.current, { scale: 1.18, autoAlpha: 0.35 }, { scale: 1, autoAlpha: 1, duration: 0.28, ease: 'power2.out' }, t)
    })
    tl.to(q('.il-leader'), { autoAlpha: 0, scale: 1.6, duration: 0.4, ease: 'power2.in' }, 2.05)
      .fromTo(q('.il-beam'), { autoAlpha: 0, scaleX: 0.1 }, { autoAlpha: 1, scaleX: 1, duration: 0.9, ease: 'power3.out' }, 2.2)
      .fromTo(q('.il-logo'), { autoAlpha: 0, scale: 0.9, letterSpacing: '0.45em', filter: 'blur(8px)' }, { autoAlpha: 1, scale: 1, letterSpacing: '0.04em', filter: 'blur(0px)', duration: 1, ease: 'power3.out' }, 2.25)
      .fromTo(q('.il-tag'), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 2.75)
      .to(el, { autoAlpha: 0, duration: 0.7, ease: 'power2.inOut' }, 3.55)
    const skip = () => { if (tl.progress() < 0.86) tl.seek(3.5) }
    el.addEventListener('pointerdown', skip); addEventListener('keydown', skip)
    return () => { cancelAnimationFrame(raf); tl.kill(); el.removeEventListener('pointerdown', skip); removeEventListener('keydown', skip); window.__lenis?.start() }
  }, [show])
  if (!show) return null
  return <div className="intro" ref={root} aria-hidden="true">
    <div className="il-film l" /><div className="il-film r" />
    <div className="il-leader">
      <div className="il-sweep" /><div className="il-ring a" /><div className="il-ring b" /><i className="il-x h" /><i className="il-x v" />
      <b ref={num}>3</b>
    </div>
    <div className="il-beam" />
    <div className="il-logo">GOPI<span>VERSE</span></div>
    <div className="il-tag">MOVIES · EVENTS · PLAYS · SPORTS</div>
    <div className="il-grain" /><div className="il-flicker" />
    <span className="il-skip">Tap to skip</span>
  </div>
}
