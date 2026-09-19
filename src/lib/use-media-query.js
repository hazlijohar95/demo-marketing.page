import { useCallback, useMemo, useSyncExternalStore } from "react"

function getMedia(query) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null
  }
  return window.matchMedia(query)
}

function snapshotMedia(query, fallback = false) {
  return getMedia(query)?.matches ?? fallback
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
