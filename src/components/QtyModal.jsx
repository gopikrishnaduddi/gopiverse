// "How many seats?" picker shown after choosing a showtime (with seat prices and availability for that show)
import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { SEAT_CLASSES } from '../data/seatClasses'
import { UPHOLSTERY, availLabel, soldSeats, classAvailability } from '../three/hall/layout'
import { inr, showKey } from '../lib/util'
import { useStore, useUI } from '../store/useStore'
import { CloseX } from './Overlays'

const VEH = ['🚲', '🛵', '🛺', '🚗', '🚙', '🚙', '🚐', '🚐', '🚌', '🚌']
export const availClass = (lab) => 'al-' + lab.split(' ')[0].toLowerCase()

export default function QtyModal({ initial = 2, avail, sub, onConfirm }) {
  const [q, setQ] = useState(initial)
  const veh = useRef()
  useLayoutEffect(() => { gsap.fromTo(veh.current, { x: -50, autoAlpha: 0, scale: 0.7 }, { x: 0, autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2.2)' }) }, [VEH[q - 1]])
  return <div className="qm">
    <CloseX />
    <h3>How many seats?</h3>
    {sub && <p className="mut" style={{ fontSize: 12.5, marginTop: 2 }}>{sub}</p>}
    <div className="qm-veh"><span ref={veh}>{VEH[q - 1]}</span></div>
    <div className="qm-nums">{Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <button key={n} className={n === q ? 'on' : ''} onClick={() => setQ(n)}>{n}</button>)}</div>
    {avail && <div className="qm-cls">{SEAT_CLASSES.slice().reverse().map((c) => {
      const a = avail[c.k], lab = availLabel(a.pct)
      return <div key={c.k}><small><i style={{ background: UPHOLSTERY[c.k] }} />{c.k === 'royal' ? 'RECLINER' : c.name.toUpperCase()}</small><b>{inr(c.price)}</b><em className={availClass(lab)}>{lab}</em></div>
    })}</div>}
    <button className="btn btn-y" style={{ width: '100%', height: 48, marginTop: 18 }} onClick={() => onConfirm(q)}>Select {q} seat{q > 1 ? 's' : ''}</button>
  </div>
}

// seats left per class for a show that hasn't been opened yet
export function showAvail(b) { const key = showKey(b), sold = useStore.getState().sold; return classAvailability(soldSeats(key, b.fill, sold[key] || [])) }
// colour of a showtime button from how many seats are really left (same numbers as the hall and the popover)
export const fullness = (avail) => { const v = Object.values(avail), left = v.reduce((n, c) => n + c.left, 0) / v.reduce((n, c) => n + c.total, 0); return left < 0.15 ? ' a' : left < 0.4 ? ' f' : '' }
// showtime tapped → "How many seats?" → 3D hall
export function bookShow(b, sub, nav) {
  const { openModal, closeModal } = useUI.getState(), { booking, setBooking } = useStore.getState()
  openModal(<QtyModal initial={booking?.qty || 2} avail={showAvail(b)} sub={sub} onConfirm={(q) => { closeModal(); setBooking({ ...b, qty: q }); nav('/book/seats') }} />)
}
