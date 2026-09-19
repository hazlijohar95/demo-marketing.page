import assert from "node:assert/strict"

import { copyText } from "./clipboard.js"

function stubGlobals({ clipboardImpl, doc }) {
  Object.defineProperty(globalThis, "navigator", {
    value: { clipboard: { writeText: clipboardImpl } },
    configurable: true,
  })
  Object.defineProperty(globalThis, "document", { value: doc, configurable: true })
}

function unstub() {
  delete globalThis.navigator
  delete globalThis.document
}

// Happy path: async Clipboard API.
stubGlobals({
  clipboardImpl: async () => {},
  doc: { createElement: () => { throw new Error("should not fallback") } },
})
assert.equal(await copyText("hello"), true)
unstub()

// Fallback path: clipboard throws, execCommand succeeds.
let removed = false
stubGlobals({
  clipboardImpl: async () => { throw new Error("denied") },
  doc: {
    createElement: () => ({
      style: {},
      select: () => {},
      value: "",
      remove: () => { removed = true },
    }),
    body: { appendChild: () => {} },
    execCommand: () => true,
  },
})
assert.equal(await copyText("fallback"), true)
assert.equal(removed, true)
unstub()

console.log("clipboard: ok")
