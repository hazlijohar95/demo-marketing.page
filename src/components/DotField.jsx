import { DotGrid } from "@paper-design/shaders-react"

import { useInView, useSystemTheme } from "../lib/environment.js"

const DOTS = {
  light: { back: "#ffffff", fill: "#d2d2d2" },
  dark: { back: "#161616", fill: "#3d3d3d" },
}

// Shader dot-field painted inside the existing pattern bands.
// Same 2px squares on a 6px grid as the CSS mask it layers over —
// the mask stays as the no-WebGL fallback underneath.
// Lazy-mounted via useInView so the three WebGL contexts only spin up
// when their band scrolls into view.
export default function DotField() {
  const theme = useSystemTheme()
  const [ref, show] = useInView(0.05)

  const colors = DOTS[theme] ?? DOTS.light

  return (
    <span ref={ref} key={theme} data-slot="dot-drift" data-fade aria-hidden="true">
      {show ? (
        <DotGrid
          width="100%"
          height="100%"
          colorBack={colors.back}
          colorFill={colors.fill}
          shape="square"
          size={2.5}
          gapX={6}
          gapY={6}
          sizeRange={0.25}
          opacityRange={0.6}
        />
      ) : null}
    </span>
  )
}
