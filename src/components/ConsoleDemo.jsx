import { useState } from "react"
import { ArrowUpRight } from "lucide-react"

import { APP_URL } from "../content.js"
import { CHATS } from "../content/console-data.js"
import { useConsolePlayback } from "./console/use-console-playback.js"
import { useGuidedTour } from "./console/use-guided-tour.js"
import ConsoleHeader from "./console/ConsoleHeader.jsx"
import ConsoleSidebar from "./console/ConsoleSidebar.jsx"
import ConsoleConversation from "./console/ConsoleConversation.jsx"
import ConsoleInspector from "./console/ConsoleInspector.jsx"

export default function ConsoleDemo() {
  const [chatId, setChatId] = useState(CHATS[0].id)
  const [sideTab, setSideTab] = useState("chats")
  const [rightTab, setRightTab] = useState("terminal")
  const [activeNav, setActiveNav] = useState("chats")
  const [query, setQuery] = useState("")

  const chat = CHATS.find((c) => c.id === chatId)
  const playback = useConsolePlayback(chat, chatId)
  const { tourStep, touring, startTour, stopTour, TOUR } = useGuidedTour({
    chat,
    send: playback.send,
    replay: playback.replay,
    setPreview: playback.setPreview,
    setRightTab,
    setDraft: playback.setDraft,
  })

  const fileCount = chat.files.sandbox.length + chat.files.local.length

  return (
    <div data-component="console-live">
      <ConsoleHeader
        chat={chat}
        done={playback.done}
        working={playback.working}
        tourStep={tourStep}
        TOUR={TOUR}
        onToggleTour={() => (touring.current ? stopTour() : startTour())}
        onReplayStop={playback.working ? playback.stop : playback.replay}
      />

      {/* Touching the app hands control back — the head controls sit
          outside this element so Play/Stop/Replay stay usable. */}
      <div data-component="live-grid" onPointerDownCapture={stopTour} onKeyDownCapture={stopTour}>
        <ConsoleSidebar
          chatId={chatId}
          setChatId={setChatId}
          sideTab={sideTab}
          setSideTab={setSideTab}
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          query={query}
          setQuery={setQuery}
        />
        <ConsoleConversation
          chat={chat}
          allMessages={playback.allMessages}
          shownCount={playback.shownCount}
          working={playback.working}
          logRef={playback.logRef}
          onLogScroll={playback.onLogScroll}
          draft={playback.draft}
          setDraft={playback.setDraft}
          send={playback.send}
        />
        <ConsoleInspector
          chat={chat}
          rightTab={rightTab}
          setRightTab={setRightTab}
          preview={playback.preview}
          setPreview={playback.setPreview}
          shownCount={playback.shownCount}
          working={playback.working}
          fileCount={fileCount}
        />
      </div>

      <p data-slot="live-foot">
        Interactive recreation · illustrated data ·{" "}
        <a href={APP_URL} target="_blank" rel="noreferrer">
          Open the real console <ArrowUpRight aria-hidden="true" />
        </a>
      </p>
    </div>
  )
}
