# 002 — Animate the three fill bars with transform instead of width

- **Status**: DONE (applied directly, feel checks pending)
- **Depends on**: 001 (consumes `--bx-dur-bar` and `--bx-ease-out`)
- **Commit**: `f9d985b` **plus uncommitted working-tree changes**. All line numbers refer to the **working tree**. Verify each excerpt before editing.
- **Severity**: HIGH
- **Category**: 5 — Performance
- **Estimated scope**: 3 files (`src/styles.css`, `src/components/MetricBar.jsx`, `src/components/DemoSection.jsx`), ~7 edits

## Problem

Three separate fill bars animate the **`width`** property. Every frame of every one of these transitions triggers layout, then paint, then composite — the most expensive path available. Only `transform` and `opacity` avoid layout and paint.

**Bar 1 — `metric-bar`** (spec board, 3 instances on screen). Two problems in five lines: it animates `width`, and it drives that width from a **CSS variable set on the parent**, which forces a style recalculation across the parent's children on every change. `900ms` is also three times the 300ms UI budget.

```css
/* src/styles.css:2730-2736 — current */
[data-page="box"] [data-component="metric-bar"] > b {
  position: absolute;
  inset: 0 auto 0 0;
  width: var(--metric-bar-fill, 0%);
  background: var(--metric-bar-color, var(--bx-accent));
  transition: width 900ms cubic-bezier(0.2, 0.7, 0.2, 1);
}
```

```jsx
/* src/components/MetricBar.jsx:35-46 — current */
export function MetricBar({ fill = 0, color, active = false, label }) {
  const [ref, seen] = useInView()
  const pct = Math.max(0, Math.min(100, fill))
  return (
    <span
      ref={ref}
      data-component="metric-bar"
      data-active={active ? "true" : undefined}
      role="img"
      aria-label={label}
      style={{ "--metric-bar-fill": `${seen ? pct : 0}%`, "--metric-bar-color": color }}
    >
      <b aria-hidden="true" />
      <em aria-hidden="true" />
    </span>
  )
}
```

**Bar 2 — `demo-meter`** (demo terminal, 3 instances, animates repeatedly during a run). Animates `width`, and uses `ease-out` on what is a **progress readout** — progress is constant motion, which calls for `linear`. The fill advances once per `LINE_MS = 750` beat (`src/components/DemoSection.jsx:11`), so each 600ms eased step decelerates to a stop and then jumps again, reading as stutter rather than steady progress.

```css
/* src/styles.css:2994-2998 — current */
[data-page="box"] [data-slot="demo-meter"] b {
  display: block;
  height: 100%;
  transition: width 600ms ease-out;
}
```

```jsx
/* src/components/DemoSection.jsx:63-72 — current */
function Meter({ label, fill, color }) {
  return (
    <span data-slot="demo-meter">
      <span>{label}</span>
      <i>
        <b style={{ width: `${fill}%`, background: color }} />
      </i>
    </span>
  )
}
```

**Bar 3 — `lc-bar`** (lifecycle flow, 6 instances). Animates `width`, and `500ms` on a click response exceeds the 300ms budget — the bar is still filling well after the click that caused it.

```css
/* src/styles.css:3062-3072 — current */
[data-page="box"] [data-slot="lc-bar"] b {
  display: block;
  height: 100%;
  width: 0;
  background: var(--stage-color, var(--bx-accent));
  transition: width 500ms ease-out;
}
[data-page="box"] [data-slot="lifecycle-track"] button[data-active="true"] [data-slot="lc-bar"] b,
[data-page="box"] [data-slot="lifecycle-track"] button[data-active="done"] [data-slot="lc-bar"] b {
  width: 100%;
}
```

**Reduced-motion coverage is inconsistent.** `metric-bar` has a guard; the other two animate at full travel under `prefers-reduced-motion: reduce`.

```css
/* src/styles.css:2746-2750 — current: covers one of the three bars */
@media (prefers-reduced-motion: reduce) {
  [data-page="box"] [data-component="metric-bar"] > b {
    transition: none;
  }
}
```

## Target

All three bars become `transform: scaleX()` with `transform-origin: left center`, and the value is set **directly on the fill element**, never via a parent variable.

