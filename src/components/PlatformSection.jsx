import { GitBranch, Layers, ShieldCheck } from "lucide-react"

import SectionHeading from "./SectionHeading.jsx"
import Reveal from "./Reveal.jsx"

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "A little separation. A lot of freedom.",
    body: "Give each task an isolated workspace. Your agent can run code and try things while your laptop and production systems stay out of the way.",
  },
  {
    icon: Layers,
    title: "Progress that sticks around.",
    body: "Files, tools, and context stay with the workspace. Come back to a long-running job and pick up right where your agent left off.",
  },
  {
    icon: GitBranch,
    title: "Room to take another direction.",
    body: "Save a good point and explore a new approach in its own branch. Keep the original work while you see what else is possible.",
    label: "Branching · Beta",
  },
]

export default function PlatformSection() {
  return (
    <section data-section="platform" id="platform" aria-labelledby="platform-title">
      <div data-slot="section-header">
        <Reveal>
          <SectionHeading
            id="platform"
            strong="Your agent does the work."
            rest="We give it the space."
          />
          <p>
            No machine to prepare before the good part. Just a place for your agent to turn a
            prompt into something real.
          </p>
        </Reveal>
      </div>
      <div data-component="card-grid">
        {FEATURES.map(({ icon: Icon, title, body, label }, index) => (
          <Reveal key={title} as="article" delay={index * 100} data-component="leader-card">
            <div data-slot="card-top">
              <span data-slot="rank">{String(index + 1).padStart(2, "0")}</span>
              <span data-slot="leader-avatar" aria-hidden="true">
                <Icon />
              </span>
            </div>
            <h3>{title}</h3>
            <p>{body}</p>
            {label ? <span data-slot="beta-pill">{label}</span> : null}
          </Reveal>
        ))}
      </div>
    </section>
  )
}
