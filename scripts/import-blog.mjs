#!/usr/bin/env node
// Import content/blog/*.md into EmDash. Re-runnable: existing slugs are updated.
//
//   node scripts/import-blog.mjs                          # localhost:5180 (dev bypass)
//   EMDASH_TOKEN=... node scripts/import-blog.mjs --url https://boxcompute.ai
//
// Markdown is converted to Portable Text here; the HTTP API only takes blocks.

import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"

import { markdownToPortableText } from "emdash/client"

const args = process.argv.slice(2)
const urlFlag = args.indexOf("--url")
const base = (urlFlag === -1 ? "http://localhost:5180" : args[urlFlag + 1]).replace(/\/$/, "")
const dir = join(import.meta.dirname, "..", "content", "blog")
const token = process.env.EMDASH_TOKEN

/** Front matter: `key: value` lines between the leading `---` fences. */
function parseFrontMatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!match) throw new Error("missing front matter")
  const meta = {}
  for (const line of match[1].split("\n")) {
    const at = line.indexOf(":")
    if (at === -1) continue
    const value = line.slice(at + 1).trim()
    meta[line.slice(0, at).trim()] = value.replace(/^["'](.*)["']$/, "$1")
  }
  return { meta, body: raw.slice(match[0].length).trim() }
}

const headers = { "content-type": "application/json", "X-EmDash-Request": "1" }

/** Session cookies rotate on write, so every response's Set-Cookie has to be kept. */
function absorbCookies(res) {
  const fresh = res.headers.getSetCookie()
  if (fresh.length === 0 || headers.cookie === undefined) return
  const jar = new Map(headers.cookie.split("; ").map((c) => [c.slice(0, c.indexOf("=")), c]))
  for (const cookie of fresh) {
    const pair = cookie.split(";")[0]
    jar.set(pair.slice(0, pair.indexOf("=")), pair)
  }
  headers.cookie = [...jar.values()].join("; ")
}

async function api(path, init = {}) {
  const res = await fetch(`${base}/_emdash/api${path}`, { ...init, headers })
  absorbCookies(res)
  const json = await res.json().catch(() => null)
  if (!res.ok || json?.success === false) {
    throw new Error(`${init.method ?? "GET"} ${path} → ${res.status} ${JSON.stringify(json?.error ?? json)}`)
  }
  return json.data
}

/** Bearer for remote; localhost falls back to the dev-bypass session cookie. */
async function authenticate() {
  if (token) {
    headers.Authorization = `Bearer ${token}`
    return "bearer token"
  }
  if (!base.includes("localhost") && !base.includes("127.0.0.1")) {
    throw new Error(`EMDASH_TOKEN is required for ${base} (dev bypass is localhost-only)`)
  }
  const res = await fetch(`${base}/_emdash/api/setup/dev-bypass?redirect=/`, { redirect: "manual" })
  const cookie = res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ")
  if (!cookie) throw new Error("dev bypass returned no session cookie — is the dev server running?")
  headers.cookie = cookie
  return "dev bypass"
}

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

/** Byline per display name, reused across runs so re-imports don't duplicate authors. */
async function ensureByline(displayName, cache) {
  if (cache.has(displayName)) return cache.get(displayName)
  const slug = slugify(displayName)
  const { items } = await api(`/admin/bylines?search=${encodeURIComponent(displayName)}`)
  const found = items.find((b) => b.slug === slug)
  const byline =
    found ??
    (await api("/admin/bylines", {
      method: "POST",
      body: JSON.stringify({ slug, displayName, isGuest: true }),
    }))
  cache.set(displayName, byline.id)
  return byline.id
}

/** Content assignment takes term slugs, and the term has to exist first. */
async function ensureTerm(label, cache) {
  const slug = slugify(label)
  if (cache.has(slug)) return slug
  const { terms: existing } = await api("/taxonomies/tag/terms")
  if (!existing.some((t) => t.slug === slug)) {
    await api("/taxonomies/tag/terms", { method: "POST", body: JSON.stringify({ slug, label }) })
  }
  cache.add(slug)
  return slug
}

async function findPost(slug) {
  const res = await fetch(`${base}/_emdash/api/content/posts/${slug}`, { headers })
  absorbCookies(res)
  if (res.status === 404) return null
  const json = await res.json()
  return json.success ? json.data.item : null
}

const bylines = new Map()
const terms = new Set()
let created = 0
let updated = 0

if (args.includes("--self-check")) {
  const { strictEqual: eq, deepStrictEqual: deep } = await import("node:assert")
  const { meta, body } = parseFrontMatter('---\ntitle: "A: B"\ntags: x, y\n---\n# Head\n\nText\n')
  eq(meta.title, "A: B") // quotes stripped, colon in value kept
  deep(meta.tags.split(",").map((t) => t.trim()), ["x", "y"])
  eq(body, "# Head\n\nText")
  eq(slugify("Farhan Helmy"), "farhan-helmy")
  eq(slugify("VM Sandboxes!"), "vm-sandboxes")
  // Every post file has to parse and carry the fields the import depends on.
  for (const file of (await readdir(dir)).filter((f) => f.endsWith(".md"))) {
    const { meta: m } = parseFrontMatter(await readFile(join(dir, file), "utf8"))
    for (const key of ["title", "slug", "excerpt", "publishedAt"]) {
      if (!m[key]) throw new Error(`${file}: missing ${key}`)
    }
    if (Number.isNaN(Date.parse(m.publishedAt))) throw new Error(`${file}: bad publishedAt`)
  }
  console.log("self-check ok")
  process.exit(0)
}

console.log(`→ ${base} (${await authenticate()})`)

for (const file of (await readdir(dir)).filter((f) => f.endsWith(".md")).sort()) {
  const { meta, body } = parseFrontMatter(await readFile(join(dir, file), "utf8"))
  const slug = meta.slug ?? file.replace(/\.md$/, "")

  const payload = {
    data: { title: meta.title, excerpt: meta.excerpt, content: markdownToPortableText(body) },
    slug,
    publishedAt: new Date(`${meta.publishedAt}T00:00:00Z`).toISOString(),
  }
  if (meta.byline) payload.bylines = [{ bylineId: await ensureByline(meta.byline, bylines) }]
  if (meta.tags) {
    const slugs = []
    // Sequential: concurrent creates of the same new term would race.
    for (const label of meta.tags.split(",")) slugs.push(await ensureTerm(label.trim(), terms))
    payload.taxonomies = { tag: slugs }
  }

  const existing = await findPost(slug)
  const id = existing
    ? (await api(`/content/posts/${existing.id}`, { method: "PUT", body: JSON.stringify(payload) })).item.id
    : (await api("/content/posts", { method: "POST", body: JSON.stringify(payload) })).item.id

  // Writes land as drafts on a drafts-enabled collection, so publish explicitly.
  await api(`/content/posts/${id}/publish`, { method: "POST", body: "{}" })

  if (existing) {
    updated++
    console.log(`  ~ ${slug}`)
  } else {
    created++
    console.log(`  + ${slug}`)
  }
}

console.log(`${created} created, ${updated} updated`)
