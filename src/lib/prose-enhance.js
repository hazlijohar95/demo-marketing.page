// Prose enhancement for CMS-rendered article and docs pages. One module owns
// every DOM contract the prose scripts rely on; the post page and the docs
// layout are the two adapters at its seam, each calling only its entry point.
// Both entries share the code chrome (code-chrome.js); the docs language
// choice persists through the SDK language module (sdk-language.js).
import { enhanceCodeBlocks } from "./code-chrome.js"
import { readSdkLang, writeSdkLang } from "./sdk-language.js"

// --- Shared ---

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

// A wide table has to scroll sideways on a phone, but scrolling the table
// element itself (display: block) takes its rows and cells out of the table
// role, so a screen reader stops announcing row and column context. Scroll a
// wrapper instead, and give it a tab stop — a scroll container with no tab
// stop is unreachable without a pointer (WCAG 2.1.1).
export function wrapTables(root) {
  root.querySelectorAll("table").forEach((table) => {
    if (table.parentElement?.dataset.slot === "prose-table") return
    const box = document.createElement("div")
    box.setAttribute("data-slot", "prose-table")
    box.setAttribute("tabindex", "0")
    box.setAttribute("role", "region")
    box.setAttribute("aria-label", "Table")
    table.replaceWith(box)
    box.append(table)
  })
}

// --- Post entry: reading progress, rail contents, terminal chrome ---
// The CMS ships headings without ids and code without highlighting, so this
// entry anchors the h2s and labels badges with a light heuristic
// (box-drawing means a diagram, a route or CLI verb means a terminal or
// HTTP block).

