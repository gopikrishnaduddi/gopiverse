/*
  3D CINEMA HALL — React Three Fiber
  A realistic, modern auditorium:
  • curved rows on a stepped floor, aisles with real half-steps and LED step lights
  • upholstered seats (channel-stitched fabric) and leather couple recliners with consoles & lit cupholders
  • an audience sitting in booked seats (some with popcorn and drinks)
  • curved screen that lights the room with the colours of the trailer, projector beam with floating dust
  • velvet curtains that open when you walk in, quilted acoustic walls, wall-wash lights, handrails,
    stepped ceiling with LED coves, downlights and a star field, EXIT doors with glowing signs
  • smooth house-light dimming, ambient occlusion + bloom + film grain (auto-lowered on slow devices)
  • camera glides in straight lines, never passes through walls; "seat view" lets you look around from your seat
*/
import { createContext, forwardRef, useContext, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, N8AO, Noise, SMAA } from '@react-three/postprocessing'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import gsap from 'gsap'
import { LAYOUT, SCREEN, CZ, WALL, BACK, PARAPET_R, DOORS_Z, UPHOLSTERY, floorAt, ringZ, onArc } from './layout'
import { CLS } from '../../data/seatClasses'
import { drawArt, mixHex, rng, hashStr } from '../../lib/posterArt'
import { useTrailer } from '../../lib/media'
import { inr } from '../../lib/util'
import { drone } from '../../lib/audio'

RectAreaLightUniformsLib.init()
// quality level inside the canvas: 'high' | 'mid' | 'low'. Low = lighter lights & materials for slow phones.
const QCtx = createContext('high')
const useLite = () => useContext(QCtx) === 'low'

const { seats, rows, arms, byId } = LAYOUT
const STD = [], REC = [], LOCAL = []           // seat index lists for the two seat types
seats.forEach((s, i) => { if (s.cls === 'royal') { LOCAL[i] = ['rec', REC.length]; REC.push(i) } else { LOCAL[i] = ['std', STD.length]; STD.push(i) } })
const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2])
const WHITE = new THREE.Color('#ffffff')
const glowColor = (hex, k) => new THREE.Color(hex).multiplyScalar(k)   // values > 1 bloom
const MOBILE = typeof window !== 'undefined' && window.innerWidth < 900
// fewer polygons on phones (and when ?q=low is in the address) — seats and people stay recognisable
const LOWPOLY = MOBILE || (typeof location !== 'undefined' && /[?&]q=low/.test(location.search))
const merge = (list) => mergeGeometries(list.map((g) => (g.index ? g.toNonIndexed() : g)))

/* ======================= procedural textures ======================= */
function mkCanvas(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c }
function toTex(c, rep, srgb = true) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]) }
  return t
}
// grayscale height canvas → normal map
function normalMap(c, strength = 2, rep) {
  const w = c.width, h = c.height, src = c.getContext('2d').getImageData(0, 0, w, h).data
  const out = document.createElement('canvas'); out.width = w; out.height = h
  const ctx = out.getContext('2d'), img = ctx.createImageData(w, h), d = img.data
  const H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength, l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4
    d[i] = (-dx / l * 0.5 + 0.5) * 255; d[i + 1] = (dy / l * 0.5 + 0.5) * 255; d[i + 2] = (0.5 / l + 0.5) * 255; d[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0); return toTex(out, rep, false)
}
const speckle = (x, w, h, n, seed, lo, hi, size = 1) => { const r = rng(seed); for (let i = 0; i < n; i++) { const v = (lo + r() * (hi - lo)) | 0; x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(r() * w, r() * h, size, size) } }
const rrect = (x, a, b, w, h, r) => { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath() }

