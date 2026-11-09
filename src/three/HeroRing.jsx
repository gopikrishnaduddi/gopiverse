/*
  HOME HERO — a curved ring of cinema screens rendered with React Three Fiber.
  • drag to spin (with inertia), GSAP snaps to the nearest screen on release
  • every 5.2 s it rotates to the next screen (progress bar in the hero card)
  • front screen glows; side screens get darker by angle
  • click a side screen → rotate it to the front, click the front screen → open the movie
  • the camera follows the mouse a little (parallax) and a hovered screen lifts towards you
*/
import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import { makePoster } from '../lib/posterArt'
import { probeImage, posterBase } from '../lib/media'

const FONT = (import.meta.env.BASE_URL || '/') + 'fonts/manrope-600.woff'
const CARD_W = 1, CARD_H = 1.5, R = 4.2, C = 0.75
const STEP = (CARD_W * 1.13) / R           // radians between screens

// poster texture: generated art first, real file swaps in when found.
// A NEW texture is created for the real poster (WebGL keeps the first upload's size,
// so changing the image of an existing texture leaves parts of the old art behind).
const BLANK = (() => { if (typeof document === 'undefined') return null; const c = document.createElement('canvas'); c.width = 2; c.height = 3; const x = c.getContext('2d'); x.fillStyle = '#111318'; x.fillRect(0, 0, 2, 3); return new THREE.CanvasTexture(c) })()
function fitCover(t, img) {
  const a = img.width / img.height, want = CARD_W / CARD_H
  if (a > want) { t.repeat.set(want / a, 1); t.offset.set((1 - want / a) / 2, 0) } else { t.repeat.set(1, a / want); t.offset.set(0, (1 - a / want) / 2) }
}
export function usePosterTexture(m) {
  const [tex, setTex] = useState(BLANK)
  useEffect(() => {
    let live = true, real = false, made = []
    const use = (img, isReal) => {
      if (!live || (real && !isReal)) return
      if (isReal) real = true
      const t = new THREE.Texture(img); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; fitCover(t, img); t.needsUpdate = true
      made.push(t); setTex(t)
    }
    const fallback = new Image(); fallback.onload = () => use(fallback); fallback.src = makePoster(m)
    probeImage(posterBase(m)).then((url) => {
      if (!url || !live) return
      const img = new Image(); img.onload = () => use(img, true); img.src = url
    })
    return () => { live = false; made.forEach((t) => t.dispose()) }
  }, [m.id])
  return tex
}

function Screen({ m, i, state, onPick }) {
  const g = useRef(), refl = useRef(), mat = useRef(), frame = useRef(), glow = useRef(), label = useRef(), hov = useRef(false), lift = useRef(0)
  const tex = usePosterTexture(m)
  useFrame(({ clock }) => {
    const N = state.n
    let r = i - state.pos; r = ((r % N) + N) % N; if (r > N / 2) r -= N
    const a = r * STEP, vis = Math.abs(a) < 1.45
    g.current.visible = vis; if (!vis) return
    lift.current += ((hov.current && !state.drag ? 1 : 0) - lift.current) * 0.12
    const L = lift.current, bob = Math.sin(clock.elapsedTime * 0.9 + i * 1.7) * 0.012
    g.current.position.set(R * Math.sin(a) * (1 - L * 0.05), bob + L * 0.03, -C - R * Math.cos(a) * (1 - L * 0.05))
    g.current.rotation.y = -a
    g.current.scale.setScalar(1 + L * 0.04)
    const b = Math.max(0.32, 1 - Math.abs(r) * 0.14)
    mat.current.color.setScalar(b); refl.current.material.color.setScalar(b)
    const f = Math.max(0, 1 - Math.abs(r) * 2)
    frame.current.material.opacity = f; glow.current.material.opacity = f * 0.55
    if (label.current) label.current.fillOpacity = 0.55 + 0.45 * f
  })
  return (
    <group ref={g}>
      <mesh ref={glow} position={[0, 0, -0.02]}><planeGeometry args={[CARD_W * 1.6, CARD_H * 1.35]} /><meshBasicMaterial map={GLOW} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></mesh>
      <mesh ref={frame} position={[0, 0, -0.01]}><planeGeometry args={[CARD_W + 0.05, CARD_H + 0.05]} /><meshBasicMaterial color="#f7b928" transparent toneMapped={false} /></mesh>
      <mesh onClick={(e) => { e.stopPropagation(); if (e.delta < 6) onPick(i) }} onPointerOver={() => { hov.current = true; document.body.style.cursor = 'pointer' }} onPointerOut={() => { hov.current = false; document.body.style.cursor = '' }}>
        <planeGeometry args={[CARD_W, CARD_H]} /><meshBasicMaterial ref={mat} map={tex} toneMapped={false} />
      </mesh>
      <mesh ref={refl} position={[0, -CARD_H - 0.03, 0]} scale={[1, -1, 1]}>
        <planeGeometry args={[CARD_W, CARD_H]} /><meshBasicMaterial map={tex} alphaMap={FADE} transparent opacity={0.32} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <Text ref={label} font={FONT} position={[0, CARD_H / 2 + 0.13, 0]} fontSize={0.085} letterSpacing={0.08} color="#dfe4ee" anchorX="center" anchorY="middle">{(m.short || m.title).toUpperCase()}</Text>
    </group>
  )
}
const FADE = (() => {   // alpha gradient for reflections (strong near the screen, fading away)
  if (typeof document === 'undefined') return null
  const c = document.createElement('canvas'); c.width = 4; c.height = 128; const x = c.getContext('2d')
  const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, '#000'); g.addColorStop(0.45, '#000'); g.addColorStop(1, '#fff')
  x.fillStyle = g; x.fillRect(0, 0, 4, 128); return new THREE.CanvasTexture(c)
})()
const GLOW = (() => {
  if (typeof document === 'undefined') return null
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d')
  const gr = x.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, 'rgba(247,185,40,.9)'); gr.addColorStop(1, 'rgba(247,185,40,0)')
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c)
})()

