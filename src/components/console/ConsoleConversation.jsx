import { ArrowUp, Paperclip } from "lucide-react"

function Message({ message }) {
  if (message.kind === "report") return <h3>{message.title}</h3>
  if (message.kind === "lead") return <p data-line="lead">{message.text}</p>
  if (message.kind === "fact") return <p data-line="fact">{message.text}</p>
  if (message.kind === "user") return <p data-line="ask">{message.text}</p>
  if (message.kind === "run")
    return (
      <p data-line="run">
        <span>→</span> {message.text}
      </p>
    )
  return <p data-line="note">{message.text}</p>
}

export default function ConsoleConversation({
  chat,
  allMessages,
  shownCount,
  working,
  logRef,
  onLogScroll,
  draft,
  setDraft,
  send,
}) {
  return (
    <div data-slot="live-main">
      <div data-slot="live-convo-head" key={chat.id}>
        <span data-slot="live-avatar" data-tone="mint">
          BC
        </span>
        <span>
          <b>{chat.title}</b>
          <span>
            BoxCompute · {chat.model} · {working ? "Working" : chat.status}
          </span>
        </span>
        <span data-slot="live-wb">{chat.sandbox}</span>
      </div>

      <div
        data-slot="live-log"
        ref={logRef}
        onScroll={onLogScroll}
        role="log"
        aria-live="off"
        tabIndex={0}
        aria-label="Conversation"
      >
        <p data-line="ask">{chat.task}</p>
        {allMessages.slice(0, shownCount).map((message, i) => (
          <Message key={i} message={message} />
        ))}
        {working ? (
          <p data-line="run" aria-hidden="true">
            <span data-slot="demo-caret" />
          </p>
        ) : null}
      </div>

      <div data-slot="live-composer">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send()
          }}
          placeholder="Ask anything…"
          aria-label="Ask anything"
        />
        <div>
          <span>
            <Paperclip aria-hidden="true" />
            <span data-slot="live-model">{chat.model}</span>
          </span>
          <button
            type="button"
            onClick={() => send()}
            disabled={!draft.trim() || working}
            aria-label="Send message"
          >
            <ArrowUp aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
