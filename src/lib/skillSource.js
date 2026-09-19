// Single source of truth for the public boxcompute-sandbox agent skill.
// Served verbatim at /skills/boxcompute-sandbox/SKILL.md and hashed into
// /.well-known/agent-skills/index.json — one edit updates both, so the
// published digest can never drift from the served bytes.
export const SKILL_NAME = "boxcompute-sandbox"

export const SKILL_DESCRIPTION =
  "Run work in an isolated BoxCompute Sandbox (full Linux VM) via the bxc CLI — workspaces, command execution, files, and logs."

export const SKILL_MD = `---
name: boxcompute-sandbox
description: Run work in an isolated BoxCompute Sandbox (full Linux VM) via the bxc CLI — workspaces, command execution, files, and logs.
---

# boxcompute-sandbox

Use BoxCompute Sandboxes for remote compute: an isolated full Linux VM per
task, grouped by persistent workspaces. Mirror of the managed skill installed
by \`bxc skill install\`; full guide at https://boxcompute.ai/docs/cli/agents/

## Setup (human runs these, never the agent)

\`\`\`bash
npm install --global @boxcompute/cli
bxc login
bxc doctor
bxc skill install
\`\`\`

Never read, print, request, or transmit the saved BoxCompute credential.
Every \`bxc\` process reads the protected credential file itself.

## Boundaries

1. Discover before assuming: \`bxc --json workspaces\`, \`bxc --json sandboxes\`.
2. Start a Sandbox with a workspace ID only when a new isolated instance is
   needed; reuse the returned Sandbox ID afterwards.
3. Execute programs as structured arguments; \`bash -lc\` only for intentional
   shell syntax.
4. Keep paths at \`/workspace\` or below; pass \`--cwd\` / \`--env\` per execution.
5. A non-zero remote exit is evidence to diagnose, not a reason to retry blindly.
6. After a dropped connection, inspect state before retrying a start or delete.
7. Leave Sandboxes running unless asked to destroy them or they are disposable.

## Prompt patterns

\`\`\`text
$boxcompute-sandbox run this project's test suite in an isolated BoxCompute Sandbox and fix the failures
\`\`\`

\`\`\`text
Use BoxCompute to reproduce this Linux-only failure without changing my local machine.
\`\`\`

\`\`\`text
Create a disposable Sandbox under workspace WORKSPACE_ID, run the benchmark, report the result, and delete only that Sandbox when finished.
\`\`\`

Finish by reporting the workspace used, the meaningful results, and whether
the Sandbox was left running. Auth details: https://boxcompute.ai/auth
(served as \`/auth.md\`); API reference: https://boxcompute.ai/docs/http-api/
`
