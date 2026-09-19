// node src/lib/xml.test.mjs
import assert from "node:assert/strict"

import { escapeXml } from "./xml.js"

assert.equal(escapeXml("a&b<c>d\"e"), "a&amp;b&lt;c&gt;d&quot;e")
assert.equal(escapeXml("plain"), "plain")
assert.equal(escapeXml(""), "")

console.log("xml: ok")
