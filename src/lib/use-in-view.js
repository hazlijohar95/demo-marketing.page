import { useEffect, useRef, useState } from "react"

import { onVisible } from "./visible.js"
import { prefersReducedMotion } from "./reduced-motion.js"

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
