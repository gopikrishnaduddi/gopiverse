/*
  3D CINEMA HALL — React Three Fiber
  Realistic + futuristic auditorium:
  • curved rows, curved stepped floor with LED step lines, curved screen
  • upholstered seats (rounded cushion, tilted backrest, headrest, shell, armrests with lit cupholders)
  • velvet curtains, acoustic wall fins, surround speakers, EXIT doors with glowing signs
  • starlight ceiling, recessed downlights, LED cove lines, projector beam with floating dust
  • bloom glow on lights (HD mode, desktop)
  • screen plays public/assets/trailers/<id>.mp4 (falls back to animated art)
  • camera presets glide in a STRAIGHT line (GSAP) and are clamped inside the walls,
    under the ceiling and above the seats/balcony every frame
*/
import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
const merge = (list) => mergeGeometries(list.map((g) => (g.index ? g.toNonIndexed() : g)))
import gsap from 'gsap'
import { LAYOUT, SCREEN, CZ, WALL, BACK, PARAPET_R, floorAt, ringZ } from './layout'
import { CLS } from '../../data/seatClasses'
import { drawArt, mixHex, rng } from '../../lib/posterArt'
import { useTrailer } from '../../lib/media'
import { inr } from '../../lib/util'
import { drone } from '../../lib/audio'

const { seats, rows, arms, byId } = LAYOUT
const V = (a) => new THREE.Vector3(...a)
const glowColor = (hex, k) => new THREE.Color(hex).multiplyScalar(k)   // >1 = blooms

/* ---------- canvas textures ---------- */
function ctex(w, h, draw, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]) }
  return t
}
const letterTex = (txt) => ctex(64, 64, (x) => { x.fillStyle = 'rgba(255,255,255,.8)'; x.font = '600 34px Manrope, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 32, 34) })
function makeTextures() {
  const t = {
    letters: Object.fromEntries(rows.map((r) => [r.letter, letterTex(r.letter)])),
    // carpet: deep charcoal-burgundy with a subtle geometric weave (UVs are in metres → 1 tile per 2 m)
    carpet: ctex(256, 256, (x, w, h) => {
      x.fillStyle = '#2a1214'; x.fillRect(0, 0, w, h); const r = rng(4)
      for (let i = 0; i < 5000; i++) { x.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.22)' : 'rgba(255,120,110,.05)'; x.fillRect(r() * w, r() * h, 1.5, 1.5) }
      x.strokeStyle = 'rgba(255,150,120,.06)'; x.lineWidth = 2
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.beginPath(); x.moveTo(i * 32 + 16, j * 32 + 4); x.lineTo(i * 32 + 28, j * 32 + 16); x.lineTo(i * 32 + 16, j * 32 + 28); x.lineTo(i * 32 + 4, j * 32 + 16); x.closePath(); x.stroke() }
    }, [0.5, 0.5]),
    carpetBig: null,
    // acoustic wall fabric panels
    wall: ctex(512, 256, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1b0f12'); g.addColorStop(1, '#2a1216'); x.fillStyle = g; x.fillRect(0, 0, w, h)
      const r = rng(8); for (let i = 0; i < 9000; i++) { x.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.25)' : 'rgba(255,255,255,.025)'; x.fillRect(r() * w, r() * h, 1, 1) }
      x.fillStyle = 'rgba(0,0,0,.55)'; for (let i = 0; i <= 4; i++) x.fillRect(i * 128 - 2, 0, 4, h); x.fillRect(0, h / 2 - 2, w, 4)
    }, [8, 3]),
    // seat fabric (light grey so the per-seat colour tints it)
    fabric: ctex(128, 128, (x, w, h) => {
      x.fillStyle = '#e9e9e9'; x.fillRect(0, 0, w, h); const r = rng(2)
      for (let i = 0; i < 2600; i++) { x.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.08)'; x.fillRect(r() * w, r() * h, 1, 1) }
      x.strokeStyle = 'rgba(0,0,0,.06)'; for (let i = 0; i < w; i += 4) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke() }
    }, [6, 6]),
    grille: ctex(64, 64, (x, w, h) => { x.fillStyle = '#0d0d10'; x.fillRect(0, 0, w, h); x.fillStyle = '#26262c'; for (let i = 2; i < w; i += 5) for (let j = 2; j < h; j += 5) { x.beginPath(); x.arc(i, j, 1.2, 0, 7); x.fill() } }),
    exit: ctex(256, 96, (x, w, h) => { x.fillStyle = '#021a0c'; x.fillRect(0, 0, w, h); x.fillStyle = '#3dff8f'; x.font = '800 54px Manrope, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('EXIT', 110, 50); x.beginPath(); x.moveTo(185, 30); x.lineTo(215, 48); x.lineTo(185, 66); x.fill(); x.fillRect(165, 44, 26, 8) }),
    beamFade: (() => { const t = ctex(4, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#000'); g.addColorStop(0.3, '#555'); g.addColorStop(0.65, '#fff'); g.addColorStop(1, '#000'); x.fillStyle = g; x.fillRect(0, 0, w, h) }); t.colorSpace = THREE.NoColorSpace; return t })(),
    marker: ctex(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(62,245,230,1)'); g.addColorStop(0.45, 'rgba(62,245,230,.9)'); g.addColorStop(0.5, 'rgba(62,245,230,.35)'); g.addColorStop(1, 'rgba(62,245,230,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); x.strokeStyle = '#05201e'; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(21, 33); x.lineTo(29, 41); x.lineTo(44, 24); x.stroke() }),
    spill: ctex(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128) }),
  }
  t.carpetBig = t.carpet.clone(); t.carpetBig.repeat.set(12, 16); t.carpetBig.needsUpdate = true
  return t
}

/* ---------- curved shapes (rings around CZ, clipped by the side walls) ---------- */
const arcHalf = (rad) => Math.asin(Math.min(1, WALL / rad))
function arcPoints(rad, y, n = 64) { const t = arcHalf(rad), p = []; for (let i = 0; i <= n; i++) { const a = -t + (2 * t * i) / n; p.push(new THREE.Vector3(rad * Math.sin(a), y, CZ + rad * Math.cos(a))) } return p }
// shape in (x, -z) so that rotateX(-PI/2) lays it on the floor; rOut = null → runs to the back wall, zLine → closes on a straight line
function ringShape(rIn, rOut, zLine) {
  const s = new THREE.Shape(), tIn = arcHalf(rIn), n = 64
  for (let i = 0; i <= n; i++) { const a = -tIn + (2 * tIn * i) / n; const x = rIn * Math.sin(a), z = CZ + rIn * Math.cos(a); i ? s.lineTo(x, -z) : s.moveTo(x, -z) }
  if (rOut) { const tO = arcHalf(rOut); for (let i = n; i >= 0; i--) { const a = -tO + (2 * tO * i) / n; s.lineTo(rOut * Math.sin(a), -(CZ + rOut * Math.cos(a))) } }
  else { const zz = zLine ?? BACK; s.lineTo(WALL, -zz); s.lineTo(-WALL, -zz) }
  s.closePath(); return s
}
function slabGeo(rIn, rOut, y0, h, zLine) { const g = new THREE.ExtrudeGeometry(ringShape(rIn, rOut, zLine), { depth: h, bevelEnabled: false, curveSegments: 1 }); g.rotateX(-Math.PI / 2); g.translate(0, y0, 0); return g }
const tubeGeo = (rad, y, r = 0.016) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arcPoints(rad, y, 48)), 120, r, 6, false)

