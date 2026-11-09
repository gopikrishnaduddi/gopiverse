import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { BY_ID } from '../data/movies'
import { SEAT_CLASSES, CLS } from '../data/seatClasses'
import { useStore, useUI, toast } from '../store/useStore'
import { soldSeats, bestSeats, pickBlock, viewQuality, seatById, classAvailability, availLabel, UPHOLSTERY } from '../three/hall/layout'
import Hall from '../three/hall/Hall'
import SeatMap from '../components/SeatMap'
import QtyModal, { availClass } from '../components/QtyModal'
import { inr, showKey } from '../lib/util'
import * as I from '../components/Icons'

const VIEWS = ['Overview', 'From stage', 'Balcony', "Bird's eye", '▶ Tour']
export function Stars({ n }) { return <span className="stars">{[1, 2, 3, 4, 5].map((i) => <i key={i} className={n >= i ? 'f' : n >= i - 0.5 ? 'h' : ''}>★</i>)}</span> }
export function ViewQuality({ seat }) {
  const v = viewQuality(seat)
  return <div className="vq">
    <div className="vq-top"><Stars n={v.score} /><b>{v.label}</b><small>from {seat.label}</small></div>
    <div className="vq-grid">
      <div><small>To the screen</small><b>{v.dist.toFixed(1)} m</b></div>
      <div><small>Screen fills</small><b>{Math.round(v.fill)}°</b></div>
      <div><small>Angle</small><b>{v.side < 3 ? 'Centre' : Math.round(v.side) + '° side'}</b></div>
    </div>
    {v.tags.length > 0 && <div className="vq-tags">{v.tags.map((t) => <span key={t}>{t}</span>)}</div>}
  </div>
}
const fromTicket = (t) => ({ kind: 'movie', movieId: t.movieId, theatre: t.theatre, area: t.area, city: t.city, day: t.day ?? 0, dateLabel: t.dateLabel, time: t.time, fmt: t.fmt, lang: t.lang, fill: t.fill ?? 0.6, seats: [] })

