const MONO = "var(--bx-mono)"
const INK = "var(--bx-text)"
const MUTED = "var(--bx-muted)"
const FAINT = "var(--bx-faint)"
const LINE = "var(--bx-line-strong)"
const PLATE = "var(--bx-layer)"
const EMBER = "var(--bx-accent-text)"
const OK = "var(--bx-success)"

// Shared bits: hairline boxes, mono labels, ember for the point that
// matters. All paint comes from design tokens so each figure adapts to
// the system light/dark theme with no extra work.
function Box({ x, y, w, h, children }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} style={{ fill: PLATE, stroke: LINE, strokeWidth: 1 }} />
      {children}
    </g>
  )
}

function Label({ x, y, children, size = 12, weight = 600, fill = INK, anchor = "start" }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      style={{ fontFamily: MONO, fontSize: size, fontWeight: weight, fill }}
    >
      {children}
    </text>
  )
}

function Sub({ x, y, children, anchor = "start" }) {
  return (
    <Label x={x} y={y} size={11} weight={400} fill={MUTED} anchor={anchor}>
      {children}
    </Label>
  )
}

function Arrow({ x1, y, x2, marker, color = MUTED }) {
  return (
    <line
      x1={x1}
      y1={y}
      x2={x2}
      y2={y}
      markerEnd={`url(#${marker})`}
      style={{ stroke: color, strokeWidth: 1.5 }}
    />
  )
}

function Head({ id, color = MUTED }) {
  return (
    <marker id={id} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6" fill="none" style={{ stroke: color, strokeWidth: 1.5 }} />
    </marker>
  )
}

/* The loop from "I got frustrated with AWS…": one workflow node hands the
   agent a sandbox, and the investigate cycle runs inside it. */
function AgentLoop() {
  return (
    <svg viewBox="0 0 720 330" role="presentation" aria-hidden="true" style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <Head id="al-head" />
        <Head id="al-ember" color={EMBER} />
      </defs>
      <Box x={16} y={115} w={140} h={100}>
        <Label x={32} y={145}>01</Label>
        <Label x={32} y={166}>USER</Label>
        <Sub x={32} y={188}>question</Sub>
      </Box>
      <Arrow x1={156} y={165} x2={184} marker="al-head" />
      <Box x={184} y={30} w={352} h={270}>
        <Label x={200} y={60}>02 · SANDBOX LOOP</Label>
        <Sub x={200} y={80}>write → run → inspect → adjust</Sub>
        {["write code", "run it", "inspect output", "adjust and retry"].map((step, i) => (
          <g key={step}>
            <rect
              x={200}
              y={96 + i * 48}
              width={288}
              height={38}
              style={{ fill: "var(--bx-bg)", stroke: LINE, strokeWidth: 1 }}
            />
            <Label x={214} y={120 + i * 48} size={11} weight={500}>
              {step}
            </Label>
          </g>
        ))}
        <path
          d="M494,272 C534,272 534,120 498,120"
          fill="none"
          markerEnd="url(#al-ember)"
          style={{ stroke: EMBER, strokeWidth: 1.5 }}
        />
      </Box>
      <Arrow x1={536} y={165} x2={564} marker="al-head" />
      <Box x={564} y={115} w={140} h={100}>
        <Label x={580} y={145}>03</Label>
        <Label x={580} y={166}>ANALYZER</Label>
        <Sub x={580} y={188}>explains findings</Sub>
      </Box>
    </svg>
  )
}

/* The stack from "Why we chose KubeVirt": what manages, what virtualizes,
   and where untrusted code actually runs. */
