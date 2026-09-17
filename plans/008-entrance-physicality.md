# 008 — Give the entrance and scroll-reveal animations travel, and tighten the hero stagger

- **Status**: DONE (applied directly, feel checks pending)
- **Depends on**: 001 (consumes `--bx-dur-enter` and `--bx-ease-out`)
- **Commit**: `f9d985b` **plus uncommitted working-tree changes**. Line numbers refer to the **working tree**.
- **Severity**: LOW
- **Category**: 3 — Physicality & origin (plus stagger, category 7)
- **Estimated scope**: 2 files (`src/styles.css`, `src/components/Hero.jsx`), ~5 edits
- **Note**: this is the most taste-dependent plan in the set. Read the feel-check section before starting, and be prepared to report that the change should be reverted.

## Problem

**Problem 1 — the entrance system is a pure opacity fade with no transform.** Nothing in the physical world appears by becoming opaque in place. Both of the page's entrance mechanisms do exactly that:

```css
/* src/styles.css:2243-2257 — current */
@media (prefers-reduced-motion: no-preference) {
  [data-page="box"] [data-entrance] {
    opacity: 0;
    animation: bx-rise 600ms ease-out forwards;
    animation-delay: var(--enter-delay, 0ms);
  }
  [data-page="box"] [data-reveal] {
    opacity: 0;
    transition: opacity 600ms ease-out;
    transition-delay: var(--reveal-delay, 0ms);
  }
  [data-page="box"] [data-reveal].is-visible {
    opacity: 1;
  }
}
```

The keyframe is named **`bx-rise`** and nothing rises:

```css
/* src/styles.css:2259-2266 — current */
@keyframes bx-rise {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

The name is evidence of intent that was never implemented. `[data-reveal]` is applied by `src/components/Reveal.jsx` and wraps almost every section on the page (Platform, Compare, Demo, Spec, How it works, FAQ, Closing), so this is the page's dominant motion.

**Problem 2 — 600ms is long for an entrance.** Both paths run 600ms. That is double the UI budget. Scroll reveals get more latitude than interactive UI, but 600ms of opacity-only fade is where "elegant" tips into "slow to arrive", especially since `onVisible` fires at only 12% visibility (`src/lib/visible.js:4`) — the element starts fading while still mostly below the fold and can still be mid-fade when fully on screen.

**Problem 3 — the hero stagger is 100ms per item.** Four elements, hardcoded delays of 0 / 100 / 200 / 300ms:

```jsx
/* src/components/Hero.jsx:8-32 — current, abridged */
      <p data-slot="hero-meta" role="status" data-entrance style={{ "--enter-delay": "0ms" }}>
      …
        <h1 id="hero-title" data-entrance style={{ "--enter-delay": "100ms" }}>
      …
          <p data-entrance style={{ "--enter-delay": "200ms" }}>
      …
          <div data-slot="hero-actions" data-entrance style={{ "--enter-delay": "300ms" }}>
```

The recommended stagger band is 30–80ms. At 100ms the last item — the **primary CTA** — only *begins* its 600ms fade 300ms after page paint, finishing at 900ms. Stagger is decorative and must never be the reason a button is slow to appear.

## Target

Add a small vertical travel, shorten to `--bx-dur-enter` (400ms), and tighten the stagger to 60ms.

```css
/* target — src/styles.css:2243-2257 */
@media (prefers-reduced-motion: no-preference) {
  [data-page="box"] [data-entrance] {
    opacity: 0;
    animation: bx-rise var(--bx-dur-enter) var(--bx-ease-out) forwards;
    animation-delay: var(--enter-delay, 0ms);
  }
  [data-page="box"] [data-reveal] {
    opacity: 0;
    transform: translateY(8px);
    transition:
      opacity var(--bx-dur-enter) var(--bx-ease-out),
      transform var(--bx-dur-enter) var(--bx-ease-out);
    transition-delay: var(--reveal-delay, 0ms);
  }
  [data-page="box"] [data-reveal].is-visible {
    opacity: 1;
    transform: none;
  }
}
```

```css
/* target — src/styles.css:2259-2266 */
@keyframes bx-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
```

```jsx
/* target — src/components/Hero.jsx, delays only */
  0ms   → hero-meta      (unchanged)
  100ms → 60ms           h1
  200ms → 120ms          hero-copy p
  300ms → 180ms          hero-actions
