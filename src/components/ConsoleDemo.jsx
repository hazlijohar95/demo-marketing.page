import { useEffect, useRef, useState } from "react"
import {
  ArrowUp,
  ArrowUpRight,
  Boxes,
  ChevronDown,
  FileText,
  Folder,
  KeyRound,
  LayoutDashboard,
  Paperclip,
  Plus,
  RotateCcw,
  Search,
  Settings,
  X,
} from "lucide-react"

import { APP_URL } from "../content.js"
import { prefersReducedMotion } from "../lib/reduced-motion.js"

const DESKTOP_SHOT = "/product/console-desktop.png?v=a2a2ab4"

const CHATS = [
  {
    id: "orders",
    title: "Explore customer orders",
    model: "DeepSeek V4 Flash",
    status: "Done",
    group: "Today",
    task: "Analyze customer_orders.csv. Flag failed orders, sum affected revenue, save report.json.",
    messages: [
      { kind: "report", title: "What I found" },
      { kind: "fact", text: "248,391 orders processed" },
      { kind: "fact", text: "3 failed orders identified" },
      { kind: "fact", text: "$1,842.40 in affected revenue" },
      {
        kind: "note",
        text: "Saved report.json + order_summary.csv in /workspace. Workspace persists for follow-ups.",
      },
    ],
    files: {
      local: [],
      sandbox: [
        { name: "order_summary.csv", size: "2KB" },
        { name: "report.json", size: "384B" },
      ],
    },
    log: [
      "$ bxc sandbox exec sandbox-7f3a -- python3 analyze_orders.py",
      "→ sandbox-7f3a ready · isolated Sandbox",
      "→ 248,391 rows scanned in 41s",
      "→ 3 failures flagged · revenue reconciled",
      "✓ report.json + order_summary.csv in /workspace",
    ],
    previews: [
      { label: "Affected revenue", value: "$1,842.40" },
      { label: "Failed orders", value: "3" },
      { label: "Rows processed", value: "248,391" },
    ],
  },
  {
    id: "triage",
    title: "Refund triage",
    model: "DeepSeek V4 Flash",
    status: "Done",
    group: "Today",
    task: "Review this week's refunds. Flag human-needed cases, draft replies.md.",
    messages: [
      { kind: "report", title: "What I found" },
      { kind: "fact", text: "46 refunds reviewed" },
      { kind: "fact", text: "5 need a human — flagged with reasons" },
      {
        kind: "note",
        text: "Drafts in /workspace/replies.md. Nothing sent; 5 flagged.",
      },
    ],
    files: {
      local: [],
      sandbox: [{ name: "replies.md", size: "1KB" }],
    },
    log: [
      "$ bxc sandbox exec sandbox-3b08 -- python3 triage_refunds.py",
      "→ sandbox-3b08 ready · isolated Sandbox",
      "→ 46 cases read · policy checked",
      "✓ replies.md in /workspace · 5 flagged",
    ],
    previews: [
      { label: "Reviewed", value: "46" },
      { label: "Need a human", value: "5" },
      { label: "Auto-ok", value: "41" },
    ],
  },
]

const AGENTS = [
  { name: "BoxCompute", detail: "Default · answers + runs", status: "Active" },
  { name: "Reporter", detail: "CSV in · findings out", status: "Idle" },
]

const FILE_BODY = {
  "report.json": '{\n  "processed": 248391,\n  "failed": 3,\n  "affected_revenue": 1842.40,\n  "currency": "USD"\n}',
  "order_summary.csv": "status,count,revenue\nok,248388,1190452.10\nfailed,3,1842.40",
  "replies.md": "# Draft replies\n\n1. Order #88121 — …\n2. Order #88203 — …\n\n5 flagged for a human.",
}

const NAV = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "sandboxes", label: "Sandboxes", Icon: Boxes },
  { id: "keys", label: "API keys", Icon: KeyRound },
]

