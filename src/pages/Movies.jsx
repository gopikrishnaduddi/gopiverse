import { useRef, useState } from 'react'
import { MOVIES, LANGS } from '../data/movies'
import { useStore } from '../store/useStore'
import { MovieCard, Footer } from '../components/Cards'
import { useReveal } from '../components/useReveal'

export default function Movies() {
  const city = useStore((s) => s.city)
  const [lang, setLang] = useState('All'), [genre, setGenre] = useState('All')
  const root = useRef(); useReveal(root, [lang, genre])
  const gens = ['All', ...new Set(MOVIES.flatMap((m) => m.genres))]
  const f = MOVIES.filter((m) => (lang === 'All' || m.langs.includes(lang)) && (genre === 'All' || m.genres.includes(genre)))
  return <div ref={root}><div className="wrap page-top">
    <h1 className="page-h">Movies in {city}</h1><p className="page-sub">{f.length} movies · tap a poster to see showtimes</p>
    <div className="chips" style={{ marginTop: 20 }}>{['All', ...LANGS].map((l) => <button key={l} className={'chip' + (l === lang ? ' on' : '')} onClick={() => setLang(l)}>{l === 'All' ? 'All languages' : l}</button>)}</div>
    <div className="chips" style={{ margin: '10px 0 28px' }}>{gens.map((g) => <button key={g} className={'chip' + (g === genre ? ' on' : '')} onClick={() => setGenre(g)}>{g === 'All' ? 'All genres' : g}</button>)}</div>
    <h4 className="h" style={{ marginTop: 0 }}>Now showing</h4>
    <div className="grid reveal">{f.filter((m) => m.status === 'now').map((m) => <MovieCard key={m.id} m={m} />)}</div>
    {!f.length && <p className="mut">Nothing matches these filters.</p>}
    {f.some((m) => m.status === 'prebook') && <><h4 className="h" style={{ marginTop: 44 }}>Coming soon · Pre-book</h4><div className="grid reveal">{f.filter((m) => m.status === 'prebook').map((m) => <MovieCard key={m.id} m={m} />)}</div></>}
  </div><Footer /></div>
}
