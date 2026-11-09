// "Seats held for 09:41" — seats are held for 10 minutes after you choose them
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, useUI } from '../store/useStore'

function Expired() {
  const patch = useStore((s) => s.patchBooking), close = useUI((s) => s.closeModal), nav = useNavigate()
  return <div style={{ textAlign: 'center', padding: '8px 0' }}><div style={{ fontSize: 44 }}>⏰</div><h3 style={{ marginTop: 8 }}>Your seat hold expired</h3>
    <p className="mut" style={{ fontSize: 13, margin: '6px 0 18px' }}>Seats are released after 10 minutes so others can book them. Pick your seats again to continue.</p>
    <button className="btn btn-y" style={{ width: '100%', height: 46 }} onClick={() => { patch({ seats: [], holdUntil: null }); close(); nav('/book/seats') }}>Pick seats again</button></div>
}
export default function HoldTimer() {
  const until = useStore((s) => s.booking?.holdUntil), open = useUI((s) => s.openModal)
  const [left, setLeft] = useState(() => (until ? until - Date.now() : null))
  useEffect(() => {
    if (!until) return
    const t = () => { const l = until - Date.now(); setLeft(l); if (l <= 0) { clearInterval(id); open(<Expired />) } }
    const id = setInterval(t, 1000); t()
    return () => clearInterval(id)
  }, [until])
  if (!until || left == null) return null
  const l = Math.max(0, left), mm = Math.floor(l / 60000), ss = Math.floor((l % 60000) / 1000)
  return <div className={'hold' + (l < 120000 ? ' warn' : '')}><span>⏱</span> Seats held for <b>{String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}</b></div>
}
