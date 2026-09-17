// node src/lib/tour-schedule.test.mjs
import assert from "node:assert/strict"

import { BEAT_MS, tourSchedule } from "./tour-schedule.js"

// The one thing that must hold: a tour beat never narrates a panel while
// the stream it describes is still printing, and the tour never ends
// before the follow-up it triggered has finished streaming.
for (const messages of [2, 5, 6, 12]) {
  const { steps, end } = tourSchedule(messages, 4)

  assert.equal(steps[0], 0, "first step is immediate")

  for (let i = 1; i < steps.length; i += 1) {
    assert.ok(steps[i] > steps[i - 1], `step ${i} must follow step ${i - 1}`)
  }

  // Step 1 shows the files the run wrote — it has to wait for the run.
  assert.ok(
    steps[1] > messages * BEAT_MS,
    `files step (${steps[1]}) must clear the ${messages}-message stream`,
  )

  // The last step sends a follow-up that streams 4 more messages.
  assert.ok(
    end >= steps.at(-1) + 4 * BEAT_MS,
    `end (${end}) must outlast the follow-up stream`,
  )
}

console.log("tour-schedule: ok")
