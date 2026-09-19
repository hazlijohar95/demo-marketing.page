import { EMBER, FAINT, Label, MUTED, PLATE, Sub } from "./primitives.jsx"

/* The stack from "Why we chose KubeVirt": what manages, what virtualizes,
   and where untrusted code actually runs. */
export default function VmStack() {
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
          <rect x={16} y={l.y} width={688} height={l.h} style={{ fill: PLATE, stroke: "var(--bx-line-strong)", strokeWidth: 1 }} />
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
