import { useEffect, useRef } from "react"

import { useSystemTheme } from "../theme.js"
import { prefersReducedMotion } from "../lib/reduced-motion.js"

// CanvasUI Grid / Ripple / Magnify, translated into the BoxCompute system.
// The canonical dot grid stays in CSS (square 2px cells on a 6px grid);
// this canvas only paints *activated* cells over it, so the static state
// is byte-identical to the rest of the site. Hover inspects (accent),
// pointer-down spawns a sandbox ripple (mint ring, blue trail).
// Transparent by default, aria-hidden, idle loop stops when settled.
const GAP = 6
const SIZE = 2
const HOVER_RADIUS = 120
const RIPPLE_LIFE = 1200
const RIPPLE_SPEED = 0.28
const RIPPLE_BAND = 36

const PALETTE = {
  light: { hover: "#3b5cf6", ripple: "#9ae600", trail: "#51a2ff" },
  dark: { hover: "#8190ff", ripple: "#9ae600", trail: "#51a2ff" },
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function mix(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

function css(rgb, alpha) {
  return `rgba(${Math.round(rgb[0])}, ${Math.round(rgb[1])}, ${Math.round(rgb[2])}, ${alpha.toFixed(3)})`
}

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
    let ripples = []
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
      ripples = ripples.filter((r) => now - r.t0 < RIPPLE_LIFE)
      if (!pointer.inside && ripples.length === 0) return

      const palette = PALETTE[themeRef.current] ?? PALETTE.light
      const hoverRgb = hexToRgb(palette.hover)
      const rippleRgb = hexToRgb(palette.ripple)
      const trailRgb = hexToRgb(palette.trail)
      const offX = (w % GAP) / 2
      const rippleStates = ripples.map((r) => {
        const age = now - r.t0
        return { ...r, age, radius: age * RIPPLE_SPEED, fade: 1 - age / RIPPLE_LIFE }
      })

      for (let y = 1; y < h; y += GAP) {
        for (let x = offX + 1; x < w; x += GAP) {
          const dx = x - pointer.x
          const dy = y - pointer.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          let glow = 0
          if (pointer.inside && dist < HOVER_RADIUS) {
            const t = 1 - dist / HOVER_RADIUS
            glow = t * t
          }
          let ring = 0
          let ringAge = 0
          for (const r of rippleStates) {
            const dxr = x - r.x
            const dyr = y - r.y
            const d = Math.sqrt(dxr * dxr + dyr * dyr)
            const band = (d - r.radius) / RIPPLE_BAND
            const g = Math.exp(-band * band * 2) * r.fade
            if (g > ring) {
              ring = g
              ringAge = r.age / RIPPLE_LIFE
            }
          }
          const total = Math.max(glow, ring)
          if (total < 0.03) continue
          const size = SIZE + total * 2
          const base = ring > glow ? mix(rippleRgb, trailRgb, ringAge) : hoverRgb
          ctx.fillStyle = css(base, 0.25 + total * 0.75)
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
        ripples.length === 0 &&
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
      ripples.push({ x: p.x, y: p.y, t0: performance.now() })
      if (ripples.length > 5) ripples = ripples.slice(-5)
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
