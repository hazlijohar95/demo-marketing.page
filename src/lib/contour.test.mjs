// node src/lib/contour.test.mjs
// Guards the hero field's contour banding. Imports the real derivation from
// field-contour.js — the same function SandboxField.jsx paints with — so the
// test crosses the module's interface instead of mirroring eight lines of
// arithmetic that could drift from the shipped field.
import assert from "node:assert/strict"

import { CONTOUR_STEP, contour, fieldStrength, HOVER_RADIUS, hoverStrength, PULSE_REACH, pulseStrength, scanBounds } from "./field-contour.js"

const STEP = CONTOUR_STEP

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

// --- Field accumulation: the painter's contract, tested at the seam ---
// Hover is 1 at the pointer and exactly 0 at and past its reach.
near(hoverStrength(0), 1, "hover peaks at the pointer")
assert.equal(hoverStrength(HOVER_RADIUS), 0, "hover is unlit at its reach")
assert.equal(hoverStrength(HOVER_RADIUS + 1), 0, "hover is unlit past its reach")
assert.equal(hoverStrength(-1), 0, "hover rejects negative distance")

// A pulse is 1 fresh at its origin, gone when decayed or out of reach.
near(pulseStrength(0, 1), 1, "fresh pulse peaks at its origin")
assert.equal(pulseStrength(0, 0), 0, "decayed pulse is unlit")
assert.equal(pulseStrength(PULSE_REACH, 1), 0, "pulse is unlit at its reach")
assert.equal(pulseStrength(PULSE_REACH + 1, 1), 0, "pulse is unlit past its reach")
// Decay is monotonic at the origin, where the band term is pinned at 1.
assert.ok(
  pulseStrength(0, 1) >= pulseStrength(0, 0.5) && pulseStrength(0, 0.5) >= pulseStrength(0, 0.1),
  "pulse decays monotonically at its origin",
)

// Combined strength: idle is dark, hover-only matches the hover term, and
// overlapping origins read as one surface (max), not stacked rings (sum).
const idle = { inside: false, x: 0, y: 0 }
assert.equal(fieldStrength(10, 10, idle, []), 0, "idle field is unlit")
const hover = { inside: true, x: 100, y: 100 }
near(
  fieldStrength(100, 100, hover, []),
  hoverStrength(0),
  "hover-only matches the hover term",
)
const onePulse = [{ x: 50, y: 50, fade: 0.8 }]
const single = fieldStrength(50, 50, idle, onePulse)
const doubled = fieldStrength(50, 50, idle, [...onePulse, ...onePulse])
near(doubled, single, "overlapping pulses take the max, not the sum")
for (let d = 0; d < 200; d += 7.3) {
  const v = fieldStrength(100 + d, 100, hover, [{ x: 300, y: 300, fade: 0.6 }])
  assert.ok(v >= 0 && v <= 1 + 1e-9, `fieldStrength at d=${d} = ${v} out of range`)
}

// Scan bounds: null when idle, otherwise covering every circle of influence.
assert.equal(scanBounds(idle, []), null, "idle scans nothing")
const box = scanBounds(hover, [{ x: 300, y: 300, fade: 0.6 }])
assert.ok(box.minX <= 100 - HOVER_RADIUS && box.maxX >= 300 + PULSE_REACH, "box spans hover and pulse")
assert.ok(box.minY <= 100 - HOVER_RADIUS && box.maxY >= 300 + PULSE_REACH, "box spans hover and pulse")

console.log("contour ok")
