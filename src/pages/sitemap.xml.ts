import { getEmDashCollection } from "emdash"

import { escapeXml } from "../lib/xml.js"

export const prerender = false

const STATIC_ROUTES = ["/", "/blog/", "/docs", "/quickstart/"]

function absolute(origin: string, path: string) {
  return new URL(path, origin).href
}

export async function GET(context: { url: URL }) {
  const origin = context.url.origin
  const today = new Date().toISOString().slice(0, 10)

  // Docs routes discovered from files so new guides never need a sitemap edit.
  // The mapping mirrors [...slug].astro exactly (no index special-casing).
  const modules = import.meta.glob("../content/docs/**/*.md")
  const docRoutes = Object.keys(modules).map((path) =>
    path.replace("../content/docs", "/docs").replace(/\.md$/, "/"),
  )

  // Blog posts live in D1 — a failure must not take the sitemap down,
  // it just falls back to the static + docs routes (/blog/ covers discovery).
  let postRoutes: { loc: string; lastmod: string }[] = []
  try {
    const { entries } = await getEmDashCollection("posts", {
      orderBy: { published_at: "desc" },
    })
    postRoutes = (entries ?? []).map((entry: any) => ({
      loc: absolute(origin, `/blog/${entry.id}/`),
      lastmod: entry.data.publishedAt?.toISOString().slice(0, 10) ?? today,
    }))
  } catch {
    postRoutes = []
  }

  const urls = [
    ...STATIC_ROUTES.map((path) => ({ loc: absolute(origin, path), lastmod: today })),
    ...docRoutes.map((path) => ({ loc: absolute(origin, path), lastmod: today })),
    ...postRoutes,
  ]

  // De-dupe (/docs vs /docs/) while keeping first-seen order.
  const seen = new Set<string>()
  const unique = urls.filter((u) => {
    const key = u.loc.replace(/\/$/, "") || "/"
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${unique
    .map((u) => `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`)
    .join("\n")}\n</urlset>\n`

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
