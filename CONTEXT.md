# CONTEXT.md — BoxCompute landing page

Domain terms. Architecture reviews must use these names for the domain and
the skill's language (module, interface, seam, adapter, depth, leverage,
locality) for the structure.

- **Sandbox** — an isolated full Linux VM per task, grouped by a workspace.
  Deleted with its filesystem; files under `/workspace` live as long as it does.
- **Workspace** — durable parent holding multiple Sandboxes. No delete.
- **Console demo** — the interactive recreation of the real console on the
  landing page (sidebar, conversation, workbench), driven by staged data in
  `src/content/console-data.js`, not by the product.
- **Demo playback** — the beat-clocked message stream plus the opt-in guided
  tour. One beat per message (`streamDuration`); the tour narrates only after
  the stream it describes has finished.
- **Prose enhancement** — the JS that upgrades CMS-rendered article and docs
  pages: code chrome, post progress/TOC, docs language tabs. Post page and
  docs layout are its two adapters.
- **Code chrome** — the bordered figure + language badge + copy button wrapped
  around every bare `<pre>` in prose.
- **Cover art** — generated per-post Shader props derived only from slug and
  topic (`postCover`); tile and hero of one post must be the same picture.
- **Contour field** — the hero canvas that paints only activated cells of the
  dot grid as distance iso-contours (`contour`).
- **Environment** — SSR-safe reads of the browser shared by all islands:
  media queries, OS theme, motion preference, in-view observation.
- **Theme** — manual light/dark/system override (`bx-theme`) over the OS
  query. `applyTheme` sets `html[data-theme]` pre-paint; `useResolvedTheme`
  resolves paint decisions for shaders so canvas stays in sync.
- **Reveal** — scroll-triggered `.is-visible`; instant under reduced-motion.
- **SDK language** — the persisted TypeScript/Python choice shared by the
  Quickstart page and the docs switcher (canonical key `bx-sdk-lang`,
  legacy `bx-qs-lang` / `bx-docs-lang` as read fallbacks).
- **Docs inpage** — the h2 TOC + `#` anchors built by `initDocsEnhance`;
  docs layout and post page are its two adapters (post reuses its own TOC).
- **Discovery** — dynamic `sitemap.xml` (static + docs glob + D1 posts) and
  `blog/rss.xml`; both server-rendered with 1h edge cache.
