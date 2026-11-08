/*
  Trailer player: plays public/assets/trailers/<id>.mp4 when it exists,
  otherwise an animated canvas built from the movie's fallback art.
*/
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { useTrailer, useBackdrop } from '../lib/media'
import { drawArt } from '../lib/posterArt'

const Trailer = forwardRef(function Trailer({ m }, ref) {
  const url = useTrailer(m), poster = useBackdrop(m)
  const vid = useRef(), cvs = useRef()
  useImperativeHandle(ref, () => ({ hasVideo: !!url, setMuted: (v) => { if (vid.current) { vid.current.muted = v; if (!v) vid.current.play().catch(() => {}) } } }), [url])
  useEffect(() => {
    if (url) return
    const c = cvs.current, ctx = c.getContext('2d'); let raf, last = 0; const t0 = performance.now()
    const size = () => { const r = Math.min(1, 960 / (c.clientWidth || 960)); c.width = Math.round((c.clientWidth || 960) * r); c.height = Math.round((c.clientHeight || 540) * r) }
    size(); addEventListener('resize', size)
    const f = (now) => {
      raf = requestAnimationFrame(f); if (now - last < 40) return; last = now
      const t = (now - t0) / 1000, w = c.width, h = c.height
      ctx.save(); const z = 1.06 + Math.sin(t * 0.12) * 0.04; ctx.translate(w / 2 + Math.sin(t * 0.07) * w * 0.02, h / 2); ctx.scale(z, z); ctx.translate(-w / 2, -h / 2); drawArt(ctx, m, w, h, t); ctx.restore()
      ctx.fillStyle = `rgba(255,240,220,${0.03 + Math.random() * 0.03})`; ctx.fillRect(0, 0, w, h)
    }
    raf = requestAnimationFrame(f)
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', size) }
  }, [url, m.id])
  return url
    ? <video ref={vid} className="trailer" src={url} poster={poster} autoPlay muted loop playsInline />
    : <canvas ref={cvs} className="trailer" />
})
export default Trailer
