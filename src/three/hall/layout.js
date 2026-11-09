// Hall geometry (metres). Screen at the front (−z), balcony at the back (+z).
// Rows are CURVED: every row is an arc around a point behind the screen (CZ), so all seats face the screen.
import { CLS, SEAT_CLASSES } from '../../data/seatClasses'
import { rng, hashStr } from '../../lib/posterArt'

export const SCREEN = { w: 17, h: 7.2, y: 5.4, z: -15, curve: 30 } // curve = radius of the curved screen
export const PITCH = 0.62
export const SWEET_RI = 6        // row G = sweet spot
export const CZ = -40            // centre of the row curve (bigger number = flatter rows)
export const WALL = 11.95        // inner face of the side walls
export const BACK = 15.05        // inner face of the back wall
export const PARAPET_R = 7.45 - CZ
export const DOORS_Z = [-11, 13.4] // side-wall doors (front exits, balcony exits)

// Real upholstery colours used in 3D (and as swatches in the seat panel)
export const UPHOLSTERY = { classic: '#2c3e7a', prime: '#8a2131', royal: '#8f5a2a', balcony: '#55367a' }

// position on a row arc: u = distance along the row from the centre line, rad = row radius
export const onArc = (u, rad, y = 0) => { const a = u / rad; return { x: rad * Math.sin(a), y, z: CZ + rad * Math.cos(a), rot: a } }
// "equivalent z" of any floor point (which row ring it is in)
export const ringZ = (x, z) => CZ + Math.hypot(x, z - CZ)

export function buildLayout() {
  const rows = [], L = 'ABCDEFGHIJKLMNOP'
  let z = -9
  const add = (ri, cls, blocks, pitch, y, zz) => rows.push({ letter: L[ri], ri, cls, blocks, pitch, y, z: zz, rad: zz - CZ })
  for (let i = 0; i < 3; i++) { add(i, 'classic', [6, 14, 6], PITCH, 0, z); z += 1.15 }
  for (let i = 3; i < 10; i++) { add(i, 'prime', [6, 14, 6], PITCH, (i - 2) * 0.32, z); z += 1.15 }
  z += 0.45
  for (let i = 10; i < 12; i++) { add(i, 'royal', [4, 8, 4], 0.95, (i - 2) * 0.32, z); z += 1.6 }
  let bz = 8.6
  for (let i = 12; i < 16; i++) { add(i, 'balcony', [8, 14, 8], PITCH, 4.6 + (i - 12) * 0.42, bz); bz += 1.2 }

  const seats = [], arms = []
  rows.forEach((r) => {
    const aisle = 1.3, widths = r.blocks.map((n) => n * r.pitch), tot = widths.reduce((a, b) => a + b, 0) + aisle * (r.blocks.length - 1)
    let u = -tot / 2, num = 1
    r.seatIdx = []; r.blockU = []
    r.label = onArc(u - 0.75, r.rad, r.y + 1.05)
    r.blocks.forEach((n, bi) => {
      const blk = []
      for (let k = 0; k < n; k++) {
        const p = onArc(u + r.pitch * (k + 0.5), r.rad, r.y)
        seats.push({ id: r.letter + num, label: r.letter + num, row: r.letter, ri: r.ri, cls: r.cls, price: CLS[r.cls].price, block: bi, k, ...p,
          pair: r.cls === 'royal' ? (k % 2 === 0 ? r.letter + (num + 1) : r.letter + (num - 1)) : null })
        blk.push(seats.length - 1); num++
      }
      // armrests / consoles between seats. Recliners: full console at the outside of each couple pair, slim armrest in the middle
      for (let k = 0; k <= n; k++) {
        const royal = r.cls === 'royal'
        arms.push({ ...onArc(u + r.pitch * k, r.rad, r.y), royal, slim: royal && k % 2 === 1, edge: k === 0 ? -1 : k === n ? 1 : 0, ri: r.ri })
      }
      r.blockU.push([u, u + widths[bi]])
      r.seatIdx.push(blk); u += widths[bi] + aisle
    })
  })
  const byId = {}; seats.forEach((s, i) => (byId[s.id] = i))
  return { rows, seats, arms, byId }
}
export const LAYOUT = buildLayout()
export const seatById = (id) => LAYOUT.seats[LAYOUT.byId[id]]

// floor height under any point (used to keep the camera above the seats/balcony)
export function floorAt(x, z) {
  const q = ringZ(x, z)
  let y = 0
  if (q > PARAPET_R + CZ - 0.2) { y = 4.6; LAYOUT.rows.forEach((r) => { if (r.cls === 'balcony' && q > r.z - 0.6) y = r.y }); return y }
  LAYOUT.rows.forEach((r) => { if (r.cls !== 'balcony' && q > r.z - 0.6) y = r.y })
  return y
}

