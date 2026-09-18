// Guards the accessibility, layout, and agent-discovery invariants of the
// served landing page. Requests go to a local `wrangler dev` server (which
// serves the built worker exactly as production does: prerendered routes as
// static assets, SSR routes through the Astro app + edge middleware), so the
// checks cover the real response headers as well as the markup.
//
//   npm run build && node --test scripts/a11y-check.mjs
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { createHash } from "node:crypto"
import test, { after, before } from "node:test"

const PORT = 54321
const BASE = `http://localhost:${PORT}`

let dev = null
let html = ""
let css = ""

async function waitForOk(url, tries = 90) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // Server still booting.
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`wrangler dev never came up at ${url}`)
}

before(async () => {
  dev = spawn("npx", ["wrangler", "dev", "--port", String(PORT)], {
    // Detached process group so teardown kills workerd too, not just npx —
    // otherwise the orphan keeps the port and the next run fails to boot.
    detached: true,
    cwd: new URL("..", import.meta.url),
    stdio: "ignore",
  })
  await waitForOk(`${BASE}/`)
  html = await (await fetch(`${BASE}/`)).text()
  const chunk = /href="\/_astro\/([^"]+\.css)"/.exec(html)
  assert.ok(chunk, "no stylesheet link in served HTML")
  css = await (await fetch(`${BASE}/_astro/${chunk[1]}`)).text()
})

after(() => {
  if (dev?.pid) {
    try {
      process.kill(-dev.pid, "SIGTERM")
    } catch {
      // Already gone.
    }
  }
})

test("no ARIA that promises unimplemented keyboard behaviour", () => {
  for (const role of ["radiogroup", "radio", "tablist", "tab"]) {
    assert.equal(html.includes(`role="${role}"`), false, `role="${role}" is back`)
  }
  // Their state attributes go with them; selection is carried by aria-pressed.
  assert.equal(html.includes("aria-checked"), false)
  assert.equal(html.includes("aria-selected"), false)
  assert.ok(html.includes('aria-pressed="true"'))
})

test("header, main and footer are landmarks, not nested in main", () => {
  const at = (tag) => html.indexOf(`<${tag}`)
  const mainOpen = at("main")
  const mainClose = html.indexOf("</main>")
  assert.ok(at("header") < mainOpen, "header must precede main")
  assert.ok(html.indexOf("<footer") > mainClose, "footer must follow main")
})

test("skip link targets a focusable main", () => {
  assert.ok(html.includes('href="#main"'))
  assert.match(html, /<main id="main" tabindex="-1">/)
})

test("heading levels never skip", () => {
  const levels = [...html.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]))
  assert.equal(levels[0], 1, "page starts at h1")
  assert.equal(levels.filter((l) => l === 1).length, 1, "exactly one h1")
  let deepest = 1
  for (const level of levels) {
    assert.ok(level <= deepest + 1, `h${level} skips a level`)
    deepest = Math.max(deepest, level)
  }
})

test("scrollable regions are keyboard reachable", () => {
  // Conversation log and comparison table. The demo transcript is not here:
  // it has no overflow, so a tab stop would land on nothing.
  assert.equal([...html.matchAll(/tabindex="0"/g)].length, 2)
})

test("no focus indicator is removed without replacement", () => {
  assert.equal(css.includes("outline:none"), false)
  assert.ok(css.includes("forced-colors"), "forced-colors fallback missing")
})

test("direction-dependent layout uses logical properties", () => {
  // Physical inline properties are allowed only for safe-area insets, which
  // describe a physical screen side regardless of reading direction.
  const physical = [
    ...css.matchAll(/(?:margin|padding|border)-(?:left|right):([^;}]*)/g),
    ...css.matchAll(/text-align:(left|right)/g),
  ]
  const offenders = physical.map((m) => m[0]).filter((d) => !d.includes("safe-area-inset"))
  assert.deepEqual(offenders, [])
  // transform-origin has no logical keyword, so progress fills need an explicit
  // mirror. `[dir=rtl]`, not `:dir(rtl)`: the build downlevels `:dir()` into a
  // `:lang()` list that would miss an explicit dir attribute.
  assert.ok(css.includes("[dir=rtl]"), "RTL mirror for progress fills missing")
  assert.equal(css.includes(":dir("), false)
})

