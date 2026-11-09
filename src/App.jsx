import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import Nav from './components/Nav'
import BottomNav from './components/BottomNav'
import Intro from './components/Intro'
import { Modal, Toast } from './components/Overlays'
import Home from './pages/Home'
import Movies from './pages/Movies'
import Events from './pages/Events'
import MoviePage from './pages/MoviePage'
import Snacks from './pages/Snacks'
import Review from './pages/Review'
import Pay from './pages/Pay'
import Ticket from './pages/Ticket'
import MyTickets from './pages/MyTickets'

gsap.registerPlugin(ScrollTrigger)
// the 3D hall is big, so it loads only when someone opens it
const Seats = lazy(() => import('./pages/Seats'))
const HallLoading = () => <div className="hall-load"><div className="spin" /><b>Opening the hall…</b><small>Setting up seats, screen and lights</small></div>

export default function App() {
  const loc = useLocation()
  const main = useRef()
  const lenis = useRef()
  const isHall = loc.pathname.startsWith('/book/seats') || /^\/ticket\/[^/]+\/seat$/.test(loc.pathname)

  // Lenis smooth scroll (off in the 3D hall)
  useEffect(() => {
    if (isHall) return
    const l = new Lenis({ lerp: 0.11, smoothWheel: true })
    lenis.current = l; window.__lenis = l
    l.on('scroll', ScrollTrigger.update)
    const tick = (t) => l.raf(t * 1000)
    gsap.ticker.add(tick); gsap.ticker.lagSmoothing(0)
    return () => { gsap.ticker.remove(tick); l.destroy(); lenis.current = null; window.__lenis = null }
  }, [isHall])

  // page transition + scroll to top
  useLayoutEffect(() => {
    window.scrollTo(0, 0); lenis.current?.scrollTo(0, { immediate: true })
    const ctx = gsap.context(() => {
      gsap.fromTo(main.current, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', clearProps: 'transform' })
    })
    const id = setTimeout(() => ScrollTrigger.refresh(), 400)
    return () => { ctx.revert(); clearTimeout(id) }
  }, [loc.pathname])

  return (
    <>
      {!isHall && <Nav />}
      <main ref={main}>
        <Suspense fallback={<HallLoading />}>
        <Routes location={loc}>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/events" element={<Events kind="events" />} />
          <Route path="/plays" element={<Events kind="plays" />} />
          <Route path="/sports" element={<Events kind="sports" />} />
          <Route path="/movie/:id" element={<MoviePage />} />
          <Route path="/book/seats" element={<Seats />} />
          <Route path="/book/snacks" element={<Snacks />} />
          <Route path="/book/review" element={<Review />} />
          <Route path="/book/pay" element={<Pay />} />
          <Route path="/ticket/:id" element={<Ticket />} />
          <Route path="/ticket/:id/seat" element={<Seats viewOnly />} />
          <Route path="/tickets" element={<MyTickets />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </main>
      {!isHall && <BottomNav />}
      <Modal />
      <Toast />
      <Intro />
    </>
  )
}
