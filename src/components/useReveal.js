import { useLayoutEffect } from 'react'
import gsap from 'gsap'

// GSAP ScrollTrigger: fade/slide in every `.reveal` element inside ref
export function useReveal(ref, deps = []) {
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.reveal').forEach((el) =>
        gsap.fromTo(el, { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } }))
    }, ref)
    return () => ctx.revert()
  }, deps)
}
