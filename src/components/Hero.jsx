import { ArrowUpRight } from "lucide-react"

import { APP_URL } from "../content.js"
import SandboxField from "./SandboxField.jsx"

export default function Hero() {
  return (
    <section data-section="hero" aria-labelledby="hero-title">
      {/* Static copy, so no live region: `role="status"` announced it as a page
          update on load, ahead of the h1. */}
      <p data-slot="hero-meta" data-entrance style={{ "--enter-delay": "0ms" }}>
        Hosted BoxCompute is invite-only
      </p>
      <div data-slot="hero-canvas">
        <div data-slot="hero-pattern" aria-hidden="true">
          <SandboxField />
        </div>
        {/* Two spans, not a <br>: a line break contributes no whitespace to the
            accessible name, so the h1 computed as "A workspacefor every agent". */}
        <h1 id="hero-title" data-entrance style={{ "--enter-delay": "60ms" }}>
          <span>A workspace </span>
          <span>for every agent</span>
        </h1>
        <div data-slot="hero-copy">
          <p data-entrance style={{ "--enter-delay": "120ms" }}>
            Its own Sandbox: a full Linux VM, isolated and controlled.
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
