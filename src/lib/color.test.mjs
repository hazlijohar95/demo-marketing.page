import assert from "node:assert/strict"

import { hexToRgb, rgba } from "./color.js"

assert.deepEqual(hexToRgb("#c2410c"), [194, 65, 12])
assert.deepEqual(hexToRgb("#ffffff"), [255, 255, 255])
assert.deepEqual(hexToRgb("#161616"), [22, 22, 22])
assert.equal(rgba([194, 65, 12], 1), "rgba(194, 65, 12, 1.000)")
assert.equal(rgba([0, 0, 0], 0.355), "rgba(0, 0, 0, 0.355)")

console.log("color: ok")
