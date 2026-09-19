import { useInView } from "../lib/use-in-view.js"

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

export function MetricBar({ fill = 0, color = "var(--bx-accent)", active = false, label }) {
  const [ref, seen] = useInView(0.2)
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
