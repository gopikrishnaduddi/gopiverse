// Hall geometry (metres). Screen at the front (−z), balcony at the back (+z).
// Rows are CURVED: every row is an arc around a point behind the screen (CZ), so all seats face the screen.
import { CLS } from '../../data/seatClasses'
import { rng, hashStr } from '../../lib/posterArt'

export const SCREEN = { w: 17, h: 7.2, y: 5.4, z: -15, curve: 30 } // curve = radius of the curved screen
export const PITCH = 0.62
export const SWEET_RI = 6        // row G = sweet spot
export const CZ = -40            // centre of the row curve (bigger number = flatter rows)
export const WALL = 11.95        // inner face of the side walls
export const BACK = 15.05        // inner face of the back wall
export const PARAPET_R = 7.45 - CZ

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
    r.seatIdx = []
    r.label = onArc(u - 0.75, r.rad, r.y + 1.05)
    r.blocks.forEach((n, bi) => {
      const blk = []
      for (let k = 0; k < n; k++) {
        const p = onArc(u + r.pitch * (k + 0.5), r.rad, r.y)
        seats.push({ id: r.letter + num, label: r.letter + num, row: r.letter, ri: r.ri, cls: r.cls, price: CLS[r.cls].price, block: bi, k, ...p,
          pair: r.cls === 'royal' ? (k % 2 === 0 ? r.letter + (num + 1) : r.letter + (num - 1)) : null })
        blk.push(seats.length - 1); num++
      }
      // armrests between seats (recliners: one per couple pair)
      for (let k = 0; k <= n; k++) if (r.cls !== 'royal' || k % 2 === 0) arms.push({ ...onArc(u + r.pitch * k, r.rad, r.y), royal: r.cls === 'royal' })
      r.seatIdx.push(blk); u += widths[bi] + aisle
    })
  })
  const byId = {}; seats.forEach((s, i) => (byId[s.id] = i))
  return { rows, seats, arms, byId }
}
export const LAYOUT = buildLayout()

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
  const r = rng(hashStr(key)), sold = new Set(), rate = fill * 0.78
  LAYOUT.seats.forEach((s) => {
    if (sold.has(s.id)) return
    const bias = (s.cls === 'prime' ? 1.15 : s.cls === 'royal' ? 1.1 : s.cls === 'classic' ? 0.6 : 0.85) * (1 - Math.abs(s.x) / 14)
    if (r() < rate * bias) { sold.add(s.id); if (s.pair) sold.add(s.pair) }
  })
  extra.forEach((id) => sold.add(id))
  return sold
}

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