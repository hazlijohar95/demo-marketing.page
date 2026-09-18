// node src/lib/contour.test.mjs
// Guards the hero field's contour banding. Kept as a mirror of the function in
// SandboxField.jsx rather than an import: that module reaches for canvas and
// window at import time, so pulling it into node would need a DOM shim to test
// eight lines of arithmetic.
import assert from "node:assert/strict"

const STEP = 17
const BAND = 0.42
const BAND_POWER = 1.4

const contour = (dist) => {
  const phase = Math.abs(((dist / STEP) % 1) - 0.5) * 2
  return phase <= 1 - BAND ? 0 : ((phase - (1 - BAND)) / BAND) ** BAND_POWER
}

// Bands must land on multiples of STEP. If this drifts the rings stop being
// iso-lines of distance and the whole "measured field" read is gone.
// Squaring a float ratio overshoots 1 in the last bit, hence the epsilon.
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: got ${a}`)
for (const n of [0, 1, 2, 3, 7]) {
  near(contour(n * STEP), 1, `contour peaks at ${n} * STEP`)
}

// Exactly between two contours must be fully dark, or the bands bleed together
// into the blob this replaced.
for (const n of [0, 1, 2, 5]) {
  near(contour((n + 0.5) * STEP), 0, "midpoint between rings is unlit")
}

// Never outside 0..1 by more than float slop: the value feeds an alpha and a
// rect size, so a negative strength would draw an inverted cell.
for (let d = 0; d < 400; d += 0.37) {
  const v = contour(d)
  assert.ok(v >= 0 && v <= 1 + 1e-9, `contour(${d}) = ${v} out of range`)
}

// Thin bands are the whole point — if most of the field inks, the contours read
// as a glow. Sample one period: under half of it should be lit at all.
let lit = 0
let total = 0
for (let d = 0; d < STEP; d += 0.05) {
  total += 1
  if (contour(d) > 0.03) lit += 1
}
assert.ok(lit / total < 0.5, `bands too wide: ${((lit / total) * 100).toFixed(0)}% lit`)

// Monotonic climb into a band, so a cell never flickers as the pointer glides.
const mid = 0.5 * STEP
for (let d = mid; d < STEP; d += 0.5) {
  assert.ok(contour(d + 0.5) >= contour(d) - 1e-9, `rising toward the ring at ${d}`)
}

// STEP must not be a multiple of the 6px lattice, or every ring lands on the
// same columns and the field reads as a grid artifact.
assert.notEqual(STEP % 6, 0, "STEP must not align to the dot lattice")

console.log("contour ok")
