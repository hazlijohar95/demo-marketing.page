import { useCallback, useEffect, useRef, useState } from "react"

import { prefersReducedMotion } from "../../lib/reduced-motion.js"
import { tourSchedule } from "../../lib/tour-schedule.js"
import { FOLLOW_UP, FOLLOW_UP_STEPS, TYPE_MS } from "../../content/console-data.js"

// Guided tour: one full round — goal in, run streams, files it wrote, the
// numbers, then a follow-up into the same Sandbox. Opt-in, and any click or
// keypress inside the app hands control back.
//
// Tour steps fire from timers, so they must not read state captured at
// schedule time — send() would see the stale working=true from step 1
// and silently drop the follow-up. `latest` always holds the fresh actions.
export function useGuidedTour({ chat, send, replay, setPreview, setRightTab, setDraft }) {
  const [tourStep, setTourStep] = useState(null)
  const tourTimers = useRef([])
  const touring = useRef(false)
  const latest = useRef(null)
  latest.current = { send, replay, chat, setPreview, setRightTab }

  useEffect(() => {
    return () => {
      tourTimers.current.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  const stopTour = useCallback(() => {
    if (!touring.current) return
    touring.current = false
    tourTimers.current.forEach((id) => window.clearTimeout(id))
    tourTimers.current = []
    setTourStep(null)
  }, [])

  const typeInto = useCallback(
    (text, then) => {
      if (prefersReducedMotion()) {
        setDraft(text)
        then()
        return
      }
      const chars = [...text]
      chars.forEach((_, i) => {
        tourTimers.current.push(
          window.setTimeout(() => setDraft(text.slice(0, i + 1)), i * TYPE_MS),
        )
      })
      tourTimers.current.push(window.setTimeout(then, chars.length * TYPE_MS + 320))
    },
    [setDraft],
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
      else tourTimers.current.push(window.setTimeout(run, beats.steps[i]))
    })
    tourTimers.current.push(window.setTimeout(stopTour, beats.end))
    // TOUR closes over the latest actions via `latest`, so only the beat
    // clock values belong in deps.
  }, [beats.steps, beats.end, stopTour, setDraft])

  return { tourStep, touring, startTour, stopTour, TOUR }
}
