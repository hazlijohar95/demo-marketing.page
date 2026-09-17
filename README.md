# boxcompute (local)

BoxCompute landing page, rebuilt on the `opencode.ai/data` design system
(`packages/stats/app` in the opencode repo) — not a copy of its content,
but its whole visual language and thought process, applied to our sections.

```bash
npm install
npm run dev     # http://localhost:5180
npm run build
npm run preview
```

## The system (Astro 7)

- Astro `7.3.3` + `@astrojs/react` `6.0.6` (Vite 8 / Rolldown underneath).
- `src/layouts/Layout.astro` — document shell: SEO/OG/Twitter meta,
  JSON-LD, fonts (Inter + IBM Plex Mono), favicons. Imports `src/styles.css`.
- `src/pages/index.astro` — page composition. React sections are islands:
  `SiteHeader` + `Hero` use `client:load` (above the fold), everything
  else uses `client:visible`.
- `src/styles.css` — the entire design system, scoped under `[data-page="box"]`
- `src/components/SectionHeading.jsx` — shared section titles with `#` anchors

## Rules (from opencode.ai/data)

- **IBM Plex Mono everywhere**, `font-synthesis: none`, `letter-spacing: 0`
  (only headings ever go negative; we use none at all).
- **Square corners.** `border-radius: 0` on everything except 4px icon
  tiles and the 6px control tray.
- **Hairlines, not boxes.** Sections are drawn with `inset` box-shadows
  (`inset 0 -1px / inset 1px 0 / inset -1px 0` in `--bx-line`), so stacked
  sections share single 1px dividers. Cards use 1px borders that promote to
  `--bx-line-strong` on hover, plus the shadow lift scale.
- **Dot pattern.** 6px masked dot grid (`--bx-pattern`) behind the hero,
  closing band, footer band, and the hero meta chip.
- **Section titles** are 28px/400 muted sentences with a 500 strong lead
  (`<strong>Your agent does the work.</strong> We give it the space.`),
  16px on mobile — never centered, never eyebrow-led.
- **Hero** is a 232px canvas ≥768px: pattern centered behind, h1 knocked
  out top-left and copy knocked out bottom-right on `--bx-bg`.
- **Header** is sticky, 72px, 13px mono; inline section nav ≥768px,
  full overlay menu below; neutral button hidden on small screens.
- **Footer** is 11px throughout: mark tile + link columns, pattern band,
  bottom row with status square (`Isolated by default`).
- **Numbers are tabular** (`font-variant-numeric: tabular-nums`) on ranks,
  steps, counts. Focus is always a 2px `--bx-accent` outline.
- **Theme** flips a small token set (`--bx-bg/layer/line/text/muted/faint/
  pattern/logo-bg`); accent stays `#3b5cf6`, accent text goes `#8190ff`
  in dark. `system` follows `prefers-color-scheme`.

## Layout

- `src/content.js` — shared external URLs
- `src/lib/visible.js` — `onVisible` helper: IntersectionObserver primary,
  rect-check fallback (mount, scroll, resize, hashchange, load,
  visibilitychange, timed taper) so reveals and the demo also trigger in
  backgrounded tabs where IO never delivers
- `src/components/` — one file per section: `SiteHeader`, `Hero`,
  `ConsoleSection` + `ConsoleDemo` (a working recreation of the real
  console from the product screenshot: workspace sidebar with nav,
  Chats/Agents tabs, searchable chat list, user card; center conversation
  with replayable staged run, working composer with send flow, model
  badge; right workbench with Files/Terminal/Previews tabs, file
  previews, run log, metric cards), `DemoSection` (playable
  terminal: 3 scenarios, autoplay on scroll, replay, reduced-motion
  fallback), `PlatformSection` (ranked leader-cards), `CompareSection`
  (honest pattern comparison table), `SpecSection` (plain spec rows),
  `HowItWorks` (hairline step rows), `FaqSection` (accordion rows),
  `ClosingSection`, `SiteFooter`, plus `SectionHeading`, `Reveal`,
  `DotField` primitives
- `src/theme.js` — `ThemeContext` (legacy provider compat) + SSR-safe
  `useSystemTheme()` (follows the OS setting; `"light"` on the server).
  `DotField` uses the hook directly so it works as a standalone island.
- `public/` — brand mark, console screenshots, favicons, social card

## Why islands this way

All 18 React components are kept 1:1 — no visual rewrites. Each
top-level section is its own island so Astro code-splits JS per section
and SSRs the HTML (11 islands, 9 sections). `Reveal`/`MetricBar` stay
inside their parent islands (they need `IntersectionObserver`, so their
parents must hydrate). `FaqSection` uses native `<details>` but stays an
island so its `Reveal` wrappers can add `.is-visible`.

## Pattern fields

The hero, closing, and footer dot bands render Paper Shaders
(`@paper-design/shaders-react` 0.0.80, pinned, Apache-2.0) `DotGrid` —
same 2px squares on a 6px grid as the system language, with delicate
size/opacity variation, static (no motion by design). Colors follow the
resolved theme via `useSystemTheme()` (`#fff`/`#eee` light,
`#161616`/`#303030` dark). The CSS dot mask stays underneath as the
no-WebGL fallback. SSR renders an empty band; the shader hydrates on
the client.
- Dot fields drift ±6px on a 14s alternate loop (GPU-composited,
  auto-pauses in background tabs, off under reduced-motion).

## Motion (better-ui pass)

- Hero entrance staggers 0/100/200/300ms, once, `ease-out`.
- Sections reveal on scroll via `Reveal` (cards stagger 100ms).
- Buttons press to `scale(0.96)`; transitions name exact properties only.
- Lucide strokes set to 1.5px to match 400/500 text; states via
  `currentColor`, never separate assets.
- Everything off under `prefers-reduced-motion` (demo renders full
  transcript instantly, no blink, no reveals).
