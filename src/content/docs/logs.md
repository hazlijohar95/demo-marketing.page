---
title: "Read Sandbox logs"
description: "Query current or retained workload and command output without starting compute."
---

# Read Sandbox logs

Read logs for an owned Sandbox with the `sandbox:read` scope:

### TypeScript

```ts
const logs = await boxcompute.sandboxes.logs("sbx_REDACTED", {
  since: "2026-09-06T00:00:00Z",
  stream: "stderr",
  source: "process",
  limit: 100,
});
```
### Python

```python
logs = boxcompute.sandboxes.logs(
    "sbx_REDACTED",
    since="2026-09-06T00:00:00Z",
    stream="stderr",
    source="process",
    limit=100,
)
```

The equivalent direct HTTP request is:

```bash
curl --get 'https://api.boxcompute.ai/api/v2/sandboxes/sbx_REDACTED/logs' \
  -H 'Authorization: Bearer bc_live_REDACTED' \
  --data-urlencode 'since=2026-09-06T00:00:00Z' \
  --data-urlencode 'stream=stderr' \
  --data-urlencode 'source=process' \
  --data-urlencode 'limit=100'
```

Log reads do not start stopped compute. Output remains queryable after compute becomes idle and stops, for as long as the provider retains it. Explicitly deleting the Sandbox removes the customer-facing instance and its log access.

## Filters

| Query | Behavior |
| --- | --- |
| `since` | Inclusive RFC 3339 timestamp; defaults to Sandbox creation |
| `until` | Exclusive RFC 3339 timestamp; defaults to now and must be later than `since` |
| `stream` | `stdout` or `stderr` |
| `source` | `workload`, `execute`, or `process` |
| `limit` | 1–5,000 entries; defaults to 1,000 |

Results are ordered by timestamp. `workload` is Sandbox workload output, `execute` is synchronous command output, and `process` includes observable-operation output. Interactive shell transcripts are not included.

The response contains the customer-facing Sandbox ID, entries, a `truncated` flag, and `retention_seconds`:

```json
{
  "logs": {
    "sandboxId": "sbx_REDACTED",
    "entries": [
      {
        "timestamp": "2026-09-06T01:02:03.000Z",
        "stream": "stderr",
        "source": "process",
        "message": "database ready"
      }
    ],
    "truncated": false,
    "retention_seconds": 2592000
  }
}
```

If `truncated` is `true`, the result is incomplete. `retention_seconds` reports the configured
retention window—nominally 30 days today—but storage pressure can shorten availability, so retained
logs are not an archive.

## Host CLI

The host-side BoxCompute CLI exposes the same query:

```bash
bxc sandbox logs SANDBOX_ID --source execute
bxc --json sandbox logs SANDBOX_ID \
  --since 2026-09-06T00:00:00Z --limit 100
```

CLI filters are:

- `--since` and `--until` for timestamps;
- `--stream` for `stdout` or `stderr`;
- `--source` for the output source; and
- `--limit` for the maximum entry count.

Without `--json`, the CLI prints entries to standard output and a count, retention value, and truncation indicator to standard error.