/* ---------- room ---------- */
function Box({ args, position, rotation, children, ...p }) { return <mesh position={position} rotation={rotation} {...p}><boxGeometry args={args} />{children}</mesh> }
const Glow = ({ color, k = 1 }) => <meshBasicMaterial color={glowColor(color, k)} toneMapped={false} />

function Floor({ tex }) {
  const geos = useMemo(() => {
    const main = rows.filter((r) => r.cls !== 'balcony'), balc = rows.filter((r) => r.cls === 'balcony'), out = { risers: [], strips: [] }
    main.forEach((r, i) => {
      if (r.y <= 0) return
      const next = main[i + 1]
      out.risers.push(slabGeo(r.rad - 0.55, next ? next.rad - 0.55 : null, 0, r.y))
      out.strips.push(tubeGeo(r.rad - 0.56, r.y + 0.004, 0.012))
    })
    out.balcony = slabGeo(PARAPET_R, null, 4.1, 0.5)
    balc.forEach((r, i) => {
      const h = r.y - 4.6, next = balc[i + 1]
      if (h > 0.01) { out.risers.push(slabGeo(r.rad - 0.55, next ? next.rad - 0.55 : null, 4.6, h)); out.strips.push(tubeGeo(r.rad - 0.56, r.y + 0.004, 0.012)) }
    })
    out.parapet = slabGeo(PARAPET_R - 0.14, PARAPET_R, 4.1, 0.55)           // solid fascia
    out.glass = slabGeo(PARAPET_R - 0.1, PARAPET_R - 0.06, 4.65, 0.75)      // glass balustrade
    out.rail = tubeGeo(PARAPET_R - 0.08, 5.42, 0.03)
    out.under = tubeGeo(PARAPET_R + 0.01, 4.12, 0.02)
    out.stage = slabGeo(27.5, null, 0, 1, -15.5)
    out.stageLed = tubeGeo(27.48, 1.0, 0.025)
    return out
  }, [])
  const carpet = <meshStandardMaterial map={tex.carpet} roughness={0.95} />
  return <group>
    <Box args={[24, 0.2, 32]} position={[0, -0.1, -0.5]}><meshStandardMaterial map={tex.carpetBig} roughness={0.95} /></Box>
    {geos.risers.map((g, i) => <mesh key={i} geometry={g}>{carpet}</mesh>)}
    {geos.strips.map((g, i) => <mesh key={i} geometry={g}><Glow color="#ff9a2e" k={1.7} /></mesh>)}
    <mesh geometry={geos.balcony}><meshStandardMaterial color="#120c0e" roughness={0.8} /></mesh>
    <mesh geometry={geos.parapet}><meshStandardMaterial color="#1a1013" roughness={0.5} metalness={0.4} /></mesh>
    <mesh geometry={geos.glass}><meshStandardMaterial color="#9fb7ff" transparent opacity={0.16} roughness={0.05} metalness={0.2} depthWrite={false} /></mesh>
    <mesh geometry={geos.rail}><meshStandardMaterial color="#c9ccd3" metalness={0.9} roughness={0.25} /></mesh>
    <mesh geometry={geos.under}><Glow color="#9b6bff" k={2.4} /></mesh>
    <mesh geometry={geos.stage}><meshStandardMaterial color="#1c1012" roughness={0.6} /></mesh>
    <mesh geometry={geos.stageLed}><Glow color="#2ee6c5" k={2.6} /></mesh>
    {rows.map((r) => <sprite key={r.letter} position={[r.label.x, r.label.y, r.label.z]} scale={[0.5, 0.5, 1]}><spriteMaterial map={tex.letters[r.letter]} transparent depthWrite={false} /></sprite>)}
  </group>
}

