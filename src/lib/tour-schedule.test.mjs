// node src/lib/tour-schedule.test.mjs
import assert from "node:assert/strict"

import { BEAT_MS, streamDuration, tourSchedule } from "./tour-schedule.js"

// The shared rule both the playback scheduler and the tour clock build on:
// one beat per streamed message.
assert.equal(streamDuration(0), 0)
assert.equal(streamDuration(4), 4 * BEAT_MS)

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
    steps[1] > streamDuration(messages),
    `files step (${steps[1]}) must clear the ${messages}-message stream`,
  )

  // The last step sends a follow-up that streams 4 more messages.
  assert.ok(
    end >= steps.at(-1) + 4 * BEAT_MS,
    `end (${end}) must outlast the follow-up stream`,
  )
}

console.log("tour-schedule: ok")
