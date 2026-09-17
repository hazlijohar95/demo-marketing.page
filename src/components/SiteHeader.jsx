import { useState } from "react"
import { ArrowUpRight, Menu, X } from "lucide-react"

import { APP_URL } from "../content.js"

const NAV_LINKS = [
  { href: "#console", label: "Console" },
  { href: "#demo", label: "Demo" },
  { href: "#platform", label: "Platform" },
  { href: "#developers", label: "How it works" },
  { href: "#faq", label: "FAQ" },
]

const MOBILE_LINKS = [
  ...NAV_LINKS,
  { href: "/blog/", label: "Blog" },
  { href: "/docs", label: "Docs", external: true },
]

export default function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header data-component="top" data-menu-open={open ? "true" : "false"}>
      <div data-component="container">
        <div data-slot="header-bar">
          <a data-slot="brand" href="#top" aria-label="BoxCompute home">
            <img src="/brand/boxcompute-symbol.svg" width="32" height="32" alt="" />
            boxcompute
          </a>
          <nav data-component="section-nav" aria-label="Sections">
            <ul>
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div data-slot="header-actions">
            <a data-slot="header-button" data-variant="neutral" href="/docs">
              <strong>Docs</strong>
            </a>
            <a data-slot="header-button" data-variant="contrast" href={APP_URL}>
              <strong>Open BoxCompute</strong> <ArrowUpRight aria-hidden="true" />
            </a>
            <button
              data-slot="menu-button"
              type="button"
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              <span data-slot="menu-icons" data-open={open ? "true" : "false"} aria-hidden="true">
                <Menu />
                <X />
              </span>
            </button>
          </div>
        </div>
      </div>
      <nav data-slot="mobile-menu" aria-label="Mobile navigation" hidden={!open}>
        {MOBILE_LINKS.map((link) => (
          <a
            key={link.href}
            data-slot="mobile-menu-item"
            href={link.href}
            onClick={() => setOpen(false)}
          >
            <strong>{link.label}</strong>
            {link.external ? <ArrowUpRight aria-hidden="true" /> : null}
          </a>
        ))}
        <a data-slot="mobile-menu-item" href={APP_URL} onClick={() => setOpen(false)}>
          <strong>Open BoxCompute</strong> <ArrowUpRight aria-hidden="true" />
        </a>
      </nav>
    </header>
  )
}
