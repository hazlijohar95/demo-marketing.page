import ConsoleDemo from "./ConsoleDemo.jsx"
import { ParticleReveal } from "./canvasui/ParticleReveal.jsx"
import { useMediaQuery, useSystemTheme } from "../lib/environment.js"

// True Canvas UI Particle Reveal over the live console recreation:
// the console renders as grayscale dust until the cursor approaches,
// then grains merge back into crisp UI.
//
// Progressive enhancement with four gates — SSR and every other visitor
// gets the byte-identical plain ConsoleDemo:
//   1. html-in-canvas support (Chrome flag / origin-trial token; the
//      ParticleReveal component itself falls back to plain HTML),
//   2. desktop widths only (min-width matches the live-grid clamp rule,
//      so the effect wrapper can share its exact fixed height —
//      variable-height mobile stacking stays on the plain console),
//   3. fine pointers only (the reveal is cursor-driven; touch users
//      keep the fully interactive console),
//   4. no prefers-reduced-motion (no GL at all, not even the crisp path).
// The gate flips in a layout effect (pre-paint) so hydration never
// flashes. Crossing the breakpoint later reparents ConsoleDemo and
// resets its local tab/search state — accepted: the layout reflows
// completely at that point anyway.
const BG = { light: "#ffffff", dark: "#161616" }

function useRevealEnabled() {
  const wide = useMediaQuery("(min-width: 64.001rem)")
  const fine = useMediaQuery("(pointer: fine)")
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)")
  return wide && fine && !reduced
}

export default function ConsoleReveal() {
  const theme = useSystemTheme()
  const enabled = useRevealEnabled()

  if (!enabled) return <ConsoleDemo />

  return (
    <div data-component="console-reveal">
      <ParticleReveal
        radius={260}
        softness={0.85}
        bend={10}
        aberration={6}
        scatter={20}
        smoothing={0.2}
        drift={0}
        background={BG[theme] ?? BG.light}
        style={{ height: "100%" }}
      >
        <ConsoleDemo />
      </ParticleReveal>
    </div>
  )
}
