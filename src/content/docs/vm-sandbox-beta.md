---
title: "VM Sandboxes (Beta)"
description: "Create and manage VM sandboxes with the public API, including command execution, file transfer, network selection, and cleanup."
---

# VM Sandboxes (Beta)

Create a VM, upload test data, run a command, download the results, and delete
the VM using the BoxCompute API. This guide is for developers who need a full
virtual machine rather than a shared-kernel Sandbox for command-line tools and
agent tool execution.

VM Sandboxes are available to all authenticated accounts. This beta is not
intended for production workloads or always-on services.

The walkthrough uses a small text fixture and requires no additional software
inside the VM.

Last updated: September 17, 2026.

## Check whether your experiment fits

| Capability | Current VM beta profile |
| --- | --- |
| Availability | Available to all authenticated accounts. |
| Selection | `vmSandbox` is the default: omitted or `true` creates a VM; `false` creates a gVisor container Sandbox. An explicit `vmSandbox: true` requires an `Idempotency-Key` header; an omitted `vmSandbox` may create keyless, in which case the server generates the key. Historical idempotency replays keep their original runtime. |
| Networking | Outbound Internet access by default, limited to public IPv4 and DNS. Set `blockNetwork: true` to create a VM with no network interface. The choice is fixed at creation and cannot be changed later. |
| Resources | `size` selects `small` (default, 0.5 vCPU / 1,024 MiB RAM) or `large` (1.5 vCPU / 3,072 MiB RAM). Both keep a 10 GiB workspace. |
| Lifetime | No automatic expiry. The VM keeps running until you delete it. |
| Image | Immutable, server-selected approved minimal Ubuntu image. No arbitrary image override, library profile, or attached volumes. |
| User/runtime | Runs as root (UID 0) with `HOME=/workspace`. No SSH login. The minimal image has no compiler preinstalled, but root can install system packages with `apt-get`. Node.js, uv and other tool dependencies are not guaranteed. |
| Serving | No supported public inbound port, SSH endpoint, application tunnel, or webhook URL. Binding a guest port does not publish it. |
| Storage | `/` and `/workspace` share one root filesystem that is deleted with the VM. Download needed data before you delete it. An account workspace groups sandboxes; it does not preserve their files. |
| Lifecycle | Create, status, execute, files, delete. Do not depend on sleep/resume, snapshots, checkpoints, forks, or restore for this VM profile. |

Start with a small payload and one command at a time. A full toolchain, browser,
model or concurrent agent workload may exceed the available resources.

## Before you start

You need an active API key and Bash, curl, jq and Python 3
on your development machine. Run the examples in the same shell, in a new
directory for your test files. Python is used only to generate unique request
keys; it is not required inside the VM for this walkthrough.

