import { Pause, Play } from "lucide-react"

export default function ConsoleHeader({
  chat,
  done,
  tourStep,
  TOUR,
  running,
  onToggleRun,
  progress,
}) {
  const runLabel = running ? "Pause the demo" : "Play the demo"
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
        {progress ? <span data-slot="live-progress" aria-hidden="true">{progress}</span> : null}
        <span data-slot="live-badge" role="status">{done ? "Done" : "Working"}</span>
        {/* The demo's only control. Icon-only: the head row is status, and a
            self-running demo needs one affordance, not a console of them. */}
        <button
          type="button"
          data-slot="live-run"
          onClick={onToggleRun}
          title={runLabel}
          aria-label={runLabel}
        >
          {running ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        </button>
      </span>
    </div>
  )
}
