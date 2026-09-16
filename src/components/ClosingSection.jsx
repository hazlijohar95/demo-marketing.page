import { ArrowUpRight } from "lucide-react"

import { APP_URL, DEMO_URL } from "../content.js"
import Reveal from "./Reveal.jsx"
import DotField from "./DotField.jsx"

export default function ClosingSection() {
  return (
    <section data-section="closing" aria-labelledby="closing-title">
      <Reveal>
        <div data-slot="closing-pattern" aria-hidden="true">
          <DotField />
        </div>
        <h2 id="closing-title">
          <strong>More doing.</strong> Less getting ready.
        </h2>
        <p>Hosted BoxCompute is invite-only — a 15-minute call gets you a workspace.</p>
        <div data-slot="hero-actions">
          <a data-slot="header-button" data-variant="contrast" href={APP_URL}>
            <strong>Open BoxCompute</strong> <ArrowUpRight aria-hidden="true" />
          </a>
          <a
            data-slot="header-button"
            data-variant="neutral"
            href={DEMO_URL}
            target="_blank"
            rel="noreferrer"
          >
            <strong>Book a demo</strong>
          </a>
        </div>
      </Reveal>
    </section>
  )
}
