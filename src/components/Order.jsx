import { BY_ID } from '../data/movies'
import { SNACKS } from '../data/snacks'
import { OFFERS } from '../data/offers'
import { CLS } from '../data/seatClasses'
import { inr } from '../lib/util'
import { Poster, EventImg } from './Cards'

// Popcorn and drinks come in two sizes. Cart keys: "p1" = regular, "p1|L" = large
export const SIZES = { Popcorn: [['R', 'Regular', 0], ['L', 'Large', 80]], Beverages: [['R', 'Regular', 0], ['L', 'Large', 40]] }
export function snackLine(key, q) {
  const [id, size = 'R'] = key.split('|'), s = SNACKS.find((x) => x.id === id); if (!s) return null
  const sz = (SIZES[s.cat] || []).find((z) => z[0] === size), large = sz && size !== 'R'
  return { key, s, q, unit: s.p + (sz ? sz[2] : 0), name: s.n + (large ? ` (${sz[1]})` : '') }
}
export const snackLines = (b) => Object.entries(b.snacks || {}).filter(([, q]) => q > 0).map(([k, q]) => snackLine(k, q)).filter(Boolean)

export function totals(b) {
  const tick = b.kind === 'movie' ? b.seats.reduce((a, s) => a + s.price, 0) : b.ev.p * b.qty
  const nT = b.kind === 'movie' ? b.seats.length : b.qty
  const food = snackLines(b).reduce((a, l) => a + l.unit * l.q, 0)
  const conv = nT * 30, gst = conv * 0.18, protect = b.kind === 'movie' && b.protect ? nT * 19 : 0
  const offer = OFFERS.find((o) => o.code === b.promo), base = { tick, nT, food }
  const disc = offer && offer.ok(base) ? offer.calc(base) : 0
  return { tick, nT, food, conv, gst, protect, disc, offer, total: Math.max(0, tick + food + conv + gst + protect - disc) }
}
export function OrderSummary({ b }) {
  const T = totals(b), m = b.kind === 'movie' ? BY_ID[b.movieId] : null
  const byCls = m ? Object.entries(b.seats.reduce((a, s) => ((a[s.cls] = [...(a[s.cls] || []), s.label]), a), {})) : []
  const lines = snackLines(b)
  return <>
    {m ? <><div className="mv"><Poster m={m} /><div><b>{m.title}</b><p>{b.theatre}, {b.area}<br />{b.dateLabel} · {b.time}<br />{b.fmt} · {b.lang}</p></div></div>
      {byCls.map(([k, ls]) => <div className="li" key={k} style={{ marginTop: 10 }}><span>{ls.length} × {CLS[k].name} <small>({ls.join(', ')})</small></span><span>{inr(ls.length * CLS[k].price)}</span></div>)}</>
      : <><div className="mv"><EventImg e={b.ev} style={{ width: 90, height: 60, objectFit: 'cover', borderRadius: 7 }} /><div><b style={{ fontSize: 16 }}>{b.ev.n}</b><p>{b.ev.v}, {b.city}<br />{b.ev.d}{b.ev.tier ? ' · ' + b.ev.tier : ''}</p></div></div>
        <div className="li" style={{ marginTop: 12 }}><span>{b.qty} × {b.ev.tier || 'Tickets'}</span><span>{inr(T.tick)}</span></div></>}
    {lines.map((l) => <div className="li" key={l.key}><span>{l.q} × {l.name}</span><span>{inr(l.unit * l.q)}</span></div>)}
    {lines.length > 0 && <div className="li"><small>{b.delivery === 'counter' ? '🛍️ Pick up at the snack counter' : '🪑 Delivered to your seat at the interval'}</small></div>}
    <div className="li"><span>Convenience fee</span><span>{inr(T.conv)}</span></div>
    <div className="li"><span>GST on fee (18%)</span><span>{inr(T.gst)}</span></div>
    {T.protect > 0 && <div className="li"><span>Cancellation protection</span><span>{inr(T.protect)}</span></div>}
    {T.disc > 0 && <div className="li" style={{ color: 'var(--green)' }}><span>Offer {b.promo}</span><span>− {inr(T.disc)}</span></div>}
    <div className="li t"><span>Total</span><span>{inr(T.total)}</span></div>
  </>
}