function makeTextures() {
  const T = {}
  // carpet: deep burgundy with a woven diamond motif
  const carpetC = mkCanvas(256, 256, (x, w, h) => {
    x.fillStyle = '#2b1316'; x.fillRect(0, 0, w, h); const r = rng(4)
    for (let i = 0; i < 7000; i++) { x.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.24)' : 'rgba(255,120,110,.05)'; x.fillRect(r() * w, r() * h, 1.5, 1.5) }
    x.strokeStyle = 'rgba(255,170,120,.07)'; x.lineWidth = 2
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.beginPath(); x.moveTo(i * 32 + 16, j * 32 + 4); x.lineTo(i * 32 + 28, j * 32 + 16); x.lineTo(i * 32 + 16, j * 32 + 28); x.lineTo(i * 32 + 4, j * 32 + 16); x.closePath(); x.stroke() }
  })
  const carpetH = mkCanvas(256, 256, (x, w, h) => { x.fillStyle = '#808080'; x.fillRect(0, 0, w, h); speckle(x, w, h, 16000, 5, 70, 190, 1.5) })
  T.carpet = toTex(carpetC, [0.5, 0.5]); T.carpetN = normalMap(carpetH, 1.2, [0.5, 0.5])
  T.carpetBig = toTex(carpetC, [12, 16]); T.carpetBigN = normalMap(carpetH, 1.2, [12, 16])
  // seat fabric: fine weave + 3 channel stitches (4 padded flutes per seat)
  const ch = [64, 128, 192]
  const fabC = mkCanvas(256, 256, (x, w, h) => {
    x.fillStyle = '#e4e4e4'; x.fillRect(0, 0, w, h); speckle(x, w, h, 14000, 3, 185, 245)
    ch.forEach((cx) => { x.fillStyle = 'rgba(0,0,0,.42)'; x.fillRect(cx - 1.5, 0, 3, h); x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(cx + 2, 0, 2, h) })
    x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(0, 0, w, 6); x.fillRect(0, h - 6, w, 6)
  })
  const fabH = mkCanvas(256, 256, (x, w, h) => {
    x.fillStyle = '#b0b0b0'; x.fillRect(0, 0, w, h); speckle(x, w, h, 16000, 2, 130, 200)
    ch.forEach((cx) => { const g = x.createLinearGradient(cx - 10, 0, cx + 10, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(0,0,0,.95)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(cx - 10, 0, 20, h) })
  })
  T.fabric = toTex(fabC); T.fabricN = normalMap(fabH, 3.2)
  // leather: grain + horizontal tufting seams with stitching
  const lthC = mkCanvas(256, 256, (x, w, h) => {
    x.fillStyle = '#ddd6cf'; x.fillRect(0, 0, w, h); speckle(x, w, h, 9000, 8, 190, 235, 2)
    ;[86, 172].forEach((y) => { x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, y - 1, w, 3); x.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < w; i += 8) { x.fillRect(i, y - 6, 4, 1.4); x.fillRect(i + 4, y + 5, 4, 1.4) } })
  })
  const lthH = mkCanvas(256, 256, (x, w, h) => {
    x.fillStyle = '#9a9a9a'; x.fillRect(0, 0, w, h); speckle(x, w, h, 12000, 9, 110, 175, 2)
    ;[86, 172].forEach((y) => { const g = x.createLinearGradient(0, y - 12, 0, y + 12); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(0,0,0,.95)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, y - 12, w, 24) })
  })
  T.leather = toTex(lthC); T.leatherN = normalMap(lthH, 2.6)
  // acoustic wall fabric
  T.wall = toTex(mkCanvas(256, 256, (x, w, h) => { x.fillStyle = '#1e1013'; x.fillRect(0, 0, w, h); speckle(x, w, h, 9000, 11, 0, 40) ; x.globalCompositeOperation = 'lighter'; speckle(x, w, h, 3000, 12, 0, 18) }), [8, 3])
  // quilted wall panel (diamond tufting)
  const quiltC = mkCanvas(256, 256, (x, w, h) => {
    x.fillStyle = '#5b2a31'; x.fillRect(0, 0, w, h); speckle(x, w, h, 8000, 13, 60, 110)
    x.globalCompositeOperation = 'multiply'; x.fillStyle = '#7a3a42'; x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'source-over'
    x.strokeStyle = 'rgba(0,0,0,.45)'; x.lineWidth = 3
    for (let i = -4; i <= 8; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64 + 256, 256); x.stroke(); x.beginPath(); x.moveTo(i * 64, 256); x.lineTo(i * 64 + 256, 0); x.stroke() }
    x.fillStyle = 'rgba(0,0,0,.55)'; for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) { x.beginPath(); x.arc(i * 64, j * 64, 4, 0, 7); x.fill() }
  })
  const quiltH = mkCanvas(256, 256, (x, w, h) => {
    x.fillStyle = '#c8c8c8'; x.fillRect(0, 0, w, h); x.strokeStyle = '#000'; x.lineWidth = 10; x.filter = 'blur(5px)'
    for (let i = -4; i <= 8; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64 + 256, 256); x.stroke(); x.beginPath(); x.moveTo(i * 64, 256); x.lineTo(i * 64 + 256, 0); x.stroke() }
  })
  T.quilt = toTex(quiltC); T.quiltN = normalMap(quiltH, 2)
  T.grille = toTex(mkCanvas(64, 64, (x, w, h) => { x.fillStyle = '#0d0d10'; x.fillRect(0, 0, w, h); x.fillStyle = '#26262c'; for (let i = 2; i < w; i += 5) for (let j = 2; j < h; j += 5) { x.beginPath(); x.arc(i, j, 1.2, 0, 7); x.fill() } }))
  T.exit = toTex(mkCanvas(256, 96, (x, w, h) => { x.fillStyle = '#021a0c'; x.fillRect(0, 0, w, h); x.fillStyle = '#3dff8f'; x.font = '800 54px Manrope, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('EXIT', 110, 50); x.beginPath(); x.moveTo(185, 30); x.lineTo(215, 48); x.lineTo(185, 66); x.fill(); x.fillRect(165, 44, 26, 8) }))
  T.marker = toTex(mkCanvas(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(62,245,230,1)'); g.addColorStop(0.45, 'rgba(62,245,230,.9)'); g.addColorStop(0.5, 'rgba(62,245,230,.35)'); g.addColorStop(1, 'rgba(62,245,230,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); x.strokeStyle = '#05201e'; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(21, 33); x.lineTo(29, 41); x.lineTo(44, 24); x.stroke() }))
  T.spill = toTex(mkCanvas(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128) }))
  T.blob = toTex(mkCanvas(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 4, 32, 32, 32); g.addColorStop(0, 'rgba(0,0,0,.85)'); g.addColorStop(0.6, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64) }))
  // wall-wash "scallop" of light thrown down the wall by a sconce
  T.scallop = toTex(mkCanvas(64, 128, (x, w, h) => {
    const img = x.createImageData(w, h)
    for (let j = 0; j < h; j++) { const t = j / h, sig = 0.06 + 0.3 * t; for (let i = 0; i < w; i++) { const u = i / w - 0.5, a = Math.exp(-(u * u) / (2 * sig * sig)) * Math.pow(1 - t, 1.7) * Math.min(1, t * 14), k = (j * w + i) * 4; img.data[k] = 255; img.data[k + 1] = 214; img.data[k + 2] = 165; img.data[k + 3] = a * 255 } }
    x.putImageData(img, 0, 0)
  }))
  // backlit row-letter plates (one atlas: 4×4 letters A–P), fixed to the aisle side of every end seat
  T.rowAtlas = toTex(mkCanvas(512, 512, (x) => {
    'ABCDEFGHIJKLMNOP'.split('').forEach((ch, i) => {
      const cx = (i % 4) * 128, cy = Math.floor(i / 4) * 128
      rrect(x, cx + 10, cy + 10, 108, 108, 18); x.fillStyle = '#0d0b0c'; x.fill()
      x.lineWidth = 4; x.strokeStyle = 'rgba(255,196,120,.55)'; x.stroke()
      x.shadowColor = 'rgba(255,214,160,.9)'; x.shadowBlur = 14; x.fillStyle = '#fff1dc'
      x.font = '700 70px Manrope, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, cx + 64, cy + 68); x.shadowBlur = 0
    })
  }))
  // brand logo on the stage front
  T.logo = toTex(mkCanvas(1024, 128, (x, w, h) => {
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '92px Anton, Impact, sans-serif'
    const gw = x.measureText('GOPI').width, vw = x.measureText('VERSE').width, sx = w / 2 - (gw + vw) / 2
    x.shadowColor = 'rgba(247,185,40,.9)'; x.shadowBlur = 18
    x.textAlign = 'left'; x.fillStyle = '#ffffff'; x.fillText('GOPI', sx, 68); x.fillStyle = '#f7b928'; x.fillText('VERSE', sx + gw, 68)
  }))
  // snack props for the audience
  T.cup = toTex(mkCanvas(128, 64, (x, w, h) => { x.fillStyle = '#f2f2f2'; x.fillRect(0, 0, w, h); x.fillStyle = '#d7262e'; x.fillRect(0, 20, w, 22); x.fillStyle = '#f7b928'; x.beginPath(); x.arc(32, 31, 7, 0, 7); x.fill(); x.beginPath(); x.arc(96, 31, 7, 0, 7); x.fill() }))
  T.tub = toTex(mkCanvas(128, 32, (x, w, h) => { for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#f4f0ea' : '#d62a2a'; x.fillRect(i * 8, 0, 8, h) } }))
  return T
}

/* ======================= curved-geometry helpers ======================= */
const arcHalf = (rad) => Math.asin(Math.min(1, (WALL + 0.02) / rad))
function arcPoints(rad, y, n = 64, a0, a1) { if (a0 === undefined) { const t = arcHalf(rad); a0 = -t; a1 = t } const p = []; for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; p.push(new THREE.Vector3(rad * Math.sin(a), y, CZ + rad * Math.cos(a))) } return p }
// ring (around CZ) between two radii, clipped by the side walls. rOut = null → runs to the back wall
function ringShape(rIn, rOut, zLine) {
  const s = new THREE.Shape(), tIn = arcHalf(rIn), n = 64
  for (let i = 0; i <= n; i++) { const a = -tIn + (2 * tIn * i) / n; const x = rIn * Math.sin(a), z = CZ + rIn * Math.cos(a); i ? s.lineTo(x, -z) : s.moveTo(x, -z) }
  if (rOut) { const tO = arcHalf(rOut); for (let i = n; i >= 0; i--) { const a = -tO + (2 * tO * i) / n; s.lineTo(rOut * Math.sin(a), -(CZ + rOut * Math.cos(a))) } }
  else { const zz = zLine ?? BACK; s.lineTo(WALL, -zz); s.lineTo(-WALL, -zz) }
  s.closePath(); return s
}
function sectorShape(rIn, rOut, a0, a1, n = 16) {
  const s = new THREE.Shape(), P = (r, a) => [r * Math.sin(a), -(CZ + r * Math.cos(a))]
  for (let i = 0; i <= n; i++) { const [x, y] = P(rIn, a0 + ((a1 - a0) * i) / n); i ? s.lineTo(x, y) : s.moveTo(x, y) }
  for (let i = n; i >= 0; i--) { const [x, y] = P(rOut, a0 + ((a1 - a0) * i) / n); s.lineTo(x, y) }
  s.closePath(); return s
}
function extrudeShape(shape, y0, h) { const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 1 }); g.rotateX(-Math.PI / 2); g.translate(0, y0, 0); return g }
const slabGeo = (rIn, rOut, y0, h, zLine) => extrudeShape(ringShape(rIn, rOut, zLine), y0, h)
const tubeArc = (rad, y, r = 0.016, a0, a1) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arcPoints(rad, y, 48, a0, a1)), 96, r, 6, false)
// gently curved stage front (sits in front of the curtains)
const STAGE_R = 150, STAGE_Z = -12.9
const stageFrontZ = (x) => STAGE_Z - STAGE_R + Math.sqrt(STAGE_R * STAGE_R - x * x)

/* ======================= room ======================= */
function Box({ args, position, rotation, children, ...p }) { return <mesh position={position} rotation={rotation} {...p}><boxGeometry args={args} />{children}</mesh> }
const Glow = ({ color, k = 1 }) => <meshBasicMaterial color={glowColor(color, k)} toneMapped={false} />

