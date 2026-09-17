import Reveal from "./Reveal.jsx"
import ConsoleReveal from "./ConsoleReveal.jsx"
import DotField from "./DotField.jsx"

export default function ConsoleSection() {
  return (
    <section data-section="console" id="console" aria-labelledby="console-title">
      {/* The console carries its own chrome, workspace and URL — it names
          itself. The heading stays for the section's accessible name and
          the "Console" nav target, without repeating the demo in prose. */}
      <h2 data-slot="visually-hidden" id="console-title">
        The BoxCompute console
      </h2>
      <Reveal data-slot="console-stage">
        <span data-slot="stage-pattern" aria-hidden="true">
          <DotField />
        </span>
        <ConsoleReveal />
      </Reveal>
    </section>
  )
}
