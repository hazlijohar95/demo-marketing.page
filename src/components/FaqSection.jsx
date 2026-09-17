import { Plus } from "lucide-react"

import { DEMO_URL } from "../content.js"
import SectionHeading from "./SectionHeading.jsx"
import Reveal from "./Reveal.jsx"

const FAQS = [
  {
    question: "What is BoxCompute?",
    answer:
      "Secure cloud Sandboxes grouped by persistent workspaces. Each Sandbox is a full Linux VM by default: root in the guest, files under /workspace, bounded commands, no load on your machine.",
  },
  {
    question: "Will it work with my agent?",
    answer:
      "Yes. Model-independent via SDKs, CLI, HTTP API. CLI skill for Codex, Claude, Pi, others.",
  },
  {
    question: "Does my workspace keep its progress?",
    answer:
      "Yes. Workspaces persist and can hold many Sandboxes. A VM Sandbox has no automatic expiry: its files stay, and it keeps billing, until you delete it. Download what you need first — delete removes its filesystem.",
  },
  {
    question: "Can my agent reach the internet?",
    answer:
      "By default yes: outbound public IPv4 and DNS, so apt-get and package installs work. Create it with blockNetwork:true for a VM with no network interface. The choice is fixed at creation.",
  },
  {
    question: "Can I keep sensitive work private?",
    answer:
      "Each task gets an isolated Sandbox. Self-hosted origins via CLI --url keep data close.",
  },
  {
    question: "What if my connection drops mid-run?",
    answer:
      "Start a durable operation with an idempotency key. Polling, 24h retained output, explicit cancel. Closing the client never cancels it. Check exitCode, timedOut, truncation.",
  },
]

export default function FaqSection() {
  return (
    <section data-section="faq" id="faq" aria-labelledby="faq-title">
      <div data-slot="section-header">
        <Reveal>
          <SectionHeading id="faq" strong="Good questions." rest="" />
          <p>
            Still curious?{" "}
            <a href={DEMO_URL} target="_blank" rel="noreferrer">
              Book a 15-minute call →
            </a>
          </p>
        </Reveal>
      </div>
      <Reveal>
        <div data-component="faq-list">
          {FAQS.map(({ question, answer }) => (
            <details key={question} name="faq">
              <summary>
                {question}
                <Plus aria-hidden="true" />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
