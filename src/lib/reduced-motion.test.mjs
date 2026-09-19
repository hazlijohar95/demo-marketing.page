import assert from "node:assert/strict"

import { prefersReducedMotion } from "./reduced-motion.js"

// Node has no window: the SSR guard must return false, never throw.
assert.equal(prefersReducedMotion(), false)

// With a stubbed window, delegate to matchMedia.
globalThis.window = { matchMedia: () => ({ matches: true }) }
assert.equal(prefersReducedMotion(), true)
globalThis.window = { matchMedia: () => ({ matches: false }) }
assert.equal(prefersReducedMotion(), false)
delete globalThis.window

console.log("reduced-motion: ok")
