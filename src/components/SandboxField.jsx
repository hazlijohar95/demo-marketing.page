import { useEffect, useRef } from "react"

import { prefersReducedMotion, useSystemTheme } from "../lib/environment.js"
import { hexToRgb, rgba as css } from "../lib/color.js"
import { CONTOUR_STEP, HOVER_RADIUS, PULSE_REACH, fieldStrength, scanBounds } from "../lib/field-contour.js"

// CanvasUI Grid / Ripple / Magnify, translated into the BoxCompute system.
// The canonical dot grid stays in CSS (square 2px cells on a 6px grid);
// this canvas only paints *activated* cells over it, so the static state
// is byte-identical to the rest of the site. Transparent by default,
// aria-hidden, idle loop stops when settled.
//
// Hover reads as measurement, not decoration: cell brightness is a function of
// distance from the pointer, banded into iso-contours (fract(d / STEP)), so the
// field resolves into nested level curves like an SDF or a topographic map.
// Pointer-down drops a contour origin that decays, which re-centres the rings
// rather than firing a travelling wave.
const GAP = 6
const SIZE = 2
// One ink. The rings carry the structure, so a second hue would only add noise
// the contours already encode as spacing.
const PALETTE = {
  light: { ink: "#c2410c" },
  dark: { ink: "#f97316" },
}
// Contour spacing in px. CONTOUR_STEP is deliberately not a multiple of
// GAP (6): on a multiple, every ring lands on the same lattice columns and
// reads as a grid artifact instead of a measured field.
const STEP = CONTOUR_STEP
const PULSE_LIFE = 1400

export default function SandboxField() {
  const theme = useSystemTheme()
  const themeRef = useRef(theme)
  themeRef.current = theme
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (prefersReducedMotion()) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const pointer = { x: 0, y: 0, tx: 0, ty: 0, inside: false }
    let pulses = []
    let raf = 0
    let running = false
    let visible = true
    let w = 0
    let h = 0

    function resize() {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = Math.max(1, Math.round(rect.width))
      h = Math.max(1, Math.round(rect.height))
      const pw = Math.max(1, Math.round(rect.width * dpr))
      const ph = Math.max(1, Math.round(rect.height * dpr))
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw
        canvas.height = ph
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (!running) draw(performance.now())
    }

    function draw(now) {
      ctx.clearRect(0, 0, w, h)
      pulses = pulses.filter((p) => now - p.t0 < PULSE_LIFE)
      if (!pointer.inside && pulses.length === 0) return

      const palette = PALETTE[themeRef.current] ?? PALETTE.light
      const ink = hexToRgb(palette.ink)
      const offX = (w % GAP) / 2
      const pulseStates = pulses.map((p) => ({ ...p, fade: 1 - (now - p.t0) / PULSE_LIFE }))

      // Only cells within reach of the pointer or a live pulse can clear the
      // `total < 0.03` guard below. Scanning the whole grid computed ~12k sqrt
      // per frame to discard 94% of them.
      const bounds = scanBounds(pointer, pulseStates, HOVER_RADIUS, PULSE_REACH)
      if (!bounds) return
      const { minX, minY, maxX, maxY } = bounds

      // Snap to the same lattice the full scan used, so cells land on
      // identical coordinates and the visual result is unchanged.
      const yFrom = 1 + Math.max(0, Math.floor((minY - 1) / GAP)) * GAP
      const xFrom = offX + 1 + Math.max(0, Math.floor((minX - offX - 1) / GAP)) * GAP

      for (let y = yFrom; y < h && y <= maxY; y += GAP) {
        for (let x = xFrom; x < w && x <= maxX; x += GAP) {
          // Strength is how strongly this cell belongs to *any* contour origin,
          // so overlapping fields read as one surface, not stacked rings.
          const total = fieldStrength(x, y, pointer, pulseStates, STEP)
          if (total < 0.03) continue
          const size = SIZE + total * 1.6
          // Floor of 0.35 so a ring stays a ring at the edge of its falloff.
          ctx.fillStyle = css(ink, Math.min(1, 0.35 + total * 0.65))
          ctx.fillRect(x - size / 2, y - size / 2, size, size)
        }
      }
    }

    function frame(now) {
      const dt = Math.min((now - (frame.last ?? now)) / 1000, 0.05)
      frame.last = now
      const k = 1 - Math.exp(-dt / 0.12)
      pointer.x += (pointer.tx - pointer.x) * k
      pointer.y += (pointer.ty - pointer.y) * k
      draw(now)
      const settled =
        Math.abs(pointer.tx - pointer.x) < 0.1 &&
        Math.abs(pointer.ty - pointer.y) < 0.1 &&
        pulses.length === 0 &&
        !pointer.inside
      if (!visible || settled) {
        running = false
        frame.last = undefined
        if (settled) ctx.clearRect(0, 0, w, h)
        return
      }
      raf = requestAnimationFrame(frame)
    }

    function start() {
      if (running || !visible) return
      running = true
      frame.last = undefined
      raf = requestAnimationFrame(frame)
    }

    function toLocal(event) {
      const rect = canvas.getBoundingClientRect()
      return {
        x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
        y: Math.max(0, Math.min(rect.height, event.clientY - rect.top)),
      }
    }

    const scope = canvas.closest('[data-slot="hero-canvas"]') ?? canvas.parentElement

    function onMove(event) {
      const p = toLocal(event)
      if (!pointer.inside) {
        pointer.x = p.x
        pointer.y = p.y
      }
      pointer.tx = p.x
      pointer.ty = p.y
      pointer.inside = true
      start()
    }

    function onLeave() {
      pointer.inside = false
      start()
    }

    function onDown(event) {
      const p = toLocal(event)
      pulses.push({ x: p.x, y: p.y, t0: performance.now() })
      if (pulses.length > 5) pulses = pulses.slice(-5)
      pointer.tx = p.x
      pointer.ty = p.y
      pointer.inside = true
      start()
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (visible) start()
        else if (running) {
          running = false
          cancelAnimationFrame(raf)
        }
      },
      { threshold: 0.05 }
    )
    io.observe(canvas)
    scope?.addEventListener("pointermove", onMove, { passive: true })
    scope?.addEventListener("pointerleave", onLeave, { passive: true })
    scope?.addEventListener("pointerdown", onDown, { passive: true })

    return () => {
      running = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      scope?.removeEventListener("pointermove", onMove)
      scope?.removeEventListener("pointerleave", onLeave)
      scope?.removeEventListener("pointerdown", onDown)
    }
  }, [])

  return (
    <span data-component="sandbox-field" aria-hidden="true">
      <canvas ref={canvasRef} />
    </span>
  )
}
