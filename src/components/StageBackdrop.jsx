import { StaticMeshGradient } from "@paper-design/shaders-react"

import { useInView } from "../lib/environment.js"
import { useResolvedTheme } from "../lib/theme.js"

// Mesh backdrop for the console stage. Static (renders once, no motion) so it
// is cheap and motion-safe by design — no reduced-motion branch needed.
// Palettes sit on the stage shelf (--bx-layer): near-background tones with a
// whisper of brand ember, so the recreation stays the focus and the shelf
// reads as lit, not loud.
const MESH = {
  light: ["#fafafa", "#f3ece3", "#e7d6c2", "#d3ac84"],
  dark: ["#1d1d1d", "#251a12", "#372312", "#4d2e14"],
}

export default function StageBackdrop() {
  const [theme] = useResolvedTheme()
  const [ref, show] = useInView(0.05)

  const colors = MESH[theme] ?? MESH.light

  return (
    <span ref={ref} key={theme} data-slot="stage-mesh" data-fade aria-hidden="true">
      {show ? (
        <StaticMeshGradient
          width="100%"
          height="100%"
          colors={colors}
          positions={60}
          waveX={0.35}
          waveY={0.35}
          mixing={0.85}
          grainMixer={0.15}
          grainOverlay={0.08}
        />
      ) : null}
    </span>
  )
}
