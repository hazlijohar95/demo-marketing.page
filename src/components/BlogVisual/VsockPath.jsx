import { EMBER, FAINT, Head, Label, MUTED, OK, PLATE, Sub } from "./primitives.jsx"

/* The path drawing from "KubeVirt, VSOCK, and eBPF": VSOCK bypasses the
   guest NIC, so IP filters never see it — the enforceable point is the
   host listener. */
export default function VsockPath() {
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
          <rect x={16} y={n.y} width={368} height={54} style={{ fill: PLATE, stroke: "var(--bx-line-strong)", strokeWidth: 1 }} />
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
        <rect x={420} y={226} width={284} height={84} style={{ fill: PLATE, stroke: "var(--bx-line-strong)", strokeWidth: 1 }} />
        <rect x={420} y={226} width={3} height={84} style={{ fill: EMBER }} />
        <Label x={436} y={254} size={12}>HOST GATE</Label>
        <Sub x={436} y={274}>BPF LSM · socket_listen</Sub>
        <Label x={436} y={296} size={11} weight={600} fill={OK}>✓ decides who may listen</Label>
      </g>
    </svg>
  )
}
