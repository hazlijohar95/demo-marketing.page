---
title: "Limits, errors, and unsupported features"
description: "Public API input limits and HTTP failure behavior."
---

# Limits, errors, and unsupported features

These limits are enforced by the public v2 API:

| Input | Limit or default |
| --- | --- |
| JSON request body | 128 KiB maximum |
| Workspaces per account | 10 |
| Workspace name | 1–80 characters and must contain a non-whitespace character |
| Sandbox name | 1–80 characters when supplied |
| Sandbox size | VM-only string `small` or `large`; defaults to `small`. `small` is ignored for gVisor Sandboxes; `large` on gVisor returns `400 INVALID_ARGUMENT` |
| `Idempotency-Key` | 1–255 visible ASCII characters for ordinary mutations; required to create a workspace, create a VM Sandbox, or start an operation; optional to create an ordinary Sandbox or start an existing Sandbox; successful responses replay for 24 hours. Selected TCP service create/lookup instead require the same lowercase UUIDv4 operation key |
| VM Sandbox beta | The default runtime: omitted `vmSandbox` (or `true`) creates a VM, `false` a gVisor Sandbox. `size` selects `small` (default, 0.5 vCPU / 1,024 MiB) or `large` (1.5 vCPU / 3,072 MiB); both keep a 10 GiB workspace, no automatic lifetime expiry, and no libraries or shared volumes. `blockNetwork` defaults to false (outbound public IPv4 and DNS); `true` creates no network interface |
| `argv` | 1–64 non-empty strings |
| Each `argv` entry | 8,192 characters maximum |
| `cwd` | `/workspace` or a path below it; defaults to `/workspace` |
| Environment | 64 variables maximum; string values and valid variable names |
| Execution timeout | 1–900 whole seconds; defaults to 120 |
| Synchronous or retained operation output | `maxOutputBytes` is 1–1,048,576 bytes per stream; defaults to 262,144 |
| Operation wait | 0–30 whole seconds; defaults to 30 |
| Operation output page | 1–262,144 decoded bytes; defaults to 65,536 |
| Terminal operation retention | 24 hours, including up to `maxOutputBytes` from each stream |
| File path | `/workspace` or a path below it, without `.` or `..` segments; 4,096 characters maximum |
| Log query entries | 1–5,000; defaults to 1,000 |
| File range read | 8 MiB maximum per response; `offset` defaults to 0 and `maxBytes` defaults to 8 MiB |
| File write or conditional edit | 8 MiB maximum complete file |
| Conditional file edit | Complete file must be UTF-8; `oldText` is 1–65,536 characters and `newText` is 0–65,536 characters |
| Directory listing page | 1–1,000 immediate entries; `pageSize` defaults to 1,000 |
| File continuation cursor | Opaque, path-bound, and 4,096 characters maximum |
| Cooperative connection grant | Operator-selected preview only; one nonrenewable grant lasting at most 30 seconds |
| Cooperative connection keys | Exact `client_key`, `ssh_key`, and `recipient_key` formats from OpenAPI; no extra fields |
| Cooperative sealed envelope | Base64, 80–16,000 characters |
| Selected TCP service grant | Operator-selected preview only; exactly five minutes from `requested_at`, without renewal |
| Selected TCP service ports | 1–8 unique TCP ports from 1–65,535 in strictly ascending order; no UDP or public listener |
| Selected TCP service request | Current Unix-second `requested_at`, one nonzero Tailcat `client_key`, one canonical base64 32-byte `recipient_key`, and no extra fields |
| Selected TCP sealed envelope | Base64, 80–16,000 characters; create is not mutation-retryable, and exact lookup recovers only the original live envelope |
| Usage window | `days` is bounded to 1–90; defaults to 30 |
| Sandbox analytics resolution | 60–86,400 whole seconds; defaults to 300 |
| Sandbox analytics rate limit | 30 requests per minute per account |
| Sandbox analytics retention | 30 days |

Errors include a stable machine-readable `code` and a human-readable `error`
string:

```json
{ "code": "NOT_FOUND", "error": "Sandbox not found" }
```

Existing integrations may continue reading `error`; branch on `code`. Clients
must tolerate new codes added for compatible v2 routes.

| Status | Meaning |
| --- | --- |
| `400` | `INVALID_REQUEST` for invalid input, `INVALID_PATH` for an unsafe file path, `INVALID_RANGE` for an invalid file offset, `INVALID_CURSOR` for invalid continuation, `BINARY_FILE` for a non-UTF-8 edit, or `INVALID_IDEMPOTENCY_KEY` for a missing or malformed required key |
| `401` | Missing, malformed, unknown, or revoked bearer key |
| `402` | `INSUFFICIENT_CREDIT` because BoxCompute credit is exhausted |
| `403` | `INSUFFICIENT_SCOPE` because the key does not include the route's required scope, or `BILLING_ACCOUNT_FROZEN` because the billing account is frozen |
| `404` | The Sandbox, owned workspace, or requested file was not found |
| `408` | Execution timed out at the Sandbox service |
| `409` | `IDEMPOTENCY_CONFLICT` for conflicting key reuse, `WORKSPACE_QUOTA_EXCEEDED` at 10 workspaces, `DESTINATION_EXISTS` for a rename collision, `EDIT_CONFLICT` when edit text is missing or ambiguous, or `CURSOR_STALE` when a continued file or directory changed |
| `412` | `PRECONDITION_FAILED` because a file changed after the caller read it |
| `413` | A JSON body or bounded file transfer exceeds its route limit |
| `415` | A JSON mutation or binary file upload has the wrong media type |
| `429` | `RATE_LIMITED` because the per-account Sandbox analytics request limit was exceeded |
| `502` | The Sandbox service is currently unavailable |
| `503` | The Sandbox runtime is currently unavailable |

A command that exits non-zero still returns a successful HTTP response. Check `result.exitCode` and `result.timedOut`. Also check `stdoutTruncated` and `stderrTruncated` before assuming output is complete.

The official SDKs raise `BoxComputeError` for API responses and expose its status, stable code,
message, request ID when available, and retryable flag. Network failures raise
`BoxComputeTransportError`. A transport error does not prove whether a mutation reached the service;
use idempotency keys for supported create and operation-start retries.

The public v2 routes do not expose customer APIs for workspace deletion, SDK-specific lifecycle handles, streaming command output, streaming file I/O, a generally available interactive shell or PTY, shared volumes, checkpoints, or forks. A default-off cooperative connection preview exists only for operator-selected Sandboxes and is not general SSH availability. A separate default-off selected-TCP preview opens 1–8 requested ports to one client for five minutes; it is not UDP, a public listener, general ingress, or exposed by current SDKs and the CLI. Observable operations provide polling, retained output, and explicit cancellation for one structured command; they are not a general-purpose process or PTY API.