function Walls({ tex, lightsOn }) {
  const fins = useMemo(() => { const f = []; for (let z = -13.2; z < 14.8; z += 1.75) if (Math.abs(z - 13.4) > 1.3 && Math.abs(z + 11) > 1.2) f.push(z); return f }, [])
  const finRef = useRef()
  useLayoutEffect(() => {
    const m = new THREE.Matrix4(); let i = 0
    ;[-1, 1].forEach((s) => fins.forEach((z) => { m.makeTranslation(s * (WALL - 0.08), 7.9, z); finRef.current.setMatrixAt(i++, m) }))
    finRef.current.instanceMatrix.needsUpdate = true
  }, [])
  const k = lightsOn ? 1 : 0.55
  return <group>
    {/* side + back walls (acoustic fabric) */}
    <Box args={[0.3, 13, 32]} position={[-12.1, 6.4, -0.5]}><meshStandardMaterial map={tex.wall} roughness={0.95} /></Box>
    <Box args={[0.3, 13, 32]} position={[12.1, 6.4, -0.5]}><meshStandardMaterial map={tex.wall} roughness={0.95} /></Box>
    <Box args={[24.5, 13, 0.3]} position={[0, 6.4, 15.2]}><meshStandardMaterial map={tex.wall} roughness={0.95} /></Box>
    <Box args={[24.5, 13, 0.3]} position={[0, 6.4, -15.75]}><meshStandardMaterial color="#060506" roughness={1} /></Box>
    {/* vertical acoustic fins */}
    <instancedMesh ref={finRef} args={[undefined, undefined, fins.length * 2]}><boxGeometry args={[0.16, 9.2, 0.22]} /><meshStandardMaterial color="#120a0c" roughness={0.55} metalness={0.35} /></instancedMesh>
    {/* LED lines along the side walls */}
    {[-1, 1].map((s) => <group key={s}>
      <Box args={[0.04, 0.04, 29]} position={[s * (WALL - 0.02), 3.25, -0.4]}><Glow color="#41d9ff" k={1.8 * k} /></Box>
      <Box args={[0.04, 0.04, 29]} position={[s * (WALL - 0.02), 12.35, -0.4]}><Glow color="#ffb860" k={2 * k} /></Box>
    </group>)}
    {/* surround speakers */}
    {[-1, 1].flatMap((s) => [-7, -1.5, 4, 10].map((z) => <group key={s + '' + z} position={[s * (WALL - 0.32), 9.6, z]} rotation={[0, s < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
      <Box args={[0.62, 0.95, 0.4]} position={[0, 0, 0]}><meshStandardMaterial color="#0c0c0f" roughness={0.4} metalness={0.5} /></Box>
      <mesh position={[0, 0, 0.205]}><planeGeometry args={[0.54, 0.86]} /><meshStandardMaterial map={tex.grille} roughness={0.9} /></mesh>
    </group>))}
    {/* projector booth window */}
    <Box args={[3.4, 1.1, 0.1]} position={[0, 10.2, BACK - 0.02]}><meshStandardMaterial color="#05070c" roughness={0.1} metalness={0.6} /></Box>
    <mesh position={[0, 10.2, BACK - 0.08]} rotation-y={Math.PI}><circleGeometry args={[0.12, 24]} /><Glow color="#dce8ff" k={4} /></mesh>
  </group>
}

function Ceiling({ tex, lightsOn }) {
  const stars = useMemo(() => {
    const r = rng(77), n = 900, p = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) { p[i * 3] = (r() - 0.5) * 23; p[i * 3 + 1] = 12.44; p[i * 3 + 2] = -15 + r() * 30 }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); return g
  }, [])
  const coves = useMemo(() => [30, 37, 44, 51].map((rad) => tubeGeo(rad, 12.38, 0.03)), [])
  const downs = useMemo(() => { const d = []; for (let i = 0; i < 6; i++) for (const x of [-8, -2.7, 2.7, 8]) d.push([x, 12.44, -12 + i * 5]); return d }, [])
  const starMat = useRef(), grp = useRef()
  useFrame(({ clock, camera }) => {
    if (starMat.current) starMat.current.opacity = 0.75 + Math.sin(clock.elapsedTime * 1.7) * 0.15
    if (grp.current) grp.current.visible = camera.position.y < 12.6   // hide ceiling details in bird's eye
  })
  return <group ref={grp}>
    <mesh rotation-x={Math.PI / 2} position={[0, 12.5, -0.5]}><planeGeometry args={[24.6, 32]} /><meshStandardMaterial color="#07060a" roughness={0.9} /></mesh>
    <points geometry={stars}><pointsMaterial ref={starMat} size={0.06} color={glowColor('#fff3dc', 2.4)} sizeAttenuation transparent depthWrite={false} toneMapped={false} /></points>
    {coves.map((g, i) => <mesh key={i} geometry={g}><Glow color="#56d6ff" k={lightsOn ? 1.6 : 0.9} /></mesh>)}
    {downs.map((p, i) => <group key={i} position={p}>
      <mesh rotation-x={Math.PI / 2}><ringGeometry args={[0.15, 0.2, 28]} /><meshStandardMaterial color="#2a2a30" metalness={0.8} roughness={0.3} side={THREE.DoubleSide} /></mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, -0.005, 0]}><circleGeometry args={[0.15, 28]} /><Glow color="#fff1d6" k={lightsOn ? 3 : 0.12} /></mesh>
    </group>)}
  </group>
}

