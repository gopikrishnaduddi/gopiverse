import { useEffect, useState } from 'react'
import { useUI } from '../store/useStore'

export function Modal() {
  const modal = useUI((s) => s.modal), close = useUI((s) => s.closeModal)
  useEffect(() => { const k = (e) => e.key === 'Escape' && close(); addEventListener('keydown', k); return () => removeEventListener('keydown', k) }, [])
  if (!modal) return null
  return <div className="modal on" onMouseDown={(e) => e.target === e.currentTarget && close()}><div className="mbox" data-lenis-prevent>{modal}</div></div>
}
export function Toast() {
  const { toastMsg, toastKey } = useUI()
  const [on, setOn] = useState(false)
  useEffect(() => { if (!toastKey) return; setOn(true); const t = setTimeout(() => setOn(false), 2400); return () => clearTimeout(t) }, [toastKey])
  return <div className={'toast' + (on ? ' on' : '')}>{toastMsg}</div>
}
export const CloseX = () => <button className="x" onClick={() => useUI.getState().closeModal()}>✕</button>
