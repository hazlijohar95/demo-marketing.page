// Guards the accessibility and layout invariants of the built landing page.
// Regex over the prerendered HTML and CSS, deliberately: these are structural
// facts about the output, so the check is a `node --test` away rather than a
// browser harness.
//
//   npm run build && node --test scripts/a11y-check.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const html = readFileSync(new URL("../dist/client/index.html", import.meta.url), "utf8")
const css = readFileSync(
  new URL(
    `../dist/client/_astro/${/href="\/_astro\/(index\.[^"]+\.css)"/.exec(html)[1]}`,
    import.meta.url,
  ),
  "utf8",
)

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
