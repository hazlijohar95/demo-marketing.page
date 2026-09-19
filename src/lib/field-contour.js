// Contour banding for the hero SandboxField — pure derivation, no DOM.
// Lives here (not inside SandboxField.jsx) so node tests import the real
// function instead of mirroring it: the interface is the test surface.
export const CONTOUR_STEP = 17
export const CONTOUR_BAND = 0.42
export const CONTOUR_BAND_POWER = 1.4

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
