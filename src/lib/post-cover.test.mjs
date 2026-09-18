// node src/lib/post-cover.test.mjs
import assert from "node:assert/strict"

import { postCover } from "./post-cover.js"

// The whole point: the tile and the hero of one post must be the same picture,
// or opening a post looks like landing on the wrong page. Only dot size may
// differ between slots.
const tile = postCover("vm-sandboxes", "Agents", "tile")
const hero = postCover("vm-sandboxes", "Agents", "hero")
for (const key of ["shape", "type", "colorFront", "scale", "rotation", "frame"]) {
  assert.equal(tile[key], hero[key], `${key} must not change between slots`)
}
assert.notEqual(tile.size, hero.size, "dot size scales with the slot")

// A topic is a family: same hue for every post in it, different picture each.
const a = postCover("why-we-chose-kubevirt", "Infrastructure")
const b = postCover("self-hosted-machines", "Infrastructure")
assert.equal(a.colorFront, b.colorFront, "one topic, one ink")

// The real posts, with the topics the CMS gives them. Two of them share a
// topic, which is exactly the case that produced two identical spheres on the
// index — so the shapes here have to come out distinct, not merely the prop
// bundles. Add a row when a post is published.
const LIVE = [
  ["vm-sandboxes", "Agents"],
  ["why-we-built-boxcompute", "Agents"],
  ["why-we-chose-kubevirt", "Infrastructure"],
  ["kubevirt-vsock-ebpf", "Linux"],
]
const shapes = LIVE.map(([slug, topic]) => postCover(slug, topic).shape)
assert.equal(new Set(shapes).size, LIVE.length, `covers must differ: ${shapes.join(", ")}`)

// Each topic must be a visibly different family, and the ember accent has to
// appear somewhere: hashing the topic names gave two greys and no accent at
// all, which made every section look the same.
const inks = new Set(LIVE.map(([slug, topic]) => postCover(slug, topic).colorFront))
assert.ok(inks.size >= 3, `live topics need distinct inks, got ${[...inks].join(", ")}`)
assert.ok(inks.has("#c2410c"), "the ember accent should be in use, not only greys")

// An unknown tag still has to produce a usable cover, not undefined props.
const unknown = postCover("some-post", "Quantum Telepathy")
const known = postCover("some-post", "Linux")

// The two shapes that render blank or near-blank at cover size must never be
// reachable, from a known topic or a hashed fallback.
const USABLE = new Set(["wave", "ripple", "sphere", "swirl", "dots"])
for (let i = 0; i < 400; i += 1) {
  const cover = postCover(`post-${i}`, i % 3 === 0 ? "Infrastructure" : `tag-${i}`)
  assert.ok(USABLE.has(cover.shape), `${cover.shape} is not a usable cover shape`)
  assert.ok(cover.scale >= 0.5 && cover.scale <= 0.8, `scale in range: ${cover.scale}`)
}

for (const cover of [unknown, known, postCover("no-topic-at-all", null)]) {
  assert.ok(cover.shape, "shape is always set")
  assert.match(cover.colorFront, /^#[0-9a-f]{6}$/)
  assert.match(cover.colorBack, /^#[0-9a-f]{6}$/)
  assert.ok(cover.rotation >= 0 && cover.rotation < 360)
  assert.ok(Math.abs(cover.offsetX) <= 1 && Math.abs(cover.offsetY) <= 1)
  assert.ok(Number.isFinite(cover.frame) && cover.frame >= 0)
}

// Dark mode swaps both inks; a light-mode ink on a dark tile is unreadable.
const light = postCover("vm-sandboxes", "Agents", "tile", "light")
const dark = postCover("vm-sandboxes", "Agents", "tile", "dark")
assert.notEqual(light.colorFront, dark.colorFront)
assert.notEqual(light.colorBack, dark.colorBack)
assert.equal(light.shape, dark.shape, "theme must not change the artwork")

// The cover's background has to be the exact card surface (--bx-layer) per
// theme. A near-miss here is the difference between art on a card and a pasted
// grey rectangle, and it can't be caught by eye in only one theme — verified
// against the live dark tile, which computes to #242424.
assert.equal(light.colorBack, "#fafafa", "light cover sits on --bx-layer")
assert.equal(dark.colorBack, "#242424", "dark cover sits on --bx-layer")

// Contrast against its own surface, so the ember reads with the same weight in
// both themes as the blue it replaced (4.97 light / 5.45 dark). Dither dots are
// sparse, so perceived contrast sits below the ratio — 4.5 is the floor here,
// not a nice-to-have.
const channel = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16) / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (x, y) => {
  const [hi, lo] = [luminance(x), luminance(y)].sort((m, n) => n - m)
  return (hi + 0.05) / (lo + 0.05)
}
for (const cover of [light, dark]) {
  const ratio = contrast(cover.colorFront, cover.colorBack)
  assert.ok(ratio >= 4.5, `cover ink too faint on its surface: ${ratio.toFixed(2)}`)
}

// Green is the "isolated by default" status colour; if it leaks into cover art
// it stops reading as a status. Blue is the UI accent, reserved for links and
// focus rings so the art doesn't compete with them.
for (let i = 0; i < 200; i += 1) {
  const cover = postCover(`p${i}`, `t${i}`)
  assert.notEqual(cover.colorFront.toLowerCase(), "#198b43", "success green is not cover ink")
  assert.notEqual(cover.colorFront.toLowerCase(), "#3b5cf6", "UI accent blue is not cover ink")
}

console.log("post-cover ok")