/* doors: frame, two leaves with push bars, glowing EXIT sign and a green light spill on the floor */
function Door({ pos, rot, tex }) {
  return <group position={pos} rotation={[0, rot, 0]}>
    <Box args={[2.1, 2.7, 0.14]} position={[0, 1.35, 0.02]}><meshStandardMaterial color="#0d0d10" metalness={0.6} roughness={0.35} /></Box>
    {[-0.47, 0.47].map((x) => <group key={x}>
      <Box args={[0.9, 2.45, 0.06]} position={[x, 1.25, 0.1]}><meshStandardMaterial color="#26272d" metalness={0.45} roughness={0.4} /></Box>
      <Box args={[0.12, 1.1, 0.012]} position={[x + (x < 0 ? 0.28 : -0.28), 1.55, 0.135]}><meshStandardMaterial color="#0a0f18" metalness={0.9} roughness={0.05} /></Box>
      <mesh position={[x, 1.05, 0.17]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.022, 0.022, 0.7, 12]} /><meshStandardMaterial color="#b8bcc4" metalness={0.95} roughness={0.2} /></mesh>
    </group>)}
    <Box args={[2.1, 0.03, 0.03]} position={[0, 0.02, 0.16]}><Glow color="#3dff8f" k={1.6} /></Box>
    <mesh position={[0, 2.95, 0.12]}><planeGeometry args={[0.95, 0.36]} /><meshBasicMaterial map={tex.exit} color={glowColor('#ffffff', 1.8)} toneMapped={false} /></mesh>
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.015, 1]}><planeGeometry args={[2.8, 2]} /><meshBasicMaterial map={tex.spill} color="#2bff7a" transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></mesh>
  </group>
}
function Doors({ tex }) {
  const list = useMemo(() => {
    const L = []
    ;[-1, 1].forEach((s) => {
      L.push({ pos: [s * (WALL - 0.03), floorAt(s * 11.5, -11), -11], rot: s < 0 ? Math.PI / 2 : -Math.PI / 2 })
      L.push({ pos: [s * (WALL - 0.03), floorAt(s * 11.5, 13.4), 13.4], rot: s < 0 ? Math.PI / 2 : -Math.PI / 2 })
      L.push({ pos: [s * 8.5, floorAt(s * 8.5, BACK - 0.5), BACK - 0.03], rot: Math.PI })
    })
    return L
  }, [])
  return <>{list.map((d, i) => <Door key={i} {...d} tex={tex} />)}</>
}

/* velvet curtains with real folds */
function Curtains() {
  const geo = useMemo(() => {
    const mk = (w, h, folds, amp) => { const g = new THREE.PlaneGeometry(w, h, 90, 1), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, Math.sin((x / w) * Math.PI * 2 * folds) * amp) } g.computeVertexNormals(); return g }
    return { side: mk(3.5, 10.5, 7, 0.09), top: mk(24.4, 1.5, 34, 0.06) }
  }, [])
  const mat = <meshPhysicalMaterial color="#6f0b12" roughness={0.78} sheen={1} sheenColor="#ff5a6a" sheenRoughness={0.45} side={THREE.DoubleSide} />
  return <group>
    <mesh geometry={geo.side} position={[-10.3, 5.25, -14.5]}>{mat}</mesh>
    <mesh geometry={geo.side} position={[10.3, 5.25, -14.5]}>{mat}</mesh>
    <mesh geometry={geo.top} position={[0, 10.1, -14.45]}>{mat}</mesh>
  </group>
}

