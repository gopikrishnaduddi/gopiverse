import { useRef } from 'react'
import { EVENTS } from '../data/events'
import { useStore } from '../store/useStore'
import { EventCard, Footer } from '../components/Cards'
import { useReveal } from '../components/useReveal'

const T = { events: ['Events', 'Concerts, comedy, festivals and more'], plays: ['Plays', 'Theatre, dance and live performance'], sports: ['Sports', 'Matchdays and races near you'] }
export default function Events({ kind }) {
  const city = useStore((s) => s.city), root = useRef(); useReveal(root, [kind])
  return <div ref={root}><div className="wrap page-top"><h1 className="page-h">{T[kind][0]} in {city}</h1><p className="page-sub">{T[kind][1]}</p>
    <div className="egrid reveal" style={{ marginTop: 28 }}>{EVENTS[kind].map((e) => <EventCard key={e.id} e={e} />)}</div></div><Footer /></div>
}
