# Animation plans

Produced by `improve-animations` (standard effort) against `src/` on commit `f9d985b` **plus uncommitted working-tree changes** to `src/styles.css`, `src/components/ConsoleDemo.jsx`, `src/components/LifecycleFlow.jsx` and `src/components/SpecSection.jsx`.

> **Every line number in every plan refers to the working tree at the time of writing, not to `f9d985b`.** Each plan quotes the current code verbatim; if an excerpt does not match what you find, stop and report rather than improvising.

## Plans

All eight applied directly to the working tree (not via isolated worktrees). Build and unit test green after each. **The feel checks in every plan remain unperformed** — they need a browser and a human eye; see "Outstanding" below.

| # | Title | Severity | Category | Status |
| --- | --- | --- | --- | --- |
| [001](001-motion-tokens.md) | Add motion tokens and fix curve choices that contradict the decision order | HIGH | Cohesion & tokens | DONE |
| [002](002-bars-width-to-transform.md) | Animate the three fill bars with transform instead of width | HIGH | Performance | DONE |
| [003](003-card-hover-gating.md) | Gate the platform card hover lift for touch and reduced motion | MEDIUM | Accessibility | DONE |
| [004](004-console-log-fade.md) | Shorten the console log line fade to fit its beat | MEDIUM | Easing & duration | DONE |
| [005](005-sandbox-field-loop.md) | Bound the hero dot-field draw loop to the region it actually paints | MEDIUM | Performance | DONE |
| [006](006-demo-status-running.md) | Make the demo terminal's running state visually distinct from done | MEDIUM | Missed opportunity | DONE |
| [007](007-faq-icon-timing.md) | Match the FAQ icon rotation to the panel it opens, and delete the duplicated reduce block | MEDIUM | Easing & duration | DONE |
| [008](008-entrance-physicality.md) | Give the entrance and scroll-reveal animations travel, and tighten the hero stagger | LOW | Physicality | DONE |

## Outstanding

Two values were applied as planned but **not** feel-checked, and both plans name a bounded fallback:

- **004** — console log fade is now 200ms against an 850ms beat. If it reads as hurried rather than calm, 300ms is the ceiling. Do not exceed it.
- **008** — scroll reveals now carry `translateY(8px)`. If sections look like they are assembling themselves rather than appearing, revert the transform only (keep the 400ms duration and the 60ms stagger) and record that outcome.

One deviation from a plan's literal target, applied deliberately: **002** moved `metric-bar`'s colour from CSS to inline JSX, which dropped the old `var(--metric-bar-color, var(--bx-accent))` fallback. `MetricBar`'s `color` prop now defaults to `var(--bx-accent)`, restoring identical behaviour. The sole call site (`SpecSection.jsx:101`) always passes a colour, so nothing changed in practice.

## Execution order

**001 must land first.** It defines the seven motion tokens that 002, 004, 007 and 008 consume. Running any of those before 001 leaves `var(--bx-dur-*)` undefined, which makes the `animation` and `transition` shorthands fail to parse — silently removing the animation entirely rather than erroring.

```
001  motion tokens  ──┬──> 002  bars: width → transform
                      ├──> 004  console log fade 500ms → 200ms
                      ├──> 007  FAQ icon timing + dedup
                      └──> 008  entrance travel + stagger

003  card hover gating      (independent)
005  sandbox field loop     (independent, JS-only)
006  demo status running    (independent)
```

Recommended sequence: **001 → 002 → 003 → 004 → 005 → 006 → 007 → 008**.

003, 005 and 006 touch no shared code and can run in any order, or in parallel with the 001-dependent chain. 008 is deliberately last because it is the most taste-dependent and its verification may conclude it should be partially reverted.

## File contention

Six of the eight plans edit `src/styles.css`. If you run any of them concurrently, expect conflicts. The regions are disjoint, so sequential execution is clean:

| Plan | `src/styles.css` regions | Other files |
| --- | --- | --- |
| 001 | token block `:8-49`, `:452-461`, `:1560`, `:1676`, `:1880`, `:1983`, `:2054` | — |
| 002 | `:2730-2736`, `:2746-2750`, `:2994-2998`, `:3062-3072` | `MetricBar.jsx`, `DemoSection.jsx` |
| 003 | `:850-871` | — |
| 004 | `:1864` | — |
| 005 | — | `SandboxField.jsx` |
| 006 | `:2406-2408` | — |
| 007 | `:1009`, `:1019-1023`, deletes `:2715-2719` | — |
| 008 | `:2243-2266` | `Hero.jsx` |

**007 deletes lines**, shifting everything below `:2719` upward by five. Run it after 002 and 006, or re-locate their targets by selector rather than by line number.

## Verification available in this repo

There is no lint or typecheck script — `package.json` defines only `dev`, `build` and `preview`. The mechanical gates are:

```bash
npm run build                              # expect "[build] Complete!", exit 0
node --test src/lib/tour-schedule.test.mjs # expect pass 1, fail 0
npm run dev                                # http://localhost:5180
```

Every plan therefore leans on its **feel check**, which is not optional. Each one names the specific DevTools panel and the specific thing to watch for.

## Two open questions the audit could not settle from code

Both are flagged inside their plans with concrete fallbacks:

- **004** — whether 200ms makes the streaming console log feel *hurried* rather than calm. Upper bound if so: 300ms. Do not exceed it.
- **008** — whether 8px of travel on section-sized reveals reads as polish or as the page assembling itself on every scroll. A partial application (duration and stagger only, no transform) is an acceptable outcome and must be reported explicitly.

## Not in scope

The audit found **no findings** in two categories, which is worth recording so nobody re-audits them:

- **Interruptibility (§4)** — clean. Transitions are used everywhere retargeting matters; `@keyframes` appear only on one-shot mounts. The mobile menu at `src/styles.css:463-482` correctly uses `@starting-style` with `transition-behavior: allow-discrete`.
- **Purpose & frequency (§1)** — clean. This is a marketing page; nothing animated is a 100+/day interaction, and no animation needed deleting.

`src/components/canvasui/ParticleReveal.jsx` was reviewed and is well-built: live `matchMedia` reduced-motion handling (`:384`), `IntersectionObserver` gating (`:396`), and it settles to zero work (`:363`). No plan targets it.

Three smaller missed opportunities were identified but **not** turned into plans, by choice:

- `ConsoleDemo.jsx:502` — the conversation head hard-swaps on chat switch; `key={chatId}` would let the existing `bx-detail-in` cover it.
- `ConsoleDemo.jsx:331` — the `live-url` path changes on chat switch with no acknowledgement.
- `SandboxField.jsx:45` — `prefersReducedMotion()` is read once on mount and never re-checked, unlike `ParticleReveal.jsx:384` and `ConsoleReveal.jsx:37`, which both attach `matchMedia` listeners. CSS hides the canvas at `:3152`, so this is a consistency gap, not a leak.
