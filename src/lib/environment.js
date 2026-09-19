// Client environment: every SSR-safe read of the browser lives here.
// MatchMedia queries, the OS theme, motion preference, in-view observation
// and the isomorphic layout effect share one seam, so islands import from
// one module instead of five shallow ones that each guard `typeof window`
// on their own.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"

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

export function prefersReducedMotion() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function getMedia(query) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null
  }
  return window.matchMedia(query)
}

// SSR-safe media query hook. Returns `fallback` on the server.
export function useMediaQuery(query, fallback = false) {
  // One MediaQueryList per query: creating it here (not per snapshot)
  // keeps subscribe/snapshot stable so the store doesn't resubscribe
  // on every render.
  const media = useMemo(() => getMedia(query), [query])
  const subscribe = useCallback(
    (onChange) => {
      if (!media) return () => {}
      media.addEventListener("change", onChange)
      return () => media.removeEventListener("change", onChange)
    },
    [media],
  )
  const getSnapshot = useCallback(() => media?.matches ?? fallback, [media, fallback])
  const getServerSnapshot = useCallback(() => fallback, [fallback])
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

// SSR-safe system theme for Astro islands: "light" on the server, then
// subscribed to OS changes on the client. Built on useMediaQuery so there
// is exactly one matchMedia subscription pattern in the codebase.
export function useSystemTheme() {
  return useMediaQuery("(prefers-color-scheme: dark)") ? "dark" : "light"
}

// Layout effect on the client (so first paint already reflects post-mount
// state), passive effect on the server (where layout effects are a no-op
// warning). For islands that must commit DOM measurements or GL setup
// before the browser paints on hydration.
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect

// Shared one-shot in-view hook. Consolidates the lazy-mount pattern
// previously copy-pasted across MetricBar, DotField, StageBackdrop and
// PostCover: reduced-motion users resolve instantly, everyone else via
// onVisible.
export function useInView(threshold = 0.12) {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    if (prefersReducedMotion()) {
      setSeen(true)
      return
    }
    return onVisible(el, () => setSeen(true), threshold)
  }, [seen, threshold])

  return [ref, seen]
}
