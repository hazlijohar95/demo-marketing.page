import { defineMiddleware } from "astro:middleware"

const homeMd = "# BoxCompute\n\nIsolated Linux VM Sandboxes grouped by persistent workspaces, for AI agents\nthat build, test, and explore.\n\n- **One Sandbox per task.** A full Linux VM with its own kernel. Your laptop\n  and prod stay out of the way.\n- **Stays until you delete it.** No automatic expiry. Files under `/workspace`\n  live as long as the Sandbox does.\n- **Survives disconnects.** Durable operations with polling, 24h of retained\n  output, and explicit cancel. Close your laptop mid-run; the job won't notice.\n\n## Start\n\n- Product docs: https://boxcompute.ai/docs\n- HTTP API reference: https://boxcompute.ai/docs/http-api/\n- SDK quickstart: https://boxcompute.ai/quickstart/\n- CLI quickstart: https://boxcompute.ai/docs/cli/quickstart/\n- Connect a coding agent: https://boxcompute.ai/docs/cli/agents/\n\n## Authenticate (agents)\n\nHosted BoxCompute is invite-only. Request access, create an account, then mint\na scoped API key (`bc_live_...`) and send it as a Bearer token:\n\n```http\nAuthorization: Bearer bc_live_REDACTED\n```\n\nMachine-readable registration guide: https://boxcompute.ai/auth.md\n\n## Discover\n\n- API catalog (RFC 9727): https://boxcompute.ai/.well-known/api-catalog\n- OpenAPI 3.1: https://api.boxcompute.ai/api/v2/openapi.json\n- Capability manifest (ARD): https://boxcompute.ai/.well-known/ai-catalog.json\n- Agent skills index: https://boxcompute.ai/.well-known/agent-skills/index.json\n\nHosted is invite-only \u2014 a 15-minute call requests your invite:\nhttps://cal.com/muhammad-farhan-helmy-bin-roslan-d7spi3/15min\n"

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
