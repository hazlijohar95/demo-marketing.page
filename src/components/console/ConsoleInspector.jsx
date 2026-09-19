import { FileText, Folder, X } from "lucide-react"

import { FILE_BODY } from "../../content/console-data.js"

export default function ConsoleInspector({
  chat,
  rightTab,
  setRightTab,
  preview,
  setPreview,
  shownCount,
  working,
  fileCount,
}) {
  return (
    <aside data-slot="live-inspector" aria-label="Workbench">
      <div data-slot="live-inspector-tabs" role="group" aria-label="Workbench view">
        {["files", "terminal", "previews"].map((tab) => (
          <button
            key={tab}
            type="button"
            data-active={rightTab === tab}
            aria-pressed={rightTab === tab}
            onClick={() => setRightTab(tab)}
          >
            {tab === "files" ? `Files ${fileCount}` : tab === "terminal" ? "Terminal" : "Previews"}
          </button>
        ))}
      </div>

      {rightTab === "files" ? (
        preview ? (
          <div data-slot="live-preview">
            {/* The filename is the visible label, but the button closes the
                preview — the name has to say so. */}
            <button type="button" onClick={() => setPreview(null)} aria-label={`Close ${preview}`}>
              <X aria-hidden="true" /> {preview}
            </button>
            <pre>{FILE_BODY[preview] ?? "…"}</pre>
          </div>
        ) : (
          <>
            <div data-slot="live-filegroup">
              <p>
                <Folder aria-hidden="true" /> Local <span>Saved · {chat.files.local.length}</span>
              </p>
              {chat.files.local.length === 0 ? <span>No saved files in this chat</span> : null}
            </div>
            <div data-slot="live-filegroup">
              <p>
                <span data-slot="live-sandbox-dot" /> Sandbox{" "}
                <span>
                  Kept until delete · {chat.files.sandbox.length}
                </span>
              </p>
              <ul>
                {chat.files.sandbox.map((file) => (
                  <li key={file.name}>
                    <button type="button" onClick={() => setPreview(file.name)}>
                      <FileText aria-hidden="true" /> {file.name} <span>{file.size}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <span>Sandbox files · deleted with the Sandbox.</span>
            </div>
          </>
        )
      ) : rightTab === "terminal" ? (
        <div data-slot="live-term">
          {/* Same beat clock as the chat log, so the terminal streams
             alongside the answer instead of printing the whole run. */}
          {chat.log.slice(0, shownCount).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
          {working ? (
            <p aria-hidden="true">
              <span data-slot="demo-caret" />
            </p>
          ) : null}
        </div>
      ) : (
        <ul data-slot="live-previews">
          {chat.previews.map((item) => (
            <li key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
