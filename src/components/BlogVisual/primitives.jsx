// Shared bits: hairline boxes, mono labels, ember for the point that
// matters. All paint comes from design tokens so each figure adapts to
// the system light/dark theme with no extra work.
export const MONO = "var(--bx-mono)"
export const INK = "var(--bx-text)"
export const MUTED = "var(--bx-muted)"
export const FAINT = "var(--bx-faint)"
export const LINE = "var(--bx-line-strong)"
export const PLATE = "var(--bx-layer)"
export const EMBER = "var(--bx-accent-text)"
export const OK = "var(--bx-success)"

export function Box({ x, y, w, h, children }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} style={{ fill: PLATE, stroke: LINE, strokeWidth: 1 }} />
      {children}
    </g>
  )
}

export function Label({ x, y, children, size = 12, weight = 600, fill = INK, anchor = "start" }) {
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

export function Sub({ x, y, children, anchor = "start" }) {
  return (
    <Label x={x} y={y} size={11} weight={400} fill={MUTED} anchor={anchor}>
      {children}
    </Label>
  )
}

export function Arrow({ x1, y, x2, marker, color = MUTED }) {
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

export function Head({ id, color = MUTED }) {
  return (
    <marker id={id} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6" fill="none" style={{ stroke: color, strokeWidth: 1.5 }} />
    </marker>
  )
}
