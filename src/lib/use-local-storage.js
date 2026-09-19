import { useCallback, useState } from "react"

// useState backed by localStorage. SSR-safe: reads lazily, writes in an
// effect-safe setter, and tolerates private-mode quota errors.
export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return initial
    try {
      const stored = window.localStorage.getItem(key)
      return stored ?? initial
    } catch {
      return initial
    }
  })

  const set = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next
        try {
          window.localStorage.setItem(key, resolved)
        } catch {
          // Private mode: the toggle still works for this visit.
        }
        return resolved
      })
    },
    [key],
  )

  return [value, set]
}
