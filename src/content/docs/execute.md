---
title: "Execute commands"
description: "Run a bounded command synchronously or as an independently observable operation."
---

# Execute commands

Execute a command in an owned Sandbox by sending a structured `argv` array through an official SDK:

## Run a command

### TypeScript

```ts
const result = await boxcompute.sandboxes.execute("sbx_REDACTED", {
  argv: ["python3", "-c", "print(sum(range(100000)))"],
  cwd: "/workspace/jobs",
  env: { MODE: "development" },
  timeoutSeconds: 120,
  maxOutputBytes: 262_144,
});
```
### Python

```python
result = boxcompute.sandboxes.execute(
    "sbx_REDACTED",
    argv=["python3", "-c", "print(sum(range(100000)))"],
    cwd="/workspace/jobs",
    env={"MODE": "development"},
    timeout_seconds=120,
    max_output_bytes=262_144,
)
```

For a direct HTTP client, the equivalent request is:

```bash
curl -X POST 'https://api.boxcompute.ai/api/v2/sandboxes/sbx_REDACTED/execute' \
  -H 'Authorization: Bearer bc_live_REDACTED' \
  -H 'Content-Type: application/json' \
  -d '{
"argv":["python3","-c","print(sum(range(100000)))"],
"cwd":"/workspace/jobs",
"env":{"MODE":"development"},
"timeoutSeconds":120,
"maxOutputBytes":262144
  }'
```

## Input

- `argv` is required and contains 1–64 non-empty strings. Each string can be at most 8,192 characters.
- `cwd` defaults to `/workspace` and must be `/workspace` or a path below it.
- `env` is optional and can contain at most 64 variables. Names must be valid environment-variable names and values must be strings.
- `timeoutSeconds` defaults to `120` and must be a whole number from 1 through 900.
- `maxOutputBytes` defaults to `262144` and must be from 1 through 1,048,576.

`argv` is structured data, not shell source. Pass user-controlled values as separate entries instead of interpolating them into a shell command.

## Result

The response wraps the result:

```json
{
  "result": {
    "stdout": "4999950000\n",
    "stderr": "",
    "exitCode": 0,
    "timedOut": false,
    "stdoutTruncated": false,
    "stderrTruncated": false
  }
}
```

A non-zero exit code is still a successful HTTP response. Treat the command as successful only according to `exitCode` and `timedOut`. If either truncation field is `true`, the corresponding captured stream is incomplete.

## Run an observable operation

Use an operation when a command must remain observable after the starting HTTP connection closes. The request body and execution limits are the same as synchronous execute, but `Idempotency-Key` is required:

### TypeScript

```ts
let operation = await boxcompute.operations.start("sbx_REDACTED", {
  argv: ["python3", "-c", "print(sum(range(100000)))"],
  cwd: "/workspace",
  timeoutSeconds: 120,
  maxOutputBytes: 262_144,
  idempotencyKey: crypto.randomUUID(),
});
while (operation.state === "accepted" || operation.state === "running") {
  operation = await boxcompute.operations.wait("sbx_REDACTED", operation.operationId, {
    timeoutSeconds: 30,
  });
}
const stdout = await boxcompute.operations.output("sbx_REDACTED", operation.operationId, {
  stream: "stdout",
  offset: 0,
});
```
### Python

```python
import uuid

operation = boxcompute.operations.start(
    "sbx_REDACTED",
    argv=["python3", "-c", "print(sum(range(100000)))"],
    idempotency_key=str(uuid.uuid4()),
)
while operation.state.value in {"accepted", "running"}:
    operation = boxcompute.operations.wait(
        "sbx_REDACTED",
        operation.operation_id,
        timeout_seconds=30,
    )
stdout = boxcompute.operations.output(
    "sbx_REDACTED",
    operation.operation_id,
    stream="stdout",
    offset=0,
)
```

The SDK exposes `inspect`, `output`, `wait`, and `cancel` on its `operations` resource. With direct
HTTP, start the same operation as follows:

```bash
curl -X POST 'https://api.boxcompute.ai/api/v2/sandboxes/sbx_REDACTED/operations' \
  -H 'Authorization: Bearer bc_live_REDACTED' \
  -H 'Idempotency-Key: operation-019f1234-5678-7000-8000-000000000000' \
  -H 'Content-Type: application/json' \
  -d '{"argv":["python3","-c","print(sum(range(100000)))"],"cwd":"/workspace"}'
```

The `202` response contains `{ "operation": ... }`. Save its opaque `operationId`. If the response is interrupted, retry the identical request with the same account-scoped key within 24 hours to recover the original response and operation ID.

```json
{
  "operation": {
    "operationId": "op_0123456789abcdef0123456789abcdef",
    "state": "accepted",
    "exitCode": null,
    "signal": null,
    "acceptedAt": "2026-09-06T07:00:00Z",
    "startedAt": null,
    "finishedAt": null,
    "stdoutOffset": 0,
    "stderrOffset": 0,
    "expiresAt": null
  }
}
```

Inspect the operation or wait up to 30 seconds for progress:

```bash
curl 'https://api.boxcompute.ai/api/v2/sandboxes/sbx_REDACTED/operations/op_REDACTED' \
  -H 'Authorization: Bearer bc_live_REDACTED'

curl -X POST 'https://api.boxcompute.ai/api/v2/sandboxes/sbx_REDACTED/operations/op_REDACTED/wait' \
  -H 'Authorization: Bearer bc_live_REDACTED' \
  -H 'Content-Type: application/json' \
  -d '{"timeoutSeconds":30}'
```

A wait timeout returns the current operation with `200`; it is not an execution timeout and does not cancel the command. States are `accepted`, `running`, `completed`, `failed`, `timedOut`, and `cancelled`. The last four are immutable terminal states. A non-zero command exit is `completed` with a non-zero `exitCode`.

Read stdout or stderr using absolute byte offsets:

```bash
curl 'https://api.boxcompute.ai/api/v2/sandboxes/sbx_REDACTED/operations/op_REDACTED/output?stream=stdout&offset=0&limit=65536' \
  -H 'Authorization: Bearer bc_live_REDACTED'
```

The response contains base64-encoded bytes in `dataBase64` plus `offset`, `nextOffset`, `earliestOffset`, and `truncated`. Continue from `nextOffset`. `limit` defaults to 65,536 decoded bytes and can be at most 262,144. When `truncated` is true, bytes before `earliestOffset` are no longer retained.

```json
{
  "stream": "stdout",
  "dataBase64": "NDk5OTk1MDAwMAo=",
  "offset": 0,
  "nextOffset": 11,
  "earliestOffset": 0,
  "truncated": false
}
```

To request remote cancellation, call the cancel route explicitly:

```bash
curl -X POST 'https://api.boxcompute.ai/api/v2/sandboxes/sbx_REDACTED/operations/op_REDACTED/cancel' \
  -H 'Authorization: Bearer bc_live_REDACTED'
```

Cancellation is confirmed only when the returned state is `cancelled`. If completion wins the race, the route returns that completed terminal result. Closing or aborting any client request never requests remote cancellation.

Terminal metadata and up to `maxOutputBytes` retained bytes from each output stream remain available until `expiresAt`, 24 hours after completion. Operation IDs are scoped to their owning account and Sandbox; expired, unknown, mismatched, and cross-account IDs all return `404 NOT_FOUND`.
