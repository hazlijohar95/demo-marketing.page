import { Arrow, EMBER, FAINT, Head, INK, Label, LINE, MUTED, OK, PLATE } from "./primitives.jsx"

/* The comparison from "Full Linux VMs for your agents": gVisor vs VM at a
   glance, plus the one lifecycle fact that affects the bill. */
export default function VmCompare() {
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
