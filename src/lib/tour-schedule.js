// Guided-tour beat clock.
//
// Derived, not hand-tuned: every tour beat has to land *after* the message
// stream it narrates, and the stream length depends on how many messages
// the chat has. Hardcoded milliseconds silently desync the moment anyone
// edits a transcript, so the schedule is computed from the same beat
// constant the stream uses.
export const BEAT_MS = 850

// One beat per streamed message. Shared by the playback scheduler (which
// reveals one message per beat) and the tour clock below, so the rule is
// stated once instead of once per caller.
export function streamDuration(count) {
  return count * BEAT_MS
}

// Beats to hold on a step whose only job is to show a panel.
const LOOK = 1.7

// The loop restart dissolves the finished transcript before rewinding it, so
// ten messages never vanish in one frame. Every later beat waits for it: the
// stream does not start until the dissolve has landed. Matches the log's
// opacity transition in sections.css (--bx-dur-ui, linear).
export const REWIND_MS = 240

// Settle between the last typed character and the send.
const TYPE_SETTLE_MS = 320

// How long the composer takes to type `text`. Shared by the typing animation
// and the clock below: the follow-up beat must not be scheduled before the
// text it types has finished, and two copies of this sum would drift.
export function typeDuration(text, typeMs) {
  return [...text].length * typeMs + TYPE_SETTLE_MS
}

export function tourSchedule(messageCount, followUpCount, followUpTypeMs = 0) {
  const stream = REWIND_MS + streamDuration(messageCount)
  // +1 beat of rest so "Done" is legible before the panels start moving.
  const files = stream + BEAT_MS
  const open = files + LOOK * BEAT_MS
  const numbers = open + LOOK * BEAT_MS
  const followUp = numbers + LOOK * BEAT_MS
  return {
    steps: [0, files, open, numbers, followUp].map(Math.round),
    // The follow-up types its text, streams its own messages, then rests two
    // beats on the finished state. The demo loops on `end`, so leaving the
    // typing out of this sum would restart over the last message.
    end: Math.round(followUp + followUpTypeMs + streamDuration(followUpCount + 2)),
  }
}
