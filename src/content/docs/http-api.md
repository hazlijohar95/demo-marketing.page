---
title: "HTTP API reference"
description: "Public v2 routes, authentication, request bodies, and response shapes."
---

# HTTP API reference

Use the fixed base URL `https://api.boxcompute.ai` and the `/api/v2` routes below. Application
integrations should normally start with the [official SDK quickstart](/quickstart/); use this page for
direct HTTP clients, generators, and API tooling.

The [public OpenAPI 3.1 contract](https://api.boxcompute.ai/api/v2/openapi.json)
is served as JSON without authentication for generators, contract tests, and
API tooling. It describes only this customer surface. It is not the private
downstream Sandbox API.

Every request except the OpenAPI document requires a BoxCompute API key:

```http
Authorization: Bearer bc_live_REDACTED
```

JSON mutation examples send `Content-Type: application/json`; file uploads use `application/octet-stream`.

## Routes

| Method | Route | Scope | Success |
| --- | --- | --- | --- |
| `DELETE` | `/api/v2/auth` | `sandbox:read` | Revokes the current key; `204` |
| `GET` | `/api/v2/workspaces` | `sandbox:read` | `{ "workspaces": Workspace[] }` |
| `POST` | `/api/v2/workspaces` | `workspace:create` | Creates a persistent workspace; `{ "workspace": Workspace }`, `201` |
| `GET` | `/api/v2/sandboxes` | `sandbox:read` | `{ "sandboxes": Sandbox[] }` |
| `POST` | `/api/v2/sandboxes` | `sandbox:create` | Creates a Sandbox; gVisor requests return running `201`, VM requests return pending `202` (replayed `201` once ready) |
| `GET` | `/api/v2/sandboxes/:id` | `sandbox:read` | `{ "sandbox": Sandbox }` |
| `GET` | `/api/v2/sandboxes/:id/analytics` | `sandbox:read` | `{ "analytics": SandboxAnalytics }` |
| `GET` | `/api/v2/sandboxes/:id/logs` | `sandbox:read` | Current or retained output; `{ "logs": SandboxLogs }` |
| `POST` | `/api/v2/sandboxes/:id/start` | `sandbox:create` | Starts an existing slot without allocation; `{ "sandbox": Sandbox }`, `201` |
| `POST` | `/api/v2/sandboxes/:id/execute` | `sandbox:execute` | `{ "result": ExecutionResult }` |
| `POST` | `/api/v2/sandboxes/:id/cooperative-connection` | `sandbox:execute` | Activates an operator-selected cooperative grant; `CooperativeEnvelope`, `201` |
| `POST` | `/api/v2/sandboxes/:id/cooperative-connection/:endpointId` | `sandbox:execute` | Returns the unchanged envelope for the same keys |
| `DELETE` | `/api/v2/sandboxes/:id/cooperative-connection/:endpointId` | `sandbox:execute` | Requests best-effort cleanup; `CooperativeRevoke`, `202` |
| `POST` | `/api/v2/sandboxes/:id/services` | `sandbox:execute` | Creates selected TCP access; `ServiceAccessEnvelope`, `201` |
| `POST` | `/api/v2/sandboxes/:id/services/lookup` | `sandbox:execute` | Recovers the original live envelope without renewal |
| `DELETE` | `/api/v2/sandboxes/:id/services/:generationId` | `sandbox:execute` | Revokes the exact generation; `ServiceAccessRevoke`, `200` |
| `POST` | `/api/v2/sandboxes/:id/operations` | `sandbox:execute` | Starts an observable command; `{ "operation": Operation }`, `202` |
| `GET` | `/api/v2/sandboxes/:id/operations/:operationId` | `sandbox:execute` | `{ "operation": Operation }` |
| `GET` | `/api/v2/sandboxes/:id/operations/:operationId/output` | `sandbox:execute` | `OperationOutputChunk` |
| `POST` | `/api/v2/sandboxes/:id/operations/:operationId/wait` | `sandbox:execute` | Waits up to 30 seconds; `{ "operation": Operation }` |
| `POST` | `/api/v2/sandboxes/:id/operations/:operationId/cancel` | `sandbox:execute` | Returns the winning terminal operation state |
| `GET` | `/api/v2/sandboxes/:id/files/stat?path=…` | `sandbox:read` | `{ "file": FileStat }` |
| `GET` | `/api/v2/sandboxes/:id/files/content?path=…&offset=…&maxBytes=…&cursor=…` | `sandbox:read` | One stable bounded binary range plus continuation headers |
| `PUT` | `/api/v2/sandboxes/:id/files/content?path=…` | `sandbox:execute` | Writes binary file content; `204` |
| `PATCH` | `/api/v2/sandboxes/:id/files/content?path=…` | `sandbox:execute` | Atomically edits UTF-8 text; `{ "sha256": string }` |
| `GET` | `/api/v2/sandboxes/:id/files/list?path=…&pageSize=…&cursor=…` | `sandbox:read` | `{ "entries": FileListEntry[], "nextCursor": string \| null }` |
| `POST` | `/api/v2/sandboxes/:id/files/directory?path=…` | `sandbox:execute` | Creates a directory; `204` |
| `POST` | `/api/v2/sandboxes/:id/files/rename?path=…` | `sandbox:execute` | Atomically renames a path; `204` |
| `DELETE` | `/api/v2/sandboxes/:id/files?path=…&recursive=false&force=false` | `sandbox:execute` | Removes a file or directory; `204` |
| `DELETE` | `/api/v2/sandboxes/:id` | `sandbox:delete` | `204` |
| `GET` | `/api/v2/usage?days=30` | `usage:read` | `{ "usage": Usage }` |

## Request bodies

Create a workspace. `name` is required, must contain a non-whitespace character, and is at most 80 characters:

```json
{
  "name": "Agent workspace"
}
```

`POST /api/v2/workspaces` requires an `Idempotency-Key` header containing 1–255 visible ASCII characters. The key is scoped to the authenticated account. Repeating the same canonical request within 24 hours returns the exact original `201` body; using the key for a different public mutation returns `409 IDEMPOTENCY_CONFLICT`. The account can own at most 10 workspaces; exceeding the limit returns `409 WORKSPACE_QUOTA_EXCEEDED`. There is no public workspace-delete route.

Create a Sandbox in an owned workspace. `name` is optional, non-empty when supplied, and at most 80 characters:

```json
{
  "workspaceId": "ws_REDACTED",
  "name": "Data import",
  "size": "small"
}
```

`POST /api/v2/sandboxes` requires the header when `vmSandbox` is explicitly `true`; an omitted
`vmSandbox` may create keyless, in which case the server generates the key. See [Manage Sandboxes](/docs/sandboxes/#retry-creation-safely) and
[VM Sandboxes (Beta)](/docs/vm-sandbox-beta/#2-create-once-recover-with-the-same-key-and-body) for retry guidance.

`vmSandbox` defaults to true: omitted or `true` creates a VM Sandbox (fixed image; no volumes,
libraries, or image override), and `false` creates a gVisor container Sandbox. `size` is VM-only and
defaults to `small`: `"small"` is 0.5 vCPU / 1,024 MiB and `"large"` is 1.5 vCPU / 3,072 MiB; both
keep the 10 GiB workspace. For gVisor Sandboxes `"small"` is ignored and `"large"` returns
`400 INVALID_ARGUMENT`. `blockNetwork` is optional for VM creation and defaults to false, which gives the VM
outbound Internet access limited to public IPv4 and DNS; set it to true for a VM with no network
interface. The network intent and size are fixed at creation, and changing them for the same idempotency key
returns `409 IDEMPOTENCY_CONFLICT`. A VM request returns `202` while durable provisioning is
pending; replaying the same key and body returns `201` once ready. The service does not silently fall
back to gVisor when a VM request is unavailable. The official SDKs (boxcompute 0.2.0, @boxcompute/sdk 0.2.0) and the CLI (bxc 0.4.0) expose the selector.

Starting an existing owned slot requires an empty JSON object. It accepts `Idempotency-Key`
optionally and does not accept a workspace, image, profile, library, or runtime selector:

```json
{}
```

Execute a command with structured arguments:

```json
{
  "argv": ["python3", "-c", "print('hello')"],
  "cwd": "/workspace",
  "env": { "MODE": "development" },
  "timeoutSeconds": 120,
  "maxOutputBytes": 262144
}
```

The operation-start route accepts the same body and requires `Idempotency-Key`. Operation wait accepts an optional `timeoutSeconds` from 0 through 30, defaulting to 30. See [Execute commands](/docs/execute/) for synchronous and observable execution examples, validation, output paging, and cancellation semantics.

All file paths must be `/workspace` or descendants without `.` or `..` segments. File reads and writes are binary-safe; send writes as `application/octet-stream`. Ranged reads accept `offset` from 0 through JavaScript's maximum safe integer and `maxBytes` from 1 byte through 8 MiB; defaults are 0 and 8 MiB. Continue with the returned next offset and opaque cursor until EOF. Directory pages accept `pageSize` from 1 through 1,000, defaulting to 1,000, and return an opaque `nextCursor`. Pass cursors unchanged; a file or directory membership change invalidates continuation with `409 CURSOR_STALE`.

Writes and complete files edited conditionally are limited to 8 MiB. Directory creation accepts `{ "recursive": false }`, defaulting to `false`. Removal accepts boolean `recursive` and `force` query parameters, both defaulting to `false`.

Conditional text edit takes `expectedSha256`, `oldText`, `newText`, and `replaceAll` (default `false`). Rename takes `destination` and `overwrite` (default `false`). See [Manage files](/docs/files/) for runnable examples, conflict behavior, and transport-failure retry guidance.

## Operator-selected cooperative connections

The cooperative routes are a default-off preview for operator-selected existing Sandboxes, not a
generally available SSH or PTY service. Activation requires an owned active selected runtime and an
exact JSON object containing `client_key`, `ssh_key`, and `recipient_key`. These are cryptographic
public keys with the precise formats in OpenAPI; extra fields are rejected. Activation returns:

```json
{
  "endpoint_id": "12345678-1234-4123-8123-123456789abc",
  "expires_at": 1788681630,
  "sealed": "BASE64_ENCRYPTED_CONNECTION_ENVELOPE"
}
```

The nonrenewable grant lasts at most 30 seconds. Reconnecting with the same endpoint and exact keys
returns the unchanged envelope; it does not mint another grant. Activation and reconnect are not
safe to retry after an indeterminate transport failure. Revoke is best effort and always returns
`202 { "endpoint_id": "…", "cleanup": "unconfirmed" }`; it is not proof of physical runtime stop.
These routes never provision a Sandbox. The current SDKs and CLI do not expose them.

## Operator-selected TCP service access

The service routes are a separate default-off preview for selected existing running Sandboxes. They
open only the requested TCP ports to one Tailcat client for a fixed five-minute grant. They do not
provision or restart a Sandbox, create a public listener, support UDP, or provide general ingress.
The current SDKs and CLI do not expose them.

Create a fresh UUIDv4 for the required `Idempotency-Key`. `requested_at` is the current Unix time in
seconds. It cannot be in the future or 300 seconds old, and the 1–8 ports must be unique and strictly
ascending:

```bash
export SERVICE_ACCESS_ID="$(python3 -c 'import uuid; print(uuid.uuid4())')"
export REQUESTED_AT="$(date +%s)"
curl -X POST "https://api.boxcompute.ai/api/v2/sandboxes/$SANDBOX_ID/services" \
  -H "Authorization: Bearer $BOXCOMPUTE_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $SERVICE_ACCESS_ID" \
  --data-binary @- <<JSON
{
  "requested_at": $REQUESTED_AT,
  "client_key": "$TAILCAT_CLIENT_KEY",
  "recipient_key": "$RECIPIENT_KEY_BASE64",
  "ports": [3000, 8080]
}
JSON
```

The response is a capability sealed to `recipient_key`; it contains no plaintext connection state:

```json
{
  "generation_id": "12345678-1234-4123-8123-123456789abc",
  "expires_at": 1788681900,
  "sealed": "BASE64_ENCRYPTED_CONNECTION_ENVELOPE"
}
```

Expiry is exactly `requested_at + 300`; lookup does not extend it. The create mutation is not safe
to retry after an indeterminate transport failure. Instead, send the exact same body and
`Idempotency-Key` to `POST /api/v2/sandboxes/:id/services/lookup` to recover the original envelope
while it is live. Revoke the returned `generation_id` with the DELETE route. A successful revoke is
`200 { "generation_id": "…", "cleanup": "guardian-confirmed" }`; uncertain cleanup fails rather
than returning success. That confirmation is authenticated cooperative cleanup, not independent
proof that a process or machine physically stopped.

Unavailable or uncertain access returns `503 SANDBOX_UNAVAILABLE`. Resources owned by another
account are indistinguishable from absent resources and return `404`. These routes work only when
BoxCompute has selected and configured the exact runtime; account scope alone does not make the
preview available.

## Response objects

`Workspace`:

```json
{
  "id": "ws_REDACTED",
  "name": "My workspace",
  "createdAt": 1788681600000
}
```

`Sandbox`:

```json
{
  "id": "sbx_REDACTED",
  "workspaceId": "ws_REDACTED",
  "name": "Data import",
  "state": "running",
  "vmSandbox": true,
  "blockNetwork": false,
  "size": "small",
  "createdAt": 1788681600000,
  "lastUsedAt": 1788681600000
}
```

`state` is `cold`, `pending`, `running`, or `expired`; `vmSandbox` is always present; VM responses
also include `blockNetwork` for the recorded network intent and `size` (`small` or `large`) for the
recorded compute profile; and
`lastUsedAt` can be `null`. Ordinary Sandboxes use `cold` and `running`; VM provisioning adds
`pending`, and `expired` means the VM runtime is no longer available. The `sbx_…` Sandbox
`id` is the only public runtime identifier. Provider runtime, image, Pod, and
process identifiers are not part of the customer contract.

`ExecutionResult`:

```json
{
  "stdout": "hello\n",
  "stderr": "",
  "exitCode": 0,
  "timedOut": false,
  "stdoutTruncated": false,
  "stderrTruncated": false
}
```

`Operation` contains an opaque `operationId`; a state of `accepted`, `running`, `completed`, `failed`, `timedOut`, or `cancelled`; nullable `exitCode`, `signal`, `startedAt`, `finishedAt`, and `expiresAt`; `acceptedAt`; and absolute `stdoutOffset` and `stderrOffset` byte counts. `completed`, `failed`, `timedOut`, and `cancelled` are terminal.

`OperationOutputChunk` contains `stream`, base64-encoded `dataBase64`, absolute `offset`, `nextOffset`, `earliestOffset`, and `truncated` fields.

File range responses return binary content with `Accept-Ranges: bytes`, `X-BoxCompute-Offset`, `X-BoxCompute-Next-Offset`, `X-BoxCompute-File-Size`, and `X-BoxCompute-EOF` headers. A non-final range also supplies `X-BoxCompute-Next-Cursor`.

`FileStat` contains `path`, target `kind` (`file`, `dir`, or `other`), `isSymbolicLink`, `size`, and `mtimeMs`. For a symlink, target fields follow the link while `isSymbolicLink` describes the path itself. A `FileListEntry` contains `name`, `path`, entry `kind` (`file`, `dir`, `symlink`, or `other`), `size`, and `mtimeMs`. `FileList` contains up to 1,000 `entries` and nullable `nextCursor`. A successful conditional edit returns `{ "sha256": string }` for the complete updated file.

`Usage` contains `since`, `operations`, `executions`, `executionTimeMs`, `outputBytes`, `failedOperations`, `agentRuns`, `toolCalls`, `activeSandboxes`, `sandboxSlots`, and up to 20 recent operation records. Each recent record contains `id`, `workspaceId`, nullable `sandboxId`, `action`, `durationMs`, `outputBytes`, `success`, and `createdAt`. Timestamps are Unix milliseconds.

`GET /api/v2/sandboxes/:id/analytics` returns bounded lifecycle, operation, and resource aggregates
for one owned Sandbox, scoped to `sandbox:read`. Query parameters are optional `from` and `to`
(ISO 8601 instants with an offset), `resolutionSeconds` (whole seconds 60–86,400, default 300), and
`generation` (a specific runtime generation). Retention is 30 days, and requests are rate-limited to
30 per minute per account (`429 RATE_LIMITED` when exceeded):

```bash
curl --get 'https://api.boxcompute.ai/api/v2/sandboxes/sbx_REDACTED/analytics' \
  -H 'Authorization: Bearer bc_live_REDACTED' \
  --data-urlencode 'resolutionSeconds=300'
```

HTTP 200 returns `{ "analytics": SandboxAnalytics }`. The object contains `sandboxId`, `from`, `to`,
`resolutionSeconds`, `retentionSeconds`, `generationsTruncated`, `operationsTruncated`, a nullable
`selectedGeneration`, up to 32 `generations` (each with `generation`, `runtimeClass` `container` or
`vm`, start/ready/stop/finalize timestamps, and `startupDurationMs`/`runtimeDurationMs`), up to
1,001 `operations` time buckets (each with `bucketStart`, nullable `generation`, `operations`,
`executions`, `durationMs`, `executionDurationMs`, `outputBytes`, and `failures`), and a `resources`
object. `resources.status` is `available`, `partial`, `unavailable`, or `not_configured`;
`resources.coverage` is `available`, `partial`, or `expired`; and `resources.series` holds up to nine
per-generation series (`cpu_usage_cores`, `memory_working_set_bytes`,
`network_receive_bytes_per_second`, `network_transmit_bytes_per_second`,
`filesystem_read_bytes_per_second`, `filesystem_write_bytes_per_second`,
`filesystem_usage_bytes`, `restarts_total`, `oom_kills_total`) with a unit, an availability of
`available` or `no_data`, and timestamped `points`. Missing resource telemetry is reported as absent
series, not as numeric zeros, and the response never exposes provider or Kubernetes identifiers.

See [Read Sandbox logs](/docs/logs/) for log filters, response entries, retention semantics, and CLI usage.

## Legacy v1

`/api/v1` is a legacy one-Sandbox-per-workspace compatibility surface. New integrations should use v2, where a workspace can own multiple Sandbox instances.
