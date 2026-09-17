# 007 — Match the FAQ icon rotation to the panel it opens, and delete the duplicated reduce block

- **Status**: DONE (applied directly, feel checks pending)
- **Depends on**: 001 (consumes `--bx-dur-ui` and `--bx-ease-in-out`)
- **Commit**: `f9d985b` **plus uncommitted working-tree changes**. Line numbers refer to the **working tree**.
- **Severity**: MEDIUM
- **Category**: 2 — Easing & duration (plus one cohesion cleanup)
- **Estimated scope**: 1 file (`src/styles.css`), 3 edits

## Problem

**Problem 1 — the icon and its panel disagree by 120ms.** The `+` icon in each FAQ summary rotates to an `×` over 120ms, while the answer panel it reveals opens over 240ms:

```css
/* src/styles.css:1004-1010 — current */
[data-page="box"] [data-component="faq-list"] summary svg {
  width: 15px;
  height: 15px;
  flex: 0 0 auto;
  color: var(--bx-faint);
  transition: transform 120ms ease;
}
```

```css
/* src/styles.css:1016-1030 — current: the panel, added in an earlier pass */
@media (prefers-reduced-motion: no-preference) {
  [data-page="box"] [data-component="faq-list"] details::details-content {
    block-size: 0;
    overflow: clip;
    transition:
      block-size 240ms ease-out,
      content-visibility 240ms allow-discrete;
  }
  [data-page="box"] [data-component="faq-list"] details[open]::details-content {
    block-size: auto;
  }
}
```

Two elements driven by the same click, finishing 120ms apart. The icon snaps to its final angle while the panel is only half open, which reads as the icon being disconnected from the thing it controls. When two elements animate from one gesture they should land together.

**Problem 2 — wrong curve for the motion type.** A rotation is on-screen movement, not an entrance or exit, so the decision order calls for `ease-in-out`. `ease` is the curve for colour changes. And bare `ease` is a weak built-in besides.

**Problem 3 — a byte-identical reduce block exists twice.** The same four lines appear at two places in the file, ~1,670 lines apart:

```css
/* src/styles.css:1039-1043 — current */
@media (prefers-reduced-motion: reduce) {
  [data-page="box"] [data-component="faq-list"] summary svg {
    transition: none;
  }
}
```

```css
/* src/styles.css:2715-2719 — current: identical, dead duplication */
@media (prefers-reduced-motion: reduce) {
  [data-page="box"] [data-component="faq-list"] summary svg {
    transition: none;
  }
}
```

The second is redundant. It is harmless at runtime but it is exactly the kind of drift that makes a future change to one copy silently ineffective.

Note that neither copy covers the `::details-content` transition — but that one is already inside `@media (prefers-reduced-motion: no-preference)` (`:1016`), so it is correctly excluded under `reduce` without needing an override. No change needed there.

## Target

```css
/* target — src/styles.css:1004-1010 */
[data-page="box"] [data-component="faq-list"] summary svg {
  width: 15px;
  height: 15px;
  flex: 0 0 auto;
  color: var(--bx-faint);
  transition: transform var(--bx-dur-ui) var(--bx-ease-in-out);
}
```

`--bx-dur-ui` is `240ms` (plan 001), matching the panel exactly. `--bx-ease-in-out` is `cubic-bezier(0.77, 0, 0.175, 1)` — a strong ease-in-out, correct for movement that starts and ends on screen.

For consistency the panel transition should reference the same tokens rather than re-typing the values:

```css
/* target — src/styles.css:1019-1023 */
    transition:
      block-size var(--bx-dur-ui) var(--bx-ease-out),
      content-visibility var(--bx-dur-ui) allow-discrete;
```

The panel keeps `ease-out` — it is a reveal (an entrance), so a different curve from the icon's rotation is correct. Only the **duration** needs to match. Do not "harmonise" the curves.

Then the duplicate block at `:2715-2719` is deleted outright, leaving the copy at `:1039-1043` — the one adjacent to the rule it modifies, per this file's layout convention.

## Repo conventions to follow

