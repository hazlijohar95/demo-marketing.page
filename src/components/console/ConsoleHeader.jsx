import { ArrowUpRight, Play, RotateCcw, Square } from "lucide-react"

import { DESKTOP_SHOT } from "../../content/console-data.js"

export default function ConsoleHeader({
  chat,
  done,
  working,
  tourStep,
  TOUR,
  onToggleTour,
  onReplayStop,
}) {
  const touringActive = tourStep !== null
  return (
    <div data-slot="live-head">
      <span data-slot="live-url">
        <img src="/brand/boxcompute-symbol.svg" width="14" height="14" alt="" />
        <span key={chat.id}>
          app.boxcompute.ai<b>/c/{chat.id}</b>
        </span>
      </span>
      {/* Always rendered so the live region is stable across tour steps; the
          keyed inner span re-fires the entrance animation. */}
      <span data-slot="live-tour" role="status">
        {tourStep === null ? null : (
          <span key={tourStep}>
            <b>
              {String(tourStep + 1).padStart(2, "0")}/{String(TOUR.length).padStart(2, "0")}
            </b>
            {TOUR[tourStep].label}
            <em aria-hidden="true">· click to take over</em>
          </span>
        )}
      </span>
      <span data-slot="live-head-right">
        <span data-slot="live-badge" role="status">{done ? "Done" : "Working"}</span>
        <button
          type="button"
          onClick={onToggleTour}
          aria-label={touringActive ? "Stop the tour" : "Play a guided tour"}
        >
          {touringActive ? (
            <>
              <Square aria-hidden="true" /> Stop
            </>
          ) : (
            <>
              <Play aria-hidden="true" /> Play tour
            </>
          )}
        </button>
        <button type="button" onClick={onReplayStop} aria-label={working ? "Stop this run" : "Replay this run"}>
          {working ? (
            <>
              <Square aria-hidden="true" /> Stop
            </>
          ) : (
            <>
              <RotateCcw aria-hidden="true" /> Replay
            </>
          )}
        </button>
        <a href={DESKTOP_SHOT} target="_blank" rel="noreferrer" aria-label="View full size">
          Full size <ArrowUpRight aria-hidden="true" />
        </a>
      </span>
    </div>
  )
}