```css
/* target — src/styles.css, metric-bar */
[data-page="box"] [data-component="metric-bar"] > b {
  position: absolute;
  inset: 0;
  transform-origin: left center;
  transition: transform var(--bx-dur-bar) var(--bx-ease-out);
}
```

```jsx
/* target — src/components/MetricBar.jsx */
    <span
      ref={ref}
      data-component="metric-bar"
      data-active={active ? "true" : undefined}
      role="img"
      aria-label={label}
    >
      <b
        aria-hidden="true"
        style={{ transform: `scaleX(${seen ? pct / 100 : 0})`, background: color }}
      />
      <em aria-hidden="true" />
    </span>
```

```css
/* target — src/styles.css, demo-meter.
   linear, because this is a progress readout. The duration comes from the
   JS beat clock so the fill is continuous instead of easing to a stop
   between steps; 300ms is the fallback if the variable is ever missing. */
[data-page="box"] [data-slot="demo-meter"] b {
  display: block;
  width: 100%;
  height: 100%;
  transform-origin: left center;
  transition: transform var(--demo-beat, var(--bx-dur-bar)) linear;
}
```

```jsx
/* target — src/components/DemoSection.jsx */
function Meter({ label, fill, color }) {
  return (
    <span data-slot="demo-meter">
      <span>{label}</span>
      <i>
        <b style={{ transform: `scaleX(${fill / 100})`, background: color }} />
      </i>
    </span>
  )
}
```

```css
/* target — src/styles.css, lc-bar */
[data-page="box"] [data-slot="lc-bar"] b {
  display: block;
  width: 100%;
  height: 100%;
  transform: scaleX(0);
  transform-origin: left center;
  background: var(--stage-color, var(--bx-accent));
  transition: transform var(--bx-dur-bar) var(--bx-ease-out);
}
[data-page="box"] [data-slot="lifecycle-track"] button[data-active="true"] [data-slot="lc-bar"] b,
[data-page="box"] [data-slot="lifecycle-track"] button[data-active="done"] [data-slot="lc-bar"] b {
  transform: scaleX(1);
}
```

```css
/* target — src/styles.css, the reduce guard now covers all three */
@media (prefers-reduced-motion: reduce) {
  [data-page="box"] [data-component="metric-bar"] > b,
  [data-page="box"] [data-slot="demo-meter"] b,
  [data-page="box"] [data-slot="lc-bar"] b {
    transition: none;
  }
}
```

## Repo conventions to follow

- **Per-instance values arrive as inline `style` from JSX**, not as CSS classes. Exemplar: `src/components/LifecycleFlow.jsx:69` passes `style={{ "--stage-color": s.color }}`. Keep that habit for the *colour*; the change here is that the *geometry* moves from a parent variable to a direct property on the child.
- **`--stage-color` stays as it is.** A parent variable driving a child's `background` is fine — the performance concern is specifically variables driving animated transforms, because those recalc styles on every frame. Colour is set once per click.
- **Existing exemplar of a correctly-scoped fill**: none in this repo — all three bars share the same mistake, which is why they are one plan.
- Reduced-motion guards in this file are grouped into `@media (prefers-reduced-motion: reduce)` blocks placed immediately after the rules they modify (see `src/styles.css:2746`). Extend the existing block rather than adding a new one.

## Steps

1. `src/styles.css:2730-2736` — replace the `[data-component="metric-bar"] > b` rule body with the target above. Note three removals: `width`, the `background: var(--metric-bar-color, …)` line (colour moves to JSX), and the hand-typed `cubic-bezier`. `inset: 0 auto 0 0` becomes `inset: 0` so the element is full-width and scaled down from there.

2. `src/components/MetricBar.jsx:39-45` — delete the `style={{ … }}` attribute from the outer `<span>` entirely, and add the `style` attribute to the `<b>` as shown in the target. `pct` is 0–100 and `scaleX` needs 0–1, so divide by 100. Keep `aria-hidden="true"` on both `<b>` and `<em>`, and keep `role="img"` / `aria-label` on the parent.

