// node src/lib/tour-schedule.test.mjs
import assert from "node:assert/strict"

import { BEAT_MS, REWIND_MS, streamDuration, tourSchedule, typeDuration } from "./tour-schedule.js"

// The shared rule both the playback scheduler and the tour clock build on:
// one beat per streamed message.
assert.equal(streamDuration(0), 0)
assert.equal(streamDuration(4), 4 * BEAT_MS)

// Typing is a char clock plus one settle.
assert.equal(typeDuration("", 40), 320)
assert.equal(typeDuration("abc", 40), 3 * 40 + 320)

// The one thing that must hold: a tour beat never narrates a panel while
// the stream it describes is still printing, and the tour never ends
// before the follow-up it triggered has finished typing and streaming.
const FOLLOW_TYPE_MS = typeDuration("Which regions were hit?", 40)
const FOLLOW_UP_COUNT = 4
for (const messages of [2, 5, 6, 12]) {
  const { steps, end } = tourSchedule(messages, FOLLOW_UP_COUNT, FOLLOW_TYPE_MS)

  assert.equal(steps[0], 0, "first step is immediate")

  for (let i = 1; i < steps.length; i += 1) {
    assert.ok(steps[i] > steps[i - 1], `step ${i} must follow step ${i - 1}`)
  }

  // Step 1 shows the files the run wrote — it has to wait for the dissolve
  // the restart opens with *and* the run itself.
  assert.ok(
    steps[1] > REWIND_MS + streamDuration(messages),
    `files step (${steps[1]}) must clear the dissolve plus the ${messages}-message stream`,
  )

  // The last step types a follow-up, then streams its messages. The demo loops
  // on `end`, so it must clear both or the restart eats the last line.
  assert.ok(
    end >= steps.at(-1) + FOLLOW_TYPE_MS + FOLLOW_UP_COUNT * BEAT_MS,
    `end (${end}) must outlast the follow-up typing and stream`,
  )
}

console.log("tour-schedule: ok")
