import assert from "node:assert/strict"

// Minimal DOM: enough for wrapTables (create, replace, append, one selector).
class El {
  constructor(tag) {
    this.tagName = tag.toUpperCase()
    this.children = []
    this.parentElement = null
    this.dataset = {}
    this.attrs = {}
  }
  setAttribute(name, value) {
    this.attrs[name] = value
    if (name.startsWith("data-")) this.dataset[name.slice(5)] = value
  }
  append(...nodes) {
    for (const node of nodes) {
      node.parentElement = this
      this.children.push(node)
    }
  }
  replaceWith(node) {
    const parent = this.parentElement
    parent.children[parent.children.indexOf(this)] = node
    node.parentElement = parent
    this.parentElement = null
  }
  querySelectorAll(selector) {
    const want = selector.toUpperCase()
    const found = []
    const walk = (el) => {
      for (const child of el.children) {
        if (child.tagName === want) found.push(child)
        walk(child)
      }
    }
    walk(this)
    return found
  }
}

globalThis.document = { createElement: (tag) => new El(tag) }
const { wrapTables } = await import("./prose-enhance.js")

const prose = new El("div")
const table = new El("table")
const nested = new El("table")
prose.append(table, new El("p"))
prose.children[1].append(nested)

wrapTables(prose)
for (const t of [table, nested]) {
  const box = t.parentElement
  assert.equal(box.attrs["data-slot"], "prose-table")
  assert.equal(box.attrs.tabindex, "0")
  assert.equal(box.attrs.role, "region")
  assert.equal(box.children.length, 1, "table is the wrapper's only child")
  assert.equal(t.tagName, "TABLE", "table keeps its element, so it keeps its role")
}

// Idempotent: docs re-enhance runs on the same DOM.
wrapTables(prose)
assert.equal(table.parentElement.attrs["data-slot"], "prose-table")
assert.equal(table.parentElement.parentElement, prose, "no wrapper around the wrapper")

console.log("prose-table: ok")
