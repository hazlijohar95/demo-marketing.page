# 003 — Gate the platform card hover lift for touch and reduced motion

- **Status**: DONE (applied directly, feel checks pending)
- **Depends on**: nothing (independent — can run before or after 001)
- **Commit**: `f9d985b` **plus uncommitted working-tree changes**. Line numbers refer to the **working tree**.
- **Severity**: MEDIUM
- **Category**: 6 — Accessibility
- **Estimated scope**: 1 file (`src/styles.css`), 1 edit plus 1 small addition

## Problem

`[data-component="leader-card"]` is the only hover **transform** in the entire stylesheet, and it is ungated on both of the two axes that matter.

```css
/* src/styles.css:850-865 — current */
[data-page="box"] [data-component="leader-card"]:hover {
  border-color: var(--bx-line-strong);
  box-shadow:
    0 0 0 0.5px #00000024,
    0 6px 16px #0000000d,
    0 2px 6px #0000000f;
  transform: translateY(-1px);
}

[data-page="box"] [data-component="leader-card"] {
  transition:
    transform 220ms ease-out,
    border-color 220ms ease-out,
    box-shadow 220ms ease-out,
    background-color 480ms ease;
}
```

There is also a dark-mode background change on the same hover:

```css
/* src/styles.css:867-871 — current */
@media (prefers-color-scheme: dark) {
  [data-page="box"] [data-component="leader-card"]:hover {
    background: #242424;
  }
}
```

**Problem 1 — touch fires false hovers.** On a phone or tablet, tapping one of the three cards in the Platform section applies `:hover` and it *stays applied* until the user taps somewhere else. The card sits permanently lifted and shadowed. One of the three cards contains a real button (`OpsVisual`, `src/components/PlatformSection.jsx:53-79`), so a user tapping that button leaves the whole card stuck in the lifted state while they interact with it.

The stylesheet already has exactly one correct `@media (hover: hover) and (pointer: fine)` block — at `src/styles.css:391` — so the pattern exists; this rule simply predates it.

**Problem 2 — no reduced-motion handling for the movement.** `translateY(-1px)` is position change. Under `prefers-reduced-motion: reduce` the position change should be dropped while the border and shadow feedback stays, so the card still responds to the cursor. Right now nothing is dropped.

For scale: this is 3 cards on one section, hovered occasionally. The severity is MEDIUM because of the stuck-state bug on touch, not because the animation itself is wrong — 220ms `ease-out` on a 1px lift is a good choice.

## Target

Wrap the hover rules in a pointer gate, and add a reduced-motion rule that neutralises only the transform.

```css
/* target */
/* Hover lift is gated: a tap on a touch device fires :hover and leaves
   the card stuck in the lifted state, and one of these cards holds an
   interactive button. */
@media (hover: hover) and (pointer: fine) {
  [data-page="box"] [data-component="leader-card"]:hover {
    border-color: var(--bx-line-strong);
    box-shadow:
      0 0 0 0.5px #00000024,
      0 6px 16px #0000000d,
      0 2px 6px #0000000f;
    transform: translateY(-1px);
  }

  @media (prefers-reduced-motion: reduce) {
    [data-page="box"] [data-component="leader-card"]:hover {
      transform: none;
    }
  }
}

[data-page="box"] [data-component="leader-card"] {
  transition:
    transform 220ms ease-out,
    border-color 220ms ease-out,
    box-shadow 220ms ease-out,
    background-color 480ms ease;
}

@media (prefers-color-scheme: dark) {
  @media (hover: hover) and (pointer: fine) {
    [data-page="box"] [data-component="leader-card"]:hover {
      background: #242424;
    }
  }
}
```

Note what is **not** dropped under reduced motion: `border-color`, `box-shadow`, and the dark-mode `background`. Reduced motion means less movement, not no feedback — the card must still visibly acknowledge the cursor.

## Repo conventions to follow

- **The pointer-gate exemplar is `src/styles.css:387-410`**, added for the header buttons. Copy its shape exactly, including the explanatory comment above the block:
  ```css
  @media (hover: hover) and (pointer: fine) {
    [data-page="box"] [data-slot="header-button"][data-variant="neutral"]:hover { … }
  }
  ```
