// node src/lib/sdk-language.test.mjs
import assert from "node:assert/strict"

import { normalizeSdkLang, readSdkLang, SDK_LANG_KEY, writeSdkLang } from "./sdk-language.js"

function stubStorage(initial = {}) {
  const map = new Map(Object.entries(initial))
  Object.defineProperty(globalThis, "window", {
    value: {
      localStorage: {
        getItem: (k) => (map.has(k) ? map.get(k) : null),
        setItem: (k, v) => map.set(k, v),
      },
    },
    configurable: true,
  })
  return map
}

function unstub() {
  delete globalThis.window
}

// Canonical values only; garbage falls back to TypeScript.
assert.equal(normalizeSdkLang("py"), "py")
assert.equal(normalizeSdkLang("ts"), "ts")
assert.equal(normalizeSdkLang("python"), "ts")
assert.equal(normalizeSdkLang(null), "ts")
assert.equal(normalizeSdkLang(undefined), "ts")

// No window (SSR): TypeScript without throwing.
assert.equal(readSdkLang(), "ts")

// Fresh visitor: TypeScript.
stubStorage()
assert.equal(readSdkLang(), "ts")
unstub()

// Current key wins over both legacy keys.
stubStorage({ "bx-sdk-lang": "py", "bx-qs-lang": "ts", "bx-docs-lang": "ts" })
assert.equal(readSdkLang(), "py")
unstub()

// Legacy Quickstart choice migrates on read.
stubStorage({ "bx-qs-lang": "py" })
assert.equal(readSdkLang(), "py")
unstub()

// Legacy docs choice migrates on read.
stubStorage({ "bx-docs-lang": "py" })
assert.equal(readSdkLang(), "py")
unstub()

// Writes go to the canonical key only, normalized.
const map = stubStorage({ "bx-qs-lang": "py", "bx-docs-lang": "py" })
writeSdkLang("py")
assert.equal(map.get(SDK_LANG_KEY), "py")
assert.equal(map.get("bx-qs-lang"), "py", "legacy keys are never rewritten")
writeSdkLang("garbage")
assert.equal(map.get(SDK_LANG_KEY), "ts")
unstub()

console.log("sdk-language: ok")
