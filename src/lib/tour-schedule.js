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

export function tourSchedule(messageCount, followUpCount) {
  const stream = streamDuration(messageCount)
  // +1 beat of rest so "Done" is legible before the panels start moving.
  const files = stream + BEAT_MS
  const open = files + LOOK * BEAT_MS
  const numbers = open + LOOK * BEAT_MS
  const followUp = numbers + LOOK * BEAT_MS
  return {
    steps: [0, files, open, numbers, followUp].map(Math.round),
    // The follow-up types, streams its own messages, then rests a beat.
    end: Math.round(followUp + streamDuration(followUpCount + 2)),
  }
}