function Floor({ tex }) {
  const g = useMemo(() => {
    const main = rows.filter((r) => r.cls !== 'balcony'), balc = rows.filter((r) => r.cls === 'balcony')
    const risers = [], strips = [], steps = [], lights = []
    const aislesOf = (r) => { const a = []; for (let j = 0; j < r.blockU.length - 1; j++) a.push([r.blockU[j][1] / r.rad, r.blockU[j + 1][0] / r.rad]); return a }
    // half-steps in every aisle (stadium seating rises too much for one step per row)
    const addSteps = (prev, cur) => {
      const h = (cur.y - prev.y) / 2; if (h <= 0.01) return
      const R = cur.rad - 0.55, depth = Math.min(0.6, (cur.rad - prev.rad) / 2), ranges = []
      const A = aislesOf(prev), B = aislesOf(cur)
      A.forEach(([a0, a1], j) => { const lo = Math.max(a0, B[j][0]) + 0.06 / R, hi = Math.min(a1, B[j][1]) - 0.06 / R; if (hi - lo > 0.3 / R) ranges.push([lo, hi]) })
      const outer = Math.max(prev.blockU.at(-1)[1] / prev.rad, cur.blockU.at(-1)[1] / cur.rad) + 0.14 / R, wallA = arcHalf(R)
      if (wallA - outer > 0.3 / R) { ranges.push([outer, wallA]); ranges.push([-wallA, -outer]) }
      ranges.forEach(([a0, a1]) => {
        steps.push(extrudeShape(sectorShape(R - depth, R, a0, a1), prev.y, h))
        const inset = 0.16 / R
        for (const [rr, yy] of [[R - depth, prev.y + h], [R, cur.y]]) for (const a of [a0 + inset, a1 - inset]) {
          if (Math.abs(rr * Math.sin(a)) > WALL - 0.15) continue
          lights.push({ x: (rr - 0.012) * Math.sin(a), y: yy - 0.04, z: CZ + (rr - 0.012) * Math.cos(a), rot: a })
        }
      })
    }
    main.forEach((r, i) => {
      if (r.y > 0) { const next = main[i + 1]; risers.push(slabGeo(r.rad - 0.55, next ? next.rad - 0.55 : null, 0, r.y)); strips.push(tubeArc(r.rad - 0.56, r.y + 0.004, 0.009)) }
      if (i > 0) addSteps(main[i - 1], r)
    })
    balc.forEach((r, i) => {
      const h = r.y - 4.6, next = balc[i + 1]
      if (h > 0.01) { risers.push(slabGeo(r.rad - 0.55, next ? next.rad - 0.55 : null, 4.6, h)); strips.push(tubeArc(r.rad - 0.56, r.y + 0.004, 0.009)) }
      if (i > 0) addSteps(balc[i - 1], r)
    })
    const stage = new THREE.Shape(); for (let i = 0; i <= 40; i++) { const x = -WALL + (2 * WALL * i) / 40; i ? stage.lineTo(x, -stageFrontZ(x)) : stage.moveTo(x, -stageFrontZ(x)) } stage.lineTo(WALL, 15.7); stage.lineTo(-WALL, 15.7); stage.closePath()
    const stageLed = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 25 }, (_, i) => { const x = -WALL + (2 * WALL * i) / 24; return new THREE.Vector3(x, 1.0, stageFrontZ(x) + 0.01) })), 80, 0.022, 6, false)
    // row-letter plates on the outer face of every end armrest (both sides of each aisle)
    const plates = []
    rows.forEach((r) => {
      const li = 'ABCDEFGHIJKLMNOP'.indexOf(r.letter), cx = li % 4, cy = Math.floor(li / 4)
      arms.filter((a) => a.ri === r.ri && a.edge !== 0).forEach((a) => {
        const g = new THREE.PlaneGeometry(0.15, 0.15), uv = g.attributes.uv
        for (let i = 0; i < uv.count; i++) uv.setXY(i, (cx + uv.getX(i)) / 4, 1 - (cy + 1 - uv.getY(i)) / 4)
        const nx = a.edge * Math.cos(a.rot), nz = -a.edge * Math.sin(a.rot), off = a.royal ? 0.122 : 0.047
        g.rotateY(Math.atan2(nx, nz)); g.translate(a.x + nx * off, a.y + 0.5, a.z + nz * off); plates.push(g)
      })
    })
    return {
      plates: merge(plates),
      risers: merge(risers), strips: merge(strips), steps: merge(steps), lights,
      balcony: slabGeo(PARAPET_R, null, 4.1, 0.5), parapet: slabGeo(PARAPET_R - 0.14, PARAPET_R, 4.1, 0.55),
      glass: slabGeo(PARAPET_R - 0.1, PARAPET_R - 0.06, 4.65, 0.75), rail: tubeArc(PARAPET_R - 0.08, 5.42, 0.03), under: tubeArc(PARAPET_R + 0.01, 4.12, 0.02),
      stage: extrudeShape(stage, 0, 1), stageLed,
    }
  }, [])
  const stepLights = useRef()
  useLayoutEffect(() => {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1)
    g.lights.forEach((l, i) => { q.setFromEuler(e.set(0, l.rot, 0)); m.compose(new THREE.Vector3(l.x, l.y, l.z), q, one); stepLights.current.setMatrixAt(i, m) })
    stepLights.current.instanceMatrix.needsUpdate = true; stepLights.current.computeBoundingSphere()
  }, [])
  const lite = useLite()
  const carpet = <meshStandardMaterial map={tex.carpet} normalMap={tex.carpetN} normalScale={[0.5, 0.5]} roughness={0.96} />
  return <group>
    <Box args={[24, 0.2, 32]} position={[0, -0.1, -0.5]}><meshStandardMaterial map={tex.carpetBig} normalMap={tex.carpetBigN} normalScale={[0.5, 0.5]} roughness={0.96} /></Box>
    <mesh geometry={g.risers}>{carpet}</mesh>
    <mesh geometry={g.steps}><meshStandardMaterial map={tex.carpet} normalMap={tex.carpetN} color="#bba3a3" roughness={0.95} /></mesh>
    <mesh geometry={g.strips}><Glow color="#ff9a2e" k={1.5} /></mesh>
    <instancedMesh ref={stepLights} args={[undefined, undefined, g.lights.length]}><boxGeometry args={[0.1, 0.022, 0.02]} /><Glow color="#ffe0b0" k={2.6} /></instancedMesh>
    <mesh geometry={g.balcony}><meshStandardMaterial color="#120c0e" roughness={0.8} /></mesh>
    <mesh geometry={g.parapet}><meshStandardMaterial color="#1a1013" roughness={0.45} metalness={0.45} /></mesh>
    <mesh geometry={g.glass}>{lite ? <meshStandardMaterial color="#9fb7ff" transparent opacity={0.12} roughness={0.1} depthWrite={false} /> : <meshPhysicalMaterial color="#9fb7ff" transparent opacity={0.14} roughness={0.04} metalness={0.1} clearcoat={1} depthWrite={false} />}</mesh>
    <mesh geometry={g.rail}><meshStandardMaterial color="#c9ccd3" metalness={0.95} roughness={0.22} /></mesh>
    <mesh geometry={g.under}><Glow color="#9b6bff" k={2.4} /></mesh>
    <mesh geometry={g.stage}><meshStandardMaterial color="#1a0f11" roughness={0.55} metalness={0.15} /></mesh>
    <mesh geometry={g.stageLed}><Glow color="#2ee6c5" k={2.6} /></mesh>
    <mesh position={[0, 0.5, stageFrontZ(0) + 0.015]}><planeGeometry args={[3.6, 0.45]} /><meshBasicMaterial map={tex.logo} transparent color={glowColor('#ffffff', 1.25)} toneMapped={false} depthWrite={false} /></mesh>
    <mesh geometry={g.plates}><meshBasicMaterial map={tex.rowAtlas} color={glowColor('#ffffff', 1.25)} toneMapped={false} /></mesh>
  </group>
}

