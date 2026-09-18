import { useEffect, useRef, useState } from "react"
import { ArrowUpRight, Menu, X } from "lucide-react"

import { APP_URL } from "../content.js"

// Root-relative so the nav also works from /blog/*; on the landing page these
// still resolve to same-document fragment scrolls.
const NAV_LINKS = [
  { href: "/#console", label: "Console" },
  { href: "/#demo", label: "Demo" },
  { href: "/#platform", label: "Platform" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#faq", label: "FAQ" },
  { href: "/blog/", label: "Blog" },
]

const MOBILE_LINKS = [...NAV_LINKS, { href: "/docs", label: "Docs", external: true }]

export default function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState("")
  const [scrolled, setScrolled] = useState(false)
  const menuButtonRef = useRef(null)
  const firstLinkRef = useRef(null)

  // Which section the reader is in. Drives the nav's current-item mark, so the
  // sticky bar answers "where am I" instead of only "where can I go".
  useEffect(() => {
    const ids = NAV_LINKS.map((link) => link.href.split("#")[1]).filter(Boolean)
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean)
    // No early return on an empty list: /blog/* has no sections but still needs
    // the scrolled hairline.
    const read = () => {
      setScrolled(window.scrollY > 8)
      // Nearest section whose top has passed just under the sticky bar.
      let current = ""
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= 140) current = section.id
      }
      setActive(current)
    }
    read()
    window.addEventListener("scroll", read, { passive: true })
    window.addEventListener("resize", read)
    return () => {
      window.removeEventListener("scroll", read)
      window.removeEventListener("resize", read)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    firstLinkRef.current?.focus()
    // The menu is a fixed overlay covering everything below the bar, so the
    // content behind it must leave the tab order. The header bar itself stays
    // interactive: it holds the close button.
    const behind = document.querySelector('[data-page] > [data-component="container"]')
    if (behind) behind.inert = true
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => {
      if (behind) behind.inert = false
      document.removeEventListener("keydown", onKey)
      menuButtonRef.current?.focus()
    }
  }, [open])

  return (
    <header
      data-component="top"
      data-menu-open={open ? "true" : "false"}
      data-scrolled={scrolled ? "true" : "false"}
    >
      <div data-component="container">
        <div data-slot="header-bar">
          <a data-slot="brand" href="/" aria-label="BoxCompute home">
            <img src="/brand/boxcompute-symbol.svg" width="32" height="32" alt="" />
            boxcompute
          </a>
          <nav data-component="section-nav" aria-label="Sections">
            <ul>
              {NAV_LINKS.map((link) => {
                const id = link.href.split("#")[1]
                const current = Boolean(id) && id === active
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      data-current={current ? "true" : undefined}
                      aria-current={current ? "true" : undefined}
                    >
                      {link.label}
                    </a>
                  </li>
                )
              })}
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
              ref={menuButtonRef}
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
        {MOBILE_LINKS.map((link, i) => (
          <a
            key={link.href}
            ref={i === 0 ? firstLinkRef : undefined}
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
