import { Boxes, KeyRound, LayoutDashboard } from "lucide-react"

// One id per chat, interpolated into the transcript instead of retyped —
// the head chip, the terminal and the URL have to agree or the console
// reads as three unrelated mockups.
export const SANDBOX = { orders: "sandbox-7f3a", triage: "sandbox-3b08" }

export const CHATS = [
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

export const AGENTS = [
  { name: "BoxCompute", detail: "Default · answers + runs", status: "Active" },
  { name: "Reporter", detail: "CSV in · findings out", status: "Idle" },
]

export const FILE_BODY = {
  "report.json": '{\n  "processed": 248391,\n  "failed": 3,\n  "affected_revenue": 1842.40,\n  "currency": "USD"\n}',
  "order_summary.csv": "status,count,revenue\nok,248388,1190452.10\nfailed,3,1842.40",
  "replies.md": "# Draft replies\n\n1. Order #88121 — …\n2. Order #88203 — …\n\n5 flagged for a human.",
}

export const NAV = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "sandboxes", label: "Sandboxes", Icon: Boxes },
  { id: "keys", label: "API keys", Icon: KeyRound },
]

export const FOLLOW_UP = "Which regions were hit? Reuse the same Sandbox."
export const FOLLOW_UP_STEPS = 4
export const TYPE_MS = 40
