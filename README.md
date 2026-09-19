<div align="center">

<img src="public/brand/boxcompute-symbol.svg" alt="BoxCompute" width="56" height="56">

# BoxCompute

**The marketing site, docs, and blog for BoxCompute** — isolated Linux VM
sandboxes for AI agents.

Astro islands on Cloudflare Workers, with a square-cornered, hairline design
system and an interactive recreation of the product console.

[![CI](https://github.com/hazlijohar95/boxcompute-marketing.page/actions/workflows/ci.yml/badge.svg)](https://github.com/hazlijohar95/boxcompute-marketing.page/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-black?style=flat-square)](LICENSE)

[Live site](https://boxcompute.ai) · [Docs](https://boxcompute.ai/docs) · [Quick start](#quick-start) · [Architecture](#architecture)

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/hazlijohar95/boxcompute-marketing.page)

One click forks this repo, provisions the D1 database, R2 bucket, and KV
namespace, and deploys the Worker. Requires the repository to be public.

</div>

---

## Quick start

Requires [Bun](https://bun.sh) and Node 20+ on `PATH` — Bun runs the scripts,
Node runs the tests. The Bun version is pinned in `package.json`.

```bash
git clone https://github.com/hazlijohar95/boxcompute-marketing.page.git
cd boxcompute-marketing.page
bun install
bun dev              # http://localhost:5180
```

That's it — the landing page, docs, and quickstart all render without any
configuration. Only the `/blog/` routes need a database, and they degrade to
an empty list until you add one.

<details>
<summary><strong>Enabling the blog locally</strong> (optional)</summary>

The blog is an [EmDash](https://emdashcms.com) CMS backed by Cloudflare D1 and
R2, not markdown files in the repo. To run it:

```bash
cp .env.example .env
bunx emdash secrets generate     # paste the value into .env
bun dev
```

Write posts at `/_emdash/admin` — the dev server prints a bypass link. To
seed the four sample posts in `content/blog/`:

```bash
bun scripts/import-blog.mjs
```

`EMDASH_ENCRYPTION_KEY` encrypts stored plugin secrets. Lose it and those
secrets become unreadable.

</details>

## Commands

| Command | What it does |
| :--- | :--- |
| `bun dev` | Dev server on port 5180 |
| `bun check` | Build, then unit + accessibility suites |
| `bun check:unit` | Unit tests only, no build — fast inner loop |
| `bun run deploy` | Build and `wrangler deploy` |

Plus the usual `build` and `preview`. Two Bun names to watch: `bun run build`,
not `bun build` (the bare form is Bun's own bundler), and `check`, not `test` —
`bun test` forces Bun's own runner, which collects no `node:test` cases and
reports `0 pass, 0 fail` while exiting `0`.

## Architecture

Astro 7 in `output: "server"` mode on the Cloudflare adapter. Every page is
server-rendered HTML; interactivity ships as separately hydrated React
islands rather than one bundle.

```
src/
├── pages/              routes
│   ├── index.astro         landing page (prerendered)
│   ├── docs/[...slug]      docs from src/content/docs/*.md
│   ├── blog/               posts from D1 via EmDash (server-rendered)
│   ├── sitemap.xml.ts      static routes + docs glob + D1 posts
│   └── skills/…/SKILL.md   agent skill, hashed into .well-known
├── components/         one file per section, plus console/ and BlogVisual/
├── layouts/            Layout.astro (shell, SEO, fonts) · DocsLayout.astro
├── lib/                framework-free helpers, each with a *.test.mjs
├── content/            docs markdown + staged console demo data
├── styles/             tokens.css → base.css → sections.css
├── middleware.js       Link headers + text/markdown content negotiation
└── worker.ts           Astro handler + EmDash cron handler
```

**Islands.** Only `SiteHeader` and `Hero` are `client:load`; every other
island on the homepage is `client:visible`.

**Cloudflare bindings** (`wrangler.jsonc`):

| Binding | Resource | Purpose |
| :--- | :--- | :--- |
| `DB` | D1 `boxcompute-cms` | Blog posts |
| `MEDIA` | R2 `boxcompute-media` | Post media |
| `SESSION` | KV | Astro sessions |
| `triggers.crons` | `* * * * *` | Scheduled publishing |

The first `wrangler deploy` provisions the named D1 and R2 resources. There is
no `account_id` in `wrangler.jsonc` on purpose — a hardcoded one fails for
anyone deploying to a different account. Set `CLOUDFLARE_ACCOUNT_ID` if your
login has more than one account.

**Agent-readable by design.** `middleware.js` serves a markdown
representation of the homepage to clients sending `Accept: text/markdown`,
and attaches RFC 8288 `Link` headers pointing at the API catalog and OpenAPI
spec. `src/lib/skillSource.js` is the single source for the published agent
skill, so the digest in `/.well-known/agent-skills/index.json` can never
drift from the bytes served at `/skills/boxcompute-sandbox/SKILL.md`.

## Design system

Adapted from the [`opencode.ai/data`](https://opencode.ai/data) visual
language. All of it lives under `[data-page="box"]` in `src/styles/`, layered
`tokens → base → sections` so the cascade order is explicit.

- **Mono everywhere.** IBM Plex Mono, `font-synthesis: none`,
  `letter-spacing: 0`. Inter is present for prose only.
- **Square corners.** `border-radius: 0`, except 4px icon tiles and the 6px
  control tray.
- **Hairlines, not boxes.** Sections are drawn with `inset` box-shadows so
  stacked sections share a single 1px divider instead of doubling up.
- **A 6px dot grid** behind the hero, closing band, and footer — rendered as
  a WebGL `DotGrid`, with the CSS dot mask underneath as the no-WebGL
  fallback.
- **Tabular numbers** on every rank, step, and count. Focus is always a 2px
  accent outline.
- **Theme** flips a small token set via `html[data-theme]`, set pre-paint to
  avoid a flash. Accent stays `#3b5cf6`. `system` follows the OS.
- **Motion is restrained and optional.** Hero staggers once at
  0/100/200/300ms; buttons press to `scale(0.96)`; transitions name exact
  properties. Everything is disabled under `prefers-reduced-motion`, where
  the console demo renders its full transcript instantly.

## Testing

```bash
bun check:unit    # pure helpers, milliseconds
bun check         # the above plus the served-page suite
```

`src/lib/` holds framework-free logic, each module paired with a
`*.test.mjs` using the built-in `node:test` runner — no test framework
dependency. `scripts/a11y-check.mjs` boots `wrangler dev` against the real
build and asserts the accessibility, layout, and agent-discovery invariants
of the actual HTTP responses, including headers.

## License

[MIT](LICENSE), with one exception: `src/components/canvasui/` is vendored
from [Canvas UI](https://github.com/DavidHDev/canvas-ui) under **MIT +
Commons Clause**, which is not an OSI-approved license and forbids selling
that code. Keep its attribution headers intact. Deleting those two files and
the `ConsoleReveal.jsx` wrapper leaves a fully MIT tree — the console then
renders as plain live DOM, which is already what visitors without Chrome's
`html-in-canvas` flag see. Details in [LICENSE](LICENSE).
