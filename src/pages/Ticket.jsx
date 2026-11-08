import { Link, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { BY_ID } from '../data/movies'
import { useStore } from '../store/useStore'
import { useBackdrop, useEventImg } from '../lib/media'
import { inr } from '../lib/util'
import * as I from '../components/Icons'

function MovieTop({ t, mv }) { const img = useBackdrop(mv); return <TopView img={img} title={mv.title} sub={`${mv.cert} · ${t.lang} · ${t.fmt}`} /> }
function EventTop({ t }) { const img = useEventImg(t.ev); return <TopView img={img} title={t.ev.n} sub={t.ev.g} /> }
function TopView({ img, title, sub }) { return <div className="tk-top"><img src={img} alt="" /><div className="tt"><b>{title}</b><small>{sub}</small></div></div> }
function Top({ t }) {
  const mv = t.kind === 'movie' ? BY_ID[t.movieId] : null
  return mv ? <MovieTop t={t} mv={mv} /> : <EventTop t={t} />
}
export function TicketCard({ t }) {
  const mv = t.kind === 'movie' ? BY_ID[t.movieId] : null
  return <div className="tk"><Top t={t} key={t.id} />
    <div className="tk-b">{mv ? <><div><small>Date</small><b>{t.dateLabel}</b></div><div><small>Time</small><b>{t.time}</b></div><div style={{ gridColumn: '1/-1' }}><small>Theatre</small><b>{t.theatre}, {t.area}</b></div><div><small>{t.screen}</small><b>{t.seats.join(', ')}</b></div><div><small>Tickets</small><b>{t.seats.length}</b></div></>
      : <><div><small>Date</small><b>{t.ev.d}</b></div><div><small>Tickets</small><b>{t.qty}</b></div><div style={{ gridColumn: '1/-1' }}><small>Venue</small><b>{t.ev.v}, {t.city}</b></div></>}
      {t.snacks.length > 0 && <div style={{ gridColumn: '1/-1' }}><small>Food & beverage</small><b style={{ fontSize: 12.5 }}>{t.snacks.map((s) => s.q + '× ' + s.n).join(', ')}</b></div>}</div>
    <div className="tk-tear"><i /><i /></div>
    <div className="tk-qr"><div className="q"><QRCodeSVG value={'GOPIVERSE|' + t.id + '|' + (mv ? mv.title + '|' + t.time + '|' + t.seats.join(',') : t.ev.n)} size={102} /></div>
      <div><p>Booking ID</p><b className="id">{t.id}</b><p style={{ marginTop: 8 }}>Show this QR at the entrance.<br />Paid {inr(t.total)}</p></div></div></div>
}
export default function Ticket() {
  const { id } = useParams(), t = useStore((s) => s.tickets.find((x) => x.id === id))
  if (!t) return <div className="wrap page-top empty"><div className="big">🎟️</div><p>Ticket not found on this device.</p><Link className="btn btn-y" to="/tickets" style={{ marginTop: 16 }}>My tickets</Link></div>
  return <div className="wrap tk-wrap"><div className="ok"><I.Check /></div><h1 className="page-h" style={{ textAlign: 'center' }}>You're all set{t.contact ? ', ' + t.contact.name.split(' ')[0] : ''}!</h1>
    <p className="page-sub" style={{ textAlign: 'center' }}>Your M-ticket is confirmed and saved in My tickets.</p><TicketCard t={t} />
    <div style={{ display: 'flex', gap: 10, marginTop: 24 }}><Link className="btn btn-ghost" to="/tickets">My tickets</Link><Link className="btn btn-y" to="/">Book another</Link></div></div>
}