```

8px is the travel: enough to read as arrival, small enough that it cannot cause a visible layout shift or draw attention to itself on a section-sized element. `transform: none` (not `translateY(0)`) on the settled state so the element is not left with a needless compositor layer.

## Repo conventions to follow

- **`[data-reveal]` is set by a shared component**, `src/components/Reveal.jsx:20-24`, which also owns the `--reveal-delay` custom property and the `.is-visible` class added by `onVisible`. **Do not modify `Reveal.jsx`** — the CSS change is sufficient because the component already toggles the class this rule keys off.
- **`[data-entrance]` has no component**; the attribute and its `--enter-delay` are written inline in `src/components/Hero.jsx` only. `grep -rn 'data-entrance' src/` should return four hits, all in `Hero.jsx`. Confirm that before editing — if there are more, they need the same delay treatment.
- **`prefersReducedMotion()` is handled in JS too**: `src/components/Reveal.jsx:11-14` adds `.is-visible` immediately under reduced motion, bypassing the transition. That path keeps working unchanged, because the `translateY` only exists inside the `no-preference` media query — under `reduce`, `[data-reveal]` has no transform at all and no `opacity: 0`. Verify this: the whole block at `:2243` is inside `@media (prefers-reduced-motion: no-preference)`, so nothing needs a `reduce` override.
- **Exemplar of the travel distance and curve to match**: `bx-detail-in` at `src/styles.css:2288-2293` uses `translateY(2px)` for readouts next to the click that caused them, and `bx-panel-in` at `:2295-2300` uses `translateX(6px)` for a drill-in. 8px for a whole section entering the viewport is the same family, scaled to the element.

## Steps

1. `src/styles.css:2245` — change `animation: bx-rise 600ms ease-out forwards;` to `animation: bx-rise var(--bx-dur-enter) var(--bx-ease-out) forwards;`.

2. `src/styles.css:2248-2252` — add `transform: translateY(8px);` after the `opacity: 0;` line, and replace the single-property `transition: opacity 600ms ease-out;` with the two-property transition from the target.

3. `src/styles.css:2253-2256` — add `transform: none;` to the `[data-reveal].is-visible` rule alongside the existing `opacity: 1;`.

4. `src/styles.css:2259-2266` — add `transform: translateY(8px);` to the `from` block and `transform: none;` to the `to` block of `@keyframes bx-rise`.

5. `src/components/Hero.jsx` — change three `--enter-delay` values: `"100ms"` → `"60ms"` (line 16, the `h1`), `"200ms"` → `"120ms"` (line 21, the copy paragraph), `"300ms"` → `"180ms"` (line 24, `hero-actions`). Leave the `"0ms"` on `hero-meta` (line 8) as it is. Change nothing else in the file.

## Boundaries

- Do NOT modify `src/components/Reveal.jsx`. Do NOT modify `src/lib/visible.js` or its 12% threshold.
- Do NOT add a `@media (prefers-reduced-motion: reduce)` override for either selector. The entire rule block already lives inside `no-preference`; adding a `reduce` block would be dead code.
- Do NOT increase the travel beyond 8px. `[data-reveal]` wraps whole sections including tables and the 6-cell spec board; larger travel on elements that tall reads as the page assembling itself and risks looking like layout shift.
- Do NOT animate anything other than `opacity` and `transform`.
- Do NOT add a stagger to `[data-reveal]` sections beyond the `--reveal-delay` values already passed by callers (e.g. `src/components/PlatformSection.jsx:120` uses `delay={index * 100}`). Those are out of scope; changing them touches four more components.
- Do NOT rename `bx-rise`, `[data-entrance]`, or `[data-reveal]`.
- If `grep -rn 'data-entrance' src/` returns hits outside `Hero.jsx`, STOP and report before editing.

## Verification

- **Mechanical**: `npm run build` → expect `[build] Complete!` and exit 0.
  - `grep -c 'data-entrance' src/components/Hero.jsx` → expect `4`.
  - `grep -rn 'data-entrance' src/ --include=*.jsx --include=*.astro | grep -v Hero.jsx` → expect **no output**.
  - `grep -n '600ms' src/styles.css` → neither the `[data-entrance]` nor the `[data-reveal]` rule may still appear (other 600ms values elsewhere are out of scope).
- **Feel check** — **this plan is a judgment call and the feel check decides whether to keep it:**
  - `npm run dev`, open `http://localhost:5180`, hard-reload.
  - **The hero.** The four elements should arrive in a quick cascade rather than a slow procession. Time it roughly: the CTA now finishes at ~580ms instead of ~900ms. Confirm the CTA is clickable and visually settled well under a second.
  - **The judgment.** Scroll slowly down the whole page, then scroll back up and down again several times at different speeds. Ask: does the 8px travel read as *polish*, or does the page look like it is **assembling itself** every time you scroll? Sections wrapped in `Reveal` include the compare table and the spec board — large, dense, grid-heavy blocks. If any of them look like they are settling into place rather than simply appearing, **revert steps 2, 3 and 4 (keep the transform out) and retain only the duration and stagger changes from steps 1 and 5.** Report that outcome explicitly; a partial application here is a legitimate result, not a failure.
  - **Check for false layout shift.** DevTools → Rendering → enable "Layout Shift Regions", then scroll the page. The `translateY` is a transform and must produce **zero** shift regions. If any appear, something was applied as a layout property instead of a transform.
  - **Check the reveal cannot be caught mid-fade.** `onVisible` fires at 12% visibility, so with the shorter 400ms duration a section should be fully settled by the time it is comfortably on screen. Scroll at a normal reading pace and confirm no section is still fading once it is fully visible.
  - **Interruptibility.** `[data-reveal]` uses a transition, so scrolling a section in and out quickly should retarget smoothly, never restart. `[data-entrance]` is a keyframe but runs once on mount — confirm it does not re-run on scroll.
  - DevTools → Rendering → emulate `prefers-reduced-motion: reduce`, hard-reload, and scroll the whole page. **Every section must be fully visible and unmoved** — no fade, no travel, no `opacity: 0` stuck anywhere. This is the most important check in this plan: `Reveal.jsx` adds `.is-visible` immediately under reduced motion, but if the `translateY` leaked outside the `no-preference` block, sections would be permanently offset by 8px.
  - With JS disabled (DevTools → Settings → Debugger → Disable JavaScript), reload: `.is-visible` never gets added, so confirm content is still readable. Note that this is **pre-existing behaviour, not introduced here** — if sections are invisible without JS, that is an existing issue to report separately, not to fix in this plan.
- **Done when**: the build passes, the greps match, Layout Shift Regions shows nothing during scroll, reduced motion shows every section unmoved and fully opaque, and you have made and reported an explicit keep-or-revert call on the 8px travel.
