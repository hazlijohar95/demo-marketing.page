import { useState } from "react"

import Reveal from "./Reveal.jsx"
import { CHART_COLORS, MetricBar } from "./MetricBar.jsx"

const STATS = [
  {
    rank: "01",
    value: "120s",
    label: "default timeout · max 900s",
    fill: (120 / 900) * 100,
    color: CHART_COLORS.timeout,
    detail: "timeoutSeconds 1–900. Sync execute waits; durable ops poll.",
  },
  {
    rank: "02",
    value: "256KB",
    label: "default output cap · max 1M",
    fill: (262144 / 1048576) * 100,
    color: CHART_COLORS.output,
    detail: "maxOutputBytes per stream. Check truncation flags.",
  },
  {
    rank: "03",
    value: "10",
    label: "workspaces max · no delete API",
    fill: 100,
    color: CHART_COLORS.workspaces,
    detail: "Workspaces are durable parents. Sandboxes deleted explicitly.",
  },
  {
    rank: "04",
    value: "/ws",
    label: "scoped paths · /workspace only",
    fill: 100,
    color: CHART_COLORS.files,
    detail: "cwd, argv, files all scoped. No shell joining.",
  },
]

export default function HeroStats() {
  const [active, setActive] = useState(0)
  return (
    <Reveal data-component="hero-stats" role="group" aria-label="API bounds at a glance">
      <div data-slot="hero-stats-head">
        <span>Bounds, not promises</span>
        <span>public v2 API</span>
      </div>
      <ol role="radiogroup" aria-label="API bounds">
        {STATS.map((s, i) => (
          <li key={s.rank}>
            <button
              type="button"
              role="radio"
              data-active={i === active ? "true" : undefined}
              onClick={() => setActive(i)}
              aria-checked={i === active}
            >
              <span data-slot="hs-rank">{s.rank}</span>
              <strong data-slot="hs-value">{s.value}</strong>
              <span data-slot="hs-label">{s.label}</span>
              <span aria-hidden="true">
                <MetricBar
                  fill={s.fill}
                  color={s.color}
                  active={i === active}
                  label={`${s.value} ${s.label}`}
                />
              </span>
            </button>
          </li>
        ))}
      </ol>
      <p data-slot="hero-stats-foot" role="status">
        {STATS[active].detail}
      </p>
    </Reveal>
  )
}