function VmStack() {
  const layers = [
    { y: 16, h: 64, title: "SANDBOX API", sub: "create · observe · stop · clean", tag: "your calls" },
    { y: 100, h: 64, title: "KUBERNETES + KUBEVIRT", sub: "placement · lifecycle · policy", tag: "management" },
    { y: 184, h: 64, title: "LAUNCHER POD", sub: "QEMU / KVM runs the VM", tag: "virtualization" },
    { y: 268, h: 72, title: "GUEST LINUX", sub: "own kernel · systemd · root", tag: "untrusted code runs here", hot: true },
  ]
  return (
    <svg viewBox="0 0 720 356" role="presentation" aria-hidden="true" style={{ width: "100%", height: "auto", display: "block" }}>
      {layers.map((l) => (
        <g key={l.title}>
          <rect x={16} y={l.y} width={688} height={l.h} style={{ fill: PLATE, stroke: LINE, strokeWidth: 1 }} />
          {l.hot ? <rect x={16} y={l.y} width={3} height={l.h} style={{ fill: EMBER }} /> : null}
          <Label x={34} y={l.y + 28}>{l.title}</Label>
          <Sub x={34} y={l.y + 48}>{l.sub}</Sub>
          <Label x={688} y={l.y + 28} size={11} weight={400} fill={l.hot ? EMBER : FAINT} anchor="end">
            {l.tag}
          </Label>
        </g>
      ))}
      {[80, 164, 248].map((y) => (
        <polygon key={y} points={`352,${y} 368,${y} 360,${y + 10}`} style={{ fill: MUTED }} />
      ))}
    </svg>
  )
}

/* The path drawing from "KubeVirt, VSOCK, and eBPF": VSOCK bypasses the
   guest NIC, so IP filters never see it — the enforceable point is the
   host listener. */
function VsockPath() {
  const lane = [
    { y: 16, title: "GUEST PROGRAM", sub: "runs as root — untrusted" },
    { y: 96, title: "virtio-vsock", sub: "guest kernel device" },
    { y: 176, title: "vhost-vsock", sub: "host kernel transport" },
    { y: 256, title: "HOST PROGRAM", sub: "CID 2 · port — host side" },
  ]
  const edge = ["socket", "virtual device", "VSOCK connection"]
  return (
    <svg viewBox="0 0 720 342" role="presentation" aria-hidden="true" style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <Head id="vp-head" />
        <Head id="vp-ember" color={EMBER} />
      </defs>
      {lane.map((n) => (
        <g key={n.title}>
          <rect x={16} y={n.y} width={368} height={54} style={{ fill: PLATE, stroke: LINE, strokeWidth: 1 }} />
          <Label x={32} y={n.y + 24} size={12}>{n.title}</Label>
          <Sub x={32} y={n.y + 42}>{n.sub}</Sub>
        </g>
      ))}
      {edge.map((label, i) => (
        <g key={label}>
          <line
            x1={200}
            y1={70 + i * 80}
            x2={200}
            y2={90 + i * 80}
            markerEnd="url(#vp-ember)"
            style={{ stroke: EMBER, strokeWidth: 1.5 }}
          />
          <Label x={212} y={86 + i * 80} size={11} weight={400} fill={MUTED}>
            {label}
          </Label>
        </g>
      ))}
      <g>
        <rect
          x={420}
          y={96}
          width={284}
          height={110}
          strokeDasharray="5 4"
          style={{ fill: "none", stroke: FAINT, strokeWidth: 1 }}
        />
        <Label x={436} y={124} size={12} fill={FAINT}>IP PATH</Label>
        <Sub x={436} y={144}>guest eth0 · firewall lives here</Sub>
        <Label x={436} y={182} size={12} weight={600} fill={EMBER}>✕ blind to VSOCK</Label>
      </g>
      <g>
        <rect x={420} y={226} width={284} height={84} style={{ fill: PLATE, stroke: LINE, strokeWidth: 1 }} />
        <rect x={420} y={226} width={3} height={84} style={{ fill: EMBER }} />
        <Label x={436} y={254} size={12}>HOST GATE</Label>
        <Sub x={436} y={274}>BPF LSM · socket_listen</Sub>
        <Label x={436} y={296} size={11} weight={600} fill={OK}>✓ decides who may listen</Label>
      </g>
    </svg>
  )
}

