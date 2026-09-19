// Minutes to read a Portable Text body, for the "· 6 min read" byline.
// Walks blocks/children recursively because emdash nests spans inside list
// items and marks; a flat `.map(b => b.children)` misses those.
const WPM = 220

function textOf(node) {
  if (typeof node === "string") return node
  if (Array.isArray(node)) return node.map(textOf).join(" ")
  if (!node || typeof node !== "object") return ""
  // A code block carries its source in `code`, not in `children`.
  return [node.text, node.code, textOf(node.children)].filter(Boolean).join(" ")
}

export function readingMinutes(content) {
  const words = textOf(content).trim().split(/\s+/).filter(Boolean).length
  // A post always takes at least a minute to open, and 0 min read reads as
  // broken data rather than as a short post.
  return words === 0 ? null : Math.max(1, Math.round(words / WPM))
}
