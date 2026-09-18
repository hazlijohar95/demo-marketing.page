---
title: "Manage Sandboxes"
description: "Create and list workspaces, then create, inspect, and delete Sandbox instances."
---

# Manage Sandboxes

A BoxCompute workspace is the parent for Sandbox instances. A workspace can own multiple Sandboxes, each with a stable customer-facing `id`. All list and lookup operations are limited to the account that owns the API key.

VM Sandboxes are the default runtime. See [VM Sandboxes (Beta)](/docs/vm-sandbox-beta/)
for the fixed profile, network choice, integration walkthrough, and current
limitations; pass `vmSandbox: false` to create an ordinary gVisor Sandbox
instead.

## Use an official SDK

### TypeScript

```ts
import { BoxCompute } from "@boxcompute/sdk";

const boxcompute = new BoxCompute({ apiKey: process.env.BOXCOMPUTE_API_KEY! });
const workspaces = await boxcompute.workspaces.list();
const workspace = workspaces[0] ?? await boxcompute.workspaces.create({
  name: "Agent workspace",
  idempotencyKey: "workspace-bootstrap-v1",
});
const sandbox = await boxcompute.sandboxes.create({
  workspaceId: workspace.id,
  name: "Worker 1",
  idempotencyKey: crypto.randomUUID(),
});

const current = await boxcompute.sandboxes.inspect(sandbox.id);
await boxcompute.sandboxes.delete(current.id);
```
### Python

```python
import os
import uuid

from boxcompute import BoxCompute

with BoxCompute(api_key=os.environ["BOXCOMPUTE_API_KEY"]) as boxcompute:
workspaces = boxcompute.workspaces.list()
workspace = workspaces[0] if workspaces else boxcompute.workspaces.create(
    name="Agent workspace",
    idempotency_key="workspace-bootstrap-v1",
)
sandbox = boxcompute.sandboxes.create(
    workspace_id=workspace.id,
    name="Worker 1",
    idempotency_key=str(uuid.uuid4()),
)
current = boxcompute.sandboxes.inspect(sandbox.id)
boxcompute.sandboxes.delete(current.id)
```

Generate one idempotency key per intended Sandbox creation and reuse it only when retrying that
same creation.

## Direct HTTP

### List owned workspaces

```bash
curl 'https://api.boxcompute.ai/api/v2/workspaces' \
  -H 'Authorization: Bearer bc_live_REDACTED'
```

This includes owned workspaces that do not yet have a Sandbox. Use a returned workspace `id` when creating an instance.

### Bootstrap a workspace

If the account has no workspace, create one with a key that has `workspace:create` scope:

```bash
curl -X POST 'https://api.boxcompute.ai/api/v2/workspaces' \
  -H 'Authorization: Bearer bc_live_REDACTED' \
  -H 'Idempotency-Key: workspace-bootstrap-v1' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Agent workspace"}'
```

`name` is required, must contain a non-whitespace character, and can contain at most 80 characters. The required idempotency key is account-scoped: retrying the same canonical request within 24 hours returns the original `201` response and workspace ID. Reusing the key for a different public mutation returns `409 IDEMPOTENCY_CONFLICT`.

The response is `{ "workspace": ... }`. The new workspace appears in subsequent workspace lists and can own multiple Sandboxes. Accounts can have at most 10 workspaces; exceeding that limit returns `409 WORKSPACE_QUOTA_EXCEEDED`.

Workspaces persist independently of their Sandboxes. The public API does not provide workspace deletion, so create one only when the account needs another durable Sandbox parent.

### Create and start an instance

```bash
curl -X POST 'https://api.boxcompute.ai/api/v2/sandboxes' \
  -H 'Authorization: Bearer bc_live_REDACTED' \
  -H 'Idempotency-Key: 019f1234-5678-7000-8000-000000000000' \
  -H 'Content-Type: application/json' \
  -d '{"workspaceId":"ws_REDACTED","name":"Worker 1"}'
```

`workspaceId` is required and must identify a workspace owned by the key's account. `name` is optional; when supplied, it must be a non-empty string of at most 80 characters. Each successful request creates another independent instance and returns `201` with `{ "sandbox": ... }`.

### Retry creation safely

`Idempotency-Key` is optional, but use one whenever a create might be retried after a timeout or lost response. Generate a unique value for each intended creation and persist it until the response is safely recorded.

Repeating the same canonical request with the same key on the same account within 24 hours returns the exact original `201` response and Sandbox ID. Concurrent requests with that key share the same result. Reusing it for a different create request or another public mutation returns `409 IDEMPOTENCY_CONFLICT`. Keys are account-scoped even when the requests use different API keys.

Omitting the header preserves non-idempotent behavior: every request can create another Sandbox. After 24 hours, a reused key can also create a new mutation, so do not use a longer retry window.

### List and inspect

```bash
curl 'https://api.boxcompute.ai/api/v2/sandboxes' \
  -H 'Authorization: Bearer bc_live_REDACTED'

curl 'https://api.boxcompute.ai/api/v2/sandboxes/sbx_REDACTED' \
  -H 'Authorization: Bearer bc_live_REDACTED'
```

The list response is `{ "sandboxes": [...] }`; inspection returns `{ "sandbox": ... }`. State is
`cold`, `pending`, `running`, or `expired`. Ordinary Sandboxes use `cold` and `running`; VM beta
provisioning adds `pending`, and `expired` means the VM runtime is no longer available. See
[HTTP API reference](/docs/http-api/) for the complete shape.

When idle compute stops, the Sandbox becomes `cold`. Its retained workload and command output can remain available without restarting it; see [Read Sandbox logs](/docs/logs/).

### Start an existing slot

Direct HTTP clients can start an existing owned Sandbox without allocating another instance:

```bash
curl -X POST 'https://api.boxcompute.ai/api/v2/sandboxes/sbx_REDACTED/start' \
  -H 'Authorization: Bearer bc_live_REDACTED' \
  -H 'Idempotency-Key: start-existing-v1' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

This route requires `sandbox:create`, accepts only an empty JSON object, and returns `201` with
`{ "sandbox": ... }`. The idempotency header is optional. It reuses the selected slot and its
recorded runtime choice; it does not accept a workspace, image, library, profile, or runtime
selector. The current SDKs and CLI do not expose this route directly.

### Delete

```bash
curl -X DELETE 'https://api.boxcompute.ai/api/v2/sandboxes/sbx_REDACTED' \
  -H 'Authorization: Bearer bc_live_REDACTED' \
  -H 'Content-Type: application/json'
```

Deletion returns `204 No Content` and removes that Sandbox instance. It does not delete its parent workspace or sibling Sandboxes.
