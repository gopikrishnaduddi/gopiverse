export function confetti() {
  const c = document.createElement('canvas'); c.className = 'confetti'; document.body.appendChild(c); c.width = innerWidth; c.height = innerHeight
  const x = c.getContext('2d')
  const P = Array.from({ length: 140 }, () => ({ x: innerWidth / 2, y: innerHeight * 0.3, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 12 - 3, c: ['#f7b928', '#2ee6c5', '#ff3d55', '#9b6bff', '#fff'][(Math.random() * 5) | 0], r: Math.random() * 6 + 3, a: Math.random() * 6 }))
  let n = 0
  const f = () => { x.clearRect(0, 0, c.width, c.height); P.forEach((p) => { p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.a += 0.2; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore() }); if (++n < 150) requestAnimationFrame(f); else c.remove() }
  f()
}
