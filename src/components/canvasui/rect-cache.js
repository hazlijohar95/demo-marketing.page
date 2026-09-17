// Vendored from Canvas UI (https://github.com/DavidHDev/canvas-ui,
// src/lib/rect-cache.ts) — Copyright (c) 2026 David Haz, MIT + Commons
// Clause. Converted to plain JS for this site's islands; logic unchanged.
export function createRectCache(element) {
  let current = element.getBoundingClientRect()

  const refresh = () => {
    current = element.getBoundingClientRect()
  }

  const observer = new ResizeObserver(refresh)
  observer.observe(element)
  window.addEventListener("resize", refresh, { passive: true })
  window.addEventListener("scroll", refresh, {
    capture: true,
    passive: true,
  })

  return {
    get current() {
      return current
    },
    destroy() {
      observer.disconnect()
      window.removeEventListener("resize", refresh)
      window.removeEventListener("scroll", refresh, true)
    },
  }
}
