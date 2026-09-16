import SectionHeading from "./SectionHeading.jsx"
import Reveal from "./Reveal.jsx"

const SPECS = [
  {
    term: "Isolation",
    title: "Full virtual machines, one per task.",
    body: "KubeVirt VMs — your agent runs code while your laptop and production stay out of the way.",
  },
  {
    term: "Lifetime",
    title: "Persistent across sessions.",
    body: "Files, tools, and context are kept. Come back to a long job and continue.",
  },
  {
    term: "Branching",
    title: "Snapshot any good point, fork to explore.",
    body: "The original stays untouched while you see what else is possible. Currently in beta.",
  },
  {
    term: "Control",
    title: "Account-scoped API, bounded commands.",
    body: "Structured argument arrays with bounded time and capped output. Auditable by default.",
  },
  {
    term: "Fits",
    title: "Any model, your framework.",
    body: "Model-independent, with Pi and Flue integration guides in the docs today.",
  },
  {
    term: "Deploy",
    title: "Hosted or private.",
    body: "Hosted BoxCompute is invite-only; private options keep code and data close to systems you trust.",
  },
]

export default function SpecSection() {
  return (
    <section data-section="spec" id="spec" aria-labelledby="spec-title">
      <div data-slot="section-header">
        <Reveal>
          <SectionHeading id="spec" strong="The shape of a workspace." rest="Specs, plainly." />
          <p>No benchmarks, no asterisks. What it is and what it isn’t.</p>
        </Reveal>
      </div>
      <Reveal>
        <dl data-component="spec-list">
          {SPECS.map((spec) => (
            <div key={spec.term}>
              <dt>{spec.term}</dt>
              <dd>
                <strong>{spec.title}</strong> <span>{spec.body}</span>
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  )
}