/* ---------- curved screen (trailer) + projector beam ---------- */
function Screen({ movie, lightsOn, sound, tex }) {
  const url = useTrailer(movie)
  const canvas = useMemo(() => { const c = document.createElement('canvas'); c.width = 640; c.height = 272; drawArt(c.getContext('2d'), movie, 640, 272, 0); return c }, [movie.id])
  const ctex2 = useMemo(() => { const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; return t }, [canvas])
  const video = useMemo(() => {
    if (!url) return null
    const v = document.createElement('video'); Object.assign(v, { src: url, muted: true, loop: true, playsInline: true, crossOrigin: 'anonymous' }); v.play().catch(() => {})
    const t = new THREE.VideoTexture(v); t.colorSpace = THREE.SRGBColorSpace; return { v, t }
  }, [url])
  useEffect(() => () => { if (video) { video.v.pause(); video.v.src = ''; video.t.dispose() } }, [video])
  // Sound button: unmute the trailer (or play the ambient drone when there is no trailer file)
  useEffect(() => {
    if (video) { video.v.muted = !sound; video.v.volume = 1; if (sound) video.v.play().catch(() => {}) }
    else sound ? drone.start() : drone.stop()
    return () => drone.stop()
  }, [sound, video])

  const geo = useMemo(() => {
    const R = SCREEN.curve, L = SCREEN.w / R
    const mk = (r, h, l) => { const g = new THREE.CylinderGeometry(r, r, h, 72, 1, true, Math.PI - l / 2, l); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i)); return g }
    // projector beam: cone from the booth to the screen, flattened to the screen's shape
    const from = V([0, 10.2, BACK - 0.1]), to = V([0, SCREEN.y, SCREEN.z + 0.3]), len = from.distanceTo(to)
    const cone = new THREE.ConeGeometry(SCREEN.w / 2, len, 48, 1, true); cone.translate(0, -len / 2, 0)
    const q = new THREE.Quaternion().setFromUnitVectors(V([0, -1, 0]), to.clone().sub(from).normalize())
    return { screen: mk(R, SCREEN.h, L), mask: mk(R + 0.08, SCREEN.h + 0.6, L * 1.04), cone, from, q, len }
  }, [])
  const dust = useMemo(() => {
    const r = rng(31), n = 420, p = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) { const t = r(), a = r() * Math.PI * 2, rr = Math.sqrt(r()) * t; p[i * 3] = Math.cos(a) * rr * SCREEN.w * 0.5; p[i * 3 + 1] = -t * geo.len; p[i * 3 + 2] = Math.sin(a) * rr * SCREEN.h * 0.5 }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); return g
  }, [])
  const light = useRef(), last = useRef(0), beam = useRef(), dustRef = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    light.current.intensity = (lightsOn ? 16 : 42) * (0.85 + Math.sin(t * 3.1) * 0.08 + Math.sin(t * 7.3) * 0.05)
    beam.current.opacity = (lightsOn ? 0.006 : 0.028) * (0.9 + Math.sin(t * 5.3) * 0.1)
    if (dustRef.current) dustRef.current.rotation.y = t * 0.02
    if (video || t - last.current < 0.05) return
    last.current = t; drawArt(canvas.getContext('2d'), movie, 640, 272, t); ctex2.needsUpdate = true
  })
  const z0 = SCREEN.z + SCREEN.curve
  return <>
    <mesh geometry={geo.mask} position={[0, SCREEN.y, z0 + 0.02]}><meshBasicMaterial color="#000" side={THREE.BackSide} /></mesh>
    <mesh geometry={geo.screen} position={[0, SCREEN.y, z0]}><meshBasicMaterial map={video ? video.t : ctex2} side={THREE.BackSide} toneMapped={false} /></mesh>
    <group position={geo.from} quaternion={geo.q} scale={[1, 1, SCREEN.h / SCREEN.w]}>
      <mesh geometry={geo.cone}><meshBasicMaterial ref={beam} color="#cfe0ff" alphaMap={tex.beamFade} transparent opacity={0.02} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} /></mesh>
    </group>
    <group position={geo.from} quaternion={geo.q}><points ref={dustRef} geometry={dust}><pointsMaterial size={0.025} color="#e8f0ff" transparent opacity={lightsOn ? 0.12 : 0.4} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></points></group>
    <pointLight ref={light} position={[0, SCREEN.y, SCREEN.z + 3.5]} color="#a9c2ff" distance={36} decay={1.4} />
  </>
}

