// Fire `callback` once `el` is meaningfully inside the viewport.
// IntersectionObserver is primary; a rect check on mount, scroll, and
// visibilitychange covers backgrounded tabs where IO never delivers.
export function onVisible(el, callback, threshold = 0.12) {
  let done = false
  let io = null
  const timers = []

  function cleanup() {
    window.removeEventListener("scroll", check)
    window.removeEventListener("resize", check)
    window.removeEventListener("hashchange", check)
    window.removeEventListener("load", check)
    document.removeEventListener("visibilitychange", onVisibility)
    timers.forEach((id) => window.clearTimeout(id))
    if (io) io.disconnect()
  }

  function finish() {
    if (done) return
    done = true
    cleanup()
    callback()
  }

  function check() {
    if (done || !el.isConnected) return
    const rect = el.getBoundingClientRect()
    const vh = window.innerHeight || document.documentElement.clientHeight
    const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0)
    if (visible > 0 && visible / Math.min(rect.height, vh) >= threshold) finish()
  }

  function onVisibility() {
    if (!document.hidden) check()
  }

  check()
  if (!done && typeof IntersectionObserver !== "undefined") {
    io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) finish()
    }, { threshold })
    io.observe(el)
  }
  window.addEventListener("scroll", check, { passive: true })
  window.addEventListener("resize", check)
  window.addEventListener("hashchange", check)
  window.addEventListener("load", check)
  document.addEventListener("visibilitychange", onVisibility)
  // Anchor jumps and late layout can land after mount without emitting
  // anything observable in a backgrounded tab — re-check on a short taper.
  for (const ms of [100, 400, 1000, 2500]) timers.push(window.setTimeout(check, ms))
  return cleanup
}
