// Quickstart snippets + next-steps. Extracted from Quickstart.jsx so the
// page component only handles layout — copy updates never touch JSX.
export const DOCS = "/docs"

export const SCOPES = [
  "workspace:create",
  "sandbox:read",
  "sandbox:create",
  "sandbox:execute",
  "sandbox:delete",
]

export const SNIPPETS = {
  env: `read -rsp 'BoxCompute API key: ' BOXCOMPUTE_API_KEY && echo\nexport BOXCOMPUTE_API_KEY`,
  installTs: `npm install @boxcompute/sdk\nnpm install --save-dev tsx`,
  installPy: `python -m pip install boxcompute`,
  runTs: `npx tsx quickstart.ts`,
  runPy: `python quickstart.py`,
  expected: `4999950000`,
  ts: `import { randomUUID } from "node:crypto";
import { BoxCompute } from "@boxcompute/sdk";

const apiKey = process.env.BOXCOMPUTE_API_KEY;
if (!apiKey) throw new Error("BOXCOMPUTE_API_KEY is required");

const boxcompute = new BoxCompute({ apiKey });
const [existingWorkspace] = await boxcompute.workspaces.list();
const workspace = existingWorkspace ?? await boxcompute.workspaces.create({
  name: "SDK quickstart",
  idempotencyKey: "sdk-quickstart-workspace-v1",
});

const sandbox = await boxcompute.sandboxes.create({
  workspaceId: workspace.id,
  name: "SDK quickstart",
  idempotencyKey: randomUUID(),
});

try {
  const result = await boxcompute.sandboxes.execute(sandbox.id, {
    argv: ["python3", "-c", "print(sum(range(100000)))"],
    cwd: "/workspace",
    timeoutSeconds: 120,
    maxOutputBytes: 262_144,
  });
  console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  process.exitCode = result.exitCode;
} finally {
  await boxcompute.sandboxes.delete(sandbox.id);
}`,
  py: `import os
import sys
import uuid

from boxcompute import BoxCompute

with BoxCompute(api_key=os.environ["BOXCOMPUTE_API_KEY"]) as boxcompute:
    workspaces = boxcompute.workspaces.list()
    workspace = (
        workspaces[0]
        if workspaces
        else boxcompute.workspaces.create(
            name="SDK quickstart",
            idempotency_key="sdk-quickstart-workspace-v1",
        )
    )
    sandbox = boxcompute.sandboxes.create(
        workspace_id=workspace.id,
        name="SDK quickstart",
        idempotency_key=str(uuid.uuid4()),
    )
    try:
        result = boxcompute.sandboxes.execute(
            sandbox.id,
            argv=["python3", "-c", "print(sum(range(100000)))"],
            cwd="/workspace",
        )
        print(result.stdout, end="")
        if result.stderr:
            print(result.stderr, end="", file=sys.stderr)
    finally:
        boxcompute.sandboxes.delete(sandbox.id)`,
}

export const NEXT_STEPS = [
  {
    title: "Manage workspaces and Sandboxes",
    body: "Lifecycles, naming, and cleanup patterns.",
    href: `${DOCS}/sandboxes/`,
  },
  {
    title: "Execution inputs and durable operations",
    body: "Timeouts, output caps, and observable runs.",
    href: `${DOCS}/execute/`,
  },
  {
    title: "Sandbox files",
    body: "Read, write, edit, rename, list, remove.",
    href: `${DOCS}/files/`,
  },
  {
    title: "Integration guides",
    body: "Connect a supported agent framework.",
    href: `${DOCS}/integrations/`,
  },
  {
    title: "HTTP API reference",
    body: "Direct HTTP clients and OpenAPI tooling.",
    href: `${DOCS}/http-api/`,
  },
]