// demo occupancy: seeded by show, fuller in the evening
export function soldSeats(key, fill, extra = []) {
  const r = rng(hashStr(key)), sold = new Set(), rate = fill * 0.92
  LAYOUT.seats.forEach((s) => {
    if (sold.has(s.id)) return
    const bias = (s.cls === 'prime' ? 1.15 : s.cls === 'royal' ? 1.1 : s.cls === 'classic' ? 0.6 : 0.85) * (1 - Math.abs(s.x) / 14)
    if (r() < rate * bias) { sold.add(s.id); if (s.pair) sold.add(s.pair) }
  })
  extra.forEach((id) => sold.add(id))
  return sold
}

// seats left per class for a show → { royal: { total, left, pct }, ... }
export function classAvailability(sold) {
  return Object.fromEntries(SEAT_CLASSES.map((c) => {
    const all = LAYOUT.seats.filter((s) => s.cls === c.k), left = all.filter((s) => !sold.has(s.id)).length
    return [c.k, { total: all.length, left, pct: left / all.length }]
  }))
}
export const availLabel = (pct) => (pct <= 0 ? 'Sold out' : pct < 0.15 ? 'Almost full' : pct < 0.4 ? 'Filling fast' : 'Available')

/*  BEST SEATS
    for each row (optionally only one class), for each window of `q` side-by-side seats:
      skip if any seat is sold, if it crosses an aisle (windows stay inside a block),
      or if it would split a couple recliner.
      score = distance from centre * 1.2 + distance from the sweet-spot row (balcony weighted lower)
    return the lowest-scoring window                                                      */
export function bestSeats(q, cls, sold) {
  let best = null, bestScore = Infinity
  LAYOUT.rows.forEach((r) => {
    if (cls && r.cls !== cls) return
    r.seatIdx.forEach((blk) => {
      for (let s = 0; s + q <= blk.length; s++) {
        const win = blk.slice(s, s + q).map((i) => LAYOUT.seats[i])
        if (win.some((x) => sold.has(x.id))) continue
        if (r.cls === 'royal' && (s % 2 || q % 2)) continue
        const cx = win.reduce((a, x) => a + x.x, 0) / q
        let score = (Math.abs(cx) / PITCH) * 1.2 * 0.35
        if (r.cls === 'balcony') score += Math.abs(r.ri - 13.5) * 0.8 + 1.6
        else score += Math.abs(r.ri - SWEET_RI) * (r.ri < SWEET_RI ? 1.25 : 1)
        if (score < bestScore) { bestScore = score; best = win }
      }
    })
  })
  return best
}

/*  CLICK-TO-FILL (like BookMyShow): tapping one seat picks `n` side-by-side seats starting there.
    Prefers seats to the right, then shifts left so the tapped seat is always included.
    Recliners are filled in couple pairs.                                                    */
export function pickBlock(seat, n, sold, taken = new Set()) {
  const r = LAYOUT.rows.find((x) => x.letter === seat.row)
  const blk = r.seatIdx[seat.block].map((i) => LAYOUT.seats[i])
  const k = blk.findIndex((x) => x.id === seat.id)
  const free = (x) => x && !sold.has(x.id) && !taken.has(x.id)
  const royal = r.cls === 'royal', step = royal ? 2 : 1
  if (royal) n = Math.max(2, n + (n % 2))
  const k0 = royal ? k - (k % 2) : k
  for (let st = k0; st > k0 - n; st -= step) {
    if (st < 0 || st + n > blk.length) continue
    const win = blk.slice(st, st + n)
    if (win.every(free)) return win
  }
  // not enough together: take what is free to the right of the tapped seat
  const out = []
  for (let i = k0; i < blk.length && out.length < n; i++) { if (!free(blk[i])) break; out.push(blk[i]) }
  return out.length ? out : [seat]
}

/*  VIEW QUALITY for a seat: distance, how much of your view the screen fills, side angle → stars + label */
export function viewQuality(s) {
  const ey = s.y + 1.15, dx = s.x, dz = s.z - SCREEN.z, flat = Math.hypot(dx, dz)
  const dist = Math.hypot(flat, SCREEN.y - ey)
  const fill = (2 * Math.atan(SCREEN.w / 2 / flat) * 180) / Math.PI      // degrees of your view the screen covers
  const side = (Math.abs(Math.atan2(dx, dz)) * 180) / Math.PI
  const up = (Math.atan2(SCREEN.y - ey, flat) * 180) / Math.PI
  let score = 5
  if (fill > 90) score -= 2; else if (fill > 72) score -= 1
  if (fill < 36) score -= 1; else if (fill < 44) score -= 0.5
  if (side > 16) score -= 1.5; else if (side > 9) score -= 0.5
  if (up > 16) score -= 0.5
  score = Math.max(1, Math.round(score * 2) / 2)
  const tags = []
  if (s.cls !== 'balcony' && Math.abs(s.ri - SWEET_RI) <= 2 && side < 9) tags.push('Sweet spot')
  if (fill > 72) tags.push('Close to screen')
  if (s.cls === 'balcony') tags.push('Elevated view')
  if (side > 12) tags.push('Side angle')
  if (s.cls === 'royal') tags.push('Recliner')
  const label = score >= 4.5 ? 'Perfect view' : score >= 4 ? 'Great view' : score >= 3 ? 'Good view' : 'Okay view'
  return { dist, fill, side, score, label, tags }
}
