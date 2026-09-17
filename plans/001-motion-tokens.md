# 001 — Add motion tokens and fix curve choices that contradict the decision order

- **Status**: DONE (applied directly, feel checks pending)
- **Commit**: `f9d985b` **plus uncommitted working-tree changes** to `src/styles.css`, `src/components/ConsoleDemo.jsx`, `src/components/LifecycleFlow.jsx`, `src/components/SpecSection.jsx`. All line numbers below refer to the **working tree**, not to `f9d985b`. Verify each excerpt before editing.
- **Severity**: HIGH
- **Category**: 7 — Cohesion & tokens
- **Estimated scope**: 1 file (`src/styles.css`), ~9 small edits

## Problem

`src/styles.css` has a rich design-token block for colour, type and spacing, but **no motion tokens at all**. Every curve and duration is hand-typed at its use site.

The token block that exists (`src/styles.css:14-42`) stops at spacing:

```css
/* src/styles.css:36-42 — current, abridged */
  --bx-success: #198b43;
  --bx-section-pad: 80px 40px;
  /* Console chrome rows. Named here, not inlined, because the
     particle-reveal wrapper has to add them to the grid height. */
  --live-head-h: 44px;
  --live-foot-h: 42px;
```

Three consequences:

**1. A hand-typed curve repeated three times in one declaration.**

```css
/* src/styles.css:452-461 — current */
[data-page="box"] [data-slot="menu-icons"] svg {
  grid-area: 1 / 1;
  width: 14px;
  height: 14px;
  transition:
    opacity 180ms cubic-bezier(0.2, 0, 0, 1),
    transform 180ms cubic-bezier(0.2, 0, 0, 1),
    filter 180ms cubic-bezier(0.2, 0, 0, 1);
}
```

**2. Bare `ease-out` on roughly twenty declarations.** CSS's built-in `ease-out` is a weak curve; deliberate motion needs a stronger one. There is no single place to change it.

**3. `ease-out` used on colour-only transitions, where the decision order calls for `ease`.** Five declarations transition nothing but colour and background yet use the entrance curve:

```css
/* src/styles.css:1560-1562 — current (live-nav button) */
  transition-property: background-color, color;
  transition-duration: 120ms;
  transition-timing-function: ease-out;
```

```css
/* src/styles.css:1675-1677 — current (live-chats button) */
  transition-property: background-color, border-color;
  transition-duration: 120ms;
  transition-timing-function: ease-out;
```

```css
/* src/styles.css:1879-1881 — current (live-composer) */
  transition-property: border-color;
  transition-duration: 120ms;
  transition-timing-function: ease-out;
```

```css
/* src/styles.css:1982-1984 — current (live-inspector-tabs button) */
  transition-property: color;
  transition-duration: 120ms;
  transition-timing-function: ease-out;
```

```css
/* src/styles.css:2053-2055 — current (live-filegroup li button) */
  transition-property: background-color, color;
  transition-duration: 120ms;
  transition-timing-function: ease-out;
```

This plan is the foundation for plans 002, 004, 007 and 008, which all consume the tokens it defines.

## Target

Add exactly seven motion tokens — no more. Every one is consumed by this plan or by 002/004/007/008; do not invent additional tokens "for later".

```css
/* target — appended inside the existing [data-page="box"] token block,
   immediately after --live-foot-h: 42px; */
  /* Motion. Curves follow the decision order: entering/exiting uses
     --bx-ease-out, on-screen movement uses --bx-ease-in-out, and plain
     colour changes stay on the built-in `ease`. */
  --bx-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --bx-ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --bx-dur-press: 120ms;
  --bx-dur-fast: 200ms;
  --bx-dur-ui: 240ms;
  --bx-dur-bar: 300ms;
  --bx-dur-enter: 400ms;
```

The menu-icon crossfade collapses to one token:

```css
/* target */
[data-page="box"] [data-slot="menu-icons"] svg {
  grid-area: 1 / 1;
  width: 14px;
  height: 14px;
  transition:
    opacity 180ms var(--bx-ease-out),
    transform 180ms var(--bx-ease-out),
    filter 180ms var(--bx-ease-out);
}
```

The five colour-only declarations move to `ease` and the duration token:

```css
/* target — pattern for all five */
  transition-duration: var(--bx-dur-press);
  transition-timing-function: ease;
```

## Repo conventions to follow

- **All tokens live in one place**: the `[data-page="box"]` block at `src/styles.css:8-49`. Nothing is defined on `:root` — the page scopes everything under `[data-page="box"]` (a `<main>`, see `src/pages/index.astro:21`). Follow that; do **not** add `:root`.
- **Dark mode overrides only colour** (`src/styles.css:52-66`). Motion tokens need no dark-mode variant — do not add them there.
- **Exemplar to imitate**: `--live-head-h` / `--live-foot-h` at `src/styles.css:39-41` — declared in the token block with a comment explaining *why* the value is shared rather than inlined. Match that commenting style.
- **The file uses the longhand trio** (`transition-property` / `-duration` / `-timing-function`) for interactive states and the `transition:` shorthand for one-off declarations. Preserve whichever form each site already uses; only change the values.

