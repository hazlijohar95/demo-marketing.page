# 004 — Shorten the console log line fade to fit its beat

- **Status**: DONE (applied directly, feel checks pending)
- **Depends on**: 001 (consumes `--bx-dur-fast` and `--bx-ease-out`)
- **Commit**: `f9d985b` **plus uncommitted working-tree changes**. Line numbers refer to the **working tree**.
- **Severity**: MEDIUM
- **Category**: 2 — Easing & duration
- **Estimated scope**: 1 file (`src/styles.css`), 1 edit

## Problem

Messages in the interactive console recreation fade in over **500ms**, but a new message arrives every **850ms**.

```css
/* src/styles.css:1861-1867 — current */
@media (prefers-reduced-motion: no-preference) {
  [data-page="box"] [data-slot="live-log"] > p,
  [data-page="box"] [data-slot="live-log"] > h4 {
    animation: bx-live-in 500ms ease-out both;
  }
}
```

```css
/* src/styles.css:1869-1873 — current */
@keyframes bx-live-in {
  from {
    opacity: 0;
  }
}
```

The beat is set in JS and is authoritative:

```js
/* src/lib/tour-schedule.js:8 — current */
export const BEAT_MS = 850
```

`500 / 850` means **59% of every beat is spent mid-fade**. The log never reaches a settled state between messages: by the time a line is fully opaque and comfortably readable, the next one is already 350ms from arriving. The section is the page's centrepiece — the interactive console at `#console`, which auto-plays on scroll-in (`src/components/ConsoleDemo.jsx:173-181`) — so this is the motion most visitors judge the product by.

The UI duration budget is under 300ms. 500ms is not catastrophic here because it is opacity-only and text arriving gradually can feel deliberate, but at 59% of the beat it crosses from "calm" into "never resolves".

## Target

```css
/* target */
@media (prefers-reduced-motion: no-preference) {
  [data-page="box"] [data-slot="live-log"] > p,
  [data-page="box"] [data-slot="live-log"] > h4 {
    animation: bx-live-in var(--bx-dur-fast) var(--bx-ease-out) both;
  }
}
```

`--bx-dur-fast` is `200ms` (defined by plan 001). That puts the fade at 24% of the 850ms beat: each line resolves well before the next arrives, and the log has visible rest between messages.

The `@keyframes bx-live-in` block and the `both` fill mode are unchanged. The `reduce` override at `src/styles.css:2221-2226` is unchanged.

## Repo conventions to follow

- **Every animation in this file is wrapped in `@media (prefers-reduced-motion: no-preference)`** and, where it matters, mirrored by a `reduce` block. Both already exist for this rule — do not add or remove either.
- **Exemplar of the token form to imitate**: after plan 001, `src/styles.css:452-461` reads `transition: opacity 180ms var(--bx-ease-out), …`. Use the same `var()` style rather than re-typing a cubic-bezier.
- The keyframe is opacity-only by design and stays that way. Log lines are inserted into a scrolling container that auto-sticks to the bottom (`src/components/ConsoleDemo.jsx:184-190`); adding a `translateY` here would fight that scroll and is explicitly out of scope.

## Steps

1. `src/styles.css:1864` — change `animation: bx-live-in 500ms ease-out both;` to `animation: bx-live-in var(--bx-dur-fast) var(--bx-ease-out) both;`.

That is the whole change. If plan 001 has not been applied yet, STOP — `--bx-dur-fast` will be undefined and the `animation` shorthand will fail to parse, silently removing the fade entirely.

## Boundaries

- Do NOT modify `@keyframes bx-live-in` at `src/styles.css:1869-1873`.
- Do NOT modify the reduce block at `src/styles.css:2221-2226`.
- Do NOT change `BEAT_MS` in `src/lib/tour-schedule.js`. It is consumed by `tourSchedule()` and covered by `src/lib/tour-schedule.test.mjs`; changing it would desynchronise the guided tour from the message stream.
- Do NOT touch the demo terminal's log (`[data-slot="demo-log"]`, `src/styles.css:2410`). It is a different component on a different clock (`LINE_MS = 750`) and has no entrance animation — leave it that way.
- Do NOT add a transform to this animation.
- Do NOT touch any `.jsx` file.

## Verification

- **Mechanical**: `npm run build` → expect `[build] Complete!` and exit 0.
  - `grep -n 'bx-live-in' src/styles.css` → expect exactly two hits: the `animation:` line and the `@keyframes` declaration.
  - `grep -n '500ms' src/styles.css` → the `bx-live-in` line must no longer appear (other 500ms values elsewhere in the file are fine and out of scope).
- **Feel check**: `npm run dev`, open `http://localhost:5180`, scroll to the console section so it auto-plays.
  - Watch a full run. Each line should reach full opacity and **visibly rest** before the next appears. Previously the log felt like a continuous wash; it should now read as discrete arrivals.
  - **This is the value I could not settle from code.** 200ms may read as *hurried* for a product whose whole story is "calm, bounded work". If it does, 300ms is the upper bound worth trying (35% of the beat, still at the edge of the UI budget) — but do not go back above 300ms. Report which you chose and why.
  - Click **Replay** in the console header, then click it again immediately mid-stream. Lines should keep fading in cleanly; because each line is a freshly-keyed element, the keyframe restarting from zero is correct here and should not look glitchy.
  - Click **Play tour** and watch all five steps. The tour beats are derived from `BEAT_MS` (`src/lib/tour-schedule.js:12-25`), so the narration should still land after the stream it describes — confirm step 2 ("It left files behind") does not fire while messages are still arriving.
  - In DevTools → Animations, set playback to 25% and confirm each line fades once, not twice (a double-fade would mean the `both` fill mode was dropped).
  - DevTools → Rendering → emulate `prefers-reduced-motion: reduce`, reload, scroll to the console. Lines must appear instantly with no fade.
- **Done when**: the build passes, the grep shows two `bx-live-in` hits, the log visibly rests between lines, and the guided tour still stays in sync.