function postBadge(_pre, code) {
  const text = ((code || _pre)?.textContent || "")
  if (/[┌│▼▲→←]/.test(text)) return "diagram"
  if (/^\s*(GET|POST|PUT|PATCH|DELETE)\s+\//m.test(text)) return "http"
  if (/^\s*(bxc|curl|npm|POST|GET|DELETE|PUT|PATCH)\b/m.test(text)) return "terminal"
  return "code"
}

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

function assignHeadIds(heads) {
  const used = new Set()
  heads.forEach((h) => {
    const base = slugify(h.textContent || "section") || "section"
    let id = h.id || base
    let n = 2
    while (used.has(id)) id = `${base}-${n++}`
    used.add(id)
    h.id = id
  })
}

function spyToc(heads, list) {
  if (!("IntersectionObserver" in window)) return
  const links = new Map(
    [...list.querySelectorAll("a")].map((a) => [a.getAttribute("href").slice(1), a]),
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

function initToc(prose) {
  const toc = document.querySelector('[data-slot="post-toc"]')
  const tocList = document.querySelector('[data-slot="post-toc-list"]')
  if (!prose || !toc || !tocList) return
  const heads = [...prose.querySelectorAll("h2")]
  if (heads.length < 2) return
  assignHeadIds(heads)
  heads.forEach((h) => {
    const li = document.createElement("li")
    const a = document.createElement("a")
    a.href = `#${h.id}`
    a.textContent = (h.textContent || "").trim()
    li.append(a)
    tocList.append(li)
  })
  toc.hidden = false
  spyToc(heads, tocList)
}

export function initPostEnhance() {
  const col = document.querySelector('[data-slot="post-column"]')
  if (!col) return
  initProgress(document.querySelector('[data-section="post"]'))
  const prose = col.querySelector('[data-component="prose"]')
  initToc(prose)
  if (prose) {
    enhanceCodeBlocks(prose, postBadge)
    wrapTables(prose)
  }
}

// --- Docs entry: terminal chrome plus a TypeScript/Python switcher ---
// The h3s stay in the source for no-JS readers; with JS they are replaced
// by the toggle and the choice persists via localStorage.

// Shiki marks each block with data-language; the code-class fallback is
// for any renderer that only emits language-* classes.
const LANGS = {
  ts: "ts",
  typescript: "ts",
  python: "python",
  py: "python",
  bash: "bash",
  shell: "bash",
  sh: "bash",
  json: "json",
  http: "http",
  text: "text",
  plaintext: "text",
}

function docsBadge(pre, code) {
  const raw = (
    pre.getAttribute("data-language") ||
    (code?.className || "").match(/language-([\w+-]+)/i)?.[1] ||
    ""
  ).toLowerCase()
  return LANGS[raw] || raw || "code"
}

function readLang() {
  return readSdkLang()
}

function remember(lang, apply) {
  writeSdkLang(lang)
  apply(lang)
}

export function initDocsEnhance() {
  const prose = document.querySelector('[data-component="prose"][data-docs]')
  if (!prose) return
  enhanceCodeBlocks(prose, docsBadge)
  wrapTables(prose)
  initDocsInpage(prose)

  const groups = []
  let primed = false
  const apply = (lang) => {
    groups.forEach(({ btnTs, btnPy, panelTs, panelPy }) => {
      const isTs = lang === "ts"
      btnTs.setAttribute("aria-pressed", String(isTs))
      btnTs.dataset.active = String(isTs)
      btnPy.setAttribute("aria-pressed", String(!isTs))
      btnPy.dataset.active = String(!isTs)
      const show = isTs ? panelTs : panelPy
      const wasHidden = show.hidden
      panelTs.hidden = !isTs
      panelPy.hidden = isTs
      if (primed && wasHidden) {
        show.classList.remove("is-swapped")
        void show.offsetWidth
        show.classList.add("is-swapped")
      }
    })
    primed = true
  }

  prose.querySelectorAll("h3").forEach((h3) => {
    if ((h3.textContent || "").trim().toLowerCase() !== "typescript") return
    const tsBlock = h3.nextElementSibling
    if (!tsBlock || !/^(FIGURE|PRE)$/.test(tsBlock.tagName)) return
    const h3py = tsBlock.nextElementSibling
    if (!h3py || h3py.tagName !== "H3" || (h3py.textContent || "").trim().toLowerCase() !== "python")
      return
    const pyBlock = h3py.nextElementSibling
    if (!pyBlock || !/^(FIGURE|PRE)$/.test(pyBlock.tagName)) return

    const tabs = document.createElement("div")
    tabs.setAttribute("data-component", "docs-tabs")
    const list = document.createElement("div")
    list.setAttribute("data-slot", "docs-tablist")
    list.setAttribute("role", "group")
    list.setAttribute("aria-label", "SDK language")
    const btnTs = document.createElement("button")
    btnTs.type = "button"
    btnTs.textContent = "TypeScript"
    const btnPy = document.createElement("button")
    btnPy.type = "button"
    btnPy.textContent = "Python"
    btnTs.addEventListener("click", () => remember("ts", apply))
    btnPy.addEventListener("click", () => remember("py", apply))
    list.append(btnTs, btnPy)

    const panelTs = document.createElement("div")
    panelTs.dataset.panel = "ts"
    const panelPy = document.createElement("div")
    panelPy.dataset.panel = "py"

    h3.before(tabs)
    tabs.append(list, panelTs, panelPy)
    panelTs.append(tsBlock)
    panelPy.append(pyBlock)
    h3.remove()
    h3py.remove()
    groups.push({ btnTs, btnPy, panelTs, panelPy })
  })

  if (groups.length) apply(readLang())
}

function initDocsInpage(prose) {
  const nav = document.querySelector('[data-component="docs-inpage"]')
  const list = document.querySelector('[data-slot="docs-inpage-list"]')
  if (!nav || !list) return
  const heads = [...prose.querySelectorAll("h2")]
  if (heads.length < 2) return
  assignHeadIds(heads)
  heads.forEach((h) => {
    const id = h.id
    // Trailing "#" stripped so a second run reads the heading, not the anchor
    // it appended last time. One read, used for the anchor and the nav entry.
    const label = (h.textContent || "").trim().replace(/\s#$/, "")
    // Anchor link on the heading for copy-paste deep links.
    if (!h.querySelector('[data-slot="docs-anchor"]')) {
      const anchor = document.createElement("a")
      anchor.href = `#${id}`
      anchor.setAttribute("data-slot", "docs-anchor")
      anchor.setAttribute("aria-label", `Link to ${label}`)
      anchor.textContent = "#"
      anchor.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(new URL(`#${id}`, window.location.href).href)
        } catch {
          // Navigation still works; copy is best-effort.
        }
      })
      h.append(" ", anchor)
    }
    const li = document.createElement("li")
    const a = document.createElement("a")
    a.href = `#${id}`
    a.textContent = label
    li.append(a)
    list.append(li)
  })
  nav.hidden = false
  spyToc(heads, list)
}
