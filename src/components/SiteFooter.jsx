import { ArrowUpRight } from "lucide-react"

import { APP_URL, DEMO_URL, REPO_URL } from "../content.js"

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { href: "/#console", label: "Console" },
      { href: "/#platform", label: "Platform" },
      { href: "/#how-it-works", label: "How it works" },
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
      { href: DEMO_URL, label: "Book a 15-minute call", external: true },
    ],
  },
]

export default function SiteFooter() {
  return (
    <footer data-component="footer">
      <div data-slot="footer-grid">
        <div data-slot="footer-brand">
          <a data-slot="footer-mark" href="/" aria-label="BoxCompute home">
            <img src="/brand/boxcompute-symbol.svg" width="32" height="32" alt="" />
            <span>BoxCompute</span>
          </a>
          <p>Built for ambitious agents.</p>
        </div>
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
      <div data-slot="footer-bottom">
        <div>
          <span>© {new Date().getFullYear()} BoxCompute</span>
        </div>
        <div data-slot="footer-controls">
          <span data-slot="status">Isolated by default</span>
        </div>
      </div>
    </footer>
  )
}
