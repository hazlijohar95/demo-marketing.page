import { useCallback, useEffect, useRef, useState } from "react"

import { prefersReducedMotion, useIsomorphicLayoutEffect } from "../../lib/environment.js"
import { streamDuration } from "../../lib/tour-schedule.js"
import { useTimerBag } from "../../lib/use-timers.js"

// Stream playback: staged message reveal + composer send + replay/stop.
// Timer ownership lives in the shared bag; the guided tour holds its own
// bag so play() clears the stream without killing the tour schedule.
export function useConsolePlayback(chat, chatId) {
  const [extra, setExtra] = useState([])
  const [visible, setVisible] = useState(null)
  const [working, setWorking] = useState(false)
  const [draft, setDraft] = useState("")
  const [preview, setPreview] = useState(null)
  const { schedule, clear } = useTimerBag()
  const logRef = useRef(null)
  const stickRef = useRef(true)

  // Shared beat scheduler for play/send: reveal one message per beat,
  // then settle. `base` offsets follow-up streams past the base script.
  const scheduleStream = useCallback((count, base = 0) => {
    setVisible(base + 1)
    for (let i = 1; i < count; i += 1) {
      schedule(streamDuration(i), () => setVisible(base + i + 1))
    }
    schedule(streamDuration(count), () => setWorking(false))
  }, [schedule])

  const play = useCallback(
    (script) => {
      clear()
      setWorking(true)
      if (prefersReducedMotion()) {
        setVisible(script.length)
        setWorking(false)
        return
      }
      scheduleStream(script.length)
    },
    [clear, scheduleStream],
  )

  // Autoplay the run on mount and on every chat switch: the island is
  // client:visible, so mount is the scroll-in beat. A layout effect keeps
  // the SSR markup (all messages, for no-JS and crawlers) from flashing
  // before the script rewinds to its first line.
  useIsomorphicLayoutEffect(() => {
    setExtra([])
    setPreview(null)
    stickRef.current = true
    if (logRef.current) logRef.current.scrollTop = 0
    play(chat.messages)
  }, [chatId])

  const onLogScroll = useCallback(() => {
    const el = logRef.current
    if (!el) return
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }, [])

  useEffect(() => {
    if (stickRef.current && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [visible, extra, chatId])

  const replay = useCallback(() => {
    setExtra([])
    stickRef.current = true
    if (logRef.current) logRef.current.scrollTop = 0
    play(chat.messages)
  }, [chat.messages, play])

  // WCAG 2.2.2: the run auto-starts on scroll-in and moves for longer than 5s,
  // so it needs a stop. Showing the finished state is a valid stop.
  const stop = useCallback(() => {
    clear()
    setVisible(chat.messages.length + extra.length)
    setWorking(false)
  }, [chat.messages.length, extra.length, clear])

  const send = useCallback(
    (value) => {
      const text = (typeof value === "string" ? value : draft).trim()
      if (!text || working) return
      const followUp = [
        { kind: "user", text },
        { kind: "run", text: "Same Sandbox · /workspace intact" },
        { kind: "fact", text: "Checked /workspace files — no duplicate runs" },
        { kind: "note", text: "Done · saved in /workspace, same Sandbox." },
      ]
      const next = [...extra, ...followUp]
      setExtra(next)
      setDraft("")
      setWorking(true)
      stickRef.current = true
      if (prefersReducedMotion()) {
        setVisible(chat.messages.length + next.length)
        setWorking(false)
        return
      }
      const base = chat.messages.length
      scheduleStream(next.length, base)
    },
    [draft, working, extra, chat.messages.length, scheduleStream],
  )

  const allMessages = [...chat.messages, ...extra]
  const shownCount = visible ?? chat.messages.length + extra.length
  const done = !working && shownCount >= allMessages.length

  return {
    working,
    draft,
    setDraft,
    preview,
    setPreview,
    replay,
    stop,
    send,
    onLogScroll,
    logRef,
    stickRef,
    allMessages,
    shownCount,
    done,
  }
}