function Walls({ tex, env }) {
  const d = useMemo(() => {
    const fins = []; for (let z = -13.2; z < 14.8; z += 1.75) if (!DOORS_Z.some((dz) => Math.abs(z - dz) < 1.3)) fins.push(z)
    const panels = [], washers = [], speakers = []
    ;[-1, 1].forEach((sd) => {
      for (let i = 0; i < fins.length - 1; i++) {
        const z0 = fins[i], z1 = fins[i + 1]; if (z1 - z0 > 2.2) continue
        const zc = (z0 + z1) / 2, low = floorAt(sd * 11.6, zc) + 1.55
        for (let y = 11.68 - 0.62; y - 0.62 > low; y -= 1.3) panels.push([sd * (WALL - 0.045), y, zc])
        washers.push([sd * (WALL - 0.13), 8.55, zc, sd])
      }
      ;[-7.95, -2.7, 2.55, 7.8].forEach((z) => speakers.push([sd, z]))
    })
    // handrail + LED following the stadium slope along each side wall (split at the balcony and the doors)
    const smooth = (sd, z) => { let a = 0; for (const o of [-0.6, -0.3, 0, 0.3, 0.6]) a += floorAt(sd * 11.6, z + o); return a / 5 }
    const rails = [], leds = [], brackets = []
    ;[-1, 1].forEach((sd) => {
      const zPar = CZ + Math.sqrt(PARAPET_R ** 2 - 11.6 ** 2)
      for (const [za, zb] of [[-9.7, zPar - 0.4], [zPar + 0.7, 12.1]]) {
        const pts = [], ledPts = []
        for (let z = za; z <= zb + 1e-6; z += 0.35) { const y = smooth(sd, z) + 0.92; pts.push(new THREE.Vector3(sd * (WALL - 0.15), y, z)); ledPts.push(new THREE.Vector3(sd * (WALL - 0.07), y - 0.07, z)) }
        rails.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 3, 0.028, 8, false))
        leds.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ledPts), pts.length * 3, 0.01, 5, false))
        for (let k = 0; k < pts.length; k += 4) brackets.push([sd, pts[k].y - 0.04, pts[k].z])
      }
    })
    return { fins, panels, washers, speakers, rail: merge(rails), led: merge(leds), brackets }
  }, [])
  const panelGeo = useMemo(() => new RoundedBoxGeometry(0.07, 1.22, 1.47, 2, 0.035), [])
  const finRef = useRef(), panelRef = useRef(), washRef = useRef(), sconceRef = useRef(), brRef = useRef(), washMat = useRef(), sconceMat = useRef()
  useLayoutEffect(() => {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1)
    let i = 0
    ;[-1, 1].forEach((sd) => d.fins.forEach((z) => { m.makeTranslation(sd * (WALL - 0.08), 7.9, z); finRef.current.setMatrixAt(i++, m) }))
    d.panels.forEach((p, k) => { m.makeTranslation(p[0], p[1], p[2]); panelRef.current.setMatrixAt(k, m) })
    d.washers.forEach((w, k) => {
      q.setFromEuler(e.set(0, w[3] < 0 ? Math.PI / 2 : -Math.PI / 2, 0)); m.compose(new THREE.Vector3(w[0], w[1], w[2]), q, one); washRef.current.setMatrixAt(k, m)
      m.makeTranslation(w[3] * (WALL - 0.09), 10.95, w[2]); sconceRef.current.setMatrixAt(k, m)
    })
    d.brackets.forEach((b, k) => { q.setFromEuler(e.set(0, 0, Math.PI / 2)); m.compose(new THREE.Vector3(b[0] * (WALL - 0.08), b[1], b[2]), q, one); brRef.current.setMatrixAt(k, m) })
    ;[finRef, panelRef, washRef, sconceRef, brRef].forEach((r) => { r.current.instanceMatrix.needsUpdate = true; r.current.computeBoundingSphere() })
  }, [])
  useFrame(() => {
    washMat.current.opacity = 0.1 + 0.6 * env.lvl
    sconceMat.current.color.setRGB(1, 0.85, 0.62).multiplyScalar(0.4 + 2.4 * env.lvl)
  })
  const finW = d.fins.length * 2
  return <group>
    <Box args={[0.3, 13, 32]} position={[-12.1, 6.4, -0.5]}><meshStandardMaterial map={tex.wall} roughness={0.97} /></Box>
    <Box args={[0.3, 13, 32]} position={[12.1, 6.4, -0.5]}><meshStandardMaterial map={tex.wall} roughness={0.97} /></Box>
    <Box args={[24.5, 13, 0.3]} position={[0, 6.4, 15.2]}><meshStandardMaterial map={tex.wall} roughness={0.97} /></Box>
    <Box args={[24.5, 13, 0.3]} position={[0, 6.4, -15.85]}><meshStandardMaterial color="#050405" roughness={1} /></Box>
    <instancedMesh ref={finRef} args={[undefined, undefined, finW]}><boxGeometry args={[0.16, 9.2, 0.22]} /><meshStandardMaterial color="#130b0d" roughness={0.5} metalness={0.4} /></instancedMesh>
    <instancedMesh ref={panelRef} args={[panelGeo, undefined, d.panels.length]}><meshStandardMaterial map={tex.quilt} normalMap={tex.quiltN} normalScale={[0.8, 0.8]} roughness={0.92} /></instancedMesh>
    <instancedMesh ref={washRef} args={[undefined, undefined, d.washers.length]}><planeGeometry args={[1.5, 4.6]} /><meshBasicMaterial ref={washMat} map={tex.scallop} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></instancedMesh>
    <instancedMesh ref={sconceRef} args={[undefined, undefined, d.washers.length]}><boxGeometry args={[0.1, 0.07, 0.34]} /><meshBasicMaterial ref={sconceMat} toneMapped={false} /></instancedMesh>
    <mesh geometry={d.rail}><meshStandardMaterial color="#b8bcc6" metalness={0.95} roughness={0.25} /></mesh>
    <mesh geometry={d.led}><Glow color="#ffb860" k={1.9} /></mesh>
    <instancedMesh ref={brRef} args={[undefined, undefined, d.brackets.length]}><cylinderGeometry args={[0.012, 0.012, 0.16, 6]} /><meshStandardMaterial color="#9aa0aa" metalness={0.9} roughness={0.3} /></instancedMesh>
    {d.speakers.map(([sd, z]) => <group key={sd + '' + z} position={[sd * (WALL - 0.42), 11.25, z]} rotation={[0, sd < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
      <Box args={[0.62, 0.92, 0.42]}><meshStandardMaterial color="#0c0c0f" roughness={0.4} metalness={0.5} /></Box>
      <mesh position={[0, 0, 0.215]}><planeGeometry args={[0.54, 0.84]} /><meshStandardMaterial map={tex.grille} roughness={0.9} /></mesh>
    </group>)}
    {/* projector booth windows */}
    {[-3.4, 0, 3.4].map((x) => <Box key={x} args={[2.2, 0.9, 0.1]} position={[x, 10.2, BACK - 0.02]}><meshStandardMaterial color="#05070c" roughness={0.08} metalness={0.7} emissive="#0a1830" emissiveIntensity={0.6} /></Box>)}
    <mesh position={[0, 10.2, BACK - 0.08]} rotation-y={Math.PI}><circleGeometry args={[0.13, 24]} /><Glow color="#dce8ff" k={5} /></mesh>
  </group>
}

function Ceiling({ env }) {
  const d = useMemo(() => {
    const bulk = [], coves = [], downs = []
    for (const rad of [31, 37.5, 44, 50.5]) {
      bulk.push(slabGeo(rad - 1.1, rad, 11.85, 0.65))
      coves.push(tubeArc(rad - 1.1, 11.865, 0.022))
      for (let u = -10; u <= 10.01; u += 2.5) { const p = onArc(u, rad - 0.55, 11.84); if (Math.abs(p.x) < 11.2) downs.push(p) }
    }
    const r = rng(77), n = 1100, p = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) { p[i * 3] = (r() - 0.5) * 23; p[i * 3 + 1] = 12.46; p[i * 3 + 2] = -15 + r() * 30 }
    const stars = new THREE.BufferGeometry(); stars.setAttribute('position', new THREE.BufferAttribute(p, 3))
    return { bulk: merge(bulk), coves: merge(coves), downs, stars }
  }, [])
  const grp = useRef(), starMat = useRef(), downRef = useRef(), trimRef = useRef(), downMat = useRef()
  useLayoutEffect(() => {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), one = new THREE.Vector3(1, 1, 1)
    d.downs.forEach((p, i) => { m.compose(new THREE.Vector3(p.x, p.y, p.z), q, one); downRef.current.setMatrixAt(i, m); m.compose(new THREE.Vector3(p.x, p.y + 0.002, p.z), q, one); trimRef.current.setMatrixAt(i, m) })
    ;[downRef, trimRef].forEach((r) => { r.current.instanceMatrix.needsUpdate = true; r.current.computeBoundingSphere() })
  }, [])
  useFrame(({ clock, camera }) => {
    starMat.current.opacity = 0.7 + Math.sin(clock.elapsedTime * 1.7) * 0.15
    downMat.current.color.setRGB(1, 0.94, 0.84).multiplyScalar(0.12 + 3 * env.lvl)
    grp.current.visible = camera.position.y < 12.6       // hidden in bird's-eye view
  })
  return <group ref={grp}>
    <mesh rotation-x={Math.PI / 2} position={[0, 12.5, -0.5]}><planeGeometry args={[24.6, 32]} /><meshStandardMaterial color="#07060a" roughness={0.9} /></mesh>
    <points geometry={d.stars}><pointsMaterial ref={starMat} size={0.06} color={glowColor('#fff3dc', 2.4)} sizeAttenuation transparent depthWrite={false} toneMapped={false} /></points>
    <mesh geometry={d.bulk}><meshStandardMaterial color="#0d0b0f" roughness={0.85} /></mesh>
    <mesh geometry={d.coves}><Glow color="#56d6ff" k={1.7} /></mesh>
    <instancedMesh ref={downRef} args={[undefined, undefined, d.downs.length]}><circleGeometry args={[0.12, 24]} /><meshBasicMaterial ref={downMat} toneMapped={false} side={THREE.DoubleSide} /></instancedMesh>
    <instancedMesh ref={trimRef} args={[undefined, undefined, d.downs.length]}><ringGeometry args={[0.12, 0.17, 24]} /><meshStandardMaterial color="#2a2a30" metalness={0.85} roughness={0.3} side={THREE.DoubleSide} /></instancedMesh>
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
      DOORS_Z.forEach((z) => L.push({ pos: [s * (WALL - 0.03), floorAt(s * 11.5, z), z], rot: s < 0 ? Math.PI / 2 : -Math.PI / 2 }))
      L.push({ pos: [s * 8.5, floorAt(s * 8.5, BACK - 0.5), BACK - 0.03], rot: Math.PI })
    })
    return L
  }, [])
  return <>{list.map((d, i) => <Door key={i} {...d} tex={tex} />)}</>
}

/* velvet curtains — closed when you walk in, then they open */
function Curtains({ intro }) {
  const geo = useMemo(() => {
    const mk = (w, h, folds, amp, segs) => { const g = new THREE.PlaneGeometry(w, h, segs, 1), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, Math.sin((x / w) * Math.PI * 2 * folds) * amp) } g.computeVertexNormals(); return g }
    return { side: mk(3.4, 10.1, 7, 0.1, 120), top: mk(24.4, 1.5, 34, 0.06, 220) }
  }, [])
  const lite = useLite()
  const mat = useMemo(() => (lite ? new THREE.MeshStandardMaterial({ color: '#7a0f17', roughness: 0.8, side: THREE.DoubleSide })
    : new THREE.MeshPhysicalMaterial({ color: '#6f0b12', roughness: 0.78, sheen: 1, sheenColor: new THREE.Color('#ff5a6a'), sheenRoughness: 0.45, side: THREE.DoubleSide })), [lite])
  useEffect(() => () => mat.dispose(), [mat])
  const L = useRef(), R = useRef()
  useLayoutEffect(() => {
    const set = (k) => { const w = 3.4 * k; L.current.scale.x = k; L.current.position.x = -WALL + w / 2; R.current.scale.x = k; R.current.position.x = WALL - w / 2 }
    const st = { k: intro ? 3.53 : 1 }; set(st.k)
    if (!intro) return
    const tw = gsap.to(st, { k: 1, duration: 3.4, delay: 1.0, ease: 'power2.inOut', onUpdate: () => set(st.k) })
    return () => tw.kill()
  }, [])
  return <group>
    <mesh ref={L} geometry={geo.side} material={mat} position={[-10.25, 6.05, -13.62]} />
    <mesh ref={R} geometry={geo.side} material={mat} position={[10.25, 6.05, -13.62]} />
    <mesh geometry={geo.top} material={mat} position={[0, 10.15, -13.5]} />
    <mesh position={[0, 9.38, -13.42]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.035, 0.035, 24.2, 10]} /><meshStandardMaterial color="#c9a24a" metalness={0.9} roughness={0.3} /></mesh>
  </group>
}

/* ======================= screen, projector beam, screen light ======================= */
const BEAM_VS = `uniform float uLen; varying vec3 vN; varying vec3 vV; varying float vT; varying vec3 vW;
void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vV = mv.xyz; vN = normalize(normalMatrix * normal); vT = clamp(-position.y / uLen, 0.0, 1.0); vW = (modelMatrix * vec4(position,1.0)).xyz; gl_Position = projectionMatrix * mv; }`
const BEAM_FS = `uniform vec3 uColor; uniform float uOpacity; uniform float uTime; varying vec3 vN; varying vec3 vV; varying float vT; varying vec3 vW;
float h3(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
float n3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z); }
void main(){ float ndv = abs(dot(normalize(vN), normalize(-vV))); float core = pow(ndv, 2.2);
  float along = smoothstep(0.0, 0.06, vT) * (1.0 - 0.6 * vT);
  float haze = 0.55 + 0.45 * n3(vW * 0.7 + vec3(0.0, uTime * 0.12, uTime * 0.05));
  float a = core * along * haze * uOpacity; gl_FragColor = vec4(uColor, a); }`

