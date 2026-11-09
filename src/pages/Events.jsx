import { useRef, useState } from 'react'
import { EVENTS } from '../data/events'
import { useStore } from '../store/useStore'
import { EventCard, Footer } from '../components/Cards'
import { useReveal } from '../components/useReveal'

const T = { events: ['Events', 'Concerts, comedy, festivals and more'], plays: ['Plays', 'Theatre, dance and live performance'], sports: ['Sports', 'Matchdays and races near you'] }
const SORTS = [['all', 'Recommended', null], ['low', 'Price: low to high', (a, b) => a.p - b.p], ['high', 'Price: high to low', (a, b) => b.p - a.p]]
const cat = (e) => e.g.split(' · ')[0]
export default function Events({ kind }) {
  const city = useStore((s) => s.city), root = useRef()
  const [g, setG] = useState('All'), [sort, setSort] = useState('all')
  useReveal(root, [kind, g, sort])
  const all = EVENTS[kind], cats = ['All', ...new Set(all.map(cat))]
  let list = all.filter((e) => g === 'All' || cat(e) === g); const s = SORTS.find((x) => x[0] === sort)[2]; if (s) list = [...list].sort(s)
  return <div ref={root}><div className="wrap page-top"><h1 className="page-h">{T[kind][0]} in {city}</h1><p className="page-sub">{T[kind][1]} · {all.length} happening soon</p>
    {cats.length > 2 && <div className="chips" style={{ marginTop: 20 }}>{cats.map((c) => <button key={c} className={'chip' + (c === g ? ' on' : '')} onClick={() => setG(c)}>{c === 'All' ? 'All' : c}</button>)}</div>}
    <div className="sortbar" style={{ marginTop: 16 }}><small>{list.length} result{list.length === 1 ? '' : 's'}</small>
      <div className="seg" role="group" aria-label="Sort">{SORTS.map(([k, n]) => <button key={k} className={k === sort ? 'on' : ''} onClick={() => setSort(k)}>{n}</button>)}</div></div>
    <div className="egrid reveal" key={kind + g + sort}>{list.map((e) => <EventCard key={e.id} e={e} />)}</div></div><Footer /></div>
}
