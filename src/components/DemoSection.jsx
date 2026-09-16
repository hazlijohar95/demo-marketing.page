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
    head: "workspace · sandbox-7f3a · isolated VM",
    lines: [
      { type: "cmd", text: 'bc run "fix the flaky checkout test"' },
      { type: "run", text: "workspace ready · repo cloned · deps installed" },
      { type: "out", text: "reproduced: 1 failing test in checkout.spec" },
      { type: "run", text: "patched retry logic · re-ran the suite" },
      { type: "win", text: "214/214 green · checkpoint saved “green-main”" },
      { type: "win", text: "done · files, tools, and context kept" },
    ],
  },
  {
    id: "understand",
    label: "Read the data",
    head: "workspace · sandbox-9c1e · isolated VM",
    lines: [
      { type: "cmd", text: 'bc run "what is driving refunds?"' },
      { type: "run", text: "workspace ready · orders.csv mounted · 2.1M rows" },
      { type: "out", text: "bounded run · 120s · output capped at 64KB" },
      { type: "run", text: "grouped by reason, region, and size" },
      { type: "win", text: "68% are size exchanges · report.md + chart.png written" },
      { type: "win", text: "done · come back next quarter, it is all still here" },
    ],
  },
  {
    id: "risky",
    label: "Try the risky thing",
    head: "workspace · fork of “green-main” · original untouched",
    lines: [
      { type: "cmd", text: "bc branch green-main → try-fast-path" },
      { type: "run", text: "forked in place · same files, same tools" },
      { type: "out", text: "ran the migration against the copy" },
      { type: "out", text: "3 failures · rolled back the fork" },
      { type: "win", text: "main still green · nothing lost" },
      { type: "win", text: "done · the safe try is the whole point" },
    ],
  },
]

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export default function DemoSection() {
  const [index, setIndex] = useState(0)
  const [shown, setShown] = useState(0)
  const [started, setStarted] = useState(false)
  const figureRef = useRef(null)
  const scenario = SCENARIOS[index]
  const running = started && shown < scenario.lines.length

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
            strong="Watch a workspace work."
            rest="Three jobs, one computer."
          />
          <p>An illustrated run — timings shortened, caution not. It starts when you get here.</p>
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
                {String(Math.min(shown, scenario.lines.length)).padStart(2, "0")}/
                {String(scenario.lines.length).padStart(2, "0")}
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
