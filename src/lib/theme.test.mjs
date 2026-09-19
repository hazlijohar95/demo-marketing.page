// node src/lib/theme.test.mjs
import assert from "node:assert/strict"

import { applyTheme, normalizeTheme, readTheme, THEME_KEY, writeTheme } from "./theme.js"

function stubDom(initial = {}) {
  const store = new Map(Object.entries(initial))
  const attrs = new Map()
  const headChildren = []
  let removed = 0
  Object.defineProperty(globalThis, "window", {
    value: {
      localStorage: {
        getItem: (k) => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => store.set(k, v),
      },
    },
    configurable: true,
  })
  Object.defineProperty(globalThis, "document", {
    value: {
      createElement: () => ({
        appendChild: () => {},
        remove: () => {
          removed += 1
        },
      }),
      createTextNode: (text) => text,
      head: {
        append: (el) => headChildren.push(el),
      },
      body: { offsetHeight: 0 },
      documentElement: {
        setAttribute: (k, v) => attrs.set(k, v),
        removeAttribute: (k) => attrs.delete(k),
        getAttribute: (k) => attrs.get(k) ?? null,
        hasAttribute: (k) => attrs.has(k),
      },
    },
    configurable: true,
  })
  const frames = []
  Object.defineProperty(globalThis, "requestAnimationFrame", {
    value: (cb) => {
      frames.push(cb)
      return frames.length
    },
    configurable: true,
  })
  const flushFrames = () => {
    while (frames.length) frames.shift()()
  }
  return { store, attrs, headChildren, flushFrames, removedCount: () => removed }
}

function unstub() {
  delete globalThis.window
  delete globalThis.document
  delete globalThis.requestAnimationFrame
}

// Canonical values only; garbage falls back to system.
assert.equal(normalizeTheme("light"), "light")
assert.equal(normalizeTheme("dark"), "dark")
assert.equal(normalizeTheme("system"), "system")
assert.equal(normalizeTheme("garbage"), "system")
assert.equal(normalizeTheme(null), "system")
assert.equal(normalizeTheme(undefined), "system")

// No window (SSR): system without throwing.
assert.equal(readTheme(), "system")

// Fresh visitor: system.
stubDom()
assert.equal(readTheme(), "system")
unstub()

// Stored choice wins.
stubDom({ [THEME_KEY]: "dark" })
assert.equal(readTheme(), "dark")
unstub()

// Garbage stored choice falls back to system.
stubDom({ [THEME_KEY]: "amoled" })
assert.equal(readTheme(), "system")
unstub()

// Apply sets/removes html[data-theme]; system removes (OS query wins).
let ctx = stubDom()
applyTheme("dark")
assert.equal(ctx.attrs.get("data-theme"), "dark")
applyTheme("light")
assert.equal(ctx.attrs.get("data-theme"), "light")
applyTheme("system")
assert.equal(ctx.attrs.has("data-theme"), false)
unstub()

// Writes persist normalized + apply to DOM.
ctx = stubDom()
writeTheme("dark")
assert.equal(ctx.store.get(THEME_KEY), "dark")
assert.equal(ctx.attrs.get("data-theme"), "dark")
writeTheme("garbage")
assert.equal(ctx.store.get(THEME_KEY), "system")
assert.equal(ctx.attrs.has("data-theme"), false)
unstub()

// Manual writes snap: a transition-killer style lands in <head> for the swap
// and is removed after paint, so the 480ms surface transitions never smear.
ctx = stubDom()
writeTheme("dark")
assert.equal(ctx.headChildren.length, 1)
assert.equal(ctx.removedCount(), 0)
ctx.flushFrames()
assert.equal(ctx.removedCount(), 1)
unstub()

console.log("theme: ok")