function Screen({ movie, env, sound, tex }) {
  const url = useTrailer(movie), lite = useLite()
  const canvas = useMemo(() => { const c = document.createElement('canvas'); c.width = 640; c.height = 272; drawArt(c.getContext('2d'), movie, 640, 272, 0); return c }, [movie.id])
  const artTex = useMemo(() => { const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; return t }, [canvas])
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
    const R = SCREEN.curve, Lw = SCREEN.w / R
    const mk = (r, h, l) => { const g = new THREE.CylinderGeometry(r, r, h, 72, 1, true, Math.PI - l / 2, l); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i)); return g }
    const from = new THREE.Vector3(0, 10.2, BACK - 0.1), to = new THREE.Vector3(0, SCREEN.y, SCREEN.z + 0.3), len = from.distanceTo(to)
    const cone = new THREE.ConeGeometry(SCREEN.w / 2, len, 48, 1, true); cone.translate(0, -len / 2, 0)
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), to.clone().sub(from).normalize())
    const r = rng(31), n = 480, p = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) { const t = r(), a = r() * Math.PI * 2, rr = Math.sqrt(r()) * t; p[i * 3] = Math.cos(a) * rr * SCREEN.w * 0.5; p[i * 3 + 1] = -t * len; p[i * 3 + 2] = Math.sin(a) * rr * SCREEN.h * 0.5 }
    const dust = new THREE.BufferGeometry(); dust.setAttribute('position', new THREE.BufferAttribute(p, 3))
    return { screen: mk(R, SCREEN.h, Lw), mask: mk(R + 0.08, SCREEN.h + 0.7, Lw * 1.05), cone, from, q, len, dust }
  }, [])
  const beamMat = useMemo(() => new THREE.ShaderMaterial({ uniforms: { uColor: { value: new THREE.Color('#cfe0ff') }, uOpacity: { value: 0.05 }, uTime: { value: 0 }, uLen: { value: geo.len } }, vertexShader: BEAM_VS, fragmentShader: BEAM_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }), [])
  const sampler = useMemo(() => { const c = document.createElement('canvas'); c.width = 16; c.height = 8; return c.getContext('2d', { willReadFrequently: true }) }, [])
  const target = useMemo(() => new THREE.Color('#8fa8ff'), []), tint = useMemo(() => new THREE.Color(), [])
  const rect = useRef(), fill = useRef(), dustRef = useRef(), dustMat = useRef(), last = useRef(0), lastS = useRef(0)
  useLayoutEffect(() => { rect.current?.lookAt(0, 3.5, 12) }, [lite])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime, dark = 1 - env.lvl
    if (!video && t - last.current > 0.05) { last.current = t; drawArt(canvas.getContext('2d'), movie, 640, 272, t); artTex.needsUpdate = true }
    if (t - lastS.current > 0.12) {          // sample the picture → the room takes on the colours of the film
      lastS.current = t
      try {
        if (!video || video.v.readyState >= 2) {
          sampler.drawImage(video ? video.v : canvas, 0, 0, 16, 8)
          const px = sampler.getImageData(0, 0, 16, 8).data; let r = 0, g = 0, b = 0
          for (let i = 0; i < px.length; i += 4) { r += px[i]; g += px[i + 1]; b += px[i + 2] }
          const n = px.length / 4; target.setRGB(r / n / 255, g / n / 255, b / n / 255, THREE.SRGBColorSpace)
        }
      } catch (e) { /* ignore */ }
    }
    env.screen.lerp(target, 0.12)
    const lum = Math.min(1, (0.2126 * env.screen.r + 0.7152 * env.screen.g + 0.0722 * env.screen.b) * 3.2)
    tint.copy(env.screen).lerp(WHITE, 0.3)
    if (rect.current) { rect.current.color.copy(tint); rect.current.intensity = (1.4 + dark * 4.2) * (0.3 + lum * 1.9) }
    fill.current.color.copy(tint); fill.current.intensity = (4 + dark * 12) * (0.35 + lum * 1.4) * (lite ? 1.8 : 1)
    beamMat.uniforms.uColor.value.copy(env.screen).lerp(WHITE, 0.55)
    beamMat.uniforms.uOpacity.value = 0.03 + dark * 0.11
    beamMat.uniforms.uTime.value = t
    dustRef.current.rotation.y = t * 0.02; dustMat.current.opacity = 0.06 + dark * 0.4
  })
  const z0 = SCREEN.z + SCREEN.curve
  return <>
    <mesh geometry={geo.mask} position={[0, SCREEN.y, z0 + 0.02]}><meshBasicMaterial color="#000" side={THREE.BackSide} /></mesh>
    <mesh geometry={geo.screen} position={[0, SCREEN.y, z0]}><meshBasicMaterial map={video ? video.t : artTex} color={glowColor('#ffffff', 1.12)} side={THREE.BackSide} toneMapped={false} /></mesh>
    {!lite && <rectAreaLight ref={rect} args={['#ffffff', 2, SCREEN.w, SCREEN.h]} position={[0, SCREEN.y, SCREEN.z + 0.6]} />}
    <pointLight ref={fill} position={[0, SCREEN.y - 1, SCREEN.z + 4]} distance={30} decay={1.5} />
    <group position={geo.from} quaternion={geo.q} scale={[1, 1, SCREEN.h / SCREEN.w]}><mesh geometry={geo.cone} material={beamMat} /></group>
    <group position={geo.from} quaternion={geo.q}><points ref={dustRef} geometry={geo.dust}><pointsMaterial ref={dustMat} size={0.022} color="#e8f0ff" transparent opacity={0.2} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></points></group>
  </>
}

/* ======================= seats ======================= */
function useSeatGeo() {
  return useMemo(() => {
    const seg = LOWPOLY ? 1 : 2
    const rb = (w, h, d, r) => new RoundedBoxGeometry(w, h, d, seg, r)
    const bend = (g, w, k) => { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) / (w / 2); p.setZ(i, p.getZ(i) - k * x * x) } return g }
    const put = (g, rx, at) => { if (rx) g.rotateX(rx); g.translate(at[0], at[1], at[2]); return g }
    const ring = (r, t, y, z) => { const g = LOWPOLY ? new THREE.TorusGeometry(r, t, 4, 10) : new THREE.TorusGeometry(r, t, 6, 18); g.rotateX(Math.PI / 2); g.translate(0, y, z); return g }
    const T = 0.2, TR = 0.24
    return {
      stdUph: merge([
        put(rb(0.5, 0.13, 0.48, 0.055), -0.05, [0, 0.47, -0.02]),                       // cushion
        put(bend(rb(0.5, 0.6, 0.12, 0.05), 0.5, 0.03), T, [0, 0.86, 0.24]),             // backrest (slightly cupped)
        put(bend(rb(0.44, 0.2, 0.12, 0.05), 0.44, 0.025), T, [0, 1.272, 0.323]),        // headrest
      ]),
      stdShell: merge([
        put(bend(rb(0.53, 0.86, 0.05, 0.025), 0.53, 0.03), T, [0, 0.98, 0.335]),        // back shell
        put(rb(0.51, 0.07, 0.46, 0.02), 0, [0, 0.375, -0.01]),                          // seat pan
      ]),
      arm: merge([put(rb(0.05, 0.64, 0.5, 0.02), 0, [0, 0.32, 0.06]), put(rb(0.085, 0.065, 0.56, 0.03), 0, [0, 0.675, 0]), ring(0.042, 0.009, 0.712, -0.215)]),
      armLed: ring(0.033, 0.0055, 0.709, -0.215),
      recUph: merge([
        put(rb(0.76, 0.26, 0.7, 0.05), 0, [0, 0.23, 0]),                                // body
        put(rb(0.72, 0.18, 0.62, 0.08), -0.03, [0, 0.44, -0.05]),                       // seat cushion
        put(rb(0.7, 0.34, 0.1, 0.04), 0, [0, 0.27, -0.37]),                             // leg rest (closed)
        put(bend(rb(0.74, 0.74, 0.26, 0.1), 0.74, 0.04), TR, [0, 0.92, 0.29]),          // plush backrest
        put(bend(rb(0.56, 0.2, 0.16, 0.08), 0.56, 0.03), TR, [0, 1.405, 0.409]),        // pillow
      ]),
      recShell: put(rb(0.8, 0.1, 0.86, 0.03), 0, [0, 0.05, 0]),
      cons: merge([put(rb(0.2, 0.6, 0.84, 0.04), 0, [0, 0.3, 0]), put(rb(0.22, 0.07, 0.84, 0.03), 0, [0, 0.625, 0]), ring(0.045, 0.009, 0.664, -0.3)]),
      consLed: ring(0.036, 0.006, 0.661, -0.3),
      slim: merge([put(rb(0.1, 0.5, 0.56, 0.03), 0, [0, 0.36, 0.02]), put(rb(0.11, 0.06, 0.6, 0.025), 0, [0, 0.64, 0.02])]),
      shadow: (() => { const g = new THREE.PlaneGeometry(0.9, 0.9); g.rotateX(-Math.PI / 2); return g })(),
    }
  }, [])
}
function place(mesh, list, { scale, offset } = {}) {
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sv = new THREE.Vector3(), o = new THREE.Vector3()
  list.forEach((s, i) => {
    q.setFromEuler(e.set(0, s.rot, 0)); p.set(s.x, s.y, s.z)
    if (offset) { const v = offset(s); p.add(o.set(v[0], v[1], v[2]).applyQuaternion(q)) }
    const sc = scale ? scale(s) : [1, 1, 1]; m.compose(p, q, sv.set(sc[0], sc[1], sc[2])); mesh.setMatrixAt(i, m)
  })
  mesh.count = list.length; mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere()
}
const ARMS_STD = arms.filter((a) => !a.royal), ARMS_CON = arms.filter((a) => a.royal && !a.slim), ARMS_SLIM = arms.filter((a) => a.slim), ARMS_EDGE = arms.filter((a) => !a.royal && a.edge)