/* ---------- seats ---------- */
function useSeatGeometry() {
  return useMemo(() => {
    const seg = typeof innerWidth !== 'undefined' && innerWidth < 900 ? 1 : 2   // lighter seats on phones
    const rb = (w, h, d, r, rx, x, y, z) => { const g = new RoundedBoxGeometry(w, h, d, seg, r); if (rx) g.rotateX(rx); g.translate(x, y, z); return g }
    const T = 0.2 // backrest tilt
    const uph = merge([
      rb(0.5, 0.14, 0.5, 0.06, 0, 0, 0.47, -0.03),     // cushion
      rb(0.5, 0.68, 0.14, 0.06, T, 0, 0.88, 0.25),      // backrest
      rb(0.4, 0.17, 0.11, 0.05, T, 0, 1.2, 0.28),       // headrest pillow
    ])
    const shell = merge([
      rb(0.54, 0.76, 0.06, 0.03, T, 0, 0.88, 0.335),    // back shell
      rb(0.52, 0.09, 0.5, 0.03, 0, 0, 0.36, -0.03),     // seat pan
      rb(0.16, 0.34, 0.26, 0.02, 0, 0, 0.17, 0.06),     // pedestal
    ])
    const cup = new THREE.TorusGeometry(0.042, 0.009, 5, 16); cup.rotateX(Math.PI / 2); cup.translate(0, 0.7, -0.2)
    const arm = merge([
      rb(0.09, 0.07, 0.58, 0.03, 0, 0, 0.66, 0.02),     // armrest pad
      rb(0.05, 0.62, 0.46, 0.02, 0, 0, 0.31, 0.07),     // side panel
      cup,                                              // cupholder rim
    ])
    const led = new THREE.TorusGeometry(0.034, 0.005, 4, 16); led.rotateX(Math.PI / 2); led.translate(0, 0.698, -0.2)
    return { uph, shell, arm, led }
  }, [])
}
function Seats({ sel, sold, filter, onToggle, tipRef, tex, lightsOn }) {
  const uph = useRef(), shell = useRef(), arm = useRef(), led = useRef(), hover = useRef(-1)
  const geo = useSeatGeometry()
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), c: new THREE.Color(), q: new THREE.Quaternion(), e: new THREE.Euler() }), [])
  const colorOf = (i) => {
    const s = seats[i]
    if (sel.includes(s.id)) return '#3ef5e6'
    if (sold.has(s.id)) return '#2a2527'
    let c = mixHex(CLS[s.cls].color, '#000000', 0.18)
    const h = hover.current
    if (h === i || (s.pair && h >= 0 && seats[h].id === s.pair)) c = mixHex(c, '#ffffff', 0.4)
    if (filter && s.cls !== filter) c = mixHex(c, '#0b0b0d', 0.75)
    return c
  }
  const paint = (idx) => {
    const list = idx ?? seats.map((_, i) => i)
    list.forEach((i) => { if (i < 0) return; tmp.c.set(colorOf(i)); uph.current.setColorAt(i, tmp.c) })
    uph.current.instanceColor.needsUpdate = true
  }
  useLayoutEffect(() => {
    const put = (mesh, list, scaleFn) => {
      list.forEach((s, i) => { tmp.q.setFromEuler(tmp.e.set(0, s.rot, 0)); tmp.m.compose(V([s.x, s.y, s.z]), tmp.q, V(scaleFn(s))); mesh.current.setMatrixAt(i, tmp.m) })
      mesh.current.instanceMatrix.needsUpdate = true; mesh.current.computeBoundingSphere()
    }
    const seatScale = (s) => (s.cls === 'royal' ? [1.5, 1.08, 1.32] : [1, 1, 1])
    put(uph, seats, seatScale); put(shell, seats, seatScale)
    put(arm, arms, (a) => (a.royal ? [1.3, 1.08, 1.3] : [1, 1, 1])); put(led, arms, (a) => (a.royal ? [1.3, 1.08, 1.3] : [1, 1, 1]))
  }, [])
  useLayoutEffect(() => paint(), [sel, sold, filter])
  const setHover = (i, e) => {
    const prev = hover.current
    if (i !== prev) { hover.current = i; const ids = [prev, i].flatMap((k) => (k >= 0 ? [k, byId[seats[k].pair] ?? -1] : [])); paint(ids) }
    const tip = tipRef.current; if (!tip) return
    if (i < 0) { tip.style.display = 'none'; document.body.style.cursor = ''; return }
    const s = seats[i], r = tip.parentElement.getBoundingClientRect()
    tip.style.display = 'block'; tip.style.left = e.clientX - r.left + 'px'; tip.style.top = e.clientY - r.top + 'px'
    document.body.style.cursor = sold.has(s.id) ? 'not-allowed' : 'pointer'
    tip.innerHTML = sold.has(s.id) ? `<b>${s.label}</b> · Booked` : `<b>${s.label}</b> · ${CLS[s.cls].name} · ${inr(s.price)}${s.pair ? ' · pair' : ''}`
  }
  const ev = {
    onPointerMove: (e) => { e.stopPropagation(); if (e.nativeEvent.pointerType === 'mouse') setHover(e.instanceId, e.nativeEvent) },
    onPointerOut: (e) => setHover(-1, e.nativeEvent),
    onClick: (e) => { e.stopPropagation(); if (e.delta < 7) onToggle(seats[e.instanceId].id) },
  }
  const fabric = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#ffffff', map: tex.fabric, roughness: 0.82, sheen: 0.7, sheenRoughness: 0.55, sheenColor: new THREE.Color('#9a9a9a') }), [])
  return <>
    <instancedMesh ref={uph} args={[geo.uph, fabric, seats.length]} {...ev} />
    <instancedMesh ref={shell} args={[geo.shell, undefined, seats.length]} raycast={() => null}><meshStandardMaterial color="#141418" roughness={0.45} metalness={0.35} /></instancedMesh>
    <instancedMesh ref={arm} args={[geo.arm, undefined, arms.length]} raycast={() => null}><meshStandardMaterial color="#1b1b20" roughness={0.4} metalness={0.45} /></instancedMesh>
    <instancedMesh ref={led} args={[geo.led, undefined, arms.length]} raycast={() => null}><meshBasicMaterial color={glowColor('#4fd8ff', lightsOn ? 1.2 : 2.2)} toneMapped={false} /></instancedMesh>
  </>
}
function Markers({ sel, tex }) {
  const g = useRef()
  // markers bob above picked seats; hidden when the camera is right next to them (view from your seat)
  useFrame(({ clock, camera }) => g.current?.children.forEach((c, k) => { c.position.y = c.userData.y + Math.sin(clock.elapsedTime * 3.3 + k) * 0.08; c.visible = camera.position.distanceTo(c.position) > 3.2 }))
  return <group ref={g}>{sel.map((id) => { const s = seats[byId[id]]; const y = s.y + (s.cls === 'royal' ? 1.85 : 1.65); return <sprite key={id} position={[s.x, y, s.z]} userData={{ y }} scale={[0.55, 0.55, 1]} renderOrder={10}><spriteMaterial map={tex.marker} transparent depthTest={false} /></sprite> })}</group>
}

