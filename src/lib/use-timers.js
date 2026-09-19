import { useCallback, useEffect, useRef } from "react"

// One timer bag per owner. The stream playback and the guided tour each
// managed their own bag plus an identical unmount cleanup; any fix to that
// discipline (e.g. clearing on unmount) had to land twice. Schedule through
// the bag and both owners share it.
export function useTimerBag() {
  const timers = useRef([])

  useEffect(() => {
    const bag = timers.current
    return () => {
      bag.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  const clear = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }, [])

  const schedule = useCallback((ms, fn) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  return { schedule, clear }
}
