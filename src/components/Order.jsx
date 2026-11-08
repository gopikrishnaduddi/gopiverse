import { BY_ID } from '../data/movies'
import { SNACKS } from '../data/snacks'
import { inr } from '../lib/util'
import { Poster, EventImg } from './Cards'

export function totals(b) {
  const tick = b.kind === 'movie' ? b.seats.reduce((a, s) => a + s.price, 0) : b.ev.p * b.qty
  const nT = b.kind === 'movie' ? b.seats.length : b.qty
  const food = Object.entries(b.snacks || {}).reduce((a, [id, q]) => a + (SNACKS.find((x) => x.id === id)?.p || 0) * q, 0)
  const conv = nT * 30, gst = conv * 0.18, disc = b.promo ? Math.min(150, Math.round(tick * 0.1)) : 0
  return { tick, nT, food, conv, gst, disc, total: tick + food + conv + gst - disc }
}
export function OrderSummary({ b }) {
  const T = totals(b), m = b.kind === 'movie' ? BY_ID[b.movieId] : null
  return <>
    {m ? <><div className="mv"><Poster m={m} /><div><b>{m.title}</b><p>{b.theatre}, {b.area}<br />{b.dateLabel} · {b.time}<br />{b.fmt} · {b.lang}</p></div></div>
      <div className="li" style={{ marginTop: 12 }}><span>{b.seats.length} × Seats <small>({b.seats.map((s) => s.label).join(', ')})</small></span><span>{inr(T.tick)}</span></div></>
      : <><div className="mv"><EventImg e={b.ev} style={{ width: 90, height: 60, objectFit: 'cover', borderRadius: 7 }} /><div><b style={{ fontSize: 16 }}>{b.ev.n}</b><p>{b.ev.v}, {b.city}<br />{b.ev.d}</p></div></div>
        <div className="li" style={{ marginTop: 12 }}><span>{b.qty} × Tickets</span><span>{inr(T.tick)}</span></div></>}
    {Object.entries(b.snacks || {}).filter(([, q]) => q).map(([id, q]) => { const s = SNACKS.find((x) => x.id === id); return <div className="li" key={id}><span>{q} × {s.n}</span><span>{inr(s.p * q)}</span></div> })}
    <div className="li"><span>Convenience fee</span><span>{inr(T.conv)}</span></div>
    <div className="li"><span>GST on fee (18%)</span><span>{inr(T.gst)}</span></div>
    {T.disc > 0 && <div className="li" style={{ color: 'var(--green)' }}><span>Offer {b.promo}</span><span>− {inr(T.disc)}</span></div>}
    <div className="li t"><span>Total</span><span>{inr(T.total)}</span></div>
  </>
}
