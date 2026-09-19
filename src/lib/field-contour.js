// Contour banding for the hero SandboxField — pure derivation, no DOM.
// Lives here (not inside SandboxField.jsx) so node tests import the real
// function instead of mirroring it: the interface is the test surface.
export const CONTOUR_STEP = 17
export const CONTOUR_BAND = 0.42
export const CONTOUR_BAND_POWER = 1.4

// Field geometry owned with the banding it serves, not with the painter:
// the scan box and every strength below must agree on these reaches, and a
// fix that lands in one place but not the other inks or starves cells.
export const HOVER_RADIUS = 132
export const PULSE_REACH = 190

// Triangle wave on distance: 1 at the centre of a contour, 0 between two.
// Raised to a power so the band stays thin and reads as a drawn line.
// `step` is overridable: decaying pulses tighten their rings as they settle
// (see SandboxField), while the hover field uses the default step.
export function contour(dist, step = CONTOUR_STEP) {
  const phase = Math.abs(((dist / step) % 1) - 0.5) * 2
  return phase <= 1 - CONTOUR_BAND
    ? 0
    : ((phase - (1 - CONTOUR_BAND)) / CONTOUR_BAND) ** CONTOUR_BAND_POWER
}

// --- Field accumulation: how strongly one cell belongs to the field ---
// Same contract as the painter: strengths feed an alpha and a rect size, so
// every helper returns 0..1 and the painter keeps its `< 0.03` ink guard.

// Hover reads as measurement: linear falloff, not squared — squaring drops
// the outer rings below the alpha floor and only the innermost two survive.
export function hoverStrength(dist, radius = HOVER_RADIUS) {
  if (dist < 0 || dist >= radius) return 0
  return contour(dist) * (1 - dist / radius)
}

// One pulse's contribution at `dist`, decaying with `fade` (1 fresh, 0 gone).
// Rings tighten as the pulse decays so the field settles to a finer
// measurement rather than travelling outward.
export function pulseStrength(dist, fade, step = CONTOUR_STEP, reach = PULSE_REACH) {
  if (dist < 0 || dist >= reach || fade <= 0) return 0
  const falloff = 1 - dist / reach
  const band = contour(dist, step * (0.6 + fade * 0.4))
  return band * falloff * fade
}

// Combined strength at one lattice point. Overlapping fields read as one
// surface (max), not stacked rings (sum). `pointer` is the live pointer
// ({ inside, x, y }); `pulseStates` are live pulses with precomputed fade
// ({ x, y, fade }) — timing (PULSE_LIFE) stays with the painter.
export function fieldStrength(x, y, pointer, pulseStates, step = CONTOUR_STEP) {
  let total = 0
  if (pointer?.inside) {
    const dx = x - pointer.x
    const dy = y - pointer.y
    total = hoverStrength(Math.sqrt(dx * dx + dy * dy))
  }
  for (const p of pulseStates ?? []) {
    const dx = x - p.x
    const dy = y - p.y
    total = Math.max(total, pulseStrength(Math.sqrt(dx * dx + dy * dy), p.fade, step))
  }
  return total
}

// Bounding box covering every circle of influence, so the painter scans only
// cells that can clear its ink guard. Null when idle (nothing can ink).
// Lattice snapping stays with the painter — it owns GAP and the offset.
export function scanBounds(pointer, pulseStates, hoverReach = HOVER_RADIUS, pulseReach = PULSE_REACH) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  const cover = (cx, cy, reach) => {
    minX = Math.min(minX, cx - reach)
    maxX = Math.max(maxX, cx + reach)
    minY = Math.min(minY, cy - reach)
    maxY = Math.max(maxY, cy + reach)
  }

  if (pointer?.inside) cover(pointer.x, pointer.y, hoverReach)
  for (const p of pulseStates ?? []) cover(p.x, p.y, pulseReach)
  if (minX > maxX) return null
  return { minX, minY, maxX, maxY }
}
