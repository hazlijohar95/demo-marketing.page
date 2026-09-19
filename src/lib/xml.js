// XML escaping for the server-rendered feeds (sitemap.xml, blog/rss.xml).
// One module so the two routes can't drift apart character by character.
export function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
