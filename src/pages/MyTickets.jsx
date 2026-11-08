import { Link, useNavigate } from 'react-router-dom'
import { BY_ID } from '../data/movies'
import { useStore } from '../store/useStore'
import { Poster, EventImg } from '../components/Cards'
import { inr } from '../lib/util'

export default function MyTickets() {
  const L = useStore((s) => s.tickets), nav = useNavigate()
  return <div className="wrap page-top" style={{ paddingBottom: 60 }}><h1 className="page-h">My tickets</h1><p className="page-sub">Saved on this device</p>
    {L.length ? <div className="tlist">{L.map((t) => { const mv = t.kind === 'movie' ? BY_ID[t.movieId] : null
      return <div className="trow" key={t.id} onClick={() => nav('/ticket/' + t.id)}>{mv ? <Poster m={mv} /> : <EventImg e={t.ev} />}
        <div><b>{mv ? mv.title : t.ev.n}</b><p>{mv ? `${t.theatre}, ${t.area} · ${t.dateLabel} · ${t.time}` : `${t.ev.v} · ${t.ev.d}`}</p><p>{mv ? 'Seats ' + t.seats.join(', ') : t.qty + ' tickets'} · {inr(t.total)}</p></div>
        <div className="id">{t.id}<br /><span className="mut" style={{ fontSize: 11 }}>View ›</span></div></div> })}</div>
      : <div className="empty"><div className="big">🎟️</div><p>No tickets yet. Your next movie night is a few taps away.</p><Link className="btn btn-y" to="/" style={{ marginTop: 16 }}>Browse movies</Link></div>}</div>
}