## Steps

1. In `src/styles.css`, inside the `[data-page="box"]` block, immediately after the line `  --live-foot-h: 42px;`, insert the seven-token motion block from the **Target** section above (comment included).

2. At `src/styles.css:452-461`, in `[data-slot="menu-icons"] svg`, replace all three occurrences of `cubic-bezier(0.2, 0, 0, 1)` with `var(--bx-ease-out)`. Leave the `180ms` durations and the property list exactly as they are.

3. At `src/styles.css:1560-1562` (`[data-slot="live-nav"] button`), change `transition-duration: 120ms;` to `transition-duration: var(--bx-dur-press);` and `transition-timing-function: ease-out;` to `transition-timing-function: ease;`. Leave `transition-property` untouched.

4. Apply the identical two-line change from step 3 at each of these four sites. Do not change their `transition-property` lines:
   - `src/styles.css:1676-1677` — `[data-slot="live-chats"] button`
   - `src/styles.css:1880-1881` — `[data-slot="live-composer"]`
   - `src/styles.css:1983-1984` — `[data-slot="live-inspector-tabs"] button`
   - `src/styles.css:2054-2055` — `[data-slot="live-filegroup"] li button`

5. Leave every other `ease-out` in the file alone. In particular **do not** touch these — they transition `transform` (press feedback), where `ease-out` is correct:
   - `src/styles.css:2234-2236` — `[data-slot="header-button"]`
   - `src/styles.css:2333-2335` — `[data-component="scenario-pills"] button`
   - `src/styles.css:2354-2356` — the shared spec-board / lifecycle / live-tabs / live-chats / inspector-tabs / live-nav press group
   - `src/styles.css:2518-2520` — `[data-slot="demo-foot"] button`
   - `src/styles.css:1940-1942` — `[data-slot="live-composer"] button`

## Boundaries

- Do NOT touch `src/styles.css:93-99` or `:100-104` (the 480ms theme cross-fade) or `:105` (`bx-theme-fade`). The comment at `:79-80` documents these as a deliberate choice; they are colour transitions on `ease`, which is already correct.
- Do NOT touch `cubic-bezier(0.2, 0.7, 0.2, 1)` at `src/styles.css:2735`. Plan **002** owns that declaration; changing it here creates a conflict.
- Do NOT change any `transition-property` list, any duration other than the five `120ms` values named in steps 3–4, or any `@keyframes` block.
- Do NOT add tokens beyond the seven listed. Do NOT add a `:root` block.
- Do NOT touch any `.jsx` file. This plan is CSS-only.
- If an excerpt above does not match what you find (the working tree may have drifted), STOP and report which one, rather than guessing at the intent.

## Verification

- **Mechanical**: `npm run build` — expect `[build] Complete!` and exit 0. There is no lint or typecheck script in this repo (`package.json` defines only `dev`, `build`, `preview`), so the build is the only mechanical gate.
- **Token wiring**: `grep -c 'var(--bx-ease-out)' src/styles.css` → expect at least `3`. `grep -c 'cubic-bezier(0.2, 0, 0, 1)' src/styles.css` → expect `0`. `grep -o 'bx-ease-out\|bx-dur-press\|bx-dur-fast\|bx-dur-ui\|bx-dur-bar\|bx-dur-enter\|bx-ease-in-out' dist/_astro/*.css | sort -u | wc -l` → expect `7` after a build (all seven tokens survive into the bundle; the four unused-by-this-plan ones are consumed by plans 002/004/007/008).
- **Feel check**: `npm run dev`, open `http://localhost:5180`.
  - Narrow the window below 768px so the hamburger appears. Toggle it repeatedly. The Menu↔X crossfade must look **identical to before this change** — `cubic-bezier(0.2, 0, 0, 1)` and `cubic-bezier(0.23, 1, 0.32, 1)` are close, so any visible difference means a typo in the token value.
  - Scroll to the Console section. Hover the sidebar nav rows, the chat rows, and the Files/Terminal/Previews tabs. Colour should still settle in about an eighth of a second; the change from `ease-out` to `ease` is deliberately near-imperceptible at 120ms. If it now feels *slower*, the duration token is wrong.
  - Click into the composer input. The border should still brighten on focus.
  - In DevTools → Animations, set playback speed to 10% and toggle the hamburger. Confirm the icon scale, opacity and blur all finish together — they share one curve now, so any stagger means one of the three was missed.
- **Done when**: the build passes, both greps return their expected counts, and the hamburger crossfade is visually unchanged.
