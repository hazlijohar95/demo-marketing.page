import { useCallback, useState } from "react"

// Vanilla storage access with the same private-mode tolerance as the hook,
// so non-React modules (docs language switcher) share the policy instead of
// re-writing try/catch around localStorage.
export function readStored(key, fallback = null) {
  if (typeof window === "undefined") return fallback
  try {
    return window.localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

export function writeStored(key, value) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Private mode: callers still work for this visit.
  }
}

// useState backed by localStorage. SSR-safe: reads lazily, writes in an
// effect-safe setter, and tolerates private-mode quota errors.
export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => readStored(key, initial))

  const set = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next
        writeStored(key, resolved)
        return resolved
      })
    },
    [key],
  )

  return [value, set]
}
