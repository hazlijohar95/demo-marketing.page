# 005 — Bound the hero dot-field draw loop to the region it actually paints

- **Status**: DONE (applied directly, feel checks pending)
- **Depends on**: nothing (independent, JS-only)
- **Commit**: `f9d985b` **plus uncommitted working-tree changes**. Line numbers refer to the **working tree**.
- **Severity**: MEDIUM
- **Category**: 5 — Performance
- **Estimated scope**: 1 file (`src/components/SandboxField.jsx`), 1 function body

## Problem

`SandboxField` is the interactive dot grid behind the hero headline. Its `draw()` function scans **every cell in the canvas, every frame**, computing a square root for each — but the effect it paints only ever reaches a small fraction of them.

```js
/* src/components/SandboxField.jsx:87-118 — current */
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
```

Do the arithmetic. At desktop widths the hero pattern is fixed at 1280×351 (`src/styles.css:719-725`) and `GAP = 6` (`src/components/SandboxField.jsx:12`), so the loop visits roughly **213 × 58 ≈ 12,400 cells per frame**. Each one costs at minimum a `Math.sqrt`, and with ripples alive it costs another `Math.sqrt` plus a `Math.exp` **per ripple** — up to five (`:170`). That is up to ~74,000 transcendental operations per frame at 60fps.

Meanwhile `HOVER_RADIUS = 120` (`:14`), so the hover glow can touch at most a 240×240 box — about **740 cells, 6% of the grid**. The `if (total < 0.03) continue` guard at `:110` means the other 94% of that work is computed and then thrown away.

The loop only runs while the pointer is inside the hero or a ripple is alive, and the component is otherwise carefully built — it early-returns under `prefersReducedMotion()` (`:45`), gates on `IntersectionObserver` (`:178-190`), stops itself when settled (`:133-139`), uses passive listeners, and caps DPR at 2. This is the one hot spot left, and it sits in the hero, which is the first thing every visitor touches and often the thing being painted while the rest of the page is still hydrating three React islands.

## Target

Compute the union bounding box of everything that can produce visible output this frame, clamp it to the canvas, snap the start coordinates onto the existing grid phase, and iterate only that.

```js
/* target — replaces the double loop, keeping the loop body verbatim */
      // Only cells within reach of the pointer glow or a live ripple band
      // can clear the `total < 0.03` guard below. Scanning the whole grid
      // computed ~12k sqrt per frame to discard 94% of them.
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity

      if (pointer.inside) {
        minX = Math.min(minX, pointer.x - HOVER_RADIUS)
        maxX = Math.max(maxX, pointer.x + HOVER_RADIUS)
        minY = Math.min(minY, pointer.y - HOVER_RADIUS)
        maxY = Math.max(maxY, pointer.y + HOVER_RADIUS)
      }
      for (const r of rippleStates) {
        // The band falls off as exp(-band^2 * 2); 2.5 bands is already
        // below the 0.03 cutoff, so there is nothing to draw beyond it.
        const reach = r.radius + RIPPLE_BAND * 2.5
        minX = Math.min(minX, r.x - reach)
        maxX = Math.max(maxX, r.x + reach)
        minY = Math.min(minY, r.y - reach)
        maxY = Math.max(maxY, r.y + reach)
      }
      if (minX > maxX) return

      // Snap to the same lattice the full scan used, so cells land on
      // identical coordinates and the visual result is unchanged.
      const yFrom = 1 + Math.max(0, Math.floor((minY - 1) / GAP)) * GAP
      const xFrom = offX + 1 + Math.max(0, Math.floor((minX - offX - 1) / GAP)) * GAP

      for (let y = yFrom; y < h && y <= maxY; y += GAP) {
        for (let x = xFrom; x < w && x <= maxX; x += GAP) {
          /* … existing loop body, completely unchanged … */
        }
      }
```

Typical cost drops from ~12,400 cells to under 1,000 while the pointer hovers. With five simultaneous large ripples the box can approach the full canvas, at which point the cost degrades gracefully to today's — never worse.

## Repo conventions to follow

- **This file uses plain closures over `useEffect`-scoped state**, no refs for hot values, no external deps. Keep that: the new bounds are `let` bindings local to `draw()`.
- **Constants are module-level SCREAMING_CASE** at `src/components/SandboxField.jsx:12-17` (`GAP`, `SIZE`, `HOVER_RADIUS`, `RIPPLE_LIFE`, `RIPPLE_SPEED`, `RIPPLE_BAND`). The `2.5` band multiplier is a local tuning detail used once — leave it inline with its explanatory comment rather than promoting it to a constant.
- **Comments in this file explain physical intent**, e.g. `:8-11` and `:36-37`. Match that voice: say why the bound is safe, not what the code does.
- **Exemplar of the same instinct already in this file**: `src/components/SandboxField.jsx:90` early-returns `if (!pointer.inside && ripples.length === 0) return` — this plan extends that existing "don't do work that cannot show" logic from the whole-frame level down to the per-cell level.

