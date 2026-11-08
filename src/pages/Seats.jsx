import { useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BY_ID } from '../data/movies'
import { SEAT_CLASSES, CLS } from '../data/seatClasses'
import { useStore, toast } from '../store/useStore'
import { LAYOUT, soldSeats, bestSeats } from '../three/hall/layout'
import Hall from '../three/hall/Hall'
import { inr, showKey } from '../lib/util'
import * as I from '../components/Icons'

const VIEWS = ['Overview', 'From stage', 'Balcony', "Bird's eye", '▶ Tour']

export default function Seats() {
  const { booking: b, patchBooking, sold: soldStore } = useStore()
  const nav = useNavigate()
  const hall = useRef(), tip = useRef()
  const [view, setView] = useState(0), [filter, setFilter] = useState(null), [qty, setQty] = useState(Math.max(1, b?.seats?.length || 2))
  const [lights, setLights] = useState(true), [hd, setHd] = useState(true), [sound, setSound] = useState(false), [msg, setMsg] = useState('')
  const sold = useMemo(() => (b ? soldSeats(showKey(b), b.fill, soldStore[showKey(b)] || []) : new Set()), [b?.movieId, b?.time, b?.theatre, b?.day])
  const [sel, setSel] = useState(() => (b?.seats || []).map((s) => s.id).filter((id) => !sold.has(id)))
  if (!b || b.kind !== 'movie') return <Navigate to="/" replace />
  const m = BY_ID[b.movieId]

  const commit = (ids) => {
    const list = ids.map((id) => LAYOUT.seats[LAYOUT.byId[id]]).sort((a, c) => a.ri - c.ri || a.x - c.x)
    setSel(list.map((s) => s.id)); patchBooking({ seats: list.map((s) => ({ id: s.id, label: s.label, cls: s.cls, price: s.price })) })
  }
  const toggle = (id) => {
    const s = LAYOUT.seats[LAYOUT.byId[id]]
    if (sold.has(id)) return toast('Seat ' + s.label + ' is already booked')
    const grp = s.pair ? [id, s.pair] : [id]
    if (sel.includes(id)) return commit(sel.filter((x) => !grp.includes(x)))
    if (sel.length + grp.length > 10) return toast('You can book up to 10 seats at a time')
    commit([...sel, ...grp.filter((x) => !sold.has(x))])
  }
  const best = () => {
    const w = bestSeats(qty, filter, sold)
    if (!w) return setMsg(filter ? `No ${qty} seats together in ${CLS[filter].name}. Try another class.` : `No ${qty} seats together left.`)
    setMsg(''); commit(w.map((s) => s.id)); setView(-1); hall.current.focus(w)
  }
  const chosen = sel.map((id) => LAYOUT.seats[LAYOUT.byId[id]])
  const sub = chosen.reduce((a, s) => a + s.price, 0), fee = chosen.length * 30 * 1.18
  const left = (k) => LAYOUT.seats.filter((s) => s.cls === k && !sold.has(s.id) && !sel.includes(s.id)).length

  return <div id="v-seats" className="on">
    <div className="sh-bar"><button className="back" onClick={() => nav('/movie/' + m.id)}><I.Left /></button>
      <div style={{ minWidth: 0 }}><h2>{m.title}</h2><p>{b.theatre}, {b.area} · {b.dateLabel} · {b.time} · {b.fmt} · {b.lang}</p></div><span className="pill">{m.cert}</span></div>
    <div className="seat-main">
      <div className="hall">
        <Hall ref={hall} movie={m} sel={sel} sold={sold} filter={filter} onToggle={toggle} lightsOn={lights} hd={hd} sound={sound} tipRef={tip} onUserMove={() => setView(-1)} />
        <div className="views">{VIEWS.map((v, i) => <button key={v} className={i === view ? 'on' : ''} onClick={() => { setView(i); hall.current.view(i) }}>{v}</button>)}</div>
        <div className="hl">Drag to orbit · scroll or pinch to zoom · tap a seat to pick it</div>
        <div className="tg"><button className={sound ? '' : 'off'} onClick={() => setSound(!sound)}>{sound ? '🔊 Sound on' : '🔇 Sound off'}</button><button className={lights ? '' : 'off'} onClick={() => setLights(!lights)}>House lights</button><button className={hd ? '' : 'off'} onClick={() => setHd(!hd)}>HD</button></div>
        <div className="seat-tip" ref={tip} />
      </div>
      <aside className="spanel"><div className="sp-scroll">
        <div className="sp-h">SEAT CLASSES</div>
        {SEAT_CLASSES.map((c) => <button key={c.k} className={'cls' + (filter === c.k ? ' on' : '')} onClick={() => setFilter(filter === c.k ? null : c.k)}>
          <span className="bar" style={{ background: c.color }} /><span><b>{c.name}</b><small>{c.sub}</small></span><span className="pr"><b>{inr(c.price)}</b><small>{left(c.k)} left</small></span></button>)}
        <div className="slegend"><span><i style={{ background: '#3b3a40' }} />Booked</span><span><i style={{ background: '#3ef5e6' }} />Your pick</span><span><i style={{ background: 'var(--y)' }} />Couple recliners sold in pairs</span></div>
        <div className="sp-h">QUICK PICK</div>
        <div className="qp"><div className="qty"><button onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button onClick={() => setQty(Math.min(10, qty + 1))}>+</button></div>
          <button className="btn" onClick={best}>✦ Best {qty} seat{qty > 1 ? 's' : ''}</button></div>
        <div className="msg">{msg}</div>
        <div className="sp-h" style={{ marginTop: 10 }}>YOUR SEATS</div>
        {chosen.length ? <>
          <div className="ychips">{chosen.map((s) => <button key={s.id} onClick={() => toggle(s.id)}>{s.label} · {CLS[s.cls].name.split(' ')[0]} <i>×</i></button>)}</div>
          <button className="btn btn-ghost vfs" onClick={() => { setView(-1); hall.current.seatView(chosen[Math.floor(chosen.length / 2)]) }}>👁 See the screen from {chosen[Math.floor(chosen.length / 2)].label}</button>
        </> : <div className="yseats">Click any seat in the hall, or let us pick the best ones.</div>}
      </div>
        <div className="sp-foot"><div className="sp-tot"><div><small>{chosen.length} ticket{chosen.length === 1 ? '' : 's'}</small><small>+ fees {inr(fee)}</small></div><b className="big">{inr(sub)}</b></div>
          <button className="btn btn-y cont" disabled={!chosen.length} onClick={() => nav('/book/snacks')}>CONTINUE · ADD SNACKS</button></div>
      </aside>
    </div>
  </div>
}