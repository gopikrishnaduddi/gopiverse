import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { toPng } from 'html-to-image'
import gsap from 'gsap'
import { BY_ID } from '../data/movies'
import { useStore, useUI, toast } from '../store/useStore'
import { useBackdrop, useEventImg } from '../lib/media'
import { inr, until } from '../lib/util'
import { useTilt } from '../components/useTilt'
import { CloseX } from '../components/Overlays'
import * as I from '../components/Icons'

function MovieTop({ t, mv }) { const img = useBackdrop(mv); return <TopView img={img} title={mv.title} sub={`${mv.cert} · ${t.lang} · ${t.fmt}`} /> }
function EventTop({ t }) { const img = useEventImg(t.ev); return <TopView img={img} title={t.ev.n} sub={t.ev.g + (t.ev.tier ? ' · ' + t.ev.tier : '')} /> }
function TopView({ img, title, sub }) { return <div className="tk-top"><img src={img} alt="" /><div className="tt"><b>{title}</b><small>{sub}</small></div></div> }
// The downloaded ticket image can't load web fonts by itself, so the GopiVerse fonts are fetched once
// and turned into data links (Latin + Latin-extended files only, which include the ₹ sign).
let fontCache = null
function ticketFonts() {
  if (fontCache) return fontCache
  fontCache = (async () => {
    const link = document.querySelector('link[href*="fonts.googleapis.com/css"]'); if (!link) return null
    const css = await (await fetch(link.href)).text()
    const blocks = css.split('@font-face').slice(1).map((b) => '@font-face' + b.slice(0, b.indexOf('}') + 1))
      .filter((b) => !/unicode-range/i.test(b) || /U\+0000-00FF|U\+0100-02/i.test(b))
    const toData = async (u) => { const blob = await (await fetch(u)).blob(); return new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(blob) }) }
    const out = await Promise.all(blocks.map(async (b) => { const m = /url\((['"]?)(https?:[^)'"]+)\1\)/.exec(b); return m ? b.replace(m[0], `url(${await toData(m[2])})`) : b }))
    return out.join('\n')
  })().catch(() => null)
  return fontCache
}
const mins = (dur) => { const m = /(\d+)h\s*(\d+)?m?/.exec(dur || ''); return m ? +m[1] * 60 + +(m[2] || 0) : 150 }
export const canCancel = (t) => t.status !== 'cancelled' && (!t.showAt || t.showAt - Date.now() > 2 * 3.6e6)

export function TicketCard({ t, cardRef }) {
  const mv = t.kind === 'movie' ? BY_ID[t.movieId] : null, tilt = useRef()
  useTilt(tilt, { max: 7, scale: 1 })
  return <div className="tk-holder" ref={tilt}><div className={'tk' + (t.status === 'cancelled' ? ' void' : '')} ref={cardRef}>
    {mv ? <MovieTop t={t} mv={mv} /> : <EventTop t={t} />}
    <div className="tk-b">{mv ? <><div><small>Date</small><b>{t.dateLabel}</b></div><div><small>Time</small><b>{t.time}</b></div><div style={{ gridColumn: '1/-1' }}><small>Theatre</small><b>{t.theatre}, {t.area}</b></div><div><small>{t.screen}</small><b>{t.seats.join(', ')}</b></div><div><small>Tickets</small><b>{t.seats.length}</b></div></>
      : <><div><small>Date</small><b>{t.ev.d}</b></div><div><small>Tickets</small><b>{t.qty}</b></div><div style={{ gridColumn: '1/-1' }}><small>Venue</small><b>{t.ev.v}, {t.city}</b></div></>}
      {t.snacks.length > 0 && <div style={{ gridColumn: '1/-1' }}><small>Food & beverage · {t.delivery === 'counter' ? 'pick up at counter' : 'to your seat at the interval'}</small><b style={{ fontSize: 12.5 }}>{t.snacks.map((s) => s.q + '× ' + s.n).join(', ')}</b></div>}</div>
    <div className="tk-tear"><i /><i /></div>
    <div className="tk-qr"><div className="q"><QRCodeSVG value={'GOPIVERSE|' + t.id + '|' + (mv ? mv.title + '|' + t.time + '|' + t.seats.join(',') : t.ev.n)} size={102} /></div>
      <div><p>Booking ID</p><b className="id">{t.id}</b><p style={{ marginTop: 8 }}>Show this QR at the entrance.<br />Paid {inr(t.total)}{t.protect ? ' · 🛡 Protected' : ''}</p></div></div>
    {t.status === 'cancelled' && <div className="tk-stamp">CANCELLED</div>}
  </div></div>
}
function CancelModal({ t }) {
  const cancel = useStore((s) => s.cancelTicket), close = useUI((s) => s.closeModal)
  const refund = Math.round(t.protect ? t.total : t.total * 0.8)
  return <><CloseX /><h3>Cancel this booking?</h3>
    <p className="mut" style={{ fontSize: 13, lineHeight: 1.6, margin: '8px 0 18px' }}>Your seats will be released. You'll get <b style={{ color: '#fff' }}>{inr(refund)}</b> back {t.protect ? '(100% — you have cancellation protection)' : '(80% of the amount)'} to your original payment method. <i>Demo — no money moves.</i></p>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}><button className="btn btn-ghost" onClick={close}>Keep booking</button>
      <button className="btn btn-red" onClick={() => { cancel(t.id); close(); toast('Booking cancelled — refund of ' + inr(refund) + ' started') }}>Yes, cancel</button></div></>
}
export default function Ticket() {
  const { id } = useParams(), t = useStore((s) => s.tickets.find((x) => x.id === id)), open = useUI((s) => s.openModal), nav = useNavigate()
  const card = useRef(), wrap = useRef(), [, tick] = useState(0)
  useEffect(() => { const i = setInterval(() => tick((n) => n + 1), 30000); return () => clearInterval(i) }, [])
  useLayoutEffect(() => {
    if (!wrap.current) return
    const ctx = gsap.context(() => {
      // explicit start AND end values (fromTo) so the card always lands flat, then the hover tilt takes over
      gsap.fromTo('.tk', { y: 70, rotateX: 28, autoAlpha: 0, transformPerspective: 900 }, { y: 0, rotateX: 0, autoAlpha: 1, duration: 1, ease: 'power3.out', delay: 0.15, clearProps: 'transform,opacity,visibility' })
      gsap.fromTo('.tk-actions > *', { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.5, delay: 0.7, clearProps: 'transform,opacity,visibility' })
    }, wrap)
    return () => ctx.revert()
  }, [id])
  if (!t) return <div className="wrap page-top empty"><div className="big">🎟️</div><p>Ticket not found on this device.</p><Link className="btn btn-y" to="/tickets" style={{ marginTop: 16 }}>My tickets</Link></div>
  const mv = t.kind === 'movie' ? BY_ID[t.movieId] : null, starts = t.showAt ? until(t.showAt) : null
  const download = async () => {
    const fonts = await ticketFonts()
    const opts = { pixelRatio: 2, cacheBust: true, backgroundColor: '#06070b', ...(fonts ? { fontEmbedCSS: fonts } : { skipFonts: true }) }
    try { const url = await toPng(card.current, opts).catch(() => toPng(card.current, { ...opts, fontEmbedCSS: undefined, skipFonts: true })); const a = document.createElement('a'); a.href = url; a.download = `GopiVerse-${t.id}.png`; a.click(); toast('⬇ Ticket saved') }
    catch (e) { toast('Could not create the image here — take a screenshot instead') }
  }
  const calendar = () => {
    const start = new Date(t.showAt), end = new Date(t.showAt + mins(mv?.dur) * 60000), f = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GopiVerse//EN', 'BEGIN:VEVENT', `UID:${t.id}@gopiverse`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(start)}`, `DTEND:${f(end)}`,
      `SUMMARY:${mv.title} — ${t.theatre}`, `LOCATION:${t.theatre}\\, ${t.area}\\, ${t.city}`, `DESCRIPTION:Seats ${t.seats.join(' ')} · Booking ID ${t.id}`, 'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:Your movie starts in 1 hour', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' })); a.download = `GopiVerse-${t.id}.ics`; a.click(); toast('📅 Calendar file downloaded')
  }
  const cancelled = t.status === 'cancelled'
  return <div className="wrap tk-wrap" ref={wrap}>
    {cancelled ? <><div className="ok bad">✕</div><h1 className="page-h" style={{ textAlign: 'center' }}>Booking cancelled</h1><p className="page-sub" style={{ textAlign: 'center' }}>Refund of {inr(t.refund)} started to your original payment method.</p></>
      : <><div className="ok"><I.Check /></div><h1 className="page-h" style={{ textAlign: 'center' }}>You're all set{t.contact ? ', ' + t.contact.name.split(' ')[0] : ''}!</h1>
        <p className="page-sub" style={{ textAlign: 'center' }}>{starts ? <>Show starts in <b style={{ color: 'var(--y)' }}>{starts}</b> · </> : ''}Your M-ticket is saved in My tickets.</p></>}
    <TicketCard t={t} cardRef={card} />
    <div className="tk-actions">
      <button className="btn btn-ghost" onClick={download}>⬇ Download</button>
      {mv && t.showAt && !cancelled && <button className="btn btn-ghost" onClick={calendar}>📅 Add to calendar</button>}
      {mv && !cancelled && <button className="btn btn-ghost" onClick={() => nav(`/ticket/${t.id}/seat`)}>👁 View my seat in 3D</button>}
      {canCancel(t) && <button className="btn btn-ghost danger" onClick={() => open(<CancelModal t={t} />)}>Cancel booking</button>}
    </div>
    <div style={{ display: 'flex', gap: 10, marginTop: 18 }}><Link className="btn btn-ghost" to="/tickets">My tickets</Link><Link className="btn btn-y" to="/">Book another</Link></div>
  </div>
}
