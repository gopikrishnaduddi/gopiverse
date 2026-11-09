/*
  MEDIA LOADER
  Real files are read from /public/assets (see README.md):
    posters/<movieId>.jpg     2:3 portrait poster       (e.g. posters/jailer2.jpg)
    backdrops/<movieId>.jpg   16:9 wide still            (e.g. backdrops/jailer2.jpg)
    trailers/<movieId>.mp4    trailer video (H.264 MP4)  (e.g. trailers/jailer2.mp4)
    snacks/<snackId>.jpg      food photo                 (e.g. snacks/p1.jpg)
    events/<eventId>.jpg      event banner               (e.g. events/improv-jam.jpg)
    cities/<city>.png         city icon (square, transparent) (e.g. cities/chennai.png)
    cast/<person-name>.jpg    square face photo          (e.g. cast/yash.jpg, cast/geetu-mohandas.jpg)
    payments/<method>.png     payment logo               (upi.png, card.png, netbanking.png, wallet.png)
  .jpg, .jpeg, .webp and .png all work. If nothing is found, generated art is used.
*/
import { useEffect, useState } from 'react'
import { makePoster, makeBackdrop, makeEventArt } from './posterArt'

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
export const asset = (p) => `${BASE}/assets/${p}`
const EXT = ['jpg', 'jpeg', 'webp', 'png']
const found = new Map()   // base -> url | null
const pending = new Map()

export function probeImage(base) {
  if (found.has(base)) return Promise.resolve(found.get(base))
  if (pending.has(base)) return pending.get(base)
  const p = (async () => {
    for (const e of EXT) {
      const url = `${base}.${e}`
      const ok = await new Promise((r) => { const i = new Image(); i.onload = () => r(i.naturalWidth > 0); i.onerror = () => r(false); i.src = url })
      if (ok) { found.set(base, url); return url }
    }
    found.set(base, null); return null
  })()
  pending.set(base, p); return p
}
export function probeVideo(url) {
  if (found.has(url)) return Promise.resolve(found.get(url))
  if (pending.has(url)) return pending.get(url)
  const p = fetch(url, { method: 'HEAD' })
    .then((r) => (r.ok && (r.headers.get('content-type') || '').startsWith('video') ? url : null))
    .catch(() => null)
    .then((u) => { found.set(url, u); return u })
  pending.set(url, p); return p
}

function useProbed(base, fallback) {
  const [src, setSrc] = useState(() => found.get(base) || fallback())
  useEffect(() => {
    let live = true
    probeImage(base).then((u) => live && setSrc(u || fallback()))
    return () => { live = false }
  }, [base])
  return src
}
export const posterBase = (m) => m.poster ? m.poster.replace(/\.(jpe?g|png|webp)$/i, '') : asset(`posters/${m.id}`)
export const usePoster = (m) => useProbed(posterBase(m), () => makePoster(m))
export function useBackdrop(m) {
  const [src, setSrc] = useState(() => found.get(asset(`backdrops/${m.id}`)) || makeBackdrop(m))
  useEffect(() => {   // wide still → else your poster file → else generated art
    let live = true
    probeImage(asset(`backdrops/${m.id}`)).then((u) => u || probeImage(posterBase(m))).then((u) => live && setSrc(u || makeBackdrop(m)))
    return () => { live = false }
  }, [m.id])
  return src
}
export const useEventImg = (e) => useProbed(asset(`events/${e.id}`), () => makeEventArt(e))
// cast/<name>.jpg — 'Geetu Mohandas' → geetu-mohandas, 'S. S. Rajamouli' → s-s-rajamouli
export const castSlug = (name) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
export const useCastImg = (name) => useProbed(asset(`cast/${castSlug(name)}`), () => null)
// cities/<city>.png — 'Delhi NCR' → delhi-ncr.png (shown in the city picker; emoji until added)
export const useCityImg = (c) => useProbed(asset(`cities/${castSlug(c.n)}`), () => null)
export function usePayLogo(p) {
  const img = useProbed(asset(`payments/${p.id}`), () => null)
  return img || p.logo || null
}
export const useSnackImg = (s) => useProbed(asset(`snacks/${s.id}`), () => null)
export const trailerUrl = (m) => m.trailer || asset(`trailers/${m.id}.mp4`)
export function useTrailer(m) {
  const [url, setUrl] = useState(() => found.get(trailerUrl(m)) || null)
  useEffect(() => { let live = true; probeVideo(trailerUrl(m)).then((u) => live && setUrl(u)); return () => { live = false } }, [m.id])
  return url
}
