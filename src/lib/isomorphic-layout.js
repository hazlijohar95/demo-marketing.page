import { useEffect, useLayoutEffect } from "react"

// Layout effect on the client (so first paint already reflects post-mount
// state), passive effect on the server (where layout effects are a no-op
// warning). Shared by islands that must commit DOM measurements or GL
// setup before the browser paints on hydration.
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect
