# 006 — Make the demo terminal's running state visually distinct from done

- **Status**: DONE (applied directly, feel checks pending)
- **Depends on**: nothing (independent — reuses the existing `bx-caret` keyframe)
- **Commit**: `f9d985b` **plus uncommitted working-tree changes**. Line numbers refer to the **working tree**.
- **Severity**: MEDIUM
- **Category**: 8 — Missed opportunities (state indication)
- **Estimated scope**: 1 file (`src/styles.css`), 1 edit

## Problem

The demo terminal has a status pill in its header that reads "Running" or "Done", with a 6px square dot before it. The dot is supposed to distinguish the two states. It does not — **the `running` rule sets the identical colour as the base rule two selectors above it.**

```css
/* src/styles.css:2399-2408 — current */
[data-page="box"] [data-slot="demo-status"]::before {
  content: "";
  width: 6px;
  height: 6px;
  background: var(--bx-success);
}

[data-page="box"] [data-slot="demo-status"][data-state="running"]::before {
  background: var(--bx-success);
}
```

The JSX faithfully writes the attribute, so the whole mechanism is wired and drives nothing:

```jsx
/* src/components/DemoSection.jsx:168-171 — current */
            <span data-slot="demo-status" role="status" data-state={running ? "running" : "done"}>
              {running ? "Running" : "Done"}
            </span>
```

`running` is derived at `src/components/DemoSection.jsx:77`:

```jsx
  const running = started && shown < scenario.lines.length
```

So a run in progress and a finished run present the same green dot; only the text changes. The dot is the faster signal — it is what the eye catches — and it is currently inert. Green-for-in-progress is also the wrong semantic: green reads as "succeeded" across the rest of this page (`--bx-success` marks the `win` lines at `src/styles.css:2465-2472`, the hero status pill, and the footer "Isolated by default").

This is filed as a missed opportunity rather than a bug because nothing is broken — but a dead CSS rule that exists specifically to indicate state is the clearest possible signal that motion belongs here.

There is already a correct precedent for "busy" in this very component. The streaming caret uses a hard blink:

```css
/* src/styles.css:2475-2486 — current, added previously */
@media (prefers-reduced-motion: no-preference) {
  [data-page="box"] [data-slot="demo-caret"] {
    animation: bx-caret 1s steps(1, end) infinite;
  }
}

@keyframes bx-caret {
  50% {
    opacity: 0;
  }
}
```

## Target

Amber and blinking while running; solid green when done. Reuse `bx-caret` — do not author a second blink keyframe.

```css
/* target — replaces src/styles.css:2406-2408 */
/* Running is amber and blinking; done is the solid green the rest of the
   page uses for success. The previous rule set --bx-success for both, so
   the dot never distinguished the two states. */
[data-page="box"] [data-slot="demo-status"][data-state="running"]::before {
  background: #d69a00;
}

@media (prefers-reduced-motion: no-preference) {
  [data-page="box"] [data-slot="demo-status"][data-state="running"]::before {
    animation: bx-caret 1s steps(1, end) infinite;
  }
}
```

`#d69a00` is not a new colour — it is already in the file at `src/styles.css:2019` (`live-sandbox-dot`, the border of the Sandbox indicator in the console inspector), where it carries exactly this meaning: warm, active, not-yet-finished.

The base rule at `:2399-2405` is unchanged and supplies the done state (`--bx-success`).

Under `prefers-reduced-motion: reduce` the dot still turns amber — the colour change alone distinguishes the states, so no information is lost. That is the correct shape for reduced motion: drop the movement, keep the meaning.

## Repo conventions to follow

- **Status dots are a repeated pattern in this file**, always a 6px square `::before` with a `background`: `[data-slot="status"]::before` (`:1226-1231`), `[data-slot="live-badge"]::before` (`:1384-1389`), and this one. Do not change the geometry — square, 6px, no border-radius. The design system is square-cornered throughout.
- **Amber for in-progress already exists**: `src/styles.css:2015-2021`, `[data-slot="live-sandbox-dot"]` uses `#d69a00`. Reuse the literal; do not introduce a `--bx-warning` token, since one colour used twice does not justify one and plan 001 deliberately keeps the token set minimal.
- **Every animation is wrapped in `@media (prefers-reduced-motion: no-preference)`.** Exemplar: `src/styles.css:2475-2479`. Follow it exactly — an ungated `animation` would be the only one in the file.
- **`bx-caret` uses `steps(1, end)`, not an eased fade.** That is deliberate: hard on/off matches the square, hairline, terminal aesthetic. The softer `bx-blink` (`:2948`, `ease-in-out`) belongs to the rounded ops dots in the platform cards. Use `bx-caret` here — this dot lives in a terminal.

## Steps

1. In `src/styles.css`, replace the rule at `:2406-2408` with the target above: change `background: var(--bx-success);` to `background: #d69a00;`, and add the explanatory comment.

2. Immediately after that rule, add the `@media (prefers-reduced-motion: no-preference)` block that applies `animation: bx-caret 1s steps(1, end) infinite;` to the same selector.

3. Leave the base `[data-slot="demo-status"]::before` rule at `:2399-2405` untouched — it is the done state.

## Boundaries

- Do NOT modify `@keyframes bx-caret` at `src/styles.css:2482-2486`. It is shared with `[data-slot="demo-caret"]`, which appears in both the demo terminal (`src/components/DemoSection.jsx:182`) and the console recreation (`src/components/ConsoleDemo.jsx:551` and `:643`). Changing the keyframe changes all three.
- Do NOT touch `[data-slot="status"]::before` (`:1226`) or `[data-slot="live-badge"]::before` (`:1384`). Those are static "always true" indicators — the footer's "Isolated by default" and the console's live badge are not progress states, and blinking them would be decoration on a permanent condition.
- Do NOT touch `src/components/DemoSection.jsx`. The `data-state` attribute and the `running` derivation are already correct; the entire defect is in CSS.
- Do NOT change the `demo-status` text, `role="status"`, colour, size, or `gap`.
- Do NOT add a `--bx-warning` token or any other token. Plan 001 owns the token set.
- Do NOT extend the amber treatment to `[data-slot="demo-head"]` or the surrounding pill background. The dot alone is the signal.
- If an excerpt does not match, STOP and report.

## Verification

- **Mechanical**: `npm run build` → expect `[build] Complete!` and exit 0.
  - `grep -c 'bx-caret' src/styles.css` → expect `3` (the caret's `animation`, the new status `animation`, and the `@keyframes`).
  - `grep -n 'demo-status"\]\[data-state="running"\]' src/styles.css` → expect two hits (the colour rule and the animation rule), and neither may contain `--bx-success`.
- **Feel check**: `npm run dev`, open `http://localhost:5180`, scroll to **Watch it work** so the run auto-starts (it triggers at 30% visibility, `src/components/DemoSection.jsx:82`).
  - During the run the dot must be **amber and blinking** once per second, in step with the caret at the bottom of the log — both use `bx-caret 1s`, so they should pulse together. If they are out of phase that is expected and fine (they start at different times); if the status dot is not blinking at all, step 2 was missed.
  - When the run finishes, the dot must go **solid green** and stop blinking, and the label must read "Done".
  - Click **Replay**. The dot must return to amber and resume blinking, then settle green again. Click Replay repeatedly mid-run — the dot should track `running` without getting stuck in either state.
  - Switch scenarios with the three pills (Ship a fix / Read the data / Stay observable). Each switch restarts the run (`src/components/DemoSection.jsx:88`), so the dot should go amber again each time.
  - Check contrast: the dot sits on `#161616` (`[data-component="demo-figure"]`, `:2371`). `#d69a00` on `#161616` is comfortably visible. Confirm by eye that it does not disappear in the dark terminal chrome, and that it is clearly distinguishable from the green — if the two read as similar at a glance, the plan has failed its purpose.
  - DevTools → Rendering → emulate `prefers-reduced-motion: reduce`, reload, scroll to the demo. The dot must be amber and **static** during the run, then green when done. The states must still be tellable apart with no motion at all — that is the accessibility requirement.
- **Done when**: the build passes, both greps match, the dot blinks amber during a run and sits solid green after, and the amber/green distinction survives with reduced motion enabled.
