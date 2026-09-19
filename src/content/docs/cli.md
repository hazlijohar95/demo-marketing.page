---
title: "BoxCompute CLI"
description: "Install the bxc command, authenticate in a browser, and manage remote Sandboxes from a terminal."
---

# BoxCompute CLI

The BoxCompute CLI connects local terminals and coding agents to isolated BoxCompute Sandboxes. It uses the customer Sandbox API v2, handles browser authentication, and can install the packaged `boxcompute-sandbox` skill for supported coding agents.

New to BoxCompute? Start with the [CLI quickstart](/docs/cli/quickstart/) for invite-only registration, installation, and your first browser login.

Use the CLI when you want to run commands interactively or let a local agent such as Codex CLI or Claude Code use remote compute. Use an [official SDK](/quickstart/) when you are building an application or need durable operations, idempotent Sandbox creation, or cursor-based file retrieval. The [HTTP API](/docs/http-api/) remains available for direct clients and generated tooling.

The CLI (bxc 0.4.0) creates a VM Sandbox by default; pass `--gvisor` or `--cpu` for a gVisor Sandbox.
It does not manage the operator-selected cooperative-SSH and selected-TCP service-access previews;
use direct HTTP for those features. The language runtime inside a Sandbox does not identify
its isolation backend.

## Requirements

- A registered BoxCompute account. Hosted access is currently invite-only; [book a 15-minute call with Farhan](https://cal.com/muhammad-farhan-helmy-bin-roslan-d7spi3/15min) to request an invite.
- Node.js 20 or newer with npm.
- A local terminal on macOS, Linux, Windows, or WSL.

## Install

Install the public package globally. npm is the recommended path, and Bun, pnpm, and Yarn Classic can install the same package:

### npm

```bash
npm install --global @boxcompute/cli
```
### Bun

```bash
bun add --global @boxcompute/cli
```
### pnpm

```bash
pnpm add --global @boxcompute/cli
```
### Yarn Classic

```bash
yarn global add @boxcompute/cli
```

Whichever package manager installs it, `bxc` runs with Node.js and still requires Node.js 20 or newer. Installing with Bun does not change the CLI runtime: the published executable starts with `#!/usr/bin/env node`.

For a one-off version check without a global installation, use either package runner:

```bash
npx @boxcompute/cli@latest version
bunx @boxcompute/cli@latest version
```

A global install is preferable for coding-agent integration because the agent skill expects `bxc` to be available on `PATH`. Bun can report that the package's lifecycle script was blocked; this does not prevent the CLI from running. Untouched managed skills are checked and refreshed by the next ordinary `bxc` command as well.

Confirm that the executable is available:

```bash
bxc version
```

The older `bcompute` executable is installed as a compatibility alias. New scripts and examples should use `bxc`.

## Log in

```bash
bxc login
```

On a first login, the CLI prints a short approval code and opens `https://app.boxcompute.ai` in your browser. Sign in, confirm that the code matches, and approve the device. The terminal waits for approval and then saves the CLI credential. Later logins reuse the saved web origin unless you pass `--url`.

For an SSH session or another environment that cannot open a browser, print the approval URL and open it yourself:

```bash
bxc login --no-open
```

For a self-hosted deployment, pass its **web origin**, without an API path:

```bash
bxc login --url https://boxcompute.example.com
```

The server must support CLI browser authentication and Sandbox API v2. If either surface is unavailable, update the BoxCompute server before updating or using this CLI.

## Verify the connection

```bash
bxc doctor
bxc workspaces
bxc sandboxes
```

`doctor` verifies the saved credential and reports the connected web origin and Sandbox count. `workspaces` lists possible parents for new Sandboxes, including workspaces that do not have a Sandbox yet. `sandboxes` lists the instances already owned by the account.

## Start and use a Sandbox

Copy a workspace ID from `bxc workspaces`, then create an instance:

```bash
bxc sandbox start WORKSPACE_ID
```

Save the returned Sandbox ID. Workspace IDs and Sandbox IDs are different: `sandbox start` takes a workspace ID, while `status`, `logs`, `exec`, and `delete` take the Sandbox ID returned by start.

```bash
bxc sandbox status SANDBOX_ID
bxc sandbox exec SANDBOX_ID -- python3 -c 'print(sum(range(100000)))'
bxc sandbox logs SANDBOX_ID --source execute
```

Everything after `--` is sent as a structured argument vector. The CLI does not join those arguments into shell source. To use pipes, redirects, or other shell syntax intentionally, invoke a shell explicitly:

```bash
bxc sandbox exec SANDBOX_ID -- bash -lc 'npm test 2>&1 | tee /workspace/test.log'
```

Sandboxes persist between commands and may become `cold` when idle. A later execution starts the runtime again. Do not delete a Sandbox merely because one terminal task is finished.

## Use different runtimes

The CLI is language-agnostic: everything after `--` is an executable and its arguments. The executable must exist inside the target Sandbox.

Check the available runtimes instead of assuming a version:

```bash
bxc sandbox exec SANDBOX_ID -- node --version
bxc sandbox exec SANDBOX_ID -- npm --version
bxc sandbox exec SANDBOX_ID -- python3 --version
bxc sandbox exec SANDBOX_ID -- bash --version
```

Run small Node.js, Python, and shell workloads directly:

```bash
bxc sandbox exec SANDBOX_ID -- node -e 'console.log([1, 2, 3].map(x => x * x))'
bxc sandbox exec SANDBOX_ID -- python3 -c 'print(sum(range(100000)))'
bxc sandbox exec SANDBOX_ID -- bash -lc 'printf "%s\n" /workspace/*'
```

The current default BoxComputeAgent Sandbox image includes Node.js, npm, Python 3, pip, and Bash. It does **not** preinstall Bun. Hosted images can evolve, so `bun --version` is the authoritative check for a particular Sandbox.

To use Bun when it is absent, install it under the persistent `/workspace` volume rather than a system directory. This requires outbound access to `bun.sh`:

```bash
bxc sandbox exec SANDBOX_ID \
  --env BUN_INSTALL=/workspace/.bun \
  -- bash -lc 'curl -fsSL https://bun.sh/install | bash'

bxc sandbox exec SANDBOX_ID -- /workspace/.bun/bin/bun --version
bxc sandbox exec SANDBOX_ID -- /workspace/.bun/bin/bun -e \
  'console.log(Bun.version)'
```

For a Bun project already stored in the Sandbox workspace:

```bash
bxc sandbox exec SANDBOX_ID \
  --cwd /workspace/project \
  -- /workspace/.bun/bin/bun install --frozen-lockfile

bxc sandbox exec SANDBOX_ID \
  --cwd /workspace/project \
  -- /workspace/.bun/bin/bun test
```

Keep runtime binaries, dependency caches, and project files under `/workspace` when they must survive an idle runtime replacement. The CLI does not copy the current local directory into a Sandbox; these commands operate on files already in the remote workspace.

## Structured output

Add the global `--json` flag for scripts and agents:

```bash
bxc --json workspaces
bxc --json sandboxes
bxc --json sandbox status SANDBOX_ID
bxc --json sandbox exec SANDBOX_ID -- npm test
```

JSON mode writes one JSON value to standard output. For `sandbox exec`, the value includes the Sandbox ID plus `stdout`, `stderr`, `exitCode`, `timedOut`, truncation flags, and wall time.

## Credential storage

By default, the CLI stores configuration outside your projects:

| File | Purpose |
| --- | --- |
| `~/.config/boxcompute/config.json` | The BoxCompute web origin and path to the credential file. |
| `~/.config/boxcompute/credential` | The `bc_live_...` CLI credential. |

The directory is restricted to the current user and both files are written with mode `0600`. The CLI refuses to use a credential file that is readable by group or other users.

These environment variables override the defaults:

| Variable | Purpose |
| --- | --- |
| `BOXCOMPUTE_CONFIG_DIR` | Use another BoxCompute configuration directory. |
| `XDG_CONFIG_HOME` | Changes the default parent of the `boxcompute` directory. |
| `BOXCOMPUTE_URL` | Override the saved BoxCompute web origin. |
| `BOXCOMPUTE_TOKEN_FILE` | Read the credential from another protected file. |

When using the last two variables, set both or leave the missing value available in `config.json`. Never put the credential in a repository, an agent skill, a prompt, or a command-line argument.

## Update or remove access

Update to the latest npm release:

```bash
bxc update
```

`bxc up` is the short alias. The updater leaves the saved connection in place and refreshes untouched CLI-managed agent skills. If npm cannot be invoked automatically, run:

```bash
npm install --global @boxcompute/cli@latest
```

Revoke the current CLI credential on the server and remove the two local files:

```bash
bxc logout
```

Uninstall the package separately when you no longer need the executable:

```bash
npm uninstall --global @boxcompute/cli
```

## Next steps

- Read the [complete CLI command reference](/docs/cli/commands/).
- Connect [Codex CLI, Claude Code, or another coding agent](/docs/cli/agents/).
- Learn the underlying [Sandbox lifecycle](/docs/sandboxes/) and [execution limits](/docs/execute/).
