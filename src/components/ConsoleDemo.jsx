import { useEffect } from "react"
import { ArrowUpRight } from "lucide-react"

import { APP_URL } from "../content.js"
import { useConsoleDemo } from "./console/use-console-demo.js"
import ConsoleHeader from "./console/ConsoleHeader.jsx"
import ConsoleSidebar from "./console/ConsoleSidebar.jsx"
import ConsoleConversation from "./console/ConsoleConversation.jsx"
import ConsoleInspector from "./console/ConsoleInspector.jsx"

export default function ConsoleDemo() {
  const demo = useConsoleDemo()

  // Keyboard shortcuts: R replays/stops, T toggles the tour.
  // Ignored inside inputs so typing "t" never hijacks the composer.
  useEffect(() => {
    const onKey = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const tag = event.target?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA") return
      const key = event.key.toLowerCase()
      if (key === "r") {
        event.preventDefault()
        if (demo.working) demo.stop()
        else demo.replay()
      } else if (key === "t") {
        event.preventDefault()
        if (demo.touring.current) demo.stopTour()
        else demo.startTour()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [demo.working, demo.stop, demo.replay, demo.startTour, demo.stopTour])

  const progress = `${Math.min(demo.shownCount, demo.allMessages.length)}/${demo.allMessages.length}`

  return (
    <div data-component="console-live">
      <ConsoleHeader
        chat={demo.chat}
        done={demo.done}
        working={demo.working}
        tourStep={demo.tourStep}
        TOUR={demo.TOUR}
        progress={progress}
        onToggleTour={() => (demo.touring.current ? demo.stopTour() : demo.startTour())}
        onReplayStop={demo.working ? demo.stop : demo.replay}
      />

      {/* Touching the app hands control back — the head controls sit
          outside this element so Play/Stop/Replay stay usable. */}
      <div data-component="live-grid" onPointerDownCapture={demo.stopTour} onKeyDownCapture={demo.stopTour}>
        <ConsoleSidebar
          chatId={demo.chatId}
          setChatId={demo.setChatId}
          sideTab={demo.sideTab}
          setSideTab={demo.setSideTab}
          activeNav={demo.activeNav}
          setActiveNav={demo.setActiveNav}
          query={demo.query}
          setQuery={demo.setQuery}
        />
        <ConsoleConversation
          chat={demo.chat}
          allMessages={demo.allMessages}
          shownCount={demo.shownCount}
          working={demo.working}
          logRef={demo.logRef}
          onLogScroll={demo.onLogScroll}
          draft={demo.draft}
          setDraft={demo.setDraft}
          send={demo.send}
        />
        <ConsoleInspector
          chat={demo.chat}
          rightTab={demo.rightTab}
          setRightTab={demo.setRightTab}
          preview={demo.preview}
          setPreview={demo.setPreview}
          shownCount={demo.shownCount}
          working={demo.working}
          fileCount={demo.fileCount}
        />
      </div>

      <p data-slot="live-foot">
        Interactive recreation · illustrated data · <span aria-hidden="true">T tour · R replay ·</span>{" "}
        <a href={APP_URL} target="_blank" rel="noreferrer">
          Open the real console <ArrowUpRight aria-hidden="true" />
        </a>
      </p>
    </div>
  )
}
