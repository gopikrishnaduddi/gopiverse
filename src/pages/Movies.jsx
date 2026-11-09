import { useRef, useState } from 'react'
import { MOVIES, LANGS } from '../data/movies'
import { useStore } from '../store/useStore'
import { MovieCard, Footer } from '../components/Cards'
import { useReveal } from '../components/useReveal'

const votes = (v) => parseFloat(v) * (/M/i.test(v) ? 1e6 : /K/i.test(v) ? 1e3 : 1)
const SORTS = [['pop', 'Popular', (a, b) => votes(b.votes) - votes(a.votes)], ['rating', 'Top rated', (a, b) => b.rating - a.rating], ['az', 'A – Z', (a, b) => a.title.localeCompare(b.title)]]
export default function Movies() {
  const city = useStore((s) => s.city), interested = useStore((s) => s.interested)
  const [lang, setLang] = useState('All'), [genre, setGenre] = useState('All'), [sort, setSort] = useState('pop')
  const root = useRef(); useReveal(root, [lang, genre, sort])
  const gens = ['All', ...new Set(MOVIES.flatMap((m) => m.genres))]
  const f = MOVIES.filter((m) => (lang === 'All' || m.langs.includes(lang)) && (genre === 'All' || m.genres.includes(genre))).sort(SORTS.find((s) => s[0] === sort)[2])
  const now = f.filter((m) => m.status === 'now'), soon = f.filter((m) => m.status === 'prebook')
  return <div ref={root}><div className="wrap page-top">
    <h1 className="page-h">Movies in {city}</h1><p className="page-sub">{now.length} now showing · {soon.length} coming soon{interested.length ? ` · ♥ ${interested.length} on your list` : ''}</p>
    <div className="chips" style={{ marginTop: 20 }}>{['All', ...LANGS].map((l) => <button key={l} className={'chip' + (l === lang ? ' on' : '')} onClick={() => setLang(l)}>{l === 'All' ? 'All languages' : l}</button>)}</div>
    <div className="chips" style={{ margin: '10px 0 18px' }}>{gens.map((g) => <button key={g} className={'chip' + (g === genre ? ' on' : '')} onClick={() => setGenre(g)}>{g === 'All' ? 'All genres' : g}</button>)}</div>
    <div className="sortbar"><h4 className="h" style={{ margin: 0 }}>Now showing</h4>
      <div className="seg" role="group" aria-label="Sort movies">{SORTS.map(([k, n]) => <button key={k} className={k === sort ? 'on' : ''} onClick={() => setSort(k)}>{n}</button>)}</div></div>
    <div className="grid reveal">{now.map((m) => <MovieCard key={m.id} m={m} />)}</div>
    {!f.length && <div className="st-empty"><b>Nothing matches these filters</b><p className="mut">Try another language or genre.</p><button className="btn btn-ghost" onClick={() => { setLang('All'); setGenre('All') }}>Clear filters</button></div>}
    {soon.length > 0 && <><h4 className="h" style={{ marginTop: 44 }}>Coming soon · Pre-book</h4><div className="grid reveal">{soon.map((m) => <MovieCard key={m.id} m={m} />)}</div></>}
  </div><Footer /></div>
}
