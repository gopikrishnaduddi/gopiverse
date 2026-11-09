// Mobile bottom navigation (phones only — hidden on bigger screens and during booking)
import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useStore, useUI } from '../store/useStore'
import { UserModal, SignModal } from './Nav'

const Ic = {
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>,
  movies: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" /></svg>,
  live: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18V6l11-2v12" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></svg>,
  tickets: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z" /><path d="M14 7v10" strokeDasharray="2 2" /></svg>,
  me: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>,
}
export default function BottomNav() {
  const loc = useLocation(), user = useStore((s) => s.user), open = useUI((s) => s.openModal)
  const upcoming = useStore((s) => s.tickets.filter((t) => t.status !== 'cancelled' && (!t.showAt || t.showAt > Date.now())).length)
  const hidden = loc.pathname.startsWith('/book/') || /\/seat$/.test(loc.pathname)
  useEffect(() => { document.body.classList.toggle('has-bnav', !hidden); return () => document.body.classList.remove('has-bnav') }, [hidden])
  if (hidden) return null
  const live = ['/events', '/plays', '/sports'].includes(loc.pathname)
  return <nav className="bnav" aria-label="Main">
    <NavLink to="/" end>{Ic.home}<span>Home</span></NavLink>
    <NavLink to="/movies" className={({ isActive }) => (isActive || loc.pathname.startsWith('/movie/') ? 'active' : '')}>{Ic.movies}<span>Movies</span></NavLink>
    <NavLink to="/events" className={() => (live ? 'active' : '')}>{Ic.live}<span>Live</span></NavLink>
    <NavLink to="/tickets" className={({ isActive }) => (isActive || loc.pathname.startsWith('/ticket/') ? 'active' : '')}>{Ic.tickets}<span>Tickets</span>{upcoming > 0 && <em>{upcoming}</em>}</NavLink>
    <button onClick={() => open(user ? <UserModal /> : <SignModal />)}>{Ic.me}<span>{user ? user.name.split(' ')[0] : 'Sign in'}</span></button>
  </nav>
}