function Seats({ sel, sold, filter, audience, onToggle, tipRef, tex }) {
  const geo = useSeatGeo(), lite = useLite()
  const R = { stdU: useRef(), stdS: useRef(), recU: useRef(), recS: useRef(), arm: useRef(), armL: useRef(), con: useRef(), conL: useRef(), slim: useRef(), aisle: useRef(), shadow: useRef() }
  const hover = useRef(-1), c = useMemo(() => new THREE.Color(), [])
  const mats = useMemo(() => (lite ? {
    fabric: new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex.fabric, roughness: 0.88 }),
    leather: new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex.leather, roughness: 0.45 }),
    shell: new THREE.MeshStandardMaterial({ color: '#141317', roughness: 0.4, metalness: 0.2 }),
    arm: new THREE.MeshStandardMaterial({ color: '#1c1b20', roughness: 0.45, metalness: 0.25 }),
    con: new THREE.MeshStandardMaterial({ color: '#2a1f1c', map: tex.leather, roughness: 0.5 }),
    led: new THREE.MeshBasicMaterial({ color: glowColor('#4fd8ff', 1.5), toneMapped: false }),
    aisle: new THREE.MeshBasicMaterial({ color: glowColor('#ffd9a0', 2.4), toneMapped: false }),
    shadow: new THREE.MeshBasicMaterial({ map: tex.blob, transparent: true, depthWrite: false, opacity: 0.75 }),
  } : {
    fabric: new THREE.MeshPhysicalMaterial({ color: '#ffffff', map: tex.fabric, normalMap: tex.fabricN, normalScale: new THREE.Vector2(0.7, 0.7), roughness: 0.86, sheen: 0.8, sheenRoughness: 0.5, sheenColor: new THREE.Color('#a8a8a8') }),
    leather: new THREE.MeshPhysicalMaterial({ color: '#ffffff', map: tex.leather, normalMap: tex.leatherN, normalScale: new THREE.Vector2(0.5, 0.5), roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.4 }),
    shell: new THREE.MeshStandardMaterial({ color: '#141317', roughness: 0.36, metalness: 0.25 }),
    arm: new THREE.MeshStandardMaterial({ color: '#1c1b20', roughness: 0.42, metalness: 0.3 }),
    con: new THREE.MeshPhysicalMaterial({ color: '#2a1f1c', map: tex.leather, roughness: 0.48, clearcoat: 0.25 }),
    led: new THREE.MeshBasicMaterial({ color: glowColor('#4fd8ff', 1.5), toneMapped: false }),
    aisle: new THREE.MeshBasicMaterial({ color: glowColor('#ffd9a0', 2.4), toneMapped: false }),
    shadow: new THREE.MeshBasicMaterial({ map: tex.blob, transparent: true, depthWrite: false, opacity: 0.75 }),
  }), [lite])
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats])
  useLayoutEffect(() => {
    const stdSeats = STD.map((i) => seats[i]), recSeats = REC.map((i) => seats[i])
    place(R.stdU.current, stdSeats); place(R.stdS.current, stdSeats); place(R.recU.current, recSeats); place(R.recS.current, recSeats)
    place(R.arm.current, ARMS_STD); place(R.armL.current, ARMS_STD); place(R.con.current, ARMS_CON); place(R.conL.current, ARMS_CON); place(R.slim.current, ARMS_SLIM)
    place(R.aisle.current, ARMS_EDGE, { offset: (a) => [a.edge * 0.03, 0.14, 0.06] })
    place(R.shadow.current, seats, { scale: (s) => (s.cls === 'royal' ? [1.3, 1, 1.25] : [1, 1, 1]), offset: () => [0, 0.007, 0.05] })
  }, [])
  const colorOf = (gi) => {
    const s = seats[gi], base = UPHOLSTERY[s.cls]
    if (sel.includes(s.id)) return '#3ef5e6'
    if (sold.has(s.id)) return audience ? mixHex(base, '#000000', 0.3) : '#2b2629'
    let col = base
    const h = hover.current
    if (h === gi || (s.pair && h >= 0 && seats[h].id === s.pair)) col = mixHex(col, '#ffffff', 0.45)
    if (filter && s.cls !== filter) col = mixHex(col, '#08080a', 0.8)
    return col
  }
  const paint = (list) => {
    ;(list ?? seats.map((_, i) => i)).forEach((gi) => { if (gi < 0 || gi == null) return; const [grp, li] = LOCAL[gi]; c.set(colorOf(gi)); (grp === 'std' ? R.stdU : R.recU).current.setColorAt(li, c) })
    ;[R.stdU, R.recU].forEach((m) => m.current.instanceColor && (m.current.instanceColor.needsUpdate = true))
  }
  useLayoutEffect(() => paint(), [sel, sold, filter, audience])
  const setHover = (gi, e) => {
    const prev = hover.current
    if (gi !== prev) { hover.current = gi; paint([prev, gi].flatMap((k) => (k >= 0 ? [k, byId[seats[k].pair] ?? -1] : []))) }
    const tip = tipRef.current; if (!tip) return
    if (gi < 0) { tip.style.display = 'none'; document.body.style.cursor = ''; return }
    const s = seats[gi], r = tip.parentElement.getBoundingClientRect()
    tip.style.display = 'block'; tip.style.left = e.clientX - r.left + 'px'; tip.style.top = e.clientY - r.top + 'px'
    document.body.style.cursor = sold.has(s.id) ? 'not-allowed' : 'pointer'
    tip.innerHTML = sold.has(s.id) ? `<b>${s.label}</b> · Booked` : `<b>${s.label}</b> · ${CLS[s.cls].name} · ${inr(s.price)}${s.pair ? ' · couple pair' : ''}`
  }
  const ev = (list) => ({
    onPointerMove: (e) => { e.stopPropagation(); if (e.nativeEvent.pointerType === 'mouse') setHover(list[e.instanceId], e.nativeEvent) },
    onPointerOut: (e) => setHover(-1, e.nativeEvent),
    onClick: (e) => { e.stopPropagation(); if (e.delta < 7) onToggle(seats[list[e.instanceId]].id) },
  })
  useEffect(() => () => { document.body.style.cursor = '' }, [])
  const N = seats.length, none = () => null
  return <>
    <instancedMesh ref={R.stdU} args={[geo.stdUph, undefined, STD.length]} material={mats.fabric} {...ev(STD)} />
    <instancedMesh ref={R.stdS} args={[geo.stdShell, undefined, STD.length]} material={mats.shell} raycast={none} />
    <instancedMesh ref={R.recU} args={[geo.recUph, undefined, REC.length]} material={mats.leather} {...ev(REC)} />
    <instancedMesh ref={R.recS} args={[geo.recShell, undefined, REC.length]} material={mats.shell} raycast={none} />
    <instancedMesh ref={R.arm} args={[geo.arm, undefined, ARMS_STD.length]} material={mats.arm} raycast={none} />
    <instancedMesh ref={R.armL} args={[geo.armLed, undefined, ARMS_STD.length]} material={mats.led} raycast={none} />
    <instancedMesh ref={R.con} args={[geo.cons, undefined, ARMS_CON.length]} material={mats.con} raycast={none} />
    <instancedMesh ref={R.conL} args={[geo.consLed, undefined, ARMS_CON.length]} material={mats.led} raycast={none} />
    <instancedMesh ref={R.slim} args={[geo.slim, undefined, ARMS_SLIM.length]} material={mats.con} raycast={none} />
    <instancedMesh ref={R.aisle} args={[undefined, undefined, ARMS_EDGE.length]} material={mats.aisle} raycast={none}><boxGeometry args={[0.012, 0.045, 0.16]} /></instancedMesh>
    <instancedMesh ref={R.shadow} args={[geo.shadow, undefined, N]} material={mats.shadow} raycast={none} renderOrder={1} />
  </>
}

