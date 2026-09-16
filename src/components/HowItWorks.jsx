import { ArrowUpRight } from "lucide-react"

import SectionHeading from "./SectionHeading.jsx"
import Reveal from "./Reveal.jsx"

const STEPS = [
  {
    title: "Start with an idea",
    body: "A feature to ship. A dataset to understand. Something worth trying.",
  },
  {
    title: "Your agent gets its own space",
    body: "An isolated workspace with room to run code, install tools, and work through the task.",
  },
  {
    title: "Come back to real progress",
    body: "Review the results, keep the files, and continue whenever you’re ready.",
  },
]

export default function HowItWorks() {
  return (
    <section data-section="how" id="developers" aria-labelledby="developers-title">
      <div data-slot="section-header">
        <Reveal>
          <SectionHeading id="developers" strong="Give it a goal." rest="Let it get to work." />
          <p>
            Bring the agent and tools you already use. BoxCompute handles the workspace behind the
            scenes.
          </p>
        </Reveal>
        <a data-slot="header-button" data-variant="neutral" href="/docs">
          <strong>Read the documentation</strong> <ArrowUpRight aria-hidden="true" />
        </a>
      </div>
      <Reveal>
        <ol data-component="steps">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span data-slot="step-number">{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  )
}