/* The comparison from "Full Linux VMs for your agents": gVisor vs VM at a
   glance, plus the one lifecycle fact that affects the bill. */
function VmCompare() {
  const rows = [
    { k: "kernel", g: "shared host kernel", v: "own guest kernel" },
    { k: "user", g: "constrained user", v: "root · UID 0" },
    { k: "packages", g: "limited toolchain", v: "apt-get install" },
    { k: "network", g: "varies", v: "outbound IPv4 + DNS" },
    { k: "lifetime", g: "task-scoped", v: "no expiry — delete to stop" },
  ]
  return (
    <svg viewBox="0 0 720 372" role="presentation" aria-hidden="true" style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <Head id="vc-head" />
      </defs>
      <Label x={16} y={28} size={11} weight={400} fill={FAINT}>CAPABILITY</Label>
      <Label x={300} y={28} size={11} weight={400} fill={FAINT}>GVISOR</Label>
      <Label x={496} y={28} size={11} weight={400} fill={FAINT}>VM · DEFAULT</Label>
      <line x1={16} y1={38} x2={704} y2={38} style={{ stroke: LINE, strokeWidth: 1 }} />
      {rows.map((r, i) => (
        <g key={r.k}>
          <Label x={16} y={64 + i * 40} size={12}>{r.k}</Label>
          <Label x={300} y={64 + i * 40} size={11} weight={400} fill={MUTED}>{r.g}</Label>
          <Label x={496} y={64 + i * 40} size={11} weight={500} fill={INK}>{r.v}</Label>
          <Label x={688} y={64 + i * 40} size={11} weight={600} fill={OK} anchor="end">✓</Label>
          <line x1={16} y1={76 + i * 40} x2={704} y2={76 + i * 40} style={{ stroke: "var(--bx-line)", strokeWidth: 1 }} />
        </g>
      ))}
      {["pending", "running", "deleted"].map((s, i) => (
        <g key={s}>
          <rect
            x={16 + i * 190}
            y={288}
            width={164}
            height={40}
            style={{ fill: i === 2 ? "none" : PLATE, stroke: LINE, strokeWidth: 1 }}
          />
          <Label x={98 + i * 190} y={313} size={11} weight={500} anchor="middle">{s}</Label>
          {i < 2 ? <Arrow x1={180 + i * 190} y={308} x2={200 + i * 190} marker="vc-head" /> : null}
        </g>
      ))}
      <Label x={586} y={301} size={11} weight={400} fill={EMBER}>billable until</Label>
      <Label x={586} y={317} size={11} weight={600} fill={EMBER}>you delete it</Label>
    </svg>
  )
}

const VISUALS = {
  "why-we-built-boxcompute": {
    art: <AgentLoop />,
    caption: "The loop that mattered — one workflow node hands the agent a sandbox, and the investigate cycle runs inside it.",
  },
  "why-we-chose-kubevirt": {
    art: <VmStack />,
    caption: "Where each layer lives — KubeVirt manages the VM lifecycle in Kubernetes, QEMU/KVM still runs it, and the agent gets a whole guest.",
  },
  "kubevirt-vsock-ebpf": {
    art: <VsockPath />,
    caption: "Draw the path first — VSOCK bypasses the guest NIC entirely, so IP firewalls never see it. The enforceable point is the host listener.",
  },
  "vm-sandboxes": {
    art: <VmCompare />,
    caption: "gVisor vs VM at a glance — and the one lifecycle fact that affects your bill.",
  },
}

export default function BlogVisual({ slug }) {
  const visual = VISUALS[slug]
  if (!visual) return null
  return (
    <figure data-component="post-visual">
      {visual.art}
      <figcaption data-slot="post-visual-caption">
        <span aria-hidden="true">Fig.</span> {visual.caption}
      </figcaption>
    </figure>
  )
}
