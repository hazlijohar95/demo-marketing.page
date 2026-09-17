import { useEffect, useRef, useState } from "react"
import { RotateCcw } from "lucide-react"

import SectionHeading from "./SectionHeading.jsx"
import Reveal from "./Reveal.jsx"
import { onVisible } from "../lib/visible.js"

const LINE_MS = 750

const SCENARIOS = [
  {
    id: "ship",
    label: "Ship a fix",
    head: "workspace · sandbox-7f3a · isolated Sandbox",
    timeSec: 42,
    outKB: 18,
    lines: [
      { type: "cmd", text: "bxc sandbox exec sandbox-7f3a -- npm test -- --runInBand" },
      { type: "run", text: "workspace ready · repo in /workspace · deps installed" },
      { type: "out", text: "reproduced: 1 failing test in checkout.spec" },
      { type: "run", text: "patched retry logic · re-ran the suite" },
      { type: "win", text: "214/214 green · results in /workspace" },
      { type: "win", text: "done · files kept until you delete the Sandbox" },
    ],
  },
  {
    id: "understand",
    label: "Read the data",
    head: "workspace · sandbox-9c1e · isolated Sandbox",
    timeSec: 67,
    outKB: 210,
    lines: [
      { type: "cmd", text: "bxc sandbox exec sandbox-9c1e -- python3 analyze_refunds.py" },
      { type: "run", text: "workspace ready · orders.csv in /workspace · 2.1M rows" },
      { type: "out", text: "bounded run · 120s · output capped at 256KB" },
      { type: "run", text: "grouped by reason, region, and size" },
      { type: "win", text: "68% are size exchanges · report.md + chart.png written" },
      { type: "win", text: "done · workspace persists, pick up where you left off" },
    ],
  },
  {
    id: "observable",
    label: "Stay observable",
    head: "workspace · sandbox-a41f · isolated Sandbox",
    timeSec: 12,
    outKB: 9,
    lines: [
      { type: "cmd", text: "bxc sandbox exec sandbox-a41f -- python3 migrate.py" },
      { type: "run", text: "durable operation started · observable if you disconnect" },
      { type: "out", text: "connection dropped · polled and resumed from retained output" },
      { type: "out", text: "3 failures · exit code and truncation flags checked" },
      { type: "win", text: "logs readable without restarting cold compute" },
      { type: "win", text: "done · delete the Sandbox when finished" },
    ],
  },
]

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function Meter({ label, fill, color }) {
  return (
    <span data-slot="demo-meter">
      <span>{label}</span>
      <i>
        <b style={{ width: `${fill}%`, background: color }} />
      </i>
    </span>
  )
}

export default function DemoSection() {
  const [index, setIndex] = useState(0)
  const [shown, setShown] = useState(0)
  const [started, setStarted] = useState(false)
  const figureRef = useRef(null)
  const scenario = SCENARIOS[index]
  const running = started && shown < scenario.lines.length
  const total = scenario.lines.length
  const doneCount = Math.min(shown, total)
  const frac = total ? doneCount / total : 0

  useEffect(() => {
    const el = figureRef.current
    if (!el) return
    return onVisible(el, () => setStarted(true), 0.3)
  }, [])

  useEffect(() => {
    setShown(0)
    if (prefersReducedMotion()) {
      setShown(SCENARIOS[index].lines.length)
      return
    }
    if (!started) return
    const id = window.setInterval(() => {
      setShown((value) => {
        if (value >= SCENARIOS[index].lines.length) {
          window.clearInterval(id)
          return value
        }
        return value + 1
      })
    }, LINE_MS)
    return () => window.clearInterval(id)
  }, [index, started])

  const replay = () => {
    if (prefersReducedMotion()) {
      setShown(scenario.lines.length)
      return
    }
    setShown(0)
  }

  return (
    <section data-section="demo" id="demo" aria-labelledby="demo-title">
      <div data-slot="section-header">
        <Reveal>
          <SectionHeading
            id="demo"
            strong="Watch it work."
            rest="Three runs, one pattern."
          />
          <p>Illustrated run. Timings shortened.</p>
        </Reveal>
        <Reveal delay={100} data-component="demo-controls">
          <div
            data-component="scenario-pills"
            role="group"
            aria-label="Demo scenario"
          >
            {SCENARIOS.map((item, i) => (
              <button
                key={item.id}
                type="button"
                data-active={i === index}
                aria-pressed={i === index}
                onClick={() => setIndex(i)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </Reveal>
      </div>
      <Reveal>
        <div data-component="demo-figure" ref={figureRef}>
          <div data-slot="demo-head">
            <span>{scenario.head}</span>
            <span data-slot="demo-status" data-state={running ? "running" : "done"}>
              {running ? "Running" : "Done"}
            </span>
          </div>
          <div data-slot="demo-meters" aria-hidden="true">
            <Meter
              label={`time ${Math.round(frac * scenario.timeSec)}s / 120s`}
              fill={frac * ((scenario.timeSec / 120) * 100)}
              color="#51a2ff"
            />
            <Meter
              label={`out ${Math.round(frac * scenario.outKB)}KB / 256KB`}
              fill={frac * ((scenario.outKB / 256) * 100)}
              color="#a684ff"
            />
            <Meter
              label={`${String(doneCount).padStart(2, "0")}/${String(total).padStart(2, "0")} steps`}
              fill={frac * 100}
              color="#00bc7d"
            />
          </div>
          <div data-slot="demo-log" role="log" aria-live="off" aria-label={`${scenario.label} transcript`}>
            {scenario.lines.slice(0, shown).map((line, i) => (
              <p key={`${scenario.id}-${i}`} data-line={line.type}>
                {line.type === "cmd" ? (
                  <>
                    <span>$</span> {line.text}
                  </>
                ) : line.type === "run" ? (
                  <>
                    <span>→</span> {line.text}
                  </>
                ) : (
                  line.text
                )}
              </p>
            ))}
            {running ? (
              <p aria-hidden="true">
                <span data-slot="demo-caret" />
              </p>
            ) : null}
          </div>
          <div data-slot="demo-foot">
            <span>
              <span data-slot="demo-count">
                {String(doneCount).padStart(2, "0")}/{String(total).padStart(2, "0")}
              </span>{" "}
              steps · illustrated, not live
            </span>
            <button type="button" onClick={replay}>
              <RotateCcw aria-hidden="true" /> Replay
            </button>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