/* ---------- camera ---------- */
const PRESETS = [[[-10.4, 8.6, 7.5], [1.5, 1.8, -6]], [[0, 3.6, -11.8], [0, 2.6, 6]], [[0, 7.6, 13.6], [0, 4.8, -15]], [[0, 30, 1.2], [0, 0, 0]]]
const TOUR = [PRESETS[0], [[9.5, 4.2, -2], [-2, 2, -10]], [[0, 2.9, -11.8], [0, 3, 6]], [[-9, 3.2, -6], [4, 3, 8]], PRESETS[2]]
const CameraRig = forwardRef(function CameraRig({ onUserMove }, ref) {
  const { camera, gl } = useThree()
  const s = useMemo(() => ({ pos: V([-10, 12, 14]), tgt: V([0, 2, -6]), dPos: V(PRESETS[0][0]), dTgt: V(PRESETS[0][1]), bird: false, tw: null, tour: null }), [])
  const clamp = (v) => {
    v.x = Math.max(-11.2, Math.min(11.2, v.x)); v.z = Math.max(-12.2, Math.min(14.5, v.z))
    const fl = v.z < -11.7 ? 1.2 : floorAt(v.x, v.z)
    v.y = Math.max(fl + 1.0, Math.min(s.bird ? 32 : 11.8, v.y))
    const q = ringZ(v.x, v.z) - CZ
    if (q > PARAPET_R - 0.5 && q < PARAPET_R + 0.5 && v.y < 6.4) v.y = 6.4   // never inside the balcony front
    return v
  }
  const stopTour = () => { s.tour?.kill(); s.tour = null }
  // straight-line glide of camera + target (curved paths cut through walls)
  const glide = (p, t, dur = 1.6) => {
    s.tw?.kill(); const p0 = s.dPos.clone(), t0 = s.dTgt.clone(), p1 = V(p), t1 = V(t), o = { k: 0 }
    s.tw = gsap.to(o, { k: 1, duration: dur, ease: 'power2.inOut', onUpdate: () => { s.dPos.lerpVectors(p0, p1, o.k); s.dTgt.lerpVectors(t0, t1, o.k) } })
  }
  useImperativeHandle(ref, () => ({
    view(i) {
      stopTour(); s.bird = i === 3
      if (i === 4) { s.tour = gsap.timeline({ repeat: -1 }); TOUR.forEach(([p, t]) => s.tour.call(() => glide(p, t, 2.6)).to({}, { duration: 3.4 })); return }
      glide(...PRESETS[i])
    },
    focus(win) { stopTour(); s.bird = false; const m = win[Math.floor(win.length / 2)]; glide([m.x * 0.6, m.y + 3.2, m.z + 4.2], [m.x * 0.3, m.y + 0.4, m.z - 6]) },
    seatView(st) { stopTour(); s.bird = false; glide([st.x + Math.sin(st.rot) * 0.15, st.y + 1.2, st.z + Math.cos(st.rot) * 0.15], [st.x * 0.15, SCREEN.y, SCREEN.z], 1.8) },
  }))
  useEffect(() => {
    const el = gl.domElement, ptrs = new Map(); let pinch = 0
    const user = () => { stopTour(); s.tw?.kill(); onUserMove() }
    const orbit = (dx, dy) => {
      const off = s.dPos.clone().sub(s.dTgt), sph = new THREE.Spherical().setFromVector3(off)
      sph.theta -= dx * 0.006; sph.phi = Math.max(0.12, Math.min(1.62, sph.phi - dy * 0.005)); off.setFromSpherical(sph); s.dPos.copy(s.dTgt).add(off); clamp(s.dPos)
    }
    const zoom = (f) => { const off = s.dPos.clone().sub(s.dTgt); off.setLength(Math.max(2.5, Math.min(28, off.length() * f))); s.dPos.copy(s.dTgt).add(off); clamp(s.dPos) }
    const dist = () => { const p = [...ptrs.values()]; return p.length < 2 ? 0 : Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) }
    const down = (e) => { ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); pinch = dist() }
    const move = (e) => {
      const p = ptrs.get(e.pointerId); if (!p) return
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY
      if (Math.abs(dx) + Math.abs(dy) < 0.5) return
      user()
      if (ptrs.size === 2) { const d = dist(); if (pinch) zoom(pinch / d); pinch = d } else orbit(dx, dy)
    }
    const up = (e) => { ptrs.delete(e.pointerId); pinch = dist() }
    const wheel = (e) => { e.preventDefault(); user(); zoom(Math.exp(e.deltaY * 0.0012)) }
    el.addEventListener('pointerdown', down); addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up); el.addEventListener('wheel', wheel, { passive: false })
    return () => { el.removeEventListener('pointerdown', down); removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); el.removeEventListener('wheel', wheel); stopTour(); s.tw?.kill() }
  }, [])
  useFrame((st) => {
    s.pos.lerp(s.dPos, 0.12); s.tgt.lerp(s.dTgt, 0.12); clamp(s.pos)   // never through walls
    camera.position.copy(s.pos); camera.lookAt(s.tgt)
    const asp = st.size.width / st.size.height, fov = asp < 1 ? 68 : 55
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix() }
  })
  return null
})

