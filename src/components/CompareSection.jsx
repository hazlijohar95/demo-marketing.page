import { useState } from "react"
import { Check, Minus } from "lucide-react"

import SectionHeading from "./SectionHeading.jsx"
import Reveal from "./Reveal.jsx"
import { CHART_COLORS } from "./MetricBar.jsx"

const COLUMNS = ["Ephemeral sandboxes", "Cloud dev machines", "DIY containers"]

const ROWS = [
  {
    label: "Resumes between sessions",
    color: CHART_COLORS.workspaces,
    us: { state: "yes", text: "Workspaces persist, cold resume" },
    others: ["Hours, then gone", "Yes, per seat", "If you babysit it"],
  },
  {
    label: "Isolated Sandbox per task",
    color: CHART_COLORS.timeout,
    us: { state: "yes", text: "Isolated Sandbox" },
    others: ["Usually microVMs", "Usually containers", "You build it"],
  },
  {
    label: "Stays observable across reconnects",
    color: CHART_COLORS.ops,
    us: { state: "yes", text: "Durable ops + retained logs" },
    others: ["Varies", "A terminal", "You build it"],
  },
  {
    label: "Works with any model or framework",
    color: CHART_COLORS.violet,
    us: { state: "yes", text: "SDK, CLI, HTTP" },
    others: ["SDK-shaped", "Editor-shaped", "Anything, DIY"],
  },
  {
    label: "Bounded, auditable commands",
    color: CHART_COLORS.output,
    us: { state: "yes", text: "Structured, time-boxed" },
    others: ["Varies", "A terminal", "You build it"],
  },
  {
    label: "Private option",
    color: CHART_COLORS.files,
    us: { state: "yes", text: "Self-hosted via CLI" },
    others: ["Enterprise tiers", "Yes", "Obviously"],
  },
]

const FOCUS = ["BoxCompute", ...COLUMNS]

export default function CompareSection() {
  const [focus, setFocus] = useState(0)
  return (
    <section data-section="compare" id="compare" aria-labelledby="compare-title">
      <div data-slot="section-header">
        <Reveal>
          <SectionHeading
            id="compare"
            strong="Why not just spin up a container?"
            rest="You could. Here is what changes."
          />
          <p>Snippet-runners execute and die. BoxCompute resumes.</p>
        </Reveal>
        <Reveal delay={100} data-component="demo-controls">
          <div data-component="scenario-pills" role="group" aria-label="Highlight column">
            {FOCUS.map((c, i) => (
              <button
                key={c}
                type="button"
                data-active={i === focus}
                onClick={() => setFocus(i)}
                aria-pressed={i === focus}
              >
                {c.split(" ")[0]}
              </button>
            ))}
          </div>
        </Reveal>
      </div>
      <Reveal>
        <div data-component="compare-scroll">
          <table data-component="compare-table" data-focus={focus}>
            <thead>
              <tr>
                <th scope="col">
                  <span data-slot="visually-hidden">Capability</span>
                </th>
                <th scope="col" data-col="us" data-dim={focus !== 0 ? "true" : undefined}>
                  BoxCompute
                </th>
                {COLUMNS.map((column, i) => (
                  <th
                    scope="col"
                    key={column}
                    data-dim={focus !== 0 && focus !== i + 1 ? "true" : undefined}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label}>
                  <th scope="row">
                    <i data-slot="row-dot" style={{ background: row.color }} aria-hidden="true" />
                    {row.label}
                  </th>
                  <td
                    data-col="us"
                    data-state={row.us.state}
                    data-dim={focus !== 0 ? "true" : undefined}
                  >
                    <Check aria-hidden="true" /> {row.us.text}
                  </td>
                  {row.others.map((cell, i) => (
                    <td
                      key={`${row.label}-${i}`}
                      data-state={cell === "You build it" || cell === "A terminal" ? "no" : undefined}
                      data-dim={focus !== 0 && focus !== i + 1 ? "true" : undefined}
                    >
                      {cell === "You build it" || cell === "A terminal" ? (
                        <>
                          <Minus aria-hidden="true" /> {cell}
                        </>
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p data-slot="compare-note">
          Patterns, not vendors. Does your agent run a snippet, or a job that continues?
        </p>
      </Reveal>
    </section>
  )
}