## Steps

1. Open `src/components/SandboxField.jsx`. Locate `draw(now)` at `:84`.

2. Immediately **after** the `const rippleStates = ripples.map(…)` block that ends at `:86` and **before** the `for (let y = 1; …` line at `:87`, insert the bounds computation from the target above (the `minX`/`minY`/`maxX`/`maxY` declarations, the `pointer.inside` block, the `rippleStates` loop, the `if (minX > maxX) return`, and the two snap lines).

3. Change the outer loop header from `for (let y = 1; y < h; y += GAP) {` to `for (let y = yFrom; y < h && y <= maxY; y += GAP) {`.

4. Change the inner loop header from `for (let x = offX + 1; x < w; x += GAP) {` to `for (let x = xFrom; x < w && x <= maxX; x += GAP) {`.

5. Leave the entire loop **body** — every line from `const dx = x - pointer.x` at `:89` through `ctx.fillRect(…)` at `:116` — byte-for-byte unchanged.

## Boundaries

- Do NOT change any constant at `src/components/SandboxField.jsx:12-17`. `GAP`, `HOVER_RADIUS`, `RIPPLE_BAND`, `RIPPLE_SPEED` and `RIPPLE_LIFE` all define how the effect *looks*; this plan changes only which cells are visited.
- Do NOT change the `0.03` cutoff at `:110`. The bounding box is derived from it; changing one without the other makes the box wrong.
- Do NOT change `offX` (`:82`), the `ctx.clearRect` at `:85`, or the `ripples.filter` at `:86`. In particular the full-canvas `clearRect` must stay full-canvas — bounding the clear as well would leave stale pixels behind a moving pointer.
- Do NOT touch `frame()`, `start()`, `resize()`, the `IntersectionObserver`, the `ResizeObserver`, or any event listener.
- Do NOT touch `src/components/canvasui/ParticleReveal.jsx` or `rect-cache.js`.
- Do NOT convert this to `OffscreenCanvas`, a worker, WebGL, or a typed-array grid cache. Those are real optimisations and all of them are out of scope; the bounding box is the whole change.
- Do NOT add dependencies.
- If an excerpt does not match, STOP and report.

## Verification

- **Mechanical**: `npm run build` → expect `[build] Complete!` and exit 0. There is no test for this component and no typecheck script; correctness rests on the visual check below.
- **Feel check** — this plan must produce **zero visible change**, so verification is about proving nothing moved:
  - `npm run dev`, open `http://localhost:5180` on a desktop width above 768px.
  - **Pixel comparison.** Before applying the change, hold the cursor still at a fixed, memorable spot in the hero (e.g. exactly on the "k" of "workspace") and screenshot. Apply the change, reload, place the cursor at the same spot, screenshot again. The lit dots must be in **identical positions** with identical brightness. If the pattern has shifted by a few pixels, the lattice snap in step 2 is wrong — recheck the `offX` term in `xFrom`.
  - **Edges are where a bounding bug hides.** Sweep the cursor slowly into all four corners of the hero and along each edge. The glow must not clip, flatten against the boundary, or leave a trailing hard line. Then sweep out of the hero and back in quickly.
  - **Ripples.** Click once in the middle of the hero and watch the mint ring expand to its full 1.2s life. It must fade out smoothly at the far edge of its travel, not vanish at a rectangular boundary. Then click five times rapidly in five widely separated spots (the cap is 5, `:170`) and confirm all five rings render fully and simultaneously.
  - **The measurement that justifies the plan.** DevTools → Performance, record ~5 seconds while sweeping the cursor across the hero. Compare `draw` self-time against a recording taken before the change. Expect a large reduction — if it is not clearly lower, the bounds are not being applied and something is wrong.
  - DevTools → Rendering → emulate `prefers-reduced-motion: reduce`, reload, and hover the hero. Nothing should paint at all — the early return at `:45` handles this and must still work.
  - Resize the window across the 768px breakpoint a few times. `ResizeObserver` re-runs `resize()`, which calls `draw()` while not running (`:73`); confirm no exception in the console and no stale dots.
- **Done when**: the build passes, the two cursor-held screenshots are identical, ripples fade smoothly at full travel with no rectangular clipping, and a Performance recording shows `draw` self-time clearly reduced.
