import { useEffect } from "react"

import { DEMO_URL } from "../content.js"

// Real site actions exposed to agents via the WebMCP API. Feature-detected:
// on browsers without navigator.modelContext this mounts and does nothing.
// Tools unregister on unmount via the AbortController signal.
const GUIDES = [
  "quickstart",
  "api-keys",
  "cli/quickstart",
  "cli/agents",
  "sandboxes",
  "execute",
  "files",
  "logs",
  "http-api",
]

function sectionExists(id) {
  return Boolean(document.getElementById(id));
}

export default function WebMcpTools() {
  useEffect(() => {
    const mc = navigator?.modelContext
    if (!mc || typeof mc.registerTool !== "function") return
    const controller = new AbortController()
    const opts = { signal: controller.signal }

    mc.registerTool(
      {
        name: "open_docs",
        description:
          "Open the BoxCompute documentation. Optionally jump straight to a guide by slug.",
        inputSchema: {
          type: "object",
          properties: {
            guide: {
              type: "string",
              description: "Guide slug, e.g. quickstart, http-api, cli/agents",
              enum: GUIDES,
            },
          },
        },
        execute: ({ guide } = {}) => {
          const path = guide && GUIDES.includes(guide) ? `/docs/${guide}/` : "/docs"
          window.location.assign(path)
          return { opened: path }
        },
      },
      opts,
    )

    mc.registerTool(
      {
        name: "go_to_section",
        description:
          "Scroll the landing page to a section: console, platform, how-it-works, or faq.",
        inputSchema: {
          type: "object",
          properties: {
            section: {
              type: "string",
              enum: ["console", "platform", "how-it-works", "faq"],
            },
          },
          required: ["section"],
        },
        execute: ({ section }) => {
          if (!sectionExists(section)) {
            window.location.assign(`/#${section}`)
            return { navigated: `/#${section}` }
          }
          document.getElementById(section).scrollIntoView({ behavior: "smooth" })
          return { scrolled: section }
        },
      },
      opts,
    )

    mc.registerTool(
      {
        name: "request_invite",
        description:
          "Open the booking page for a 15-minute call, which requests a Hosted BoxCompute invite.",
        inputSchema: { type: "object", properties: {} },
        execute: () => {
          window.open(DEMO_URL, "_blank", "noopener")
          return { opened: DEMO_URL }
        },
      },
      opts,
    )

    return () => controller.abort()
  }, [])

  return null
}
