<div align="center">

<img src="public/brand/boxcompute-symbol.svg" alt="BoxCompute" width="56" height="56">

# BoxCompute

**The marketing site, docs, and blog for BoxCompute** — isolated Linux VM
sandboxes for AI agents.

[![CI](https://github.com/hazlijohar95/boxcompute-marketing.page/actions/workflows/ci.yml/badge.svg)](https://github.com/hazlijohar95/boxcompute-marketing.page/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-black?style=flat-square)](LICENSE)

[Live site](https://boxcompute.ai) · [Docs](https://boxcompute.ai/docs) · [Quick start](#quick-start) · [Architecture](#architecture)

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/hazlijohar95/boxcompute-marketing.page)

One click forks this repo, provisions the D1 database, R2 bucket, and KV
namespace, and deploys the Worker. Requires the repository to be public.

</div>

---

Yes, it's a landing page with a test suite, a cron trigger, and an
accessibility harness that boots a real Worker and reads the actual HTTP
headers. We are aware. It catches things.

## Quick start

Needs [Bun](https://bun.sh) and Node 20+ on `PATH`. Bun runs the scripts, Node
runs the tests, and the reason for that split is genuinely stupid — see
[Commands](#commands). Bun version is pinned in `package.json`.

```bash
git clone https://github.com/hazlijohar95/boxcompute-marketing.page.git
cd boxcompute-marketing.page
bun install
bun dev              # http://localhost:5180
```

That's the whole setup. Landing page, docs, and quickstart render with zero
configuration. Only `/blog/` wants a database, and without one it degrades to
an empty list, which is indistinguishable from writer's block.

<details>
<summary><strong>Enabling the blog locally</strong> (optional)</summary>

The blog is an [EmDash](https://emdashcms.com) CMS on Cloudflare D1 and R2. Not
markdown files in the repo. If you were hoping for markdown files in the repo,
this part is going to disappoint you.

```bash
cp .env.example .env
bunx emdash secrets generate     # paste the value into .env
bun dev
```

Write posts at `/_emdash/admin`. The dev server prints a bypass link. To seed
the four sample posts in `content/blog/`:

```bash
bun scripts/import-blog.mjs
```

`EMDASH_ENCRYPTION_KEY` encrypts stored plugin secrets. Lose it and those
secrets are unreadable forever. There is no recovery flow. There is no support
line. There is just you and your entropy.

</details>

## Commands

| Command | What it does |
| :--- | :--- |
| `bun dev` | Dev server on port 5180 |
| `bun check` | Build, then unit + accessibility suites |
| `bun check:unit` | Unit tests only, no build. Fast inner loop |
| `bun run deploy` | Build and `wrangler deploy` |

Plus the usual `build` and `preview`.

**THE TEST SCRIPT IS CALLED `check`, NOT `test`.** This is not a style
preference. `bun test` ignores your `test` script and forces Bun's own runner,
which does not collect `node:test` cases. It finds our files, runs nothing,
prints `0 pass, 0 fail`, and exits `0`. A green check that tested nothing is
worse than a red one. `check` has no builtin to shadow it.

Same energy: `bun run build`, not `bun build`. The bare form is Bun's bundler
and it will happily do something you did not ask for.

## Architecture

Astro 7, `output: "server"`, Cloudflare adapter. Every page is server-rendered
HTML. Interactivity ships as separately hydrated React islands instead of one
bundle.

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

**Islands.** Only `SiteHeader` and `Hero` are `client:load`. Everything else on
the homepage is `client:visible`.

**The console on the homepage is a lie.** It's a recreation driven by staged
data in `src/content/console-data.js`, never the live product. It was built
from a screenshot. It is a very careful lie and we would like it to stay that
way, so keep the demo data and the real API separate.

**Cloudflare bindings** (`wrangler.jsonc`):

| Binding | Resource | Purpose |
| :--- | :--- | :--- |
| `DB` | D1 `boxcompute-cms` | Blog posts |
| `MEDIA` | R2 `boxcompute-media` | Post media |
| `SESSION` | KV | Astro sessions |
| `triggers.crons` | `* * * * *` | Scheduled publishing |

The first `wrangler deploy` provisions the named D1 and R2 resources.

There is deliberately **no `account_id`** in `wrangler.jsonc`. A hardcoded one
works perfectly on the machine that wrote it and fails with error 7003 for
every other human on earth, which is the exact failure mode that breaks deploy
buttons. Set `CLOUDFLARE_ACCOUNT_ID` if your login has more than one account.

**Agent-readable by design.** `middleware.js` serves a markdown version of the
homepage to anything sending `Accept: text/markdown`, and attaches RFC 8288
`Link` headers pointing at the API catalog and OpenAPI spec.
`src/lib/skillSource.js` is the single source for the published agent skill, so
the digest in `/.well-known/agent-skills/index.json` cannot drift from the
bytes served at `/skills/boxcompute-sandbox/SKILL.md`. Two files claiming
different hashes for the same skill is a bug we decided to make impossible
rather than remember.

## Design system

Everything lives under `[data-page="box"]` in `src/styles/`, layered
`tokens → base → sections` so cascade order is explicit and not vibes.

| Rule | In practice |
| :--- | :--- |
| **Mono everywhere** | IBM Plex Mono, `font-synthesis: none`. Inter for prose |
| **Square corners** | `border-radius: 0`. Only the console demo rounds anything |
| **Hairlines, not boxes** | `inset` box-shadows, so stacked sections share one 1px divider instead of quietly rendering two |
| **6px dot grid** | WebGL `DotField`, lazy-mounted on view, CSS mask underneath as fallback |
| **Tabular numbers** | Every rank, step, and count. Digits that slide sideways mid-animation are a crime |
| **Motion is optional** | All of it off under `prefers-reduced-motion`, where the console demo just prints its transcript |

**Accent** &nbsp;![](https://img.shields.io/badge/-c2410c-c2410c?style=flat-square) `#c2410c` light &nbsp;·&nbsp; ![](https://img.shields.io/badge/-f97316-f97316?style=flat-square) `#f97316` dark &nbsp;— theme flips a token set on `html[data-theme]`, set pre-paint so there's no flash.

## Testing

```bash
bun check:unit    # pure helpers, milliseconds
bun check         # the above plus the served-page suite
```

`src/lib/` is framework-free logic, each module paired with a `*.test.mjs` on
the built-in `node:test` runner. No test framework dependency, no config file,
no plugin ecosystem.

`scripts/a11y-check.mjs` is the interesting one. It boots `wrangler dev`
against a real build and asserts accessibility, layout, and agent-discovery
invariants against actual HTTP responses, headers included. Not a DOM
snapshot. If a `Link` header goes missing or the markdown negotiation breaks,
it fails.

## License

[MIT](LICENSE), with one exception, and the exception matters:
`src/components/canvasui/` is vendored from
[Canvas UI](https://github.com/DavidHDev/canvas-ui) under **MIT + Commons
Clause**. Commons Clause is not OSI-approved and forbids selling that code.
Keep the attribution headers intact.

If that's a problem, delete those two files and the `ConsoleReveal.jsx`
wrapper and you have a clean MIT tree. The console then renders as plain live
DOM, which is already what everyone without Chrome's `html-in-canvas` flag
sees. Details in [LICENSE](LICENSE).
