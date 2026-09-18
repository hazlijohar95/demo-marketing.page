import { useState } from "react"

import Reveal from "./Reveal.jsx"

const STAGES = [
  {
    id: "workspace",
    n: "01",
    title: "Workspace",
    state: "durable · max 10",
    color: "#9ae600",
    detail: "Durable parent. No delete API. Holds multiple Sandboxes.",
  },
  {
    id: "sandbox",
    n: "02",
    title: "Sandbox",
    state: "pending → running",
    color: "#51a2ff",
    detail: "Isolated instance. A full Linux VM by default; vmSandbox:false for gVisor.",
  },
  {
    id: "execute",
    n: "03",
    title: "Execute",
    state: "120s · 256KB",
    color: "#a684ff",
    detail: "Structured argv. Non-zero exit still HTTP 200 — check flags.",
  },
  {
    id: "running",
    n: "04",
    title: "Running",
    state: "no automatic expiry",
    color: "var(--bx-faint)",
    detail: "A VM keeps running, and billing, until you delete it. gVisor Sandboxes go cold when idle.",
  },
  {
    id: "logs",
    n: "05",
    title: "Logs",
    state: "~30d · no wake",
    color: "#ffb900",
    detail: "Query workload / execute / process output without starting compute.",
  },
  {
    id: "delete",
    n: "06",
    title: "Delete",
    state: "removes instance",
    color: "#ff8904",
    detail: "Deletes the Sandbox, its filesystem, and log access. Workspace and siblings stay.",
  },
]

export default function LifecycleFlow() {
  const [active, setActive] = useState(0)
  return (
    <Reveal data-component="lifecycle" role="group" aria-label="Sandbox lifecycle">
      {/* Toggle buttons, not radios: `radiogroup` on the <ol> put a `listitem`
          between the group and its radios, and no arrow-key selection exists. */}
      <ol data-slot="lifecycle-track" aria-label="Lifecycle stages">
        {STAGES.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              data-active={i === active ? "true" : i < active ? "done" : undefined}
              onClick={() => setActive(i)}
              aria-pressed={i === active}
              style={{ "--stage-color": s.color }}
            >
              <span data-slot="lc-n">{s.n}</span>
              <strong data-slot="lc-title">{s.title}</strong>
              <span data-slot="lc-state">{s.state}</span>
              <span data-slot="lc-bar" aria-hidden="true">
                <b />
              </span>
            </button>
            {i < STAGES.length - 1 ? <span data-slot="lc-link" aria-hidden="true" /> : null}
          </li>
        ))}
      </ol>
      {/* Stable live region; the keyed inner span carries the entrance animation.
          The title stays --bx-text for 4.5:1: stage hex is chart ink for the
          bar only, not body copy. */}
      <p data-slot="lifecycle-foot" role="status">
        <span key={active}>
          <strong>{STAGES[active].title}.</strong> {STAGES[active].detail}
        </span>
      </p>
    </Reveal>
  )
}
