import { SKILL_MD } from "../../../lib/skillSource.js"

// Prerendered so the skill is edge-cacheable static markdown, exactly the
// bytes hashed into the agent-skills discovery index.
export const prerender = true

export function GET() {
  return new Response(SKILL_MD, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  })
}
