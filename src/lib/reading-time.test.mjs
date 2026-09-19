// node src/lib/reading-time.test.mjs
import assert from "node:assert/strict"

import { readingMinutes } from "./reading-time.js"

// Empty and missing bodies must not print "0 min read".
assert.equal(readingMinutes(null), null)
assert.equal(readingMinutes([]), null)
assert.equal(readingMinutes([{ _type: "block", children: [] }]), null)

// A short post still rounds up to 1.
assert.equal(readingMinutes([{ _type: "block", children: [{ text: "one two three" }] }]), 1)

// Nested children (list items, marked spans) and code blocks count.
const word = "word "
const nested = [
  { _type: "block", children: [{ _type: "span", text: word.repeat(220) }] },
  { _type: "list", children: [{ children: [{ text: word.repeat(220) }] }] },
  { _type: "code", code: word.repeat(220) },
]
assert.equal(readingMinutes(nested), 3, "nested spans and code blocks are counted")

console.log("reading-time ok")
