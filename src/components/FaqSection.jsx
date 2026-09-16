import { Plus } from "lucide-react"

import { DEMO_URL } from "../content.js"
import SectionHeading from "./SectionHeading.jsx"
import Reveal from "./Reveal.jsx"

const FAQS = [
  {
    question: "What is BoxCompute?",
    answer:
      "BoxCompute gives AI agents secure, persistent cloud workspaces. They can edit files, run code, test ideas, and return finished work without running everything on your machine.",
  },
  {
    question: "Will it work with my agent?",
    answer:
      "BoxCompute is model-independent and designed to fit into the tools and agent frameworks your team already uses. Explore the documentation to get started.",
  },
  {
    question: "Does my workspace keep its progress?",
    answer:
      "Yes. Your workspace keeps files and progress between sessions, so your agent can continue a longer job without starting from scratch.",
  },
  {
    question: "Can I keep sensitive work private?",
    answer:
      "Each task runs in a separate, controlled environment. Private deployment options are also available for teams that need code and data close to the systems they already trust.",
  },
  {
    question: "What are branchable workspaces?",
    answer:
      "They let an agent save a good point and try a different approach while leaving the original workspace untouched. Workspace branching is currently in beta.",
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
              Let’s talk →
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
