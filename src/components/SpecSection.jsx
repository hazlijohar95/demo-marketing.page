import { useState } from "react"

import SectionHeading from "./SectionHeading.jsx"
import Reveal from "./Reveal.jsx"
import { CHART_COLORS, MetricBar } from "./MetricBar.jsx"

// A bar only earns its place where the number is a share of a ceiling
// (default vs max). Isolation, argv counts, transfer size and retention
// windows have no such ratio — a full bar there reads as "maxed out"
// and a partial one as "running low", both meaningless. fill: null = no bar.
const SPECS = [
  {
    rank: "01",
    term: "Isolation",
    value: "non-VM",
    label: "default · VM beta approval-only",
    fill: null,
    color: CHART_COLORS.workspaces,
    detail: "SDK + CLI create ordinary Sandboxes. vmSandbox:true needs approval, direct HTTP only.",
  },
  {
    rank: "02",
    term: "Timeout",
    value: "120s",
    label: "default · 1–900s whole seconds",
    fill: (120 / 900) * 100,
    color: CHART_COLORS.timeout,
    detail: "Non-zero exit is still HTTP 200. Inspect exitCode + timedOut.",
  },
  {
    rank: "03",
    term: "Output",
    value: "256KB",
    label: "default · 1–1,048,576 / stream",
    fill: 25,
    color: CHART_COLORS.output,
    detail: "Check stdoutTruncated / stderrTruncated before trusting output.",
  },
  {
    rank: "04",
    term: "Argv + Env",
    value: "64 / 64",
    label: "entries · 8,192 chars each",
    fill: null,
    color: CHART_COLORS.argv,
    detail: "Structured argv, no shell joining. cwd + files under /workspace.",
  },
  {
    rank: "05",
    term: "Files",
    value: "8 MiB",
    label: "per transfer · paged + conditional",
    fill: null,
    color: CHART_COLORS.files,
    detail: "Binary-safe reads, hash-guarded edits. No checkpoints, forks, volumes.",
  },
  {
    rank: "06",
    term: "Retain",
    value: "24h / 30d",
    label: "ops output · logs nominal",
    fill: null,
    color: CHART_COLORS.ops,
    detail: "Ops expire 24h after finish. Logs readable cold ~30d, not an archive.",
  },
]

export default function SpecSection() {
  const [active, setActive] = useState(1)
  return (
    <section data-section="spec" id="spec" aria-labelledby="spec-title">
      <div data-slot="section-header">
        <Reveal>
          <SectionHeading id="spec" strong="Bounds, not promises." rest="Public v2 API." />
          <p>Defaults you set per call, ceilings you can&rsquo;t. Select a row for the rule behind it.</p>
        </Reveal>
        <Reveal delay={100}>
          <div data-slot="spec-legend" aria-hidden="true">
            <span>bar = default share of its ceiling</span>
          </div>
        </Reveal>
      </div>
      <Reveal>
        <div data-component="spec-board">
          <ol role="radiogroup" aria-label="Workspace specs">
            {SPECS.map((s, i) => (
              <li key={s.rank}>
                <button
                  type="button"
                  role="radio"
                  data-active={i === active ? "true" : undefined}
                  onClick={() => setActive(i)}
                  aria-checked={i === active}
                >
                  <span data-slot="spec-rank">{s.rank}</span>
                  <span data-slot="spec-term">{s.term}</span>
                  <strong data-slot="spec-value">{s.value}</strong>
                  <span data-slot="spec-label">{s.label}</span>
                  {s.fill == null ? null : (
                    <span aria-hidden="true">
                      <MetricBar
                        fill={s.fill}
                        color={s.color}
                        active={i === active}
                        label={`${s.term} ${s.value} ${s.label}`}
                      />
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ol>
          <p data-slot="spec-foot" role="status">
            <strong>{SPECS[active].term}.</strong> {SPECS[active].detail}
          </p>
        </div>
      </Reveal>
    </section>
  )
}
