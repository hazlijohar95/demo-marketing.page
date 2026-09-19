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
- **Reveal** — scroll-triggered `.is-visible`; instant under reduced-motion.
