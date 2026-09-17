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
    state: "cold ↔ running",
    color: "#51a2ff",
    detail: "Isolated instance. Ordinary non-VM by default via SDK/CLI.",
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
    id: "cold",
    n: "04",
    title: "Cold",
    state: "idle stops compute",
    color: "var(--bx-faint)",
    detail: "Files under /workspace stay. Don't delete just because idle.",
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
    detail: "Deletes Sandbox + log access. Workspace and siblings stay.",
  },
]

export default function LifecycleFlow() {
  const [active, setActive] = useState(2)
  return (
    <Reveal data-component="lifecycle" role="group" aria-label="Sandbox lifecycle">
      <ol data-slot="lifecycle-track" role="radiogroup" aria-label="Lifecycle stages">
        {STAGES.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              role="radio"
              data-active={i === active ? "true" : i < active ? "done" : undefined}
              onClick={() => setActive(i)}
              aria-checked={i === active}
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
      <p key={active} data-slot="lifecycle-foot" role="status">
        <strong style={{ color: STAGES[active].color }}>{STAGES[active].title}.</strong>{" "}
        {STAGES[active].detail}
      </p>
    </Reveal>
  )
}