Use **`https://api.boxcompute.ai/api/v2`** as the API base URL. See the
[OpenAPI reference](https://api.boxcompute.ai/api/v2/openapi.json) for request
and response schemas.

Create an [API key](/docs/api-keys/) and send it as `Authorization: Bearer <API_KEY>`.
Keep the key on your development machine or integration controller, not in
the VM, test fixture, source repository, or logs. Disable shell tracing and
load the key securely into `BOXCOMPUTE_API_KEY` before running the examples.
No model-provider credential is needed for these offline experiments.

Required scopes: `sandbox:read` for workspace listing, sandbox status and file
reads; `sandbox:create` for creation; `sandbox:execute` for execution and file
uploads; `sandbox:delete` for cleanup. Workspace bootstrap additionally needs
`workspace:create`. Billing/credit checks still apply.

## Run your first integration test

### 1. Select an owned workspace

```bash
BASE='https://api.boxcompute.ai/api/v2'
: "${BOXCOMPUTE_API_KEY:?Load your API key securely first}"
curl --fail-with-body -sS "$BASE/workspaces" \
  -H "Authorization: Bearer $BOXCOMPUTE_API_KEY"
```

HTTP 200 returns `{"workspaces":[...]}`. Deliberately select an owned workspace;
do not silently use the first result. Set `WORKSPACE_ID` to its returned `id`.
The workspace must belong to your account. You do not need a separate tenant
ID or tenant header.

If you need a new workspace, run the following optional request. HTTP 201
returns `{"workspace":{...}}`; use its `id` in the next step. Skip this request
when using an existing workspace. You can create up to 10 workspaces per account.

```bash
WORKSPACE_KEY="workspace-$(python3 -c 'import uuid; print(uuid.uuid4())')"
curl --fail-with-body -sS -i "$BASE/workspaces" \
  -H "Authorization: Bearer $BOXCOMPUTE_API_KEY" \
  -H 'Content-Type: application/json' \
  -H "Idempotency-Key: $WORKSPACE_KEY" \
  --data '{"name":"Integration tests"}'
```

### 2. Create once; recover with the same key and body

Running this step allocates a VM. Keep the request body,
key and returned sandbox ID for recovery; do not generate a new key on retry.

```bash
WORKSPACE_ID='REPLACE_WITH_RETURNED_WORKSPACE_ID'
CREATE_KEY="vm-$(python3 -c 'import uuid; print(uuid.uuid4())')" # Generate ONCE
jq -n --arg workspaceId "$WORKSPACE_ID" \
  '{workspaceId:$workspaceId,vmSandbox:true,blockNetwork:false,size:"small"}' > vm-create.json

create_vm() {
  curl --fail-with-body -sS --connect-timeout 10 --max-time 30 \
-o vm-create-response.json -w '%{http_code}\n' "$BASE/sandboxes" \
-H "Authorization: Bearer $BOXCOMPUTE_API_KEY" \
-H 'Content-Type: application/json' \
-H "Idempotency-Key: $CREATE_KEY" \
--data-binary @vm-create.json
}
create_vm && jq . vm-create-response.json
```

The initial response is **202**, with a `sandbox` object normally in `pending`.
After a successful response, record `sandbox.id`. On a transport timeout, the
outcome is unknown: retry `create_vm` with the unchanged key/body. While work
is pending, replays return 202. Once provisioning converges, the same request
returns **201 with the same public sandbox ID**. Repeat at a modest interval
(for example 10 seconds), with a bounded overall wait; do not loop forever or
allocate a replacement on every error. A 202 is durable acceptance, **not**
proof of eligibility or readiness. Provisioning failures can leave it pending.
If it is still pending after five minutes, stop waiting, save the ID and error
response for support, and use step 5 to delete it. Five minutes is a suggested
client wait limit, not a provisioning-time guarantee. Do not change the key
to try to resolve a stuck request.

`workspaceId`, optional `name` (1–80 trimmed characters), `vmSandbox`, optional
`size`, and `blockNetwork` configure public creation:

```json
{
  "workspaceId": "ws_REDACTED",
  "name": "Integration tests",
  "vmSandbox": true,
  "size": "small",
  "blockNetwork": false
}
```

`size` is VM-only and defaults to `"small"` (0.5 vCPU / 1,024 MiB RAM);
`"large"` selects 1.5 vCPU / 3,072 MiB RAM. Both keep the 10 GiB workspace, and
the choice is fixed when the VM is created: replaying the same key with the same
body returns the recorded VM, and changing `size` for that key returns
`409 IDEMPOTENCY_CONFLICT`.

`blockNetwork` is optional and defaults to `false`, which gives the VM outbound
Internet access limited to public IPv4 and DNS. Set it to `true` for a VM with
no network interface. The choice is fixed when the VM is created: replaying the
same key with the same body returns the recorded VM, and changing
`blockNetwork` for that key returns `409 IDEMPOTENCY_CONFLICT`. A creation key
recorded before network selection existed keeps its original blocked intent
when replayed.

Do not send `image`, `backend`, `cpu`, `memoryMiB`, `workspaceMiB`,
`timeoutSeconds`, `libraries`, or `volumes`. Use `size` to select the VM compute
profile; the others are not public controls, and unknown fields are discarded.

VM creation requires `Idempotency-Key`: 1–255 visible ASCII characters, no
spaces. Keys are account-wide across mutations. Changed normalized input or
reuse for a different mutation gives `409 IDEMPOTENCY_CONFLICT`. Completed
receipts are retained for 24 hours after completion. A replay is a saved
creation receipt, not current status; even a deleted VM's receipt can replay.

### 3. Inspect status, then execute bounded work

```bash
SANDBOX_ID='REPLACE_WITH_RETURNED_SANDBOX_ID'
curl --fail-with-body -sS "$BASE/sandboxes/$SANDBOX_ID" \
  -H "Authorization: Bearer $BOXCOMPUTE_API_KEY"
```

HTTP 200 returns `{"sandbox":{...}}` with `id`, `workspaceId`, `name`, `state`,
`vmSandbox`, `createdAt` and nullable `lastUsedAt`. VM responses also include
`blockNetwork` for the recorded network intent. Timestamps are Unix
milliseconds. States are `cold`, `pending`, `running`, `expired`; require
`vmSandbox:true` and `running` before your test. Status can lag changes in VM
availability, so handle errors from execute and file requests even after a
`running` response. The response does not include an expiry timestamp, because
the VM has no automatic lifetime.

```bash
curl --fail-with-body -sS "$BASE/sandboxes/$SANDBOX_ID/execute" \
  -H "Authorization: Bearer $BOXCOMPUTE_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"argv":["/bin/echo","beta integration"],"cwd":"/workspace","timeoutSeconds":10,"maxOutputBytes":4096}'
```

HTTP 200 wraps `result` containing `stdout`, `stderr`, `exitCode`, `timedOut`,
`stdoutTruncated` and `stderrTruncated`. For this echo, expect
`stdout:"beta integration\n"`, empty stderr, exit code 0, and all flags false.
Check the result, not only HTTP success: nonzero exit codes also return 200.
Use structured `argv`, not a `command` field. Shell syntax requires an explicit
shell, and interpolating untrusted inputs into shell text is unsafe.

`cwd` defaults to `/workspace` and must stay there or below it. Optional `env`
is a string map (up to 64 valid environment variable names). `argv` has 1–64
nonempty entries, each at most 8,192 characters. Execution timeout accepts
1–900 seconds (default 120).
Output is bounded to 1–1,048,576 bytes (default 262,144). Start with short
timeouts, small output and one task at a time. Execute is not idempotent:
retrying after a lost response can run the work again.

### 4. Stage fixtures and retrieve exact bytes

Uploads are raw bytes, not JSON, base64 or multipart. The per-upload limit is
8 MiB. File paths must be absolute under `/workspace`, at most 4,096 characters,
without `.`/`..` components or NUL. Create parent directories with execute if
needed. This tiny fixture stays in the existing workspace directory.

```bash
printf '0123456789abcdefghijklmnopqrstuvwxyz\n' > fixture.txt
curl --fail-with-body -sS -i -X PUT \
  "$BASE/sandboxes/$SANDBOX_ID/files/content?path=%2Fworkspace%2Ffixture.txt" \
  -H "Authorization: Bearer $BOXCOMPUTE_API_KEY" \
  -H 'Content-Type: application/octet-stream' \
  --data-binary @fixture.txt
# Expect 204 with no body.

curl --fail-with-body -sS -D full.headers -G \
  "$BASE/sandboxes/$SANDBOX_ID/files/content" \
  -H "Authorization: Bearer $BOXCOMPUTE_API_KEY" \
  --data-urlencode 'path=/workspace/fixture.txt' -o full.txt
cmp fixture.txt full.txt

curl --fail-with-body -sS -D range.headers -G \
  "$BASE/sandboxes/$SANDBOX_ID/files/content" \
  -H "Authorization: Bearer $BOXCOMPUTE_API_KEY" \
  --data-urlencode 'path=/workspace/fixture.txt' \
  --data-urlencode 'offset=7' --data-urlencode 'maxBytes=11' -o range.txt
printf '789abcdefgh' > expected-range.txt
cmp expected-range.txt range.txt
```

Both reads return **200**, including partial reads, not 206. Use query
`offset` (default 0) and `maxBytes` (1–8,388,608; default 8,388,608), **not** an
HTTP `Range` header. Inspect `X-BoxCompute-Offset`, `X-BoxCompute-Next-Offset`,
`X-BoxCompute-File-Size`, and `X-BoxCompute-EOF`. A default read is only a full
download if EOF is true. For larger files, repeat using the returned next
offset and `X-BoxCompute-Next-Cursor` as the `cursor` query parameter, appending
chunks until EOF. A file changed between pages can return `409 CURSOR_STALE`;
restart the download rather than mixing versions. Stop the writer before
exporting a database; byte-range transport alone does not make a live database
backup consistent.

### 5. Download results; delete explicitly

The VM has no automatic expiry, so it keeps running and consuming resources
until you delete it. Download your results as soon as the test finishes. If the
VM runtime is no longer available, an execute or file request returns
`503 SANDBOX_UNAVAILABLE` and the sandbox state becomes `expired`. Using that
sandbox ID again does not automatically create a replacement VM. A 503 alone is
not proof that the VM is gone: transport failures also use that code.

```bash
curl --fail-with-body -sS -i -X DELETE "$BASE/sandboxes/$SANDBOX_ID" \
  -H "Authorization: Bearer $BOXCOMPUTE_API_KEY"
# Expect 204 with no body; a subsequent status GET returns 404.
```

Delete the VM when you are finished, or to cancel a pending creation. Deletion
removes this sandbox and its associated storage, not the parent workspace or
sibling sandboxes. A repeated DELETE after removal returns 404. Treat workspace
contents as disposable: files are not exported for you when the VM is deleted.

## Troubleshooting

Errors have shape `{"code":"...","error":"..."}`. Useful distinctions:
401 invalid/missing key; 403 `INSUFFICIENT_SCOPE` or frozen billing account;
402 `INSUFFICIENT_CREDIT`; 404 `NOT_FOUND` for missing/foreign resources or
`FILE_NOT_FOUND` for missing files; 408 `EXECUTION_TIMEOUT`; 413
`PAYLOAD_TOO_LARGE`; 415 `UNSUPPORTED_MEDIA_TYPE`; 502 `SERVICE_UNAVAILABLE`;
503 `SANDBOX_UNAVAILABLE`.

- For 401/403, check your key's status and scopes.
- For 402, check your account credit before retrying.
- For 409 `IDEMPOTENCY_CONFLICT`, check whether you changed the request body or
  reused a key for another operation. Recover the original request first.
- For 503, inspect sandbox status. If it is expired, delete it; do not retry
  execution expecting a fresh VM.
- For repeated 5xx errors or a stuck creation, contact BoxCompute with the
  sandbox ID, time of the request, HTTP status and error code. Never include
  your API key or sensitive file contents in a support report.

## Integrations

See [Hermes Agent with VM Sandboxes](/docs/integrations/hermes/) for an integration
assessment, bounded tool experiments, and the current blockers to hosting Hermes.