/* soft reflections on leather, metal and glass */
function Env() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl), env = pm.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env; scene.environmentIntensity = 0.28
    return () => { scene.environment = null; env.dispose(); pm.dispose() }
  }, [])
  return null
}
function Lights({ lightsOn }) {
  const k = lightsOn ? 1 : 0.12
  return <>
    <ambientLight color="#ffe6d2" intensity={0.55 * k} />
    <hemisphereLight args={['#ffd9bd', '#1a0709', 0.9 * k]} />
    {[[-6, 11.8, -9], [6, 11.8, -9], [-6, 11.8, -1], [6, 11.8, -1], [-6, 11.8, 7], [6, 11.8, 7]].map((p, i) => <pointLight key={i} position={p} color="#ffdcb0" intensity={lightsOn ? 22 : 0} distance={20} decay={1.5} />)}
    <pointLight position={[0, 9, 12]} color="#ffd2a0" intensity={lightsOn ? 14 : 2} distance={14} decay={1.5} />
  </>
}

const Hall = forwardRef(function Hall({ movie, sel, sold, filter, onToggle, lightsOn, hd, sound, onUserMove, tipRef }, ref) {
  const tex = useMemo(makeTextures, [])
  const mobile = typeof innerWidth !== 'undefined' && innerWidth < 900
  return (
    <Canvas dpr={hd ? [1, mobile ? 1.5 : 2] : 0.6} camera={{ fov: 55, near: 0.1, far: 120, position: [-10, 12, 14] }} gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => { gl.toneMappingExposure = 1.08 }} onPointerMissed={() => tipRef.current && (tipRef.current.style.display = 'none')}>
      <color attach="background" args={['#040305']} />
      <fog attach="fog" args={['#040305', 45, 95]} />
      <Env />
      <Lights lightsOn={lightsOn} />
      <Floor tex={tex} />
      <Walls tex={tex} lightsOn={lightsOn} />
      <Ceiling tex={tex} lightsOn={lightsOn} />
      <Doors tex={tex} />
      <Curtains />
      <Screen movie={movie} lightsOn={lightsOn} sound={sound} tex={tex} />
      <Seats sel={sel} sold={sold} filter={filter} onToggle={onToggle} tipRef={tipRef} tex={tex} lightsOn={lightsOn} />
      <Markers sel={sel} tex={tex} />
      <CameraRig ref={ref} onUserMove={onUserMove} />
      {hd && !mobile && <EffectComposer multisampling={4} disableNormalPass>
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.75} radius={0.75} />
        <Vignette offset={0.28} darkness={0.55} />
      </EffectComposer>}
    </Canvas>
  )
})
export default Hall