---
title: "CLI command reference"
description: "Commands, aliases, options, output behavior, and exit statuses for bxc."
---

# CLI command reference

The executable is `bxc`. The compatibility alias `bcompute` accepts the same commands.

```text
bxc [--json] COMMAND [OPTIONS]
```

## Global options

| Option | Meaning |
| --- | --- |
| `--json` | Emit machine-readable JSON for commands that return data. It can appear before or after the command. |
| `-V`, `-v`, `--version` | Print the installed CLI version. |
| `-h`, `--help` | Show help. Use `bxc help sandbox` or `bxc help skill` for command-group help. |

## Authentication and maintenance

### `bxc login`

Start browser device authorization. `bxc auth` and `bxc auth login` are equivalent.

| Option | Meaning |
| --- | --- |
| `--url URL` | Connect to this BoxCompute web origin. Defaults to the saved origin, then `https://app.boxcompute.ai`. The value must be an absolute HTTP or HTTPS origin without credentials, a path, query, or fragment. |
| `--no-open` | Print the approval URL without trying to launch a browser. |

The CLI supports native browser launchers on macOS, Linux, Windows, and WSL. Failure to launch a browser does not stop authorization; open the printed URL manually.

### `bxc logout`

Revoke the saved credential through Sandbox API v2, then remove the local credential and configuration files. `bxc auth logout` is equivalent. Logout requires a working connection so that access is revoked server-side.

### `bxc doctor`

Verify authentication by listing Sandboxes. Human output shows the connected origin and number of Sandboxes. JSON output has this shape:

```json
{"connected":true,"url":"https://app.boxcompute.ai","sandboxes":2}
```

### `bxc update`

Read the latest package version from npm and, when it is newer, run a global install of that exact version. `bxc up` is equivalent. This command does not require BoxCompute authentication.

### `bxc version`

Print the installed version and exit. `bxc --version` is equivalent.

## Discover resources

### `bxc workspaces`

List workspaces owned by the authenticated account:

```text
WORKSPACE_ID<TAB>NAME
```

Use a workspace ID with `bxc sandbox start`. In JSON mode, the result is `{ "workspaces": [...] }`.

### `bxc sandboxes`

List owned Sandbox instances:

```text
SANDBOX_ID<TAB>STATE<TAB>NAME
```

`bxc list` and `bxc ls` are aliases. In JSON mode, the result is `{ "sandboxes": [...] }`. A Sandbox
state is `cold`, `pending`, `running`, or `expired`; `pending` and `expired` apply to VM beta
Sandboxes even though the CLI does not create them.

## Manage Sandboxes

### `bxc sandbox start WORKSPACE_ID`

Create and start another Sandbox under a workspace. It returns the new Sandbox ID, state, and name. Each successful call can create a distinct instance, so save the returned ID and inspect the list before retrying after an uncertain network failure.

The start command accepts `--idempotency-key KEY` (required with `--vm`; reusable for any create)
and `--name NAME`. It creates a VM Sandbox by default; pass `--gvisor` (or `--cpu`, which implies
`--gvisor`) for a gVisor Sandbox, and `--no-wait` to return the creation receipt without waiting for
a pending VM to reach running. It does not expose the existing-slot start route or the
operator-selected cooperative-SSH and selected-TCP service-access routes.

### `bxc sandbox status SANDBOX_ID`

Inspect one Sandbox without executing a command. JSON mode returns `{ "sandbox": {...} }`.

### `bxc sandbox exec SANDBOX_ID -- PROGRAM [ARG...]`

Execute a structured argument vector inside a Sandbox:

```bash
bxc sandbox exec SANDBOX_ID \
  --cwd /workspace/project \
  --env NODE_ENV=test \
  --env CI=true \
  --timeout 300 \
  --max-output-bytes 1048576 \
  -- npm test -- --runInBand
```

| Option | Meaning |
| --- | --- |
| `--cwd PATH` | Working directory at `/workspace` or below. Defaults to `/workspace`. |
| `--env KEY=VALUE` | Set an environment variable. Repeat the option for more variables. The first `=` separates the name from its value. |
| `--timeout SECONDS` | Positive whole-number execution timeout. The API accepts at most 900 seconds. |
| `--max-output-bytes BYTES` | Positive whole-number capture limit. The API accepts at most 1,048,576 bytes per stream. |
| `--` | Required separator between CLI options and the remote program. |

In human mode, remote standard output stays on local standard output. Remote standard error and an execution summary are written to local standard error. The CLI exits with the remote `exitCode`, or `1` when no exit code is available. A non-zero exit therefore reports command failure even though the API request itself succeeded.

In JSON mode, standard output contains:

```json
{
  "sandboxId": "sbx_REDACTED",
  "stdout": "tests passed\n",
  "stderr": "",
  "exitCode": 0,
  "timedOut": false,
  "stdoutTruncated": false,
  "stderrTruncated": false,
  "wallTimeSeconds": 4.2
}
```

### `bxc sandbox logs SANDBOX_ID`

Read current or retained logs without starting stopped compute:

```bash
bxc sandbox logs SANDBOX_ID \
  --since 2026-09-06T00:00:00Z \
  --until 2026-09-07T00:00:00Z \
  --stream stderr \
  --source execute \
  --limit 100
```

| Option | Accepted value |
| --- | --- |
| `--since TIMESTAMP` | Include entries at or after this RFC 3339 time. |
| `--until TIMESTAMP` | Include entries before this RFC 3339 time. It must be later than `--since`. |
| `--stream STREAM` | `stdout` or `stderr`. |
| `--source SOURCE` | `workload`, `execute`, or `process`. |
| `--limit ENTRIES` | Positive whole number, at most 5,000. Defaults to 1,000 on the API. |

Human output is one tab-separated entry per line, followed by a summary on standard error. JSON output is `{ "logs": {...} }` and preserves the structured entries, retention window, and truncation marker. See [Read Sandbox logs](/docs/logs/) for source semantics and retention behavior.

### `bxc sandbox delete SANDBOX_ID --yes`

Destroy the Sandbox runtime and customer-facing instance. `bxc sandbox rm` is an alias. The explicit `--yes` confirmation is required. Deletion leaves the parent workspace intact and cannot be undone through the CLI.

## Manage coding-agent skills

Skill management does not require BoxCompute authentication.

### `bxc skill detect`

Check known configuration directories and executable names for compatible coding agents. Detection does not recursively search your home directory. The command reports detected harnesses and the destination for each skill.

### `bxc skill list`

List harnesses that are detected or already have the BoxCompute skill installed. `bxc skill ls` is an alias.

### `bxc skill install [TARGET...]`

Install a managed copy of the packaged `boxcompute-sandbox` skill. With no target, `auto` installs to every detected harness.

```bash
bxc skill install
bxc skill install codex claude
bxc skill install both
bxc skill install all
```

Targets are `claude`, `codex`, `amp`, `opencode`, `cursor`, `gemini`, `copilot`, `cline`, `roo`, `goose`, `pi`, `windsurf`, and `agents`. `both` expands to Claude Code and Codex. `all` installs every supported destination even when the harness is not detected. `bxc skill add` is an alias.

The command will not replace an unrelated or locally modified directory. Pass `--force` only when you intend to overwrite that copy:

```bash
bxc skill install codex --force
```

### `bxc skill remove [TARGET...] --yes`

Remove CLI-managed skill copies. With no target, `auto` selects detected or installed harnesses. Explicit confirmation is required.

```bash
bxc skill remove codex claude --yes
bxc skill remove all --yes
```

The command protects a locally modified copy. Add `--force` only when you intend to delete those modifications. `bxc skill rm` and `bxc skill uninstall` are aliases.

### `bxc skill info`

Print the packaged `SKILL.md` to standard output. `bxc skill print` is an alias. This is useful for auditing the exact instructions before installation.

## Managed skill updates

The CLI records a digest beside each installed skill. A global CLI update refreshes an untouched managed copy during package installation. If package lifecycle scripts were disabled, the next ordinary `bxc` command performs the same check.

Locally modified copies are never overwritten automatically. The CLI reports their paths and leaves replacement behind the explicit `bxc skill install --force` command. Start a new agent session after an update so the harness loads the current instructions.

## Exit statuses

| Status | Meaning |
| --- | --- |
| `0` | The CLI command succeeded. |
| `1` | Authentication, network, API, update, or other runtime failure; also used when a remote execution has no exit code. |
| `2` | Invalid CLI usage or options. |
| Remote exit code | `sandbox exec` returns the executed program's non-zero exit code when one is available. |

Error messages are written to standard error. API failures include their HTTP status.
