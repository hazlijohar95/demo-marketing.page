import { useEffect, useRef, useState } from "react"
import { ArrowUpRight, Menu, X } from "lucide-react"

import { useMediaQuery } from "../lib/environment.js"
import { APP_URL } from "../content.js"

// Root-relative so the nav also works from /blog/*; on the landing page these
// still resolve to same-document fragment scrolls. `page` marks cross-page
// links so the bar can show where the reader is outside the landing page.
const NAV_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#faq", label: "FAQ" },
  { href: "/blog/", label: "Blog", page: "blog" },
  { href: "/quickstart/", label: "Quickstart", page: "quickstart" },
]

const MOBILE_LINKS = [...NAV_LINKS, { href: "/docs", label: "Docs", page: "docs", external: true }]

// Cross-page markers, matched against the path prefix.
const PAGES = ["blog", "quickstart", "docs"]

function isCurrentLink(link, active, page) {
  const id = link.href.split("#")[1]
  return (Boolean(id) && id === active) || (link.page && link.page === page)
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState("")
  const [page, setPage] = useState("")
  const [scrolled, setScrolled] = useState(false)
  const menuButtonRef = useRef(null)
  const firstLinkRef = useRef(null)
  // Same breakpoint as the CSS that hides the overlay and its toggle. In rem,
  // so it tracks zoom the way the media query does. Without this, rotating a
  // phone with the menu open hid the overlay *and* its close button while the
  // effect below kept the page content inert — unreachable, with no control
  // left to undo it.
  const wide = useMediaQuery("(min-width: 48rem)")

  useEffect(() => {
    if (wide) setOpen(false)
  }, [wide])

  // Which section the reader is in. Drives the nav's current-item mark, so the
  // sticky bar answers "where am I" instead of only "where can I go".
  // `page` covers cross-page links (/blog, /docs, /quickstart) that have no
  // fragment on this document.
  useEffect(() => {
    const ids = NAV_LINKS.map((link) => link.href.split("#")[1]).filter(Boolean)
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean)
    // No early return on an empty list: /blog/* has no sections but still needs
    // the scrolled hairline.
    const read = () => {
      setScrolled(window.scrollY > 8)
      const path = window.location.pathname || "/"
      setPage(PAGES.find((name) => path.startsWith(`/${name}`)) ?? "")
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
    // Scroll lock. The overlay is fixed and contains its own overscroll, but a
    // drag starting on the header strip above it still scrolled the document
    // underneath, so the page moved behind a menu that did not. position:fixed
    // on the body rather than overflow:hidden, because iOS Safari ignores
    // overflow on the scrolling element; the stored offset goes back on close
    // so the reader lands exactly where they opened it.
    const scrollY = window.scrollY
    const { body } = document
    const prev = { position: body.style.position, top: body.style.top, width: body.style.width }
    body.style.position = "fixed"
    body.style.top = `-${scrollY}px`
    body.style.width = "100%"
    // The menu is a fixed overlay covering everything below the bar, so the
    // content behind it must leave the tab order. The header bar itself stays
    // interactive: it holds the close button.
    const behind = document.querySelector('[data-page] > [data-component="container"]')
    if (behind) behind.inert = true
    // The skip link sits outside that container, so it survives the inert pass:
    // tabbing from the close button would otherwise reach a link that jumps to
    // content nobody can focus.
    const skip = document.querySelector(".skip-link")
    if (skip) skip.inert = true
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => {
      body.style.position = prev.position
      body.style.top = prev.top
      body.style.width = prev.width
      window.scrollTo(0, scrollY)
      if (behind) behind.inert = false
      if (skip) skip.inert = false
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
                const current = isCurrentLink(link, active, page)
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
            <a
              data-slot="header-button"
              data-variant="neutral"
              href="/docs"
              data-current={page === "docs" ? "true" : undefined}
              aria-current={page === "docs" ? "page" : undefined}
            >
              <strong>Docs</strong>
            </a>
            <a data-slot="header-button" data-variant="contrast" href={APP_URL} aria-label="Open BoxCompute">
              {/* Two labels, one accessible name. The bar holds brand + Docs +
                  primary + menu, which does not fit 390px at the full label —
                  the ellipsis fallback rendered "Ope...", so the CTA stopped
                  naming its own action. aria-label above is the name either
                  way, so the swap is purely visual. */}
              <strong>
                <span data-label="long">Open BoxCompute</span>
                <span data-label="short">Open</span>
              </strong>{" "}
              <ArrowUpRight aria-hidden="true" />
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
        {MOBILE_LINKS.map((link, i) => {
          const current = isCurrentLink(link, active, page)
          return (
            <a
              key={link.href}
              ref={i === 0 ? firstLinkRef : undefined}
              data-slot="mobile-menu-item"
              href={link.href}
              data-current={current ? "true" : undefined}
              aria-current={current ? "true" : undefined}
              onClick={() => setOpen(false)}
            >
              <strong>{link.label}</strong>
              {link.external ? <ArrowUpRight aria-hidden="true" /> : null}
            </a>
          )
        })}
        <a data-slot="mobile-menu-item" href={APP_URL} onClick={() => setOpen(false)}>
          <strong>Open BoxCompute</strong> <ArrowUpRight aria-hidden="true" />
        </a>
      </nav>
    </header>
  )
}
