// Shared terminal chrome for code blocks (docs pages and blog posts).
// Wraps every bare <pre> in a bordered figure with a language badge and a
// copy button. Syntax colours, when present, come from build-time Shiki;
// this module only adds the header row, so it works the same on CMS prose
// that ships unhighlighted code.
import { COPY_RESET_MS, copyText } from "./clipboard.js"

const COPY_ICON =
  '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="5" width="8" height="8"></rect><path d="M11 5V3H3v8h2"></path></svg><span>Copy</span>'
const DONE_ICON =
  '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2.5 8.5 6 12l7.5-8"></path></svg><span>Copied</span>'

function attachCopy(button, badge, source) {
  let reset = 0
  button.addEventListener("click", async () => {
    const value = source.innerText ?? source.textContent ?? ""
    await copyText(value)
    button.innerHTML = DONE_ICON
    button.setAttribute("aria-label", "Copied")
    button.setAttribute("data-copied", "true")
    window.clearTimeout(reset)
    reset = window.setTimeout(() => {
      button.innerHTML = COPY_ICON
      button.setAttribute("aria-label", `Copy ${badge} to clipboard`)
      button.removeAttribute("data-copied")
    }, COPY_RESET_MS)
  })
}

// resolveBadge(pre, code) returns the header label for one block.
export function enhanceCodeBlocks(root, resolveBadge) {
  root.querySelectorAll("pre").forEach((pre) => {
    if (pre.closest('[data-component="docs-code"]')) return
    const code = pre.querySelector("code")
    const badge = resolveBadge(pre, code)
    const figure = document.createElement("figure")
    figure.setAttribute("data-component", "docs-code")
    figure.setAttribute("data-language", badge)
    const head = document.createElement("figcaption")
    head.setAttribute("data-slot", "docs-code-head")
    const lang = document.createElement("span")
    lang.setAttribute("data-slot", "docs-code-lang")
    lang.textContent = badge
    const button = document.createElement("button")
    button.type = "button"
    button.setAttribute("data-slot", "docs-copy")
    button.setAttribute("aria-label", `Copy ${badge} to clipboard`)
    button.innerHTML = COPY_ICON
    attachCopy(button, badge, code || pre)
    head.append(lang, button)
    pre.replaceWith(figure)
    figure.append(head, pre)
  })
}