export default function ConsoleDemo() {
  const [chatId, setChatId] = useState(CHATS[0].id)
  const [sideTab, setSideTab] = useState("chats")
  const [rightTab, setRightTab] = useState("files")
  const [activeNav, setActiveNav] = useState("chats")
  const [query, setQuery] = useState("")
  const [preview, setPreview] = useState(null)
  const [draft, setDraft] = useState("")
  const [extra, setExtra] = useState([])
  const [visible, setVisible] = useState(null)
  const [working, setWorking] = useState(false)
  const timers = useRef([])
  const logRef = useRef(null)
  const stickRef = useRef(true)

  const chat = CHATS.find((c) => c.id === chatId)
  const shownCount = visible ?? chat.messages.length + extra.length
  const allMessages = [...chat.messages, ...extra]
  const done = !working && shownCount >= allMessages.length

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }

  useEffect(() => clearTimers, [])
  useEffect(() => {
    setExtra([])
    setVisible(null)
    setWorking(false)
    setPreview(null)
    stickRef.current = true
    if (logRef.current) logRef.current.scrollTop = 0
    clearTimers()
  }, [chatId])

  const onLogScroll = () => {
    const el = logRef.current
    if (!el) return
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  useEffect(() => {
    if (stickRef.current && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [visible, extra, chatId])

  const play = (script) => {
    clearTimers()
    setWorking(true)
    if (prefersReducedMotion()) {
      setVisible(script.length)
      setWorking(false)
      return
    }
    setVisible(1)
    script.forEach((_, i) => {
      if (i === 0) return
      timers.current.push(window.setTimeout(() => setVisible(i + 1), i * 850))
    })
    timers.current.push(
      window.setTimeout(() => {
        setWorking(false)
      }, script.length * 850),
    )
  }

  const replay = () => {
    setExtra([])
    stickRef.current = true
    if (logRef.current) logRef.current.scrollTop = 0
    play(chat.messages)
  }

  const send = () => {
    const text = draft.trim()
    if (!text || working) return
    const followUp = [
      { kind: "user", text },
      { kind: "run", text: "Sandbox ready · resumed after cold" },
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
    setVisible(base + 1)
    next.forEach((_, i) => {
      if (i === 0) return
      timers.current.push(window.setTimeout(() => setVisible(base + i + 1), i * 850))
    })
    timers.current.push(window.setTimeout(() => setWorking(false), next.length * 850))
  }

  const filtered = CHATS.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()))

  return (
    <div data-component="console-live">
      <div data-slot="live-head">
        <span>The BoxCompute console</span>
        <span data-slot="live-head-right">
          <span data-slot="live-badge" role="status">{done ? "Done" : "Working"}</span>
          <button type="button" onClick={replay} aria-label="Replay this run">
            <RotateCcw aria-hidden="true" /> Replay
          </button>
          <a href={DESKTOP_SHOT} target="_blank" rel="noreferrer" aria-label="View full size">
            Full size <ArrowUpRight aria-hidden="true" />
          </a>
        </span>
      </div>

      <div data-component="live-grid">
        {/* sidebar */}
        <aside data-slot="live-side" aria-label="Workspace">
          <div data-slot="live-ws">
            <span data-slot="live-avatar" data-tone="ember">
              DW
            </span>
            <span>
              Demo workspace
              <span>1 workspace</span>
            </span>
            <ChevronDown aria-hidden="true" />
          </div>
          <nav data-slot="live-nav" aria-label="Console">
            {NAV.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                data-active={activeNav === id}
                aria-current={activeNav === id ? "true" : undefined}
                onClick={() => setActiveNav(id)}
              >
                <Icon aria-hidden="true" /> {label}
              </button>
            ))}
          </nav>
          <div data-slot="live-tabs" role="tablist" aria-label="Sidebar view">
            {["chats", "agents"].map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                data-active={sideTab === tab}
                aria-selected={sideTab === tab}
                onClick={() => {
                  setSideTab(tab)
                  setActiveNav(tab)
                }}
              >
                {tab === "chats" ? "Chats" : "Agents"}
              </button>
            ))}
          </div>

          {sideTab === "chats" ? (
            <>
              <div data-slot="live-search">
                <Search aria-hidden="true" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search chats"
                  aria-label="Search chats"
                />
                <button type="button" aria-label="New chat" onClick={() => setQuery("")}>
                  <Plus aria-hidden="true" />
                </button>
              </div>
              <p data-slot="live-group">Today</p>
              <ul data-slot="live-chats">
                {filtered.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      data-active={c.id === chatId}
                      aria-current={c.id === chatId ? "true" : undefined}
                      onClick={() => setChatId(c.id)}
                    >
                      <span data-slot="live-avatar" data-tone="mint">
                        BC
                      </span>
                      <span>
                        {c.title}
                        <span>
                          {c.model} · {c.status}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
                {filtered.length === 0 ? (
                  <li data-slot="live-empty">No chats match “{query}”.</li>
                ) : null}
              </ul>
            </>
          ) : (
            <ul data-slot="live-chats">
              {AGENTS.map((agent) => (
                <li key={agent.name}>
                  <button type="button" data-active={false} onClick={() => setSideTab("chats")}>
                    <span data-slot="live-avatar" data-tone="mint">
                      {agent.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span>
                      {agent.name}
                      <span>{agent.detail}</span>
                    </span>
                    <span data-slot="live-mini">{agent.status}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div data-slot="live-user">
            <button type="button" aria-label="Settings">
              <Settings aria-hidden="true" /> Settings
            </button>
            <span>
              <span data-slot="live-avatar" data-tone="plain">
                AL
              </span>
              <span>
                Alex<span>alex@example.com</span>
              </span>
            </span>
          </div>
        </aside>

        {/* main chat */}
        <div data-slot="live-main">
          <div data-slot="live-convo-head">
            <span data-slot="live-avatar" data-tone="mint">
              BC
            </span>
            <span>
              {chat.title}
              <span>
                BoxCompute · {chat.model} · {working ? "Working" : chat.status}
              </span>
            </span>
            <span data-slot="live-wb">Workbench 2</span>
          </div>

          <div
            data-slot="live-log"
            ref={logRef}
            onScroll={onLogScroll}
            role="log"
            aria-live="off"
            aria-label="Conversation"
          >
            <p data-line="ask">{chat.task}</p>
            <p data-line="lead">I analyzed the orders in an isolated Sandbox and saved the results.</p>
            {allMessages.slice(0, shownCount).map((message, i) =>
              message.kind === "report" ? (
                <h4 key={i}>{message.title}</h4>
              ) : message.kind === "fact" ? (
                <p key={i} data-line="fact">
                  {message.text}
                </p>
              ) : message.kind === "user" ? (
                <p key={i} data-line="ask">
                  {message.text}
                </p>
              ) : message.kind === "run" ? (
                <p key={i} data-line="run">
                  <span>→</span> {message.text}
                </p>
              ) : (
                <p key={i} data-line="note">
                  {message.text}
                </p>
              ),
            )}
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
                onClick={send}
                disabled={!draft.trim() || working}
                aria-label="Send message"
              >
                <ArrowUp aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* inspector */}
        <aside data-slot="live-inspector" aria-label="Workbench">
          <div data-slot="live-inspector-tabs" role="tablist" aria-label="Workbench view">
            {["files", "terminal", "previews"].map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                data-active={rightTab === tab}
                aria-selected={rightTab === tab}
                onClick={() => setRightTab(tab)}
              >
                {tab === "files" ? "Files 2" : tab === "terminal" ? "Terminal" : "Previews"}
              </button>
            ))}
          </div>

          {rightTab === "files" ? (
            preview ? (
              <div data-slot="live-preview">
                <button type="button" onClick={() => setPreview(null)}>
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
              {chat.log.map((line, i) => (
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
