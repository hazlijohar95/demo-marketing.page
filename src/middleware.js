import { defineMiddleware } from "astro:middleware"

import { DEMO_URL } from "./content.js"

// The markdown representation of the homepage, served to agents that ask for
// text/markdown. Kept as readable markdown so it can be edited directly.
const homeMd = `# BoxCompute

Isolated Linux VM Sandboxes grouped by persistent workspaces, for AI agents
that build, test, and explore.

- **One Sandbox per task.** A full Linux VM with its own kernel. Your laptop
  and prod stay out of the way.
- **Stays until you delete it.** No automatic expiry. Files under \`/workspace\`
  live as long as the Sandbox does.
- **Survives disconnects.** Durable operations with polling, 24h of retained
  output, and explicit cancel. Close your laptop mid-run; the job won't notice.

## Start

- Product docs: https://boxcompute.ai/docs
- HTTP API reference: https://boxcompute.ai/docs/http-api/
- SDK quickstart: https://boxcompute.ai/quickstart/
- CLI quickstart: https://boxcompute.ai/docs/cli/quickstart/
- Connect a coding agent: https://boxcompute.ai/docs/cli/agents/

## Authenticate (agents)

Hosted BoxCompute is invite-only. Request access, create an account, then mint
a scoped API key (\`bc_live_...\`) and send it as a Bearer token:

\`\`\`http
Authorization: Bearer bc_live_REDACTED
\`\`\`

Machine-readable registration guide: https://boxcompute.ai/auth.md

## Discover

- API catalog (RFC 9727): https://boxcompute.ai/.well-known/api-catalog
- OpenAPI 3.1: https://api.boxcompute.ai/api/v2/openapi.json
- Capability manifest (ARD): https://boxcompute.ai/.well-known/ai-catalog.json
- Agent skills index: https://boxcompute.ai/.well-known/agent-skills/index.json

Hosted is invite-only — a 15-minute call requests your invite:
${DEMO_URL}
`

// Machine-readable discovery pointers (RFC 8288). Same-origin targets stay
// relative so the headers are correct on every deployment; the API contract
// lives at its real absolute home.
const LINK_HEADERS = [
  `</.well-known/api-catalog>; rel="api-catalog"`,
  `</docs/http-api/>; rel="service-doc"`,
  `<https://api.boxcompute.ai/api/v2/openapi.json>; rel="service-desc"`,
  `</.well-known/ai-catalog.json>; rel="describedby"`,
].join(", ")

function withLinkHeaders(response) {
  const headers = new Headers(response.headers)
  headers.append("Link", LINK_HEADERS)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export const onRequest = defineMiddleware(async (context, next) => {
  const accept = context.request.headers.get("accept") ?? ""

  // Markdown for agents: requests asking for text/markdown get the curated
  // markdown representation; browsers keep receiving HTML by default.
  if (
    context.request.method === "GET" &&
    context.url.pathname === "/" &&
    accept.includes("text/markdown")
  ) {
    return new Response(homeMd, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "x-markdown-tokens": String(Math.ceil(homeMd.length / 4)),
      },
    })
  }

  const response = await next()
  const contentType = response.headers.get("content-type") ?? ""
  if (response.ok && contentType.includes("text/html")) {
    return withLinkHeaders(response)
  }
  return response
})
