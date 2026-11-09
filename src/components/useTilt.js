import { useEffect } from 'react'

// 3D tilt + moving light glare on hover (mouse only). Add className "tilt" to the element.
export function useTilt(ref, { max = 8, scale = 1.02 } = {}) {
  useEffect(() => {
    const el = ref.current
    if (!el || (typeof matchMedia !== 'undefined' && matchMedia('(hover: none)').matches)) return
    let raf = 0
    const move = (e) => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.transform = `perspective(900px) rotateX(${((0.5 - y) * max).toFixed(2)}deg) rotateY(${((x - 0.5) * max).toFixed(2)}deg) scale(${scale})`
        el.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); el.style.setProperty('--my', (y * 100).toFixed(1) + '%')
      })
    }
    const leave = () => { cancelAnimationFrame(raf); el.style.transform = '' }
    el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave)
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); cancelAnimationFrame(raf) }
  }, [])
}
