import { createHash } from "node:crypto"

import { SKILL_DESCRIPTION, SKILL_MD, SKILL_NAME } from "../../../lib/skillSource.js"

// Prerendered so the digest is computed at build time from the exact bytes
// served at /skills/boxcompute-sandbox/SKILL.md — the hash can never drift
// from the artifact because both come from one source module.
export const prerender = true

export function GET() {
  const body = {
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills: [
      {
        name: SKILL_NAME,
        type: "skill-md",
        description: SKILL_DESCRIPTION,
        url: "/skills/boxcompute-sandbox/SKILL.md",
        digest: `sha256:${createHash("sha256").update(SKILL_MD).digest("hex")}`,
      },
    ],
  }
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