3. `src/styles.css:2994-2998` — replace the `[data-slot="demo-meter"] b` rule body with the target above (adds `width: 100%`, `transform-origin`, switches to `transform` + `linear`).

4. `src/components/DemoSection.jsx:68` — change `<b style={{ width: `${fill}%`, background: color }} />` to `<b style={{ transform: `scaleX(${fill / 100})`, background: color }} />`.

5. `src/components/DemoSection.jsx` — find the `<div data-slot="demo-meters" aria-hidden="true">` opening tag (around line 173) and add the beat as a CSS variable so the meter duration matches the JS clock:
   ```jsx
   <div data-slot="demo-meters" aria-hidden="true" style={{ "--demo-beat": `${LINE_MS}ms` }}>
   ```
   `LINE_MS` is already declared at `src/components/DemoSection.jsx:11` and is in scope. Do not change its value.

6. `src/styles.css:3062-3072` — replace both `lc-bar` rules with the target above. The `width: 0` → `width: 100%` + `transform: scaleX(0)` swap is the key change; the active/done selector then flips `transform` instead of `width`. Keep the `background: var(--stage-color, var(--bx-accent))` line.

7. `src/styles.css:2746-2750` — extend the existing reduce block to list all three selectors, as in the target.

## Boundaries

- Do NOT change any bar's **visual** size, height, border, or colour. This is a change of animated property only; a screenshot at rest must be pixel-identical.
- Do NOT remove `overflow: hidden` from the three track elements (`metric-bar` at `src/styles.css:2721-2729`, `demo-meter i` at `:2986-2992`, `lc-bar` at `:3055-3061`). `scaleX` can overflow by a subpixel during the transition and those rules clip it.
- Do NOT touch `[data-component="metric-bar"] > em` (`src/styles.css:2737-2742`) — the gloss overlay is `inset: 0` and unaffected.
- Do NOT touch `--stage-color` or the `style` attribute at `src/components/LifecycleFlow.jsx:69`.
- Do NOT change `LINE_MS`, `BEAT_MS`, or any timing constant in JS.
- Do NOT add `will-change`. These bars animate occasionally; a permanent compositor layer for each of twelve bars costs more than it saves.
- Do NOT add new dependencies.
- If an excerpt does not match, STOP and report which one.

## Verification

- **Mechanical**: `npm run build` → expect `[build] Complete!` and exit 0. Then:
  - `grep -n 'transition: width\|transition-property: width' src/styles.css` → expect **no output**.
  - `grep -c 'metric-bar-fill' src/styles.css src/components/MetricBar.jsx` → expect `0` in both.
  - `node --test src/lib/tour-schedule.test.mjs` → expect `pass 1`, `fail 0` (unchanged; this confirms the timing constants were not disturbed).
- **Feel check**: `npm run dev`, open `http://localhost:5180`.
  - **Rest state is identical**: before starting, screenshot the Bounds section and the lifecycle strip. After the change, the filled widths must match exactly. A `scaleX` rounding error shows up here as a bar one pixel short.
  - Scroll to **Bounds, not promises**. The two bars (Timeout, Output) fill on scroll-in. They should now finish in about a third of a second instead of nearly a second — noticeably crisper, and the fill should not overshoot the track.
  - Click through the **lifecycle stages** (Workspace → Delete). Each bar should complete before your finger leaves the mouse. Earlier stages stay filled (`data-active="done"`).
  - Watch the **demo terminal** meters through a full run. The three fills should now advance as continuous sliding motion rather than six visible eased steps. This is the one value I could not settle from code: if `linear` at the 750ms beat instead reads as *sluggish*, try `transition: transform var(--bx-dur-bar) linear` (dropping the beat variable) and compare.
  - In DevTools → **Performance**, record while a demo run streams. Confirm the meter transitions no longer produce "Layout" or "Recalculate Style" entries on every frame — that absence is the entire point of this plan.
  - In DevTools → **Rendering** → emulate `prefers-reduced-motion: reduce`, then reload and click through the lifecycle stages and watch a demo run. All three bars must jump straight to their value with no travel.
- **Done when**: the build passes, both greps are empty/zero, the rest-state screenshots match, and the Performance recording shows no per-frame layout from the meters.
