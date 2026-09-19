import { getEmDashCollection } from "emdash"

import { escapeXml } from "../../lib/xml.js"

export const prerender = false

export async function GET(context: { url: URL }) {
  const origin = context.url.origin
  let items: string[] = []

  try {
    const { entries } = await getEmDashCollection("posts", {
      orderBy: { published_at: "desc" },
      limit: 20,
    })
    items = (entries ?? []).map((entry: any) => {
      const title = escapeXml(entry.data.title ?? entry.id)
      const link = new URL(`/blog/${entry.id}/`, origin).href
      const description = escapeXml(entry.data.excerpt ?? "")
      const pubDate = entry.data.publishedAt ? new Date(entry.data.publishedAt).toUTCString() : ""
      return `    <item>\n      <title>${title}</title>\n      <link>${escapeXml(link)}</link>\n      <guid>${escapeXml(link)}</guid>\n${description ? `      <description>${description}</description>\n` : ""}${pubDate ? `      <pubDate>${pubDate}</pubDate>\n` : ""}    </item>`
    })
  } catch {
    items = []
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>BoxCompute blog</title>\n    <link>${escapeXml(new URL("/blog/", origin).href)}</link>\n    <description>Notes on the technology behind agent workspaces.</description>\n${items.join("\n")}\n  </channel>\n</rss>\n`

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
