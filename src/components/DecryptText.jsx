import { useEffect, useState } from "react"

import { prefersReducedMotion } from "../lib/environment.js"

// CanvasUI Decrypt Reveal, voiced for BoxCompute: staged mono lines
// descramble from product glyphs, left to right, spaces never scrambled
// so the line keeps its shape while resolving. Instant under
// prefers-reduced-motion. Parent keeps the stable key so replay
// re-mounts and re-runs the reveal.
const GLYPHS = "[]{}<>/\\|—·:+$#01"
const FRAMES = 18
const FRAME_MS = 30

export default function DecryptText({ text }) {
  const [out, setOut] = useState(text)

  useEffect(() => {
    if (prefersReducedMotion()) {
      setOut(text)
      return
    }
    let frame = 0
    setOut(text)
    const id = window.setInterval(() => {
      frame += 1
      const reveal = Math.floor((frame / FRAMES) * text.length)
      let next = ""
      for (let i = 0; i < text.length; i += 1) {
        const ch = text[i]
        if (ch === " " || i < reveal) next += ch
        else next += GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
      }
      setOut(next)
      if (frame >= FRAMES) {
        window.clearInterval(id)
        setOut(text)
      }
    }, FRAME_MS)
    return () => window.clearInterval(id)
  }, [text])

  return <span>{out}</span>
}
