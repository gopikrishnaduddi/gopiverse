import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BY_ID } from '../data/movies'
import { useStore } from '../store/useStore'
import { Poster, EventImg } from '../components/Cards'
import { inr, until } from '../lib/util'

const stateOf = (t) => (t.status === 'cancelled' ? 'cancelled' : t.showAt && t.showAt < Date.now() ? 'past' : 'upcoming')
export default function MyTickets() {
  const L = useStore((s) => s.tickets), nav = useNavigate()
  const [tab, setTab] = useState('upcoming')
  const count = (k) => L.filter((t) => stateOf(t) === k).length
  const list = L.filter((t) => stateOf(t) === tab)
  return <div className="wrap page-top" style={{ paddingBottom: 60 }}><h1 className="page-h">My tickets</h1><p className="page-sub">Saved on this device</p>
    <div className="tabs" style={{ marginTop: 18 }}>{[['upcoming', 'Upcoming'], ['past', 'Past'], ['cancelled', 'Cancelled']].map(([k, n]) => <button key={k} className={'chip' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{n}{count(k) > 0 && <em>{count(k)}</em>}</button>)}</div>
    {list.length ? <div className="tlist">{list.map((t) => { const mv = t.kind === 'movie' ? BY_ID[t.movieId] : null, st = stateOf(t), starts = t.showAt ? until(t.showAt) : null
      return <div className={'trow ' + st} key={t.id} onClick={() => nav('/ticket/' + t.id)}>{mv ? <Poster m={mv} /> : <EventImg e={t.ev} />}
        <div><b>{mv ? mv.title : t.ev.n}</b><p>{mv ? `${t.theatre}, ${t.area} · ${t.dateLabel} · ${t.time}` : `${t.ev.v} · ${t.ev.d}`}</p><p>{mv ? 'Seats ' + t.seats.join(', ') : t.qty + ' × ' + (t.ev.tier || 'tickets')} · {inr(t.total)}</p>
          {st === 'upcoming' && starts && <span className="tpill">Starts in {starts}</span>}{st === 'cancelled' && <span className="tpill bad">Cancelled · refund {inr(t.refund || 0)}</span>}{st === 'past' && <span className="tpill dim">Watched</span>}</div>
        <div className="id">{t.id}<br /><span className="mut" style={{ fontSize: 11 }}>View ›</span></div></div> })}</div>
      : <div className="empty"><div className="big">🎟️</div><p>{tab === 'upcoming' ? 'No upcoming shows. Your next movie night is a few taps away.' : tab === 'past' ? 'No past bookings yet.' : 'No cancelled bookings.'}</p>{tab === 'upcoming' && <Link className="btn btn-y" to="/" style={{ marginTop: 16 }}>Browse movies</Link>}</div>}</div>
}