function Rig({ state, onTick }) {
  const { camera, size } = useThree()
  const mob = size.width < 820, look = useMemo(() => new THREE.Vector3(0, -0.02, -5), [])
  useEffect(() => { camera.fov = mob ? 66 : 54; camera.position.set(0, 0.1, 0); camera.lookAt(look); camera.updateProjectionMatrix() }, [size.width])
  useFrame(({ pointer }, dt) => {
    onTick(dt)
    if (mob) return
    // gentle parallax towards the mouse (stays still while dragging)
    const tx = state.drag ? camera.position.x : pointer.x * 0.22, ty = state.drag ? camera.position.y : 0.1 + pointer.y * 0.08
    camera.position.x += (tx - camera.position.x) * 0.05; camera.position.y += (ty - camera.position.y) * 0.05
    camera.lookAt(look)
  })
  return null
}

export default function HeroRing({ movies, state, onTick, onPick, mobile }) {
  return (
    <Canvas dpr={[1, mobile ? 1.6 : 2]} gl={{ antialias: true, alpha: true }} camera={{ fov: 40, near: 0.1, far: 60 }} style={{ position: 'absolute', inset: 0 }}>
      <fog attach="fog" args={['#05070d', 7, 16]} />
      <ambientLight intensity={1.2} />
      <pointLight position={[0, 2.5, -3]} intensity={6} distance={12} color="#ffe2a8" />
      <Rig state={state} onTick={onTick} />
      {movies.map((m, i) => <Screen key={m.id} m={m} i={i} state={state} onPick={onPick} />)}
      {/* reflections are mirrored copies of each screen (cheap + works on every phone) */}
    </Canvas>
  )
}

// drag / snap / autoplay controller (GSAP)
export function useRingController(n, cb) {   // cb = ref: { change(i), progress(pct) }
  const state = useMemo(() => ({ pos: 3, n, drag: false, hover: false, timer: 0, cur: -1, tween: null }), [n])
  const go = (target) => { state.timer = 0; state.tween?.kill(); state.tween = gsap.to(state, { pos: target, duration: 0.95, ease: 'power3.out' }) }
  const api = {
    state,
    next: (d) => go(Math.round(state.pos) + d),
    goTo: (i) => { let r = i - state.pos; r = ((r % n) + n) % n; if (r > n / 2) r -= n; go(Math.round(state.pos + r)) },
    onTick: (dt) => {
      if (!state.drag && !state.hover) { state.timer += dt * 1000; if (state.timer > 5200) api.next(1) }
      const fi = ((Math.round(state.pos) % n) + n) % n
      if (fi !== state.cur) { state.cur = fi; cb.current.change(fi) }
      cb.current.progress(Math.min(100, state.timer / 52))
    },
    bindDrag: (el, fw) => {
      let lastX = 0, vel = 0, lastT = 0
      const down = (e) => { state.drag = true; state.tween?.kill(); lastX = e.clientX; vel = 0; lastT = performance.now(); el.classList.add('drag') }
      const move = (e) => { if (!state.drag) return; const dx = e.clientX - lastX; lastX = e.clientX; const now = performance.now(); const k = dx / fw(); state.pos -= k; vel = -k / Math.max(8, now - lastT) * 16; lastT = now }
      const up = () => { if (!state.drag) return; state.drag = false; el.classList.remove('drag'); go(Math.round(state.pos + vel * 7)) }
      el.addEventListener('pointerdown', down); addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up)
      return () => { el.removeEventListener('pointerdown', down); removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); state.tween?.kill() }
    },
  }
  return api
}
