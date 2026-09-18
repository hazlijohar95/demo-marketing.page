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
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Square,
  X,
} from "lucide-react"

import { APP_URL } from "../content.js"
import { prefersReducedMotion } from "../lib/reduced-motion.js"
import { useIsomorphicLayoutEffect } from "../lib/isomorphic-layout.js"
import { BEAT_MS, tourSchedule } from "../lib/tour-schedule.js"

const DESKTOP_SHOT = "/product/console-desktop.png?v=a2a2ab4"

// One id per chat, interpolated into the transcript instead of retyped —
// the head chip, the terminal and the URL have to agree or the console
// reads as three unrelated mockups.
const SANDBOX = { orders: "sandbox-7f3a", triage: "sandbox-3b08" }

const CHATS = [
  {
    id: "orders",
    sandbox: SANDBOX.orders,
    title: "Explore customer orders",
    model: "DeepSeek V4 Flash",
    status: "Done",
    group: "Today",
    task: "Analyze customer_orders.csv. Flag failed orders, sum affected revenue, save report.json.",
    messages: [
      { kind: "lead", text: "I analyzed the orders in an isolated Sandbox and saved the results." },
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
      `$ bxc sandbox exec ${SANDBOX.orders} -- python3 analyze_orders.py`,
      `→ ${SANDBOX.orders} ready · isolated Sandbox`,
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
    sandbox: SANDBOX.triage,
    title: "Refund triage",
    model: "DeepSeek V4 Flash",
    status: "Done",
    group: "Today",
    task: "Review this week's refunds. Flag human-needed cases, draft replies.md.",
    messages: [
      { kind: "lead", text: "I read this week's refunds in an isolated Sandbox and drafted replies." },
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
      `$ bxc sandbox exec ${SANDBOX.triage} -- python3 triage_refunds.py`,
      `→ ${SANDBOX.triage} ready · isolated Sandbox`,
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

const FOLLOW_UP = "Which regions were hit? Reuse the same Sandbox."
const FOLLOW_UP_STEPS = 4
const TYPE_MS = 40

export default function ConsoleDemo() {
  const [chatId, setChatId] = useState(CHATS[0].id)
  const [sideTab, setSideTab] = useState("chats")
  const [rightTab, setRightTab] = useState("terminal")
  const [activeNav, setActiveNav] = useState("chats")
  const [query, setQuery] = useState("")
  const [preview, setPreview] = useState(null)
  const [draft, setDraft] = useState("")
  const [extra, setExtra] = useState([])
  const [visible, setVisible] = useState(null)
  const [working, setWorking] = useState(false)
  const [tourStep, setTourStep] = useState(null)
  const timers = useRef([])
  // The tour's own timers live apart from the stream's: play() clears the
  // stream bag, and the tour starts by calling play().
  const tourTimers = useRef([])
  const touring = useRef(false)
  const logRef = useRef(null)
  const stickRef = useRef(true)

  const chat = CHATS.find((c) => c.id === chatId)
  const shownCount = visible ?? chat.messages.length + extra.length
  const allMessages = [...chat.messages, ...extra]
  const done = !working && shownCount >= allMessages.length
  const fileCount = chat.files.sandbox.length + chat.files.local.length

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }

  useEffect(() => {
    return () => {
      clearTimers()
      tourTimers.current.forEach((id) => window.clearTimeout(id))
    }
  }, [])
  // Autoplay the run on mount and on every chat switch: the island is
  // client:visible, so mount is the scroll-in beat. A layout effect keeps
  // the SSR markup (all messages, for no-JS and crawlers) from flashing
  // before the script rewinds to its first line.
  useIsomorphicLayoutEffect(() => {
    setExtra([])
    setPreview(null)
    stickRef.current = true
    if (logRef.current) logRef.current.scrollTop = 0
    play(chat.messages)
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
      timers.current.push(window.setTimeout(() => setVisible(i + 1), i * BEAT_MS))
    })
    timers.current.push(
      window.setTimeout(() => {
        setWorking(false)
      }, script.length * BEAT_MS),
    )
  }

  const replay = () => {
    setExtra([])
    stickRef.current = true
    if (logRef.current) logRef.current.scrollTop = 0
    play(chat.messages)
  }

  // WCAG 2.2.2: the run auto-starts on scroll-in and moves for longer than 5s,
  // so it needs a stop. Showing the finished state is a valid stop.
  const stop = () => {
    clearTimers()
    setVisible(chat.messages.length + extra.length)
    setWorking(false)
  }

  const send = (value) => {
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
    setVisible(base + 1)
    next.forEach((_, i) => {
      if (i === 0) return
      timers.current.push(window.setTimeout(() => setVisible(base + i + 1), i * BEAT_MS))
    })
    timers.current.push(window.setTimeout(() => setWorking(false), next.length * BEAT_MS))
  }

  // Tour steps fire from timers, so they must not read state captured at
  // schedule time — send() would see the stale working=true from step 1
  // and silently drop the follow-up. This ref always holds the latest.
  const latest = useRef(null)
  latest.current = { send, replay, chat }

  const stopTour = () => {
    if (!touring.current) return
    touring.current = false
    tourTimers.current.forEach((id) => window.clearTimeout(id))
    tourTimers.current = []
    setTourStep(null)
  }

  const typeInto = (text, then) => {
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
  }

  // One full round: goal in, run streams, files it wrote, the numbers,
  // then a follow-up into the same Sandbox. Opt-in, and any click or
  // keypress inside the app hands control back.
  const beats = tourSchedule(chat.messages.length, FOLLOW_UP_STEPS)
  const TOUR = [
    {
      label: "Give the agent a goal",
      act: () => {
        setPreview(null)
        setRightTab("terminal")
        latest.current.replay()
      },
    },
    { label: "It left files behind", act: () => setRightTab("files") },
    {
      label: "Open what it wrote",
      act: () => setPreview(latest.current.chat.files.sandbox[0]?.name ?? null),
    },
    {
      label: "Numbers it pulled out",
      act: () => {
        setPreview(null)
        setRightTab("previews")
      },
    },
    {
      label: "Follow up · same Sandbox",
      act: () => {
        setRightTab("terminal")
        typeInto(FOLLOW_UP, () => latest.current.send(FOLLOW_UP))
      },
    },
  ]

  const startTour = () => {
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
  }

  const filtered = CHATS.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()))

  return (
    <div data-component="console-live">
      <div data-slot="live-head">
        <span data-slot="live-url">
          <img src="/brand/boxcompute-symbol.svg" width="14" height="14" alt="" />
          <span>
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
            onClick={() => (touring.current ? stopTour() : startTour())}
            aria-label={tourStep === null ? "Play a guided tour" : "Stop the tour"}
          >
            {tourStep === null ? (
              <>
                <Play aria-hidden="true" /> Play tour
              </>
            ) : (
              <>
                <Square aria-hidden="true" /> Stop
              </>
            )}
          </button>
          <button type="button" onClick={working ? stop : replay} aria-label={working ? "Stop this run" : "Replay this run"}>
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

      {/* Touching the app hands control back — the head controls sit
          outside this element so Play/Stop/Replay stay usable. */}
      <div data-component="live-grid" onPointerDownCapture={stopTour} onKeyDownCapture={stopTour}>
        {/* sidebar */}
        <aside data-slot="live-side" aria-label="Workspace">
          <div data-slot="live-brand">
            <img src="/brand/boxcompute-symbol.svg" width="20" height="20" alt="" />
            boxcompute
          </div>
          <div data-slot="live-ws">
            <span data-slot="live-avatar" data-tone="ember">
              NR
            </span>
            <span>
              <b>Northwind Retail</b>
              <span>Production · 3 members</span>
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
          {/* Sidebar views are toggle buttons: there is no tabpanel and no
              aria-controls, so tab semantics announced a relationship that
              pointed at nothing, and arrow-key navigation was never wired. */}
          <div data-slot="live-tabs" role="group" aria-label="Sidebar view">
            {["chats", "agents"].map((tab) => (
              <button
                key={tab}
                type="button"
                data-active={sideTab === tab}
                aria-pressed={sideTab === tab}
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
                <a
                  href={APP_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="New chat in the real console"
                >
                  <Plus aria-hidden="true" />
                </a>              </div>
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
                        <b>{c.title}</b>
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
                      <b>{agent.name}</b>
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
                PR
              </span>
              <span>
                <b>Priya Raman</b>
                <span>priya@northwindretail.com</span>
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
            {allMessages.slice(0, shownCount).map((message, i) =>
              message.kind === "report" ? (
                <h3 key={i}>{message.title}</h3>
              ) : message.kind === "lead" ? (
                <p key={i} data-line="lead">
                  {message.text}
                </p>
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
                onClick={() => send()}
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
