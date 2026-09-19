import { ArrowUpRight } from "lucide-react"

import { APP_URL } from "../content.js"
import { useConsoleDemo } from "./console/use-console-demo.js"
import ConsoleHeader from "./console/ConsoleHeader.jsx"
import ConsoleSidebar from "./console/ConsoleSidebar.jsx"
import ConsoleConversation from "./console/ConsoleConversation.jsx"
import ConsoleInspector from "./console/ConsoleInspector.jsx"

export default function ConsoleDemo() {
  const demo = useConsoleDemo()

  const progress = `${Math.min(demo.shownCount, demo.allMessages.length)}/${demo.allMessages.length}`

  return (
    <div data-component="console-live">
      <ConsoleHeader
        chat={demo.chat}
        done={demo.done}
        tourStep={demo.tourStep}
        TOUR={demo.TOUR}
        progress={progress}
        running={demo.running}
        onToggleRun={demo.toggleRun}
      />

      {/* Touching the app hands control over — the Pause control sits outside
          this element so it stays usable. */}
      <div data-component="live-grid" onPointerDownCapture={demo.takeOver} onKeyDownCapture={demo.takeOver}>
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
          rewinding={demo.rewinding}
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
        Interactive recreation · illustrated data ·{" "}
        <a href={APP_URL} target="_blank" rel="noreferrer">
          Open the real console <ArrowUpRight aria-hidden="true" />
        </a>
      </p>
    </div>
  )
}
