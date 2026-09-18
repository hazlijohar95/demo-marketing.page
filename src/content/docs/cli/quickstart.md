---
title: "CLI quickstart"
description: "Register for invite-only access, install bxc, and authenticate from your terminal."
---

# CLI quickstart

Use the BoxCompute CLI when you want to manage remote Sandboxes from a terminal or connect a local coding agent without handling API keys yourself.

The CLI creates a VM Sandbox by default; pass `--gvisor` for a gVisor Sandbox. It does not manage the
operator-selected cooperative-SSH and selected-TCP service-access previews.

> **Request your BoxCompute invite**
>
> Hosted BoxCompute is currently invite-only. [Book a 15-minute call with Farhan](https://cal.com/muhammad-farhan-helmy-bin-roslan-d7spi3/15min) to request an invite.

## 1. Register your account

When your invitation arrives, open its one-time link and create your BoxCompute account. You must complete this registration before the CLI can authorize your terminal.

After registration, you can sign in at [https://app.boxcompute.ai](https://app.boxcompute.ai).

## 2. Install the CLI

Install Node.js 20 or newer, then install the public CLI package:

```bash
npm install --global @boxcompute/cli
```

Confirm that `bxc` is available:

```bash
bxc version
```

Bun, pnpm, and Yarn installation options are available in the [complete CLI guide](/docs/cli/).

## 3. Log in

```bash
bxc login
```

The CLI prints a short approval code and opens the BoxCompute app in your browser. Sign in with your registered account, confirm that the browser shows the same code, and approve the device.

After approval, the terminal completes login and saves a protected CLI credential outside your project. You do not need to create or paste an API key for CLI login.

If the terminal cannot open a browser, use:

```bash
bxc login --no-open
```

Open the printed URL yourself, sign in, and approve the matching code.

## 4. Verify the connection

```bash
bxc doctor
bxc workspaces
bxc sandboxes
```

`doctor` confirms that the saved credential works. `workspaces` lists the parents available for new Sandboxes, and `sandboxes` lists your existing instances.

## 5. Start and use a Sandbox

Copy a workspace ID from `bxc workspaces`, then run:

```bash
bxc sandbox start WORKSPACE_ID
bxc sandbox exec SANDBOX_ID -- python3 -c 'print(sum(range(100000)))'
bxc sandbox status SANDBOX_ID
```

Replace `SANDBOX_ID` with the ID returned by `sandbox start`. Everything after `--` is sent as a structured argument vector to the remote Sandbox.

Sandboxes are persistent resources. Keep the returned ID for later work, or delete the instance explicitly when you no longer need it:

```bash
bxc sandbox delete SANDBOX_ID --yes
```

Deletion is permanent and leaves the parent workspace intact.

## Next steps

- Read the [complete CLI guide](/docs/cli/) for runtimes, JSON output, updates, and credential storage.
- See the [CLI command reference](/docs/cli/commands/).
- Connect [Codex CLI, Claude Code, or another coding agent](/docs/cli/agents/).