test("the sticky bar height is a single source of truth", () => {
  // The mobile overlay and every anchor landing must follow the bar when touch
  // targets grow it, or the header paints over the overlay's first item.
  assert.equal(css.includes("--bx-bar-h:72px"), true)
  assert.equal(css.includes("--bx-bar-h:84px"), true)
  assert.ok(css.includes("top:var(--bx-bar-h)"), "overlay offset is hardcoded again")
  assert.ok(css.includes("scroll-margin-top:calc(var(--bx-bar-h)"))
})

test("every band shares one inline pad", () => {
  for (const step of ["--bx-pad-inline:24px", "--bx-pad-inline:32px", "--bx-pad-inline:40px"]) {
    assert.ok(css.includes(step), `${step} missing`)
  }
  // Hero, sections and footer all read from it; a literal clamp() here is the
  // old footer rule that sat ~8px off the section edge at every width.
  assert.equal(/padding:64px clamp\([^)]*\) 24px/.test(css), false)
})

test("the hero collage grows instead of clipping", () => {
  // Absolutely-positioned children contribute no height, which turned the
  // 232px floor into a ceiling and overlapped the title with the CTA row.
  const canvas = [...css.matchAll(/hero-canvas\]\{([^}]*)\}/g)].map((m) => m[1])
  assert.ok(canvas.length >= 2, "hero-canvas rules missing")
  assert.ok(
    canvas.some((rule) => rule.includes("display:grid") && rule.includes("min-height:232px")),
    "hero canvas is no longer a growable grid",
  )
  const copy = [...css.matchAll(/hero-copy\]\{([^}]*)\}/g)].map((m) => m[1])
  assert.ok(
    copy.every((rule) => !rule.includes("position:absolute")),
    "hero copy is absolutely positioned again",
  )
})

test("grid dividers match the real column counts", () => {
  // Seven specs over three columns: only the final row may drop its rule.
  assert.equal(/spec-board\] li:nth-child\(n\+4\)\{border-bottom:0\}/.test(css), false)
  // Six stages over two columns: the leading column is 1, 3, 5 — not 3n + 1.
  assert.equal(/lifecycle-track\] li:nth-child\(3n\+1\)/.test(css), false)
  assert.ok(/lifecycle-track\] li:nth-child\(odd\)\{border-inline-start:0\}/.test(css))
})

test("fixed chrome accounts for safe areas", () => {
  assert.ok(css.includes("env(safe-area-inset-left)"))
  assert.ok(css.includes("env(safe-area-inset-bottom)"))
  // The skip link must not scroll away from the viewport it overlays.
  assert.match(css, /\.skip-link\{[^}]*position:fixed/)
})

