import { useEffect, useRef, useState } from "react"

import { onVisible } from "../lib/visible.js"
import { prefersReducedMotion } from "../lib/reduced-motion.js"

export const CHART_COLORS = {
  timeout: "#51a2ff",
  output: "#a684ff",
  argv: "#ed6aff",
  env: "#00d5be",
  workspaces: "#9ae600",
  files: "#00d3f2",
  ops: "#ffb900",
  logs: "#ff8904",
  success: "#00bc7d",
  violet: "#7c86ff",
}

function useInView() {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) {
      setSeen(true)
      return
    }
    return onVisible(el, () => setSeen(true), 0.2)
  }, [])
  return [ref, seen]
}

export function MetricBar({ fill = 0, color = "var(--bx-accent)", active = false, label }) {
  const [ref, seen] = useInView()
  const pct = Math.max(0, Math.min(100, fill))
  return (
    <span
      ref={ref}
      data-component="metric-bar"
      data-active={active ? "true" : undefined}
      role="img"
      aria-label={label}
    >
      <b
        aria-hidden="true"
        style={{ transform: `scaleX(${seen ? pct / 100 : 0})`, background: color }}
      />
      <em aria-hidden="true" />
    </span>
  )
}
