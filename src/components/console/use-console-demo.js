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
  useMediaQuery,
} from "../../lib/environment.js"
import { REWIND_MS, streamDuration, tourSchedule, typeDuration } from "../../lib/tour-schedule.js"
import { useTimerBag } from "../../lib/use-timers.js"
import { CHATS, FOLLOW_UP, FOLLOW_UP_STEPS, TYPE_MS } from "../../content/console-data.js"

export function useConsoleDemo() {
  // --- Session selection (was ConsoleDemo.jsx useState fan-out) ---
  // Deep-linkable: ?chat=<id> selects the session. SSR-safe: no window on
  // the server means the first chat.
  const [chatId, setChatIdState] = useState(() => {
    if (typeof window === "undefined") return CHATS[0].id
    const requested = new URLSearchParams(window.location.search).get("chat")
    return CHATS.some((c) => c.id === requested) ? requested : CHATS[0].id
  })
  const [sideTab, setSideTab] = useState("chats")
  const [rightTab, setRightTab] = useState("terminal")
  const [activeNav, setActiveNav] = useState("chats")
  const [query, setQuery] = useState("")

  const setChatId = useCallback((id) => {
    setChatIdState(id)
    if (typeof window !== "undefined" && window.history?.replaceState) {
      const url = new URL(window.location.href)
      url.searchParams.set("chat", id)
      window.history.replaceState(null, "", url)
    }
  }, [])

  const chat = CHATS.find((c) => c.id === chatId)
  const fileCount = chat.files.sandbox.length + chat.files.local.length

  // --- Stream playback (was use-console-playback.js) ---
  // Timer ownership lives in the shared bag; the guided tour holds its own
  // bag so play() clears the stream without killing the tour schedule.
  const [extra, setExtra] = useState([])
  const [visible, setVisible] = useState(null)
  const [working, setWorking] = useState(false)
  const [rewinding, setRewinding] = useState(false)
  const [draft, setDraft] = useState("")
  const [preview, setPreview] = useState(null)
  const stream = useTimerBag()
  const logRef = useRef(null)
  const stickRef = useRef(true)
  const followRef = useRef(false)

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

  // Rewind to the top of the script and run it.
  const rewind = useCallback(() => {
    setExtra([])
    stickRef.current = true
    followRef.current = false
    if (logRef.current) logRef.current.scrollTo({ top: 0, behavior: "instant" })
    play(chat.messages)
  }, [chat.messages, play])

  // Autoplay the run on mount and on every chat switch: the island is
  // client:visible, so mount is the scroll-in beat. A layout effect keeps
  // the SSR markup (all messages, for no-JS and crawlers) from flashing
  // before the script rewinds to its first line. No dissolve here — there is
  // nothing on screen yet to dissolve from.
  useIsomorphicLayoutEffect(() => {
    setPreview(null)
    rewind()
  }, [chatId])

  const onLogScroll = useCallback(() => {
    const el = logRef.current
    if (!el) return
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    // Our own smooth follow passes through far-from-bottom positions on the way
    // down, and each one would look like the reader scrolling away. Only a
    // scroll we did not start may unstick the log.
    if (followRef.current) {
      if (near) followRef.current = false
      return
    }
    stickRef.current = near
  }, [])

  // Follow the stream instead of snapping to it: a new message used to jump the
  // log by its own height in one frame.
  useEffect(() => {
    const el = logRef.current
    if (!stickRef.current || !el) return
    followRef.current = true
    el.scrollTo({
      top: el.scrollHeight,
      behavior: prefersReducedMotion() ? "instant" : "smooth",
    })
  }, [visible, extra, chatId])

  // The loop restarts through here, so it dissolves the finished transcript
  // first — cutting ten messages to one in a single frame reads as a glitch,
  // not a restart. REWIND_MS is in the tour clock, so the narration waits for
  // the dissolve too.
  const replay = useCallback(() => {
    if (prefersReducedMotion()) {
      rewind()
      return
    }
    setRewinding(true)
    stream.schedule(REWIND_MS, () => {
      setRewinding(false)
      rewind()
    })
  }, [rewind, stream.schedule])

  // WCAG 2.2.2: the run auto-starts on scroll-in and moves for longer than 5s,
  // so it needs a stop. Showing the finished state is a valid stop.
  const stop = useCallback(() => {
    stream.clear()
    // A pause mid-dissolve must not leave the log faded out.
    setRewinding(false)
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
  // a follow-up into the same Sandbox. It runs itself and loops: the tour *is*
  // the section's content, so the console shows the product instead of asking
  // to be operated. Any click or keypress inside the app hands control back
  // for good.
  //
  // Tour steps fire from timers, so they must not read state captured at
  // schedule time — send() would see the stale working=true from step 1
  // and silently drop the follow-up. `latest` always holds the fresh actions.
  const [tourStep, setTourStep] = useState(null)
  const tour = useTimerBag()
  const touring = useRef(false)
  const latest = useRef(null)
  latest.current = { send, replay, stop, chat, setPreview, setRightTab }

  // Autorun, and the reader's one control over it. WCAG 2.2.2: this moves for
  // far longer than 5s without being essential, so it needs a stop — hence the
  // single Pause in the head row. Reduced motion never autoruns; `paused`
  // starts false on both sides so the button's SSR label matches hydration.
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", false)
  const [paused, setPaused] = useState(false)
  const running = !paused && !reducedMotion
  const runningRef = useRef(running)
  runningRef.current = running

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
      tour.schedule(typeDuration(text, TYPE_MS), then)
    },
    [tour.schedule],
  )

  const beats = tourSchedule(
    chat.messages.length,
    FOLLOW_UP_STEPS,
    typeDuration(FOLLOW_UP, TYPE_MS),
  )
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
    tour.schedule(beats.end, () => {
      stopTour()
      // Loop. `beats.end` already rests two beats past the last message, so
      // the finished state gets read time before the next round starts.
      if (runningRef.current) startTourRef.current()
    })
    // TOUR closes over the latest actions via `latest`, so only the beat
    // clock values belong in deps (`schedule` is stable).
  }, [beats.steps, beats.end, stopTour, tour.schedule])

  // Self-reference for the loop above: assigned after the definition so each
  // cycle calls the current closure, not the one that scheduled it.
  const startTourRef = useRef(null)
  startTourRef.current = startTour

  // The demo runs on mount (the island is client:visible, so mount is the
  // scroll-in beat) and stops when the reader pauses or takes over. Pausing
  // stops the message stream too — a pause that left messages arriving would
  // be a lie. Reads through refs so a mid-cycle follow-up can't re-fire it.
  useEffect(() => {
    if (running) {
      startTourRef.current()
    } else {
      stopTour()
      latest.current.stop()
    }
  }, [running, stopTour])

  // Any click or keypress inside the app hands control over. Stops the loop
  // for good, not just this cycle, so it can't yank a panel back while the
  // reader is exploring.
  const takeOver = useCallback(() => setPaused(true), [])
  const toggleRun = useCallback(() => setPaused((value) => !value), [])

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
    rewinding,
    draft,
    setDraft,
    preview,
    setPreview,
    send,
    onLogScroll,
    logRef,
    allMessages,
    shownCount,
    done,
    // Guided tour
    tourStep,
    takeOver,
    running,
    toggleRun,
    TOUR,
  }
}
