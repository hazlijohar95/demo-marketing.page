import { ArrowUpRight } from "lucide-react"

import { APP_URL } from "../content.js"
import SandboxField from "./SandboxField.jsx"

export default function Hero() {
  return (
    <section data-section="hero" aria-labelledby="hero-title">
      <p data-slot="hero-meta" role="status" data-entrance style={{ "--enter-delay": "0ms" }}>
        Hosted BoxCompute is invite-only
      </p>
      <div data-slot="hero-canvas">
        <div data-slot="hero-pattern" aria-hidden="true">
          <SandboxField />
        </div>
        <h1 id="hero-title" data-entrance style={{ "--enter-delay": "60ms" }}>
          A workspace
          <br />
          for every agent
        </h1>
        <div data-slot="hero-copy">
          <p data-entrance style={{ "--enter-delay": "120ms" }}>
            Its own Sandbox: isolated, resumable, controlled.
          </p>
          <div data-slot="hero-actions" data-entrance style={{ "--enter-delay": "180ms" }}>
            <a data-slot="header-button" data-variant="contrast" href={APP_URL}>
              <strong>Open BoxCompute</strong> <ArrowUpRight aria-hidden="true" />
            </a>
            <a data-slot="header-button" data-variant="neutral" href="#console">
              <strong>Watch it work</strong>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