/* ======================= audience in booked seats ======================= */
const CLOTHES = ['#1d2230', '#2a1f1a', '#3a2c22', '#1b2b24', '#2e2e33', '#3b1f24', '#22303f', '#3d3a33', '#4a3b2a', '#141414', '#5a4632', '#283a52', '#4b2030', '#6b6b70']
const SKIN = ['#6b4a35', '#7a543b', '#5a3b28', '#8a6146', '#4a3022', '#9a6e4f']
const HAIR = ['#0d0b0a', '#151110', '#1d1612', '#2a2420', '#0d0b0a', '#57534e']
function usePersonGeo() {
  return useMemo(() => {
    const cap = (r, l) => new THREE.CapsuleGeometry(r, l, LOWPOLY ? 2 : 3, LOWPOLY ? 6 : 8)
    const at = (g, x, y, z) => { g.translate(x, y, z); return g }
    const torso = cap(0.16, 0.3); torso.scale(1.18, 1, 0.72); torso.rotateX(0.2); at(torso, 0, 0.86, 0.11)
    const parts = [torso]
    for (const sd of [-1, 1]) {
      const th = cap(0.075, 0.3); th.rotateX(Math.PI / 2); parts.push(at(th, sd * 0.1, 0.585, -0.1))
      const sh = cap(0.062, 0.34); sh.rotateX(-0.12); parts.push(at(sh, sd * 0.1, 0.32, -0.32))
      const ua = cap(0.05, 0.22); ua.rotateZ(sd * 0.2); ua.rotateX(0.3); parts.push(at(ua, sd * 0.235, 0.93, 0.11))
      const fa = cap(0.044, 0.2); fa.rotateX(Math.PI / 2); parts.push(at(fa, sd * 0.27, 0.752, -0.06))
      parts.push(at(new THREE.BoxGeometry(0.09, 0.07, 0.22), sd * 0.1, 0.035, -0.4))
    }
    const head = new THREE.SphereGeometry(0.1, LOWPOLY ? 10 : 16, LOWPOLY ? 8 : 12); head.scale(0.9, 1.12, 1); at(head, 0, 1.33, 0.2)
    const neck = new THREE.CylinderGeometry(0.046, 0.054, 0.13, 10); at(neck, 0, 1.2, 0.17)
    const hands = [-1, 1].map((sd) => { const h = new THREE.SphereGeometry(0.045, 8, 6); h.scale(0.9, 0.65, 1.35); return at(h, sd * 0.27, 0.755, -0.205) })
    const hair = new THREE.SphereGeometry(0.108, LOWPOLY ? 10 : 16, LOWPOLY ? 6 : 10, 0, Math.PI * 2, 0, Math.PI * 0.6); hair.scale(0.94, 1.12, 1.06); hair.rotateX(0.42); at(hair, 0, 1.345, 0.215)
    const cup = merge([at(new THREE.CylinderGeometry(0.036, 0.028, 0.15, 12), 0.31, 0.78, -0.215), at(new THREE.CylinderGeometry(0.004, 0.004, 0.09, 5), 0.316, 0.88, -0.215)])
    const tub = at(new THREE.CylinderGeometry(0.07, 0.052, 0.15, 14, 1, true), 0.02, 0.71, -0.13)
    const pop = new THREE.SphereGeometry(0.069, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2); pop.scale(1, 0.6, 1); at(pop, 0.02, 0.783, -0.13)
    return { body: merge(parts), skin: merge([head, neck, ...hands]), hair, cup, tub, pop }
  }, [])
}
function Audience({ sold, sel, show, tex }) {
  const geo = usePersonGeo(), N = seats.length
  const body = useRef(), skin = useRef(), hair = useRef(), cups = useRef(), tubs = useRef(), pops = useRef()
  const mats = useMemo(() => ({
    cloth: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.92 }),
    skin: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.62 }),
    hair: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.75 }),
    cup: new THREE.MeshStandardMaterial({ map: tex.cup, roughness: 0.45 }),
    tub: new THREE.MeshStandardMaterial({ map: tex.tub, roughness: 0.6, side: THREE.DoubleSide }),
    pop: new THREE.MeshStandardMaterial({ color: '#f1d27e', roughness: 0.9 }),
  }), [])
  useLayoutEffect(() => {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sv = new THREE.Vector3(), c = new THREE.Color()
    const list = seats.filter((s) => sold.has(s.id) && !sel.includes(s.id))
    let nc = 0, nt = 0
    list.forEach((s, i) => {
      const r = rng(hashStr(s.id + 'person')), sc = 0.92 + r() * 0.14
      q.setFromEuler(e.set(0, s.rot + (r() - 0.5) * 0.16, 0)); p.set(s.x, s.y, s.z)
      if (s.cls === 'royal') p.add(sv.set(0, 0, 0.04).applyQuaternion(q))
      m.compose(p, q, sv.set(sc * (0.95 + r() * 0.1), sc, sc))
      body.current.setMatrixAt(i, m); skin.current.setMatrixAt(i, m); hair.current.setMatrixAt(i, m)
      body.current.setColorAt(i, c.set(CLOTHES[(r() * CLOTHES.length) | 0])); skin.current.setColorAt(i, c.set(SKIN[(r() * SKIN.length) | 0])); hair.current.setColorAt(i, c.set(HAIR[(r() * HAIR.length) | 0]))
      if (s.cls !== 'royal' && r() < 0.42) cups.current.setMatrixAt(nc++, m)
      if (r() < 0.2) { tubs.current.setMatrixAt(nt, m); pops.current.setMatrixAt(nt, m); nt++ }
    })
    body.current.count = skin.current.count = hair.current.count = list.length; cups.current.count = nc; tubs.current.count = pops.current.count = nt
    ;[body, skin, hair, cups, tubs, pops].forEach((r) => { r.current.instanceMatrix.needsUpdate = true; if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true; r.current.computeBoundingSphere() })
  }, [sold, sel])
  const none = () => null
  return <group visible={show}>
    <instancedMesh ref={body} args={[geo.body, mats.cloth, N]} raycast={none} />
    <instancedMesh ref={skin} args={[geo.skin, mats.skin, N]} raycast={none} />
    <instancedMesh ref={hair} args={[geo.hair, mats.hair, N]} raycast={none} />
    <instancedMesh ref={cups} args={[geo.cup, mats.cup, N]} raycast={none} />
    <instancedMesh ref={tubs} args={[geo.tub, mats.tub, N]} raycast={none} />
    <instancedMesh ref={pops} args={[geo.pop, mats.pop, N]} raycast={none} />
  </group>
}

/* picked seats: bobbing check-marks + a cyan glow on the floor */
function Selection({ sel, tex }) {
  const marks = useRef(), glows = useRef()
  useFrame(({ clock, camera }) => {
    marks.current?.children.forEach((c, k) => { c.position.y = c.userData.y + Math.sin(clock.elapsedTime * 3.3 + k) * 0.08; c.visible = camera.position.distanceTo(c.position) > 3.2 })
    glows.current?.children.forEach((c) => (c.visible = camera.position.distanceTo(c.position) > 3))   // no glow under your own feet in seat view
  })
  const list = sel.map((id) => seats[byId[id]]).filter(Boolean)
  return <>
    <group ref={marks}>{list.map((s) => { const y = s.y + (s.cls === 'royal' ? 1.9 : 1.7); return <sprite key={s.id} position={[s.x, y, s.z]} userData={{ y }} scale={[0.5, 0.5, 1]} renderOrder={10}><spriteMaterial map={tex.marker} transparent depthTest={false} /></sprite> })}</group>
    <group ref={glows}>{list.map((s) => <mesh key={s.id} position={[s.x, s.y + 0.012, s.z]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.1, 1.1]} /><meshBasicMaterial map={tex.spill} color={glowColor('#3ef5e6', 1.4)} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></mesh>)}</group>
  </>
}

