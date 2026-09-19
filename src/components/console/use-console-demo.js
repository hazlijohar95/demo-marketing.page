// Console demo state: one deep module behind the Console demo's seam.
//
// The stream playback, the guided tour, and the session selection used to live
// in two hooks plus the section component, wired through six callbacks in
// ConsoleDemo.jsx. The beat clock (tour-schedule.js) was tested, but the bugs
// that mattered hid in the wiring between the modules: a stale `working` flag
// captured at schedule time (hence the `latest` ref), two timer bags that must
// not clear each other, and tour beats that must land after the stream they
// narrate. Those fixes had no locality — each one touched two or three files.
//
// This module owns all of it: session selection, stream reveal, composer send,
// replay/stop, the tour narration, and both timer bags as internal seams. The
// four presentational modules (Sidebar, Header, Conversation, Inspector) are
// adapters at its seam. tour-schedule.js and use-timers.js stay as
// implementation behind it, with their own internal-seam tests.
import { useCallback, useEffect, useRef, useState } from "react"

import {
  prefersReducedMotion,
  useIsomorphicLayoutEffect,
} from "../../lib/environment.js"
import { streamDuration, tourSchedule } from "../../lib/tour-schedule.js"
import { useTimerBag } from "../../lib/use-timers.js"
import { CHATS, FOLLOW_UP, FOLLOW_UP_STEPS, TYPE_MS } from "../../content/console-data.js"

export function useConsoleDemo() {
  // --- Session selection (was ConsoleDemo.jsx useState fan-out) ---
  const [chatId, setChatId] = useState(CHATS[0].id)
  const [sideTab, setSideTab] = useState("chats")
  const [rightTab, setRightTab] = useState("terminal")
  const [activeNav, setActiveNav] = useState("chats")
  const [query, setQuery] = useState("")

  const chat = CHATS.find((c) => c.id === chatId)
  const fileCount = chat.files.sandbox.length + chat.files.local.length

  // --- Stream playback (was use-console-playback.js) ---
  // Timer ownership lives in the shared bag; the guided tour holds its own
  // bag so play() clears the stream without killing the tour schedule.
  const [extra, setExtra] = useState([])
  const [visible, setVisible] = useState(null)
  const [working, setWorking] = useState(false)
  const [draft, setDraft] = useState("")
  const [preview, setPreview] = useState(null)
  const stream = useTimerBag()
  const logRef = useRef(null)
  const stickRef = useRef(true)

  // Shared beat scheduler for play/send: reveal one message per beat,
  // then settle. `base` offsets follow-up streams past the base script.
  const scheduleStream = useCallback(
    (count, base = 0) => {
      setVisible(base + 1)
      for (let i = 1; i < count; i += 1) {
        stream.schedule(streamDuration(i), () => setVisible(base + i + 1))
      }
      stream.schedule(streamDuration(count), () => setWorking(false))
    },
    [stream.schedule],
  )

  const play = useCallback(
    (script) => {
      stream.clear()
      setWorking(true)
      if (prefersReducedMotion()) {
        setVisible(script.length)
        setWorking(false)
        return
      }
      scheduleStream(script.length)
    },
    [stream.clear, scheduleStream],
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
    stream.clear()
    setVisible(chat.messages.length + extra.length)
    setWorking(false)
  }, [chat.messages.length, extra.length, stream.clear])

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

  // --- Guided tour (was use-guided-tour.js) ---
  // One full round — goal in, run streams, files it wrote, the numbers, then
  // a follow-up into the same Sandbox. Opt-in, and any click or keypress
  // inside the app hands control back.
  //
  // Tour steps fire from timers, so they must not read state captured at
  // schedule time — send() would see the stale working=true from step 1
  // and silently drop the follow-up. `latest` always holds the fresh actions.
  const [tourStep, setTourStep] = useState(null)
  const tour = useTimerBag()
  const touring = useRef(false)
  const latest = useRef(null)
  latest.current = { send, replay, chat, setPreview, setRightTab }

  const stopTour = useCallback(() => {
    if (!touring.current) return
    touring.current = false
    tour.clear()
    setTourStep(null)
  }, [tour.clear])

  const typeInto = useCallback(
    (text, then) => {
      if (prefersReducedMotion()) {
        setDraft(text)
        then()
        return
      }
      const chars = [...text]
      chars.forEach((_, i) => {
        tour.schedule(i * TYPE_MS, () => setDraft(text.slice(0, i + 1)))
      })
      tour.schedule(chars.length * TYPE_MS + 320, then)
    },
    [tour.schedule],
  )

  const beats = tourSchedule(chat.messages.length, FOLLOW_UP_STEPS)
  const TOUR = [
    {
      label: "Give the agent a goal",
      act: () => {
        latest.current.setPreview(null)
        latest.current.setRightTab("terminal")
        latest.current.replay()
      },
    },
    { label: "It left files behind", act: () => latest.current.setRightTab("files") },
    {
      label: "Open what it wrote",
      act: () => latest.current.setPreview(latest.current.chat.files.sandbox[0]?.name ?? null),
    },
    {
      label: "Numbers it pulled out",
      act: () => {
        latest.current.setPreview(null)
        latest.current.setRightTab("previews")
      },
    },
    {
      label: "Follow up · same Sandbox",
      act: () => {
        latest.current.setRightTab("terminal")
        typeInto(FOLLOW_UP, () => latest.current.send(FOLLOW_UP))
      },
    },
  ]

  const startTour = useCallback(() => {
    stopTour()
    touring.current = true
    setDraft("")
    TOUR.forEach((step, i) => {
      const run = () => {
        setTourStep(i)
        step.act()
      }
      if (beats.steps[i] === 0) run()
      else tour.schedule(beats.steps[i], run)
    })
    tour.schedule(beats.end, stopTour)
    // TOUR closes over the latest actions via `latest`, so only the beat
    // clock values belong in deps (`schedule` is stable).
  }, [beats.steps, beats.end, stopTour, tour.schedule])

  return {
    // Session
    chat,
    chatId,
    setChatId,
    sideTab,
    setSideTab,
    rightTab,
    setRightTab,
    activeNav,
    setActiveNav,
    query,
    setQuery,
    fileCount,
    // Stream playback
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
    allMessages,
    shownCount,
    done,
    // Guided tour
    tourStep,
    touring,
    startTour,
    stopTour,
    TOUR,
  }
}