export default function Seats({ viewOnly = false }) {
  const { booking, patchBooking, sold: soldStore, tickets } = useStore()
  const { openModal, closeModal } = useUI()
  const { id: ticketId } = useParams()
  const nav = useNavigate()
  const ticket = viewOnly ? tickets.find((t) => t.id === ticketId) : null
  const b = viewOnly ? (ticket && ticket.kind === 'movie' ? fromTicket(ticket) : null) : booking
  const key = b ? showKey(b) : ''
  const own = useMemo(() => (ticket ? ticket.seatIds || ticket.seats || [] : []), [ticketId])
  const sold = useMemo(() => { if (!b) return new Set(); const s = soldSeats(key, b.fill, soldStore[key] || []); own.forEach((id) => s.delete(id)); return s }, [key])
  const hall = useRef(), tip = useRef(), pose = useMemo(() => ({ x: -8.4, z: 14.3, deg: 170 }), [])
  const [sel, setSel] = useState(() => (viewOnly ? own : (b?.seats || []).map((s) => s.id).filter((id) => !sold.has(id))))
  const [qty, setQty] = useState(() => Math.max(1, b?.qty || b?.seats?.length || 2))
  const [view, setView] = useState(0), [mode, setMode] = useState('orbit'), [viewSeat, setViewSeat] = useState(null), [filter, setFilter] = useState(null)
  const [lights, setLights] = useState(true), [hd, setHd] = useState(true), [sound, setSound] = useState(false), [audience, setAudience] = useState(true)
  const [mapOpen, setMapOpen] = useState(() => typeof innerWidth !== 'undefined' && innerWidth > 900)
  const [msg, setMsg] = useState('')
  const intro = useMemo(() => (viewOnly && own.length ? { seat: seatById(own[Math.floor(own.length / 2)]) } : { overview: true }), [])
  const avail = useMemo(() => classAvailability(sold), [sold])
  useEffect(() => { if (viewOnly && own.length) setViewSeat(own[Math.floor(own.length / 2)]) }, [])
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape' && mode === 'seat') hall.current?.exitSeat() }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  }, [mode])
  if (!b || b.kind !== 'movie') return <Navigate to={viewOnly ? '/tickets' : '/'} replace />
  const m = BY_ID[b.movieId]

  const commit = (ids) => {
    const list = ids.map(seatById).filter(Boolean).sort((a, c) => a.ri - c.ri || a.x - c.x)
    setSel(list.map((s) => s.id)); setMsg('')
    if (list.length > qty) { setQty(list.length); toast('Recliners come in couple pairs — tickets set to ' + list.length) }
    patchBooking({ seats: list.map((s) => ({ id: s.id, label: s.label, cls: s.cls, price: s.price })) })
  }
  // BookMyShow-style: tap one seat → the rest of your tickets are filled side by side
  const toggle = (id) => {
    if (viewOnly) return
    const s = seatById(id)
    if (sold.has(id)) return toast('Seat ' + s.label + ' is already booked')
    if (sel.includes(id)) { const grp = s.pair ? [id, s.pair] : [id]; return commit(sel.filter((x) => !grp.includes(x))) }
    const need = qty - sel.length
    if (need <= 0) return commit(pickBlock(s, qty, sold).map((x) => x.id))
    const add = pickBlock(s, need, sold, new Set(sel)).map((x) => x.id)
    if (add.length < need && add.length) setMsg(`Only ${add.length} free side by side here — tap another seat for the rest.`)
    commit([...sel, ...add].slice(0, 10))
  }
  const changeQty = (n) => {
    setQty(n)
    if (sel.length > n) { let keep = sel.slice(0, n); keep = keep.filter((id) => { const s = seatById(id); return !s.pair || keep.includes(s.pair) }); commit(keep) }
  }
  const askQty = () => openModal(<QtyModal initial={qty} avail={avail} sub={`${b.theatre} · ${b.time} · ${b.fmt}`} onConfirm={(n) => { closeModal(); changeQty(n) }} />)
  const best = () => {
    const w = bestSeats(qty, filter, sold)
    if (!w) return setMsg(filter ? `No ${qty} seats together in ${CLS[filter].name}. Try another class.` : `No ${qty} seats together left.`)
    commit(w.map((s) => s.id)); setView(-1); hall.current.focus(w)
  }
  const seeFrom = (id) => { setView(-1); setViewSeat(id); hall.current.seatView(seatById(id)) }
  const chosen = sel.map(seatById).filter(Boolean)
  const sub = chosen.reduce((a, s) => a + s.price, 0), fee = chosen.length * 30 * 1.18
  const mid = chosen[Math.floor(chosen.length / 2)]
  const ready = chosen.length > 0 && chosen.length === qty
  const go = () => { patchBooking({ qty, seats: chosen.map((s) => ({ id: s.id, label: s.label, cls: s.cls, price: s.price })), holdUntil: Date.now() + 10 * 60 * 1000 }); nav('/book/snacks') }

  return <div id="v-seats" className="on">
    <div className="sh-bar">
      <button className="back" onClick={() => nav(viewOnly ? '/ticket/' + ticket.id : '/movie/' + m.id)}><I.Left /></button>
      <div style={{ minWidth: 0 }}><h2>{m.title}</h2><p>{b.theatre}, {b.area} · {b.dateLabel} · {b.time} · {b.fmt} · {b.lang}</p></div>
      {!viewOnly && <button className="qchip" onClick={askQty}>🎟 {qty} Ticket{qty > 1 ? 's' : ''} <span>✎</span></button>}
      <span className="pill">{m.cert}</span>
    </div>
    <div className="seat-main">
      <div className="hall">
        <Hall ref={hall} movie={m} sel={sel} sold={sold} filter={filter} onToggle={toggle} lightsOn={lights} hd={hd} sound={sound} audience={audience}
          tipRef={tip} pose={pose} intro={intro} onUserMove={() => setView(-1)} onMode={setMode} />
        {mode !== 'seat' && <div className="views">{VIEWS.map((v, i) => <button key={v} className={i === view ? 'on' : ''} onClick={() => { setView(i); hall.current.view(i) }}>{v}</button>)}</div>}
        {mode === 'seat' && <div className="sv-chip"><span>👁 Your view from <b>{seatById(viewSeat)?.label || 'your seat'}</b></span><small>Drag to look around</small><button onClick={() => { setView(0); hall.current.exitSeat() }}>✕ Exit</button></div>}
        <SeatMap sel={sel} sold={sold} filter={filter} onToggle={toggle} pose={pose} open={mapOpen} setOpen={setMapOpen} readOnly={viewOnly} />
        <div className="tbar">
          <button className={sound ? 'on' : ''} onClick={() => setSound(!sound)}>{sound ? '🔊' : '🔇'}<span>Sound</span></button>
          <button className={lights ? 'on' : ''} onClick={() => setLights(!lights)}>💡<span>{lights ? 'Lights on' : 'Lights off'}</span></button>
          <button className={audience ? 'on' : ''} onClick={() => setAudience(!audience)}>👥<span>Audience</span></button>
          <button className={hd ? 'on' : ''} onClick={() => setHd(!hd)}><b>HD</b></button>
        </div>
        <div className="seat-tip" ref={tip} />
      </div>
      <aside className="spanel"><div className="sp-scroll">
        {viewOnly ? <>
          <div className="sp-h">YOUR TICKET</div>
          <div className="vo-card"><b>{m.title}</b><p>{ticket.theatre}, {ticket.area}<br />{ticket.dateLabel} · {ticket.time} · {ticket.screen}</p></div>
        </> : <>
          <div className="sp-h">TICKETS</div>
          <div className="qp"><div className="qty"><button onClick={() => changeQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button onClick={() => changeQty(Math.min(10, qty + 1))}>+</button></div>
            <button className="btn" onClick={best}>✦ Best {qty} seat{qty > 1 ? 's' : ''}</button></div>
          <p className="sp-hint">Tap any seat — we'll fill {qty > 1 ? `${qty} seats side by side` : 'it for you'}.</p>
          <div className="msg">{msg}</div>
          <div className="sp-h">SEAT CLASSES</div>
          {SEAT_CLASSES.map((c) => { const a = avail[c.k], lab = availLabel(a.pct); return <button key={c.k} className={'cls' + (filter === c.k ? ' on' : '')} onClick={() => setFilter(filter === c.k ? null : c.k)}>
            <span className="sw" style={{ background: UPHOLSTERY[c.k] }} /><span><b>{c.name}</b><small>{c.sub}</small></span>
            <span className="pr"><b>{inr(c.price)}</b><small className={availClass(lab)}>{a.left} left</small></span></button> })}
          <div className="slegend"><span><i style={{ background: '#3a3437' }} />Booked (someone's sitting)</span><span><i style={{ background: '#3ef5e6' }} />Your pick</span><span><i style={{ background: UPHOLSTERY.royal }} />Recliners in couple pairs</span></div>
        </>}
        <div className="sp-h" style={{ marginTop: 6 }}>YOUR SEATS</div>
        {chosen.length ? <>
          <div className="ychips">{chosen.map((s) => <button key={s.id} onClick={() => (viewOnly ? seeFrom(s.id) : toggle(s.id))}>{s.label} · {CLS[s.cls].name.split(' ')[0]} {viewOnly ? <i>👁</i> : <i>×</i>}</button>)}</div>
          <ViewQuality seat={mid} />
          <button className="btn btn-ghost vfs" onClick={() => seeFrom(mid.id)}>👁 See the screen from {mid.label}</button>
        </> : <div className="yseats">Tap a seat in the hall or on the seat map, or let us pick the best ones.</div>}
      </div>
        <div className="sp-foot">
          {viewOnly ? <button className="btn btn-y cont" onClick={() => nav('/ticket/' + ticket.id)}>BACK TO TICKET</button> : <>
            <div className="sp-tot"><div><small>{chosen.length} of {qty} seat{qty > 1 ? 's' : ''}</small><small>+ fees {inr(fee)}</small></div><b className="big">{inr(sub)}</b></div>
            <button className="btn btn-y cont" disabled={!ready} onClick={go}>{chosen.length === 0 ? 'SELECT SEATS' : chosen.length < qty ? `SELECT ${qty - chosen.length} MORE` : 'CONTINUE · ADD SNACKS'}</button>
          </>}
        </div>
      </aside>
    </div>
  </div>
}