/* ======================= camera ======================= */
const PRESETS = [[[-10.4, 8.6, 7.5], [1.5, 1.8, -6]], [[0, 3.6, -11.8], [0, 2.6, 6]], [[0, 7.6, 13.6], [0, 4.8, -15]], [[0, 30, 1.2], [0, 0, 0]]]
const TOUR = [PRESETS[0], [[9.5, 4.2, -2], [-2, 2, -10]], [[0, 2.9, -11.8], [0, 3, 6]], [[-9, 3.2, -6], [4, 3, 8]], PRESETS[2]]
const ENTRANCE = [[-8.4, 7.75, 14.3], [-1.5, 5, -10]]
const CameraRig = forwardRef(function CameraRig({ onUserMove, onMode, pose, intro }, ref) {
  const { camera, gl } = useThree()
  const s = useMemo(() => ({ pos: V3(ENTRANCE[0]), tgt: V3(ENTRANCE[1]), dPos: V3(ENTRANCE[0]), dTgt: V3(ENTRANCE[1]), bird: false, tw: null, tour: null, mode: 'orbit', base: [0, 0], look: [0, 0], eye: null }), [])
  const setMode = (m) => { if (s.mode !== m) { s.mode = m; onMode && onMode(m) } }
  const clamp = (v) => {
    v.x = Math.max(-11.2, Math.min(11.2, v.x)); v.z = Math.max(-12.2, Math.min(14.5, v.z))
    const fl = v.z < -11.7 ? 1.2 : floorAt(v.x, v.z)
    v.y = Math.max(fl + 1.0, Math.min(s.bird ? 32 : 11.6, v.y))
    const q = ringZ(v.x, v.z) - CZ
    if (q > PARAPET_R - 0.5 && q < PARAPET_R + 0.5 && v.y < 6.4) v.y = 6.4   // never inside the balcony front
    return v
  }
  const stopTour = () => { s.tour?.kill(); s.tour = null }
  // straight-line glide of camera + target (curved paths cut through walls)
  const glide = (p, t, dur = 1.6, done) => {
    s.tw?.kill(); const p0 = s.dPos.clone(), t0 = s.dTgt.clone(), p1 = V3(p), t1 = V3(t), o = { k: 0 }
    s.tw = gsap.to(o, { k: 1, duration: dur, ease: 'power2.inOut', onUpdate: () => { s.dPos.lerpVectors(p0, p1, o.k); s.dTgt.lerpVectors(t0, t1, o.k) }, onComplete: done })
  }
  const toSeat = (st, dur = 1.8) => {
    stopTour(); s.bird = false; setMode('orbit')
    const eye = [st.x + Math.sin(st.rot) * 0.12, st.y + 1.22, st.z + Math.cos(st.rot) * 0.12], look = [st.x * 0.2, SCREEN.y - 0.4, SCREEN.z]
    glide(eye, look, dur, () => { const d = V3(look).sub(V3(eye)); s.base = [Math.atan2(d.x, -d.z), Math.atan2(d.y, Math.hypot(d.x, d.z))]; s.look = [0, 0]; s.eye = V3(eye); setMode('seat') })
  }
  const view = (i) => {
    stopTour(); setMode('orbit'); s.bird = i === 3
    if (i === 4) { s.tour = gsap.timeline({ repeat: -1 }); TOUR.forEach(([p, t]) => s.tour.call(() => glide(p, t, 2.6)).to({}, { duration: 3.4 })); return }
    glide(...PRESETS[i])
  }
  useImperativeHandle(ref, () => ({
    view,
    focus(win) { stopTour(); setMode('orbit'); s.bird = false; const m = win[Math.floor(win.length / 2)]; glide([m.x * 0.6, m.y + 3.2, m.z + 4.2], [m.x * 0.3, m.y + 0.4, m.z - 6]) },
    seatView: (st) => toSeat(st),
    exitSeat: () => view(0),
  }))
  useEffect(() => {   // walk in through the back door, curtains open, glide to the overview (or to your seat)
    const id = setTimeout(() => (intro?.seat ? toSeat(intro.seat, 3) : glide(...PRESETS[0], 3.2)), 450)
    return () => clearTimeout(id)
  }, [])
  useEffect(() => {
    const el = gl.domElement, ptrs = new Map(); let pinch = 0
    const user = () => { stopTour(); s.tw?.kill(); onUserMove && onUserMove() }
    const orbit = (dx, dy) => {
      const off = s.dPos.clone().sub(s.dTgt), sph = new THREE.Spherical().setFromVector3(off)
      sph.theta -= dx * 0.006; sph.phi = Math.max(0.12, Math.min(1.62, sph.phi - dy * 0.005)); off.setFromSpherical(sph); s.dPos.copy(s.dTgt).add(off); clamp(s.dPos)
    }
    const look = (dx, dy) => { s.look[0] = Math.max(-1.25, Math.min(1.25, s.look[0] - dx * 0.0035)); s.look[1] = Math.max(-0.55, Math.min(0.65, s.look[1] + dy * 0.003)) }
    const zoom = (f) => { if (s.mode === 'seat') setMode('orbit'); const off = s.dPos.clone().sub(s.dTgt); off.setLength(Math.max(2.5, Math.min(28, off.length() * f))); s.dPos.copy(s.dTgt).add(off); clamp(s.dPos) }
    const dist = () => { const p = [...ptrs.values()]; return p.length < 2 ? 0 : Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) }
    const down = (e) => { ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); pinch = dist() }
    const move = (e) => {
      const p = ptrs.get(e.pointerId); if (!p) return
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY
      if (Math.abs(dx) + Math.abs(dy) < 0.5) return
      user()
      if (ptrs.size === 2) { const d = dist(); if (pinch) zoom(pinch / d); pinch = d }
      else if (s.mode === 'seat') look(dx, dy)
      else orbit(dx, dy)
    }
    const up = (e) => { ptrs.delete(e.pointerId); pinch = dist() }
    const wheel = (e) => { e.preventDefault(); user(); zoom(Math.exp(e.deltaY * 0.0012)) }
    el.addEventListener('pointerdown', down); addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up); el.addEventListener('wheel', wheel, { passive: false })
    return () => { el.removeEventListener('pointerdown', down); removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); el.removeEventListener('wheel', wheel); stopTour(); s.tw?.kill() }
  }, [])
  useFrame((st) => {
    if (s.mode === 'seat' && s.eye) {
      const yw = s.base[0] + s.look[0], pt = s.base[1] + s.look[1]
      s.dPos.copy(s.eye); s.dTgt.set(s.eye.x + Math.sin(yw) * Math.cos(pt) * 10, s.eye.y + Math.sin(pt) * 10, s.eye.z - Math.cos(yw) * Math.cos(pt) * 10)
      s.pos.lerp(s.dPos, 0.2); s.tgt.lerp(s.dTgt, 0.2)
    } else { s.pos.lerp(s.dPos, 0.12); s.tgt.lerp(s.dTgt, 0.12); clamp(s.pos) }   // never through walls
    camera.position.copy(s.pos); camera.lookAt(s.tgt)
    const asp = st.size.width / st.size.height, fov = asp < 1 ? 68 : 55
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix() }
    if (pose) { pose.x = s.pos.x; pose.z = s.pos.z; pose.deg = (Math.atan2(s.tgt.x - s.pos.x, -(s.tgt.z - s.pos.z)) * 180) / Math.PI }
  })
  return null
})

/* soft reflections on leather, metal and glass */
function Env({ env }) {
  const { gl, scene } = useThree(), lite = useLite()
  useEffect(() => {
    if (lite) return
    const pm = new THREE.PMREMGenerator(gl), map = pm.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = map
    return () => { scene.environment = null; map.dispose(); pm.dispose() }
  }, [lite])
  useFrame(() => { scene.environmentIntensity = 0.05 + 0.2 * env.lvl })
  return null
}
function Lights({ env }) {
  const grp = useRef(), amb = useRef(), hemi = useRef(), back = useRef(), dir = useRef(), lite = useLite()
  const spots = useMemo(() => [[-6.5, -7.5], [6.5, -7.5], [-6.5, 0.2], [6.5, 0.2], [-6, 7.6], [6, 7.6]].map(([x, z]) => {
    const l = new THREE.SpotLight('#ffd9ae', 0, 26, 0.78, 0.9, 1.25); l.position.set(x, 11.8, z); l.target.position.set(x * 0.85, 0, z + 0.5); return l
  }), [])
  // low quality: no spotlights (each one costs on every pixel) — brighter soft light instead
  useLayoutEffect(() => {
    if (lite) return
    const g = grp.current; spots.forEach((l) => { g.add(l); g.add(l.target) })
    return () => spots.forEach((l) => { g.remove(l); g.remove(l.target) })
  }, [lite])
  useEffect(() => () => spots.forEach((l) => l.dispose()), [])
  useFrame(() => {
    const l = env.lvl
    amb.current.intensity = lite ? 0.12 + 0.5 * l : 0.05 + 0.32 * l
    hemi.current.intensity = lite ? 0.1 + 1.05 * l : 0.04 + 0.6 * l
    back.current.intensity = 2 + 12 * l
    if (dir.current) dir.current.intensity = 1.5 * l
    if (!lite) spots.forEach((s) => (s.intensity = 90 * l))
  })
  return <group ref={grp}>
    <ambientLight ref={amb} color="#ffe2cc" />
    <hemisphereLight ref={hemi} args={['#ffd9bd', '#1a0709', 1]} />
    <pointLight ref={back} position={[0, 9.5, 12.5]} color="#ffcf9a" distance={16} decay={1.5} />
    {lite && <directionalLight ref={dir} position={[2, 14, 4]} color="#ffdcb8" />}
  </group>
}

function Effects({ q }) {
  if (q === 'low') return null
  return <EffectComposer multisampling={0} disableNormalPass>
    {q === 'high' && <N8AO halfRes aoRadius={0.9} distanceFalloff={0.8} intensity={2.6} quality="performance" color="#050307" />}
    <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.85} radius={0.72} />
    <Noise premultiply opacity={0.28} />
    <Vignette offset={0.28} darkness={0.62} />
    <SMAA />
  </EffectComposer>
}

const Hall = forwardRef(function Hall({ movie, sel, sold, filter, onToggle, lightsOn, hd, sound, audience = true, onUserMove, onMode, tipRef, pose, intro }, ref) {
  const tex = useMemo(makeTextures, [])
  useEffect(() => () => { Object.values(tex).forEach((t) => (t && t.isTexture ? t.dispose() : t && typeof t === 'object' && Object.values(t).forEach((x) => x.dispose && x.dispose()))) }, [])
  const env = useMemo(() => ({ lvl: 1, screen: new THREE.Color('#8fa8ff') }), [])
  useEffect(() => { const tw = gsap.to(env, { lvl: lightsOn ? 1 : 0, duration: 1.8, ease: 'power2.inOut' }); return () => tw.kill() }, [lightsOn])
  const forced = useMemo(() => { try { return new URLSearchParams(location.search).get('q') } catch (e) { return null } }, [])
  const [auto, setAuto] = useState(MOBILE ? 'mid' : 'high')
  useEffect(() => { if (forced) gsap.ticker.lagSmoothing(0) }, [])   // test mode (?q=…): keep animations on real time even when frames are slow
  const q = forced || (!hd ? 'low' : auto)
  return (
    <Canvas dpr={q === 'high' ? [1, 2] : q === 'mid' ? [1, 1.5] : 0.75} camera={{ fov: 55, near: 0.1, far: 120, position: ENTRANCE[0] }} gl={{ antialias: q === 'low', powerPreference: 'high-performance' }}
      onCreated={({ gl }) => { gl.toneMappingExposure = 1.1 }} onPointerMissed={() => tipRef.current && (tipRef.current.style.display = 'none')}>
      {!forced && hd && <PerformanceMonitor flipflops={2} onDecline={() => setAuto((a) => (a === 'high' ? 'mid' : 'low'))} onFallback={() => setAuto('low')} />}
      <QCtx.Provider value={q}>
      <color attach="background" args={['#040305']} />
      <fogExp2 attach="fog" args={['#06050a', 0.011]} />
      <Env env={env} />
      <Lights env={env} />
      <Floor tex={tex} />
      <Walls tex={tex} env={env} />
      <Ceiling env={env} />
      <Doors tex={tex} />
      <Curtains intro={!!intro} />
      <Screen movie={movie} env={env} sound={sound} tex={tex} />
      <Seats sel={sel} sold={sold} filter={filter} audience={audience} onToggle={onToggle} tipRef={tipRef} tex={tex} />
      <Audience sold={sold} sel={sel} show={audience} tex={tex} />
      <Selection sel={sel} tex={tex} />
      <CameraRig ref={ref} onUserMove={onUserMove} onMode={onMode} pose={pose} intro={intro} />
      <Effects q={q} />
      </QCtx.Provider>
    </Canvas>
  )
})
export default Hall
