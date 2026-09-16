import { ArrowUpRight } from "lucide-react"

import { APP_URL } from "../content.js"
import DotField from "./DotField.jsx"

export default function Hero() {
  return (
    <section data-section="hero" aria-labelledby="hero-title">
      <p data-slot="hero-meta" role="status" data-entrance style={{ "--enter-delay": "0ms" }}>
        Hosted BoxCompute is invite-only
      </p>
      <div data-slot="hero-canvas">
        <div data-slot="hero-pattern" aria-hidden="true">
          <DotField />
        </div>
        <h1 id="hero-title" data-entrance style={{ "--enter-delay": "100ms" }}>
          A workspace
          <br />
          For Every Agent
        </h1>
        <div data-slot="hero-copy">
          <p data-entrance style={{ "--enter-delay": "200ms" }}>
            A computer of its own: isolated, persistent, controlled.
          </p>
          <div data-slot="hero-actions" data-entrance style={{ "--enter-delay": "300ms" }}>
            <a data-slot="header-button" data-variant="contrast" href={APP_URL}>
              <strong>Open BoxCompute</strong> <ArrowUpRight aria-hidden="true" />
            </a>
            <a data-slot="header-button" data-variant="neutral" href="#demo">
              <strong>Watch it work</strong>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
