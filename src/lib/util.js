import { rng, hashStr } from './posterArt'
import { CITIES, TH_NAMES, AMEN } from '../data/cities'

export const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN')

export function dayInfo(i) {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i)
  const wd = d.toLocaleDateString('en-IN', { weekday: 'short' }), mon = d.toLocaleDateString('en-IN', { month: 'short' })
  return { d, dow: i === 0 ? 'TODAY' : wd.toUpperCase(), num: d.getDate(), mon,
    label: (i === 0 ? 'Today, ' : i === 1 ? 'Tomorrow, ' : wd + ', ') + d.getDate() + ' ' + mon }
}

// Demo showtimes: same input → same result (seeded random)
// lang changes the result too: each language has its own set of theatres and times
export function getShows(m, city, day, lang = m.lang) {
  const R = rng(hashStr(m.id + city + day + (lang === m.lang ? '' : lang))), c = CITIES.find((x) => x.n === city) || CITIES[0]
  const SL = ['09:15 AM', '10:40 AM', '11:30 AM', '12:45 PM', '02:10 PM', '03:30 PM', '04:50 PM', '06:30 PM', '07:20 PM', '09:00 PM', '10:15 PM', '11:00 PM']
  return TH_NAMES.map((n, i) => {
    if (R() < 0.15) return null
    const times = SL.filter(() => R() < 0.42).slice(0, 6); if (!times.length) times.push(SL[7])
    return {
      name: n + ', ' + c.areas[i % c.areas.length], short: n, area: c.areas[i % c.areas.length], dist: +(R() * 11 + 0.7).toFixed(1), amen: AMEN[i % AMEN.length],
      shows: times.map((t) => {
        const h = (+t.slice(0, 2) % 12) + (t.includes('PM') ? 12 : 0)
        const fill = Math.min(0.97, 0.25 + (h >= 18 ? 0.35 : h >= 14 ? 0.18 : 0) + R() * 0.35 + (day === 0 ? 0.1 : 0))
        const fmt = n.includes('IMAX') && R() < 0.6 ? 'IMAX' : n.includes('4DX') && R() < 0.6 ? '4DX' : R() < 0.3 ? 'Dolby Atmos' : '2D'
        return { t, fill, fmt }
      }),
    }
  }).filter(Boolean).sort((a, b) => a.dist - b.dist)
}
export const showKey = (b) => [b.movieId, b.city, b.day, b.theatre, b.time].join('|')