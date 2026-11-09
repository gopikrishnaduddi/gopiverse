/*  2D seat map (mini-map) shown on top of the 3D hall.
    Same seats as the 3D hall, drawn from above. Tap a seat to pick it.
    The yellow marker shows where the 3D camera is and which way it is looking.   */
import { useEffect, useMemo, useRef } from 'react'
import { LAYOUT, SCREEN, UPHOLSTERY, PARAPET_R, CZ, WALL } from '../three/hall/layout'
import { mixHex } from '../lib/posterArt'

export default function SeatMap({ sel, sold, filter, onToggle, pose, open, setOpen, readOnly }) {
  const cam = useRef()
  useEffect(() => {
    if (!open) return
    let raf
    const f = () => { raf = requestAnimationFrame(f); if (cam.current && pose) cam.current.setAttribute('transform', `translate(${pose.x.toFixed(2)} ${pose.z.toFixed(2)}) rotate(${pose.deg.toFixed(1)})`) }
    f(); return () => cancelAnimationFrame(raf)
  }, [open])
  const paths = useMemo(() => {
    const R = SCREEN.curve, z0 = SCREEN.z + R, scr = []
    for (let i = 0; i <= 24; i++) { const x = -SCREEN.w / 2 + (SCREEN.w * i) / 24; scr.push(`${x.toFixed(2)} ${(z0 - Math.sqrt(R * R - x * x)).toFixed(2)}`) }
    const t = Math.asin(WALL / PARAPET_R), bal = []
    for (let i = 0; i <= 24; i++) { const a = -t + (2 * t * i) / 24; bal.push(`${(PARAPET_R * Math.sin(a)).toFixed(2)} ${(CZ + PARAPET_R * Math.cos(a)).toFixed(2)}`) }
    return { screen: 'M' + scr.join(' L'), balcony: 'M' + bal.join(' L') }
  }, [])
  return (
    <div className={'smap' + (open ? ' open' : '')}>
      <button className="smap-h" onClick={() => setOpen(!open)}><span>🗺️ Seat map</span><i>{open ? '–' : '+'}</i></button>
      {open && <svg viewBox="-12.4 -15.8 24.8 31.2" className="smap-svg">
        <rect x="-12" y="-15.3" width="24" height="30.4" rx="0.7" fill="rgba(255,255,255,.025)" stroke="rgba(255,255,255,.1)" strokeWidth="0.08" />
        <path d={paths.screen} stroke="#cfe0ff" strokeWidth="0.3" fill="none" strokeLinecap="round" />
        <text x="0" y="-12.4" textAnchor="middle" fontSize="0.75" fill="#8a91a1" letterSpacing="0.35">SCREEN</text>
        <path d={paths.balcony} stroke="#9b6bff" strokeWidth="0.09" strokeDasharray="0.35 0.25" fill="none" />
        <text x="0" y="14.65" textAnchor="middle" fontSize="0.62" fill="#8a91a1" letterSpacing="0.2">BALCONY</text>
        {LAYOUT.seats.map((s) => {
          const isSel = sel.includes(s.id), isSold = sold.has(s.id)
          const fill = isSel ? '#3ef5e6' : isSold ? '#3a3437' : mixHex(UPHOLSTERY[s.cls], '#ffffff', 0.3)
          const w = s.cls === 'royal' ? 0.82 : 0.5, h = s.cls === 'royal' ? 0.62 : 0.46
          return <rect key={s.id} x={-w / 2} y={-h / 2} width={w} height={h} rx="0.12" fill={fill} opacity={filter && s.cls !== filter ? 0.22 : 1}
            transform={`translate(${s.x.toFixed(2)} ${s.z.toFixed(2)}) rotate(${((-s.rot * 180) / Math.PI).toFixed(1)})`}
            className={readOnly || isSold ? '' : 'sm-seat'} onClick={() => !readOnly && onToggle(s.id)}><title>{s.label}{isSold ? ' · Booked' : ''}</title></rect>
        })}
        <g ref={cam}><path d="M0 0 L-1.8 -3.8 A4.1 4.1 0 0 1 1.8 -3.8 Z" fill="rgba(247,185,40,.24)" /><circle r="0.45" fill="#f7b928" stroke="#000" strokeWidth="0.1" /></g>
      </svg>}
    </div>
  )
}
