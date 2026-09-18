import { ArrowUpRight } from "lucide-react"

import { APP_URL, DEMO_URL, REPO_URL } from "../content.js"
import DotField from "./DotField.jsx"

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { href: "/#console", label: "Console" },
      { href: "/#demo", label: "Demo" },
      { href: "/#platform", label: "Platform" },
      { href: "/#developers", label: "How it works" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { href: "/blog/", label: "Blog" },
      { href: "/docs", label: "Docs" },
      { href: REPO_URL, label: "GitHub", external: true },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: APP_URL, label: "Open BoxCompute", external: true },
      { href: DEMO_URL, label: "Contact", external: true },
    ],
  },
]

export default function SiteFooter() {
  return (
    <footer data-component="footer">
      <div data-slot="footer-grid">
        <a data-slot="footer-mark" href="/" aria-label="BoxCompute home">
          <img src="/brand/boxcompute-symbol.svg" width="40" height="40" alt="" />
        </a>
        {COLUMNS.map((column) => (
          <div data-slot="footer-column" key={column.heading}>
            {/* h3, not h2: these are nav group labels, not peers of the page's
                section headings in the outline. */}
            <h3>{column.heading}</h3>
            <nav aria-label={column.heading}>
              {column.links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
                >
                  {link.label}{" "}
                  {link.external ? <ArrowUpRight aria-hidden="true" /> : null}
                </a>
              ))}
            </nav>
          </div>
        ))}
      </div>
      <div data-slot="footer-pattern" aria-hidden="true">
        <DotField />
      </div>
      <div data-slot="footer-bottom">
        <div>
          <span>© {new Date().getFullYear()} BoxCompute</span>
          <span>Built for ambitious agents.</span>
        </div>
        <div data-slot="footer-controls">
          <span data-slot="status">Isolated by default</span>
        </div>
      </div>
    </footer>
  )
}
