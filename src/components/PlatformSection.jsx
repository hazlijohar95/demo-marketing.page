import { useState } from "react"

import SectionHeading from "./SectionHeading.jsx"
import Reveal from "./Reveal.jsx"

function IsolationVisual() {
  return (
    <div data-component="mini-visual" aria-hidden="true">
      <div data-slot="mv-row">
        <span data-slot="mv-box">laptop</span>
        <span data-slot="mv-gap" />
        <span data-slot="mv-box" data-active="true">
          sandbox
        </span>
        <span data-slot="mv-gap" />
        <span data-slot="mv-box">prod</span>
      </div>
      <div data-slot="mv-cap">
        <i style={{ background: "#9ae600" }} /> own kernel · root in guest
      </div>
    </div>
  )
}

function PersistVisual() {
  return (
    <div data-component="mini-visual" aria-hidden="true">
      <div data-slot="mv-timeline">
        <span data-slot="mv-seg" data-state="run" style={{ "--seg": "#51a2ff" }}>
          start
        </span>
        <span data-slot="mv-seg" data-state="run" style={{ "--seg": "#51a2ff" }}>
          work
        </span>
        <span data-slot="mv-seg" data-state="run" style={{ "--seg": "#51a2ff" }}>
          continue
        </span>
        <span data-slot="mv-seg" data-state="del">
          delete
        </span>
      </div>
      <div data-slot="mv-cap">
        <i style={{ background: "#51a2ff" }} /> no auto-expiry · delete when done
      </div>
    </div>
  )
}

function OpsVisual() {
  const [dropped, setDropped] = useState(false)
  return (
    <div data-component="mini-visual">
      <button
        type="button"
        data-slot="mv-ops"
        data-dropped={dropped ? "true" : "false"}
        onClick={() => setDropped((v) => !v)}
        aria-pressed={dropped}
        aria-label="Simulate a dropped connection"
      >
        <span>start</span>
        <span data-slot="mv-dots">
          <i />
          <i />
          <i />
        </span>
        <span>{dropped ? "dropped" : "poll"}</span>
        <span data-slot="mv-dots">
          <i />
          <i />
          <i />
        </span>
        <span>resume</span>
      </button>
      <div data-slot="mv-cap">
        <i style={{ background: "#ffb900" }} /> tap to drop · idempotent start
      </div>
    </div>
  )
}

const FEATURES = [
  {
    rank: "01",
    title: "One Sandbox per task.",
    body: "A full Linux VM with its own kernel. Your laptop and prod stay out of the way.",
    visual: <IsolationVisual />,
  },
  {
    rank: "02",
    title: "Stays until you delete it.",
    body: "No automatic expiry. Files under /workspace live as long as the Sandbox does.",
    visual: <PersistVisual />,
  },
  {
    rank: "03",
    title: "Survive disconnects.",
    body: "Durable ops: polling, 24h output, explicit cancel.",
    visual: <OpsVisual />,
    label: "Durable operations",
  },
]

export default function PlatformSection() {
  return (
    <section data-section="platform" id="platform" aria-labelledby="platform-title">
      <div data-slot="section-header">
        <Reveal>
          <SectionHeading
            id="platform"
            eyebrow="the model"
            strong="Your agent does the work."
            rest="We give it the space."
          />
          <p>No local setup. A Sandbox in an owned workspace, bounded commands.</p>
        </Reveal>
      </div>
      <div data-component="card-grid">
        {FEATURES.map(({ title, body, visual, label, rank }, index) => (
          <Reveal key={title} as="article" delay={index * 100} data-component="leader-card">
            <div data-slot="card-top">
              <span data-slot="rank">{rank}</span>
              {label ? <span data-slot="beta-pill">{label}</span> : <span />}
            </div>
            {visual}
            <h3>{title}</h3>
            <p>{body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
