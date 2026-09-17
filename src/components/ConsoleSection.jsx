import Reveal from "./Reveal.jsx"
import ConsoleDemo from "./ConsoleDemo.jsx"

export default function ConsoleSection() {
  return (
    <section data-section="console" id="console" aria-labelledby="console-title">
      <div data-slot="section-header" data-align="center">
        <Reveal>
          <h2 data-slot="section-title" data-align="center" id="console-title">
            <a data-slot="heading-link" href="#console">
              <span data-slot="heading-anchor" aria-hidden="true">
                #
              </span>
              A glimpse of how it works.
            </a>
          </h2>
        </Reveal>
      </div>
      <Reveal>
        <ConsoleDemo />
      </Reveal>
    </section>
  )
}
