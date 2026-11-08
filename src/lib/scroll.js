// scroll helper that cooperates with Lenis smooth scrolling
export function scrollToEl(el, offset = -80) {
  if (!el) return
  if (window.__lenis) window.__lenis.scrollTo(el, { offset, duration: 1.2 })
  else window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + offset, behavior: 'smooth' })
}