test("scroll depth degrades to nothing, never to a frozen dim page", () => {
  // Both guards are load-bearing. Without @supports, a browser that drops
  // `animation-timeline` still runs the animation — as 0s, with fill `both`,
  // which pins every section at its last keyframe: the whole page at half
  // opacity, shifted up. Without the reduced-motion guard it moves for readers
  // who asked it not to.
  const guard = /@supports \(animation-timeline:view\(\)\)\{@media \(prefers-reduced-motion:no-preference\)\{([^@]*)\}\}/.exec(css)
  assert.ok(guard, "the scroll-depth block lost @supports or its reduced-motion guard")
  // The minifier reorders shorthand values, so match on the parts.
  assert.match(guard[1], /animation:[^;]*bx-section-depth/)
  assert.match(guard[1], /animation:[^;]*linear/)
  assert.match(guard[1], /animation:[^;]*both/)
  assert.match(guard[1], /animation-timeline:view\(\)/)
  // The hero is above the fold at first paint: it recedes, it never arrives.
  assert.match(guard[1], /\[data-section="?hero"?\]\{animation-name:bx-section-recede\}/)
  // Sections hold full presence across every height's "covering" phase, so the
  // dim only ever lands on a section that is marginal at a viewport edge.
  assert.match(css, /@keyframes bx-section-depth\{0%\{[^}]*\}33%,72%\{opacity:1/)
})

test("homepage advertises discovery via Link headers", async () => {
  // RFC 8288 pointers ride the HTML response (edge middleware for the SSR
  // landing page, public/_headers for prerendered routes) so agents find the
  // catalog without scraping markup.
  const res = await fetch(`${BASE}/`)
  const link = res.headers.get("link") ?? ""
  for (const rel of ['rel="api-catalog"', 'rel="service-doc"', 'rel="service-desc"']) {
    assert.ok(link.includes(rel), `Link header missing ${rel}: ${link}`)
  }
})

test("agents can request markdown, browsers keep HTML", async () => {
  const md = await fetch(`${BASE}/`, { headers: { Accept: "text/markdown" } })
  assert.ok(
    (md.headers.get("content-type") ?? "").includes("text/markdown"),
    "markdown negotiation did not return text/markdown",
  )
  assert.ok(md.headers.get("x-markdown-tokens"), "x-markdown-tokens header missing")
  const body = await md.text()
  assert.ok(body.startsWith("# BoxCompute"), "markdown body is not the homepage summary")
  const htmlRes = await fetch(`${BASE}/`)
  assert.ok(
    (htmlRes.headers.get("content-type") ?? "").includes("text/html"),
    "default response is no longer HTML",
  )
})

test("well-known discovery documents resolve with the right types", async () => {
  const catalog = await fetch(`${BASE}/.well-known/api-catalog`)
  assert.equal(catalog.status, 200)
  assert.ok(
    (catalog.headers.get("content-type") ?? "").includes("application/linkset+json"),
    "api-catalog is not linkset+json",
  )
  assert.equal(catalog.headers.get("access-control-allow-origin"), "*")
  const linkset = await catalog.json()
  assert.ok(Array.isArray(linkset.linkset) && linkset.linkset.length > 0, "linkset is empty")

  const aiCatalog = await fetch(`${BASE}/.well-known/ai-catalog.json`)
  assert.equal(aiCatalog.status, 200)
  assert.equal(aiCatalog.headers.get("access-control-allow-origin"), "*")
  const manifest = await aiCatalog.json()
  assert.ok(manifest.specVersion, "ai-catalog has no specVersion")
  assert.ok(manifest.entries.length > 0, "ai-catalog has no entries")

  const skills = await fetch(`${BASE}/.well-known/agent-skills/index.json`)
  assert.equal(skills.status, 200)
  const index = await skills.json()
  assert.ok(index.$schema.includes("agentskills.io"), "skills index has no schema")
  assert.equal(index.skills.length, 1)
  // The published digest must match the served artifact byte-for-byte, or
  // agents will reject the skill as tampered.
  const artifact = await (await fetch(`${BASE}${index.skills[0].url}`)).text()
  const digest = `sha256:${createHash("sha256").update(artifact).digest("hex")}`
  assert.equal(index.skills[0].digest, digest, "skills index digest does not match served SKILL.md")

  const auth = await fetch(`${BASE}/auth.md`)
  assert.equal(auth.status, 200)
  assert.match(await auth.text(), /^# .*auth\.md/m)

  const robots = await fetch(`${BASE}/robots.txt`)
  assert.equal(robots.status, 200)
  assert.match(await robots.text(), /Content-Signal:\s*ai-train=no,\s*search=yes,\s*ai-input=no/)
})
