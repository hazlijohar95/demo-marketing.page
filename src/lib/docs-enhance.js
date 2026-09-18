// Docs enhancement: terminal chrome on every code block plus a
// TypeScript/Python switcher wherever those two sections sit adjacent.
// The h3s stay in the source for no-JS readers; with JS they are replaced
// by the toggle and the choice persists via localStorage.
import { enhanceCodeBlocks } from "./code-chrome.js"

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

const LANG_KEY = "bx-docs-lang"

function readLang() {
  try {
    return window.localStorage.getItem(LANG_KEY) === "py" ? "py" : "ts"
  } catch {
    return "ts"
  }
}

function remember(lang, apply) {
  try {
    window.localStorage.setItem(LANG_KEY, lang)
  } catch {
    /* private mode: still switch for this visit */
  }
  apply(lang)
}

export function initDocsEnhance() {
  const prose = document.querySelector('[data-component="prose"][data-docs]')
  if (!prose) return
  enhanceCodeBlocks(prose, docsBadge)

  const groups = []
  const apply = (lang) => {
    groups.forEach(({ btnTs, btnPy, panelTs, panelPy }) => {
      const isTs = lang === "ts"
      btnTs.setAttribute("aria-pressed", String(isTs))
      btnTs.dataset.active = String(isTs)
      btnPy.setAttribute("aria-pressed", String(!isTs))
      btnPy.dataset.active = String(!isTs)
      panelTs.hidden = !isTs
      panelPy.hidden = isTs
    })
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
