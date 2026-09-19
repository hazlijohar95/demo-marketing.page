import { ArrowUpRight } from "lucide-react"

import SectionHeading from "./SectionHeading.jsx"
import Reveal from "./Reveal.jsx"
import CodeBlock from "./CodeBlock.jsx"
import { useLocalStorage } from "../lib/use-local-storage.js"
import { APP_URL, DEMO_URL } from "../content.js"
import { DOCS, NEXT_STEPS, SCOPES, SNIPPETS } from "../content/quickstart-snippets.js"

function LanguageToggle({ lang, onChange, label }) {
  const isTs = lang === "ts"
  return (
    <div data-component="scenario-pills" role="group" aria-label={label}>
      <button type="button" data-active={isTs} aria-pressed={isTs} onClick={() => onChange("ts")}>
        TypeScript
      </button>
      <button
        type="button"
        data-active={!isTs}
        aria-pressed={!isTs}
        onClick={() => onChange("py")}
      >
        Python
      </button>
    </div>
  )
}

export default function Quickstart() {
  const [lang, setLang] = useLocalStorage("bx-qs-lang", "ts")
  const isTs = lang === "ts"

  return (
    <>
      <section data-section="qs-hero" aria-labelledby="qs-title">
        <Reveal>
          <p data-slot="section-eyebrow">
            <span aria-hidden="true">#</span> sdk quickstart
          </p>
          <h1 id="qs-title" data-slot="qs-title">
            From API key <strong>to first run</strong> in about five minutes.
          </h1>
          <p data-slot="qs-lede">
            Use the official SDK for application integrations. It handles authentication, typed API
            responses, binary file transfer, timeouts, cancellation, and structured errors for the
            public v2 API.
          </p>
          <ul data-slot="qs-meta" aria-label="What to expect">
            <li>3 steps</li>
            <li>~5 min</li>
            <li>TypeScript + Python</li>
          </ul>
          <div data-slot="hero-actions">
            <a data-slot="header-button" data-variant="contrast" href={APP_URL}>
              <strong>Get an API key</strong> <ArrowUpRight aria-hidden="true" />
            </a>
            <a data-slot="header-button" data-variant="neutral" href={DEMO_URL}>
              <strong>Request an invite</strong>
            </a>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <nav data-component="qs-toc" aria-label="On this page">
            <span aria-hidden="true">On this page</span>
            <a href="#qs-register">01 · Register</a>
            <a href="#qs-install">02 · Install</a>
            <a href="#qs-run">03 · Run + clean up</a>
          </nav>
        </Reveal>
      </section>

      <section data-section="qs-invite" aria-label="Invite-only notice">
        <Reveal>
          <aside data-component="qs-callout" data-tone="info">
            <p>
              <strong>BoxCompute is currently invite-only.</strong> Book a 15-minute call with
              Farhan to request access, then use the one-time link in your invite to register.{" "}
              <a href={DEMO_URL}>
                Book the call <ArrowUpRight aria-hidden="true" />
              </a>
            </p>
          </aside>
        </Reveal>
      </section>

      <section data-section="qs-step" id="qs-register" aria-labelledby="qs-register-title">
        <div data-slot="section-header">
          <Reveal>
            <SectionHeading
              id="qs-register"
              eyebrow="step 01"
              strong="Register and create an API key."
              rest=""
            />
            <p>
              Open your invitation link, create your account, and sign in to the BoxCompute app.
              Then open API keys and create a key with exactly these scopes:
            </p>
          </Reveal>
          <Reveal delay={100}>
            <span data-slot="qs-step-tag" aria-hidden="true">
              01
            </span>
          </Reveal>
        </div>
        <Reveal>
          <ul data-slot="qs-scopes" aria-label="Required API key scopes">
            {SCOPES.map((scope) => (
              <li key={scope}>
                <code>{scope}</code>
              </li>
            ))}
          </ul>
          <p data-slot="qs-body">
            Open{" "}
            <a href="https://app.boxcompute.ai/api-keys">
              app.boxcompute.ai/api-keys <ArrowUpRight aria-hidden="true" />
            </a>
            , create the key, and copy the <code>bc_live_...</code> secret immediately — it is
            displayed only once. Store it in your secret manager. For this local walkthrough:
          </p>
          <CodeBlock filename="terminal" langLabel="bash" code={SNIPPETS.env} />
          <aside data-component="qs-callout" data-tone="warn">
            <p>
              <strong>Server-side key.</strong> Never put this key in a browser or mobile
              application. See{" "}
              <a href={`${DOCS}/api-keys/`}>
                API keys <ArrowUpRight aria-hidden="true" />
              </a>{" "}
              for scope and revocation details.
            </p>
          </aside>
        </Reveal>
      </section>

      <section data-section="qs-step" id="qs-install" aria-labelledby="qs-install-title">
        <div data-slot="section-header">
          <Reveal>
            <SectionHeading id="qs-install" eyebrow="step 02" strong="Install an SDK." rest="" />
            <p>
              Both packages target <code>https://api.boxcompute.ai</code> by default. No route URLs
              or authorization headers to build by hand.
            </p>
          </Reveal>
          <Reveal delay={100} data-component="demo-controls">
            <LanguageToggle lang={lang} onChange={setLang} label="SDK language" />
          </Reveal>
        </div>
        <Reveal>
          {isTs ? (
            <CodeBlock
              filename="terminal"
              caption="Node 18+"
              langLabel="bash"
              code={SNIPPETS.installTs}
            />
          ) : (
            <CodeBlock filename="terminal" caption="Python 3.9+" langLabel="bash" code={SNIPPETS.installPy} />
          )}
          <aside data-component="qs-callout" data-tone="info">
            <p>
              <strong>VM Sandboxes are the default</strong> (<code>vmSandbox</code> defaults to{" "}
              <code>true</code>). Pass <code>vmSandbox: false</code> for a gVisor Sandbox. The
              operator-selected cooperative-SSH and selected-TCP previews are not exposed by the
              current SDKs — use the{" "}
              <a href={`${DOCS}/http-api/`}>
                direct HTTP contract <ArrowUpRight aria-hidden="true" />
              </a>{" "}
              for those.
            </p>
          </aside>
        </Reveal>
      </section>

      <section data-section="qs-step" id="qs-run" aria-labelledby="qs-run-title">
        <div data-slot="section-header">
          <Reveal>
            <SectionHeading
              id="qs-run"
              eyebrow="step 03"
              strong="Create, execute, and clean up."
              rest=""
            />
            <p>
              The examples reuse your account&rsquo;s first workspace, or bootstrap one when the
              account is empty. Workspaces persist and are not deleted — each example creates one
              Sandbox and deletes that exact instance in a <code>finally</code> block.
            </p>
          </Reveal>
          <Reveal delay={100} data-component="demo-controls">
            <LanguageToggle lang={lang} onChange={setLang} label="SDK language" />
          </Reveal>
        </div>
        <Reveal>
          {isTs ? (
            <>
              <CodeBlock filename="quickstart.ts" langLabel="ts" code={SNIPPETS.ts} />
              <CodeBlock filename="terminal" langLabel="bash" code={SNIPPETS.runTs} />
            </>
          ) : (
            <>
              <CodeBlock filename="quickstart.py" langLabel="python" code={SNIPPETS.py} />
              <CodeBlock filename="terminal" langLabel="bash" code={SNIPPETS.runPy} />
            </>
          )}
          <CodeBlock
            filename="expected stdout"
            langLabel="text"
            code={SNIPPETS.expected}
          />
          <aside data-component="qs-callout" data-tone="info">
            <p>
              <strong>
                <code>execute</code> waits for completion
              </strong>{" "}
              and returns stdout, stderr, exit status, timeout, and truncation fields. A non-zero
              command exit is still a successful API response — inspect <code>exitCode</code> /{" "}
              <code>exit_code</code> rather than treating it as a transport error. For commands that
              must stay observable across an interrupted connection, use{" "}
              <a href={`${DOCS}/execute/#run-an-observable-operation`}>
                durable operations <ArrowUpRight aria-hidden="true" />
              </a>
              .
            </p>
          </aside>
        </Reveal>
      </section>

      <section data-section="qs-next" aria-labelledby="qs-next-title">
        <div data-slot="section-header">
          <Reveal>
            <SectionHeading id="qs-next" eyebrow="next steps" strong="Keep building." rest="" />
            <p>Where to go once your first Sandbox runs green.</p>
          </Reveal>
        </div>
        <Reveal>
          <ul data-component="qs-grid">
            {NEXT_STEPS.map((item, i) => (
              <li key={item.href} data-component="leader-card">
                <div data-slot="card-top">
                  <span data-slot="rank">{String(i + 1).padStart(2, "0")}</span>
                  <ArrowUpRight aria-hidden="true" width="14" height="14" />
                </div>
                <h3>
                  <a href={item.href} data-slot="qs-card-link">
                    {item.title}
                  </a>
                </h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ul>
          <p data-slot="qs-alt">
            Prefer the terminal or a local coding agent? Follow the{" "}
            <a href={`${DOCS}/cli/quickstart/`}>
              CLI quickstart <ArrowUpRight aria-hidden="true" />
            </a>
            .
          </p>
        </Reveal>
      </section>
    </>
  )
}
