import { Arrow, Box, EMBER, Head, Label, Sub } from "./primitives.jsx"

/* The loop from "I got frustrated with AWS…": one workflow node hands the
   agent a sandbox, and the investigate cycle runs inside it. */
export default function AgentLoop() {
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
              style={{ fill: "var(--bx-bg)", stroke: "var(--bx-line-strong)", strokeWidth: 1 }}
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