- **Nested media queries are already used in this file** — see `src/styles.css:2938-2952`, where `@media (prefers-reduced-motion: no-preference)` wraps rules that also sit inside other context. Native CSS nesting of `@media` inside `@media` is supported by every browser this project targets (the file already relies on `@starting-style`, `interpolate-size` and `::details-content`, all newer than nested media queries). If you prefer flat rules, two sibling top-level blocks with the full condition spelled out are equally acceptable — behaviour must be identical.
- **Comments explain the *why*, not the *what*** — see `src/styles.css:79-80`, `:387-390`, `:1148-1149`. Match that voice.

## Steps

1. In `src/styles.css`, wrap the existing `[data-component="leader-card"]:hover` rule at `:850-857` in `@media (hover: hover) and (pointer: fine) { … }`, adding the comment from the target above. Do not change any declaration inside the rule.

2. Inside that same pointer-gate block, after the `:hover` rule, add the nested `@media (prefers-reduced-motion: reduce)` rule that sets `transform: none` on `[data-component="leader-card"]:hover`.

3. Leave the `[data-component="leader-card"]` transition rule at `:859-865` exactly as it is. It must stay outside the gate — the transition declaration is harmless on touch and removing it would break the return animation on desktop.

4. Wrap the dark-mode hover rule at `src/styles.css:867-871` in the same `@media (hover: hover) and (pointer: fine)` condition, so the dark background does not stick after a tap either.

## Boundaries

- Do NOT change any colour, shadow, border, or the `-1px` distance. The desktop hover must look and feel exactly as it does today.
- Do NOT change the `220ms` or `480ms` durations, and do NOT swap `ease-out` for a token — plan 001 deliberately leaves this declaration alone, and duplicating that decision here would create a conflict.
- Do NOT add a pointer gate to any `:active` rule anywhere in the file. `:active` works correctly on touch and is the intended press feedback; gating it would remove press feedback on phones.
- Do NOT touch `src/components/PlatformSection.jsx` or any other `.jsx` file. This plan is CSS-only.
- Do NOT extend this pattern to other `:hover` rules in the file. Every other hover changes only colour or background, which is harmless on touch — a sticky colour is invisible feedback, a sticky lift is not. Widening the scope here would be a large, unrequested diff.
- If the excerpt does not match, STOP and report.

## Verification

- **Mechanical**: `npm run build` → expect `[build] Complete!` and exit 0.
  - `grep -c 'hover: hover' src/styles.css` → expect `3` (one pre-existing block from the header buttons, plus the two added here). If you chose the flat-rule variant, expect `4`.
- **Feel check**: `npm run dev`, open `http://localhost:5180`, scroll to **Your agent does the work**.
  - **Desktop, unchanged**: hover each of the three cards with a mouse. The 1px lift, border brightening and shadow bloom must be indistinguishable from before. Move the cursor away — the card settles back over 220ms.
  - **Touch, the actual fix**: in DevTools, open the device toolbar (⌘⇧M) and pick a phone preset, which switches the emulated pointer to coarse. Reload. Tap a card, then tap elsewhere on the page. The card must show **no** lift and **no** shadow change at any point. Then tap the "start / poll / resume" button inside the third card — the card around it must stay completely flat.
  - Still in the device toolbar, confirm the button itself still responds: the `:active` press feedback (`transform: scale(0.96)`) must survive, since it is not gated.
  - **Reduced motion**: leave the device toolbar, go to DevTools → Rendering → emulate `prefers-reduced-motion: reduce`, reload, and hover a card with the mouse. The card must **not** move, but the border and shadow must still change — if the card gives no feedback at all, step 2 was applied too broadly.
  - Repeat the reduced-motion hover with the OS in dark mode (Rendering → emulate `prefers-color-scheme: dark`). The background should still shift to `#242424`.
- **Done when**: the build passes, the grep count matches, a coarse-pointer tap leaves no sticky lift, and reduced-motion hover still changes border and shadow while the card stays put.
