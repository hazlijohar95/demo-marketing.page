// Post enhancement: reading progress, rail contents, and terminal chrome
// on code blocks. The CMS ships headings without ids and code without
// highlighting, so this module anchors the h2s and labels badges with a
// light heuristic (box-drawing means a diagram, a route or CLI verb means
// a terminal or HTTP block).
import { enhanceCodeBlocks } from "./code-chrome.js"

function postBadge(_pre, code) {
  const text = ((code || _pre)?.textContent || "")
  if (/[┌│▼▲→←]/.test(text)) return "diagram"
  if (/^\s*(GET|POST|PUT|PATCH|DELETE)\s+\//m.test(text)) return "http"
  if (/^\s*(bxc|curl|npm|POST|GET|DELETE|PUT|PATCH)\b/m.test(text)) return "terminal"
  return "code"
}

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

function initProgress(article) {
  const fill = document.querySelector('[data-slot="post-progress"] span')
  if (!fill || !article) return
  const setProgress = () => {
    const rect = article.getBoundingClientRect()
    const total = rect.height - window.innerHeight
    const done = Math.min(Math.max(-rect.top + 120, 0), Math.max(total, 1))
    fill.style.transform = `scaleX(${total > 0 ? done / total : 0})`
  }
  let ticking = false
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(() => {
        setProgress()
        ticking = false
      })
    },
    { passive: true },
  )
  setProgress()
}

function initToc(prose) {
  const toc = document.querySelector('[data-slot="post-toc"]')
  const tocList = document.querySelector('[data-slot="post-toc-list"]')
  if (!prose || !toc || !tocList) return
  const heads = [...prose.querySelectorAll("h2")]
  if (heads.length < 2) return
  const used = new Set()
  heads.forEach((h) => {
    const base = slugify(h.textContent || "section") || "section"
    let id = h.id || base
    let n = 2
    while (used.has(id)) id = `${base}-${n++}`
    used.add(id)
    h.id = id
    const li = document.createElement("li")
    const a = document.createElement("a")
    a.href = `#${id}`
    a.textContent = (h.textContent || "").trim()
    li.append(a)
    tocList.append(li)
  })
  toc.hidden = false
  if (!("IntersectionObserver" in window)) return
  const links = new Map(
    [...tocList.querySelectorAll("a")].map((a) => [a.getAttribute("href").slice(1), a]),
  )
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const link = links.get(entry.target.id)
        if (!link || !entry.isIntersecting) return
        links.forEach((l) => l.removeAttribute("data-current"))
        link.setAttribute("data-current", "true")
      })
    },
    { rootMargin: "-20% 0px -70% 0px" },
  )
  heads.forEach((h) => spy.observe(h))
}

export function initPostEnhance() {
  const col = document.querySelector('[data-slot="post-column"]')
  if (!col) return
  initProgress(document.querySelector('[data-section="post"]'))
  const prose = col.querySelector('[data-component="prose"]')
  initToc(prose)
  if (prose) enhanceCodeBlocks(prose, postBadge)
}
