import { Check, Minus } from "lucide-react"

import SectionHeading from "./SectionHeading.jsx"
import Reveal from "./Reveal.jsx"

const COLUMNS = ["Ephemeral sandboxes", "Cloud dev machines", "DIY containers"]

const ROWS = [
  {
    label: "Keeps working between sessions",
    us: { state: "yes", text: "Yes — files, tools, context" },
    others: ["Hours, then gone", "Yes, per seat", "If you babysit it"],
  },
  {
    label: "A machine per task, sealed off",
    us: { state: "yes", text: "Yes — isolated VM" },
    others: ["Usually microVMs", "Usually containers", "You build it"],
  },
  {
    label: "Branch to try another direction",
    us: { state: "yes", text: "Yes — snapshot + fork · Beta" },
    others: ["Snapshots vary", "Branches, not forks", "You build it"],
  },
  {
    label: "Works with any model or framework",
    us: { state: "yes", text: "Yes — Pi, Flue, yours" },
    others: ["SDK-shaped", "Editor-shaped", "Anything, DIY"],
  },
  {
    label: "Bounded, auditable commands",
    us: { state: "yes", text: "Yes — structured, time-boxed" },
    others: ["Varies", "A terminal", "You build it"],
  },
  {
    label: "Private option, close to your systems",
    us: { state: "yes", text: "Yes" },
    others: ["Enterprise tiers", "Yes", "Obviously"],
  },
]

export default function CompareSection() {
  return (
    <section data-section="compare" id="compare" aria-labelledby="compare-title">
      <div data-slot="section-header">
        <Reveal>
          <SectionHeading
            id="compare"
            strong="Why not just spin up a container?"
            rest="You could. Here is what changes."
          />
          <p>
            Snippet-runners are built to execute and die. BoxCompute is built for work that
            continues.
          </p>
        </Reveal>
      </div>
      <Reveal>
        <div data-component="compare-scroll">
          <table data-component="compare-table">
            <thead>
              <tr>
                <th scope="col">
                  <span data-slot="visually-hidden">Capability</span>
                </th>
                <th scope="col" data-col="us">
                  BoxCompute
                </th>
                {COLUMNS.map((column) => (
                  <th scope="col" key={column}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td data-col="us" data-state={row.us.state}>
                    <Check aria-hidden="true" /> {row.us.text}
                  </td>
                  {row.others.map((cell, i) => (
                    <td key={`${row.label}-${i}`} data-state={cell === "You build it" || cell === "A terminal" ? "no" : undefined}>
                      {cell === "You build it" || cell === "A terminal" ? (
                        <>
                          <Minus aria-hidden="true" /> {cell}
                        </>
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p data-slot="compare-note">
          Patterns, not vendors — every team names them differently. The question is which shape
          your agent’s work takes: a snippet, or a job that continues.
        </p>
      </Reveal>
    </section>
  )
}