- **Reduce blocks sit immediately after the rules they modify.** Exemplars: `src/styles.css:2746` (right after `metric-bar > b`), `:2221` (right after the `live-log` animation). The FAQ copy at `:1039` follows this — it directly follows the FAQ block. The copy at `:2715` sits in the middle of the spec-sheet section, unrelated to anything around it. **Keep `:1039`, delete `:2715`.**
- **After plan 001, durations and curves are referenced as tokens**, not literals. Exemplar: `src/styles.css:452-461` reads `transition: opacity 180ms var(--bx-ease-out), …`.
- **The rotation target itself is unchanged.** `details[open] summary svg { transform: rotate(45deg) }` at `:1012-1014` turns the `+` into an `×`; 45° is correct and deliberate.

## Steps

1. `src/styles.css:1009` — change `transition: transform 120ms ease;` to `transition: transform var(--bx-dur-ui) var(--bx-ease-in-out);`.

2. `src/styles.css:1019-1023` — in the `::details-content` rule, replace the two `240ms` literals with `var(--bx-dur-ui)` and replace `ease-out` with `var(--bx-ease-out)`. The `allow-discrete` keyword on the `content-visibility` line stays exactly where it is, after the duration.

3. Delete the entire block at `src/styles.css:2715-2719` — the `@media (prefers-reduced-motion: reduce)` wrapper and its single rule, including the closing brace and the blank line that follows it. Before deleting, confirm the block you are removing is the one **inside the spec-sheet region** (it is preceded by the `[data-component="spec-list"]` media query at `:2709-2714` and followed by `/* opencode/data-style visuals */` at `:2721`), and that the surviving copy at `:1039-1043` is intact.

4. Do not add any new reduce block. The surviving copy at `:1039-1043` still correctly disables the icon rotation, and the panel transition is already inside a `no-preference` guard.

## Boundaries

- Do NOT change `transform: rotate(45deg)` at `src/styles.css:1013`, or the icon's `width`, `height`, `flex`, or `color`.
- Do NOT change `interpolate-size: allow-keywords` in the token block (`src/styles.css:18-19`) — `::details-content` cannot transition to a keyword height without it, and removing it silently kills the panel animation.
- Do NOT change `block-size: 0` / `block-size: auto`, `overflow: clip`, or the `content-visibility` property in the `::details-content` rules. Those are load-bearing for the animation to work at all.
- Do NOT delete the reduce block at `:1039-1043`. Exactly one of the two copies goes.
- Do NOT change the `ease-out` on the panel to `ease-in-out`. The panel is a reveal; the icon is a rotation. Different curves are correct — only the durations are being unified.
- Do NOT touch `src/components/FaqSection.jsx`, including the `name="faq"` attribute at `:52` that makes the group exclusive.
- Do NOT touch any other `details`/`summary` styling.
- If an excerpt does not match, STOP and report.

## Verification

- **Mechanical**: `npm run build` → expect `[build] Complete!` and exit 0.
  - `grep -c 'faq-list"\] summary svg' src/styles.css` → expect `2` (the base rule and the single surviving reduce rule; before this change it was `3`).
  - `grep -c '120ms ease;' src/styles.css` → the FAQ line must be gone.
  - `grep -c '240ms' src/styles.css` → expect `0` in the FAQ region; the value now comes from the token.
- **Feel check**: `npm run dev`, open `http://localhost:5180`, scroll to **Good questions.**
  - Click a question. The `+` rotating to `×` and the answer sliding open must **finish at the same moment**. Watch the icon, not the text — previously it arrived early and then waited.
  - Click a **second** question while the first is still open. Because the group is exclusive (`name="faq"`), the first collapses as the second expands; both icons rotate, in opposite directions, and all four motions should land together.
  - Click the same question twice quickly. `::details-content` uses a transition, so it should retarget from wherever it is rather than jumping — no snapping to fully-open before collapsing.
  - In DevTools → Animations, set playback to 10% and open one question. Confirm the icon's rotation and the panel's height progress at visibly the same rate and cross the halfway point together. This is the whole point of the change and the only reliable way to see it.
  - DevTools → Rendering → emulate `prefers-reduced-motion: reduce`, reload, and click a question. The icon must snap instantly to 45° and the panel must appear instantly. If the icon still animates, step 3 deleted the wrong copy — restore `:1039-1043`.
  - Confirm the FAQ still works with JS disabled: `details`/`summary` is native, so it must. (DevTools → Settings → Debugger → Disable JavaScript, reload.)
- **Done when**: the build passes, the grep count is `2`, the icon and panel land together at 10% playback speed, and reduced motion snaps both instantly.
