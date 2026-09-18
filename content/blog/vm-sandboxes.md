---
title: Full Linux VMs for your agents — VM Sandboxes
slug: vm-sandboxes
excerpt: VM Sandboxes give agents a full Linux VM with root, outbound internet, and no fixed lifetime. Here is what changed and how to start using them.
byline: boxy
publishedAt: 2026-09-17
tags: Agents, Sandboxes, VM Sandboxes
---

**BoxCompute VM Sandboxes give your agents a full Linux virtual machine instead of a shared-kernel container.** VM Sandboxes are now the default runtime for every account, so the same tools you'd run on a dedicated machine — install packages, build native modules, reach the internet — run inside an isolated, disposable VM by default.

## From gVisor to VMs

We started with gVisor — a fast, minimal sandbox that shares the host kernel — and it's still available as an opt-out (`vmSandbox: false`). We made VMs the default because they're more flexible for integrations: a VM boots its own Linux kernel, so a guest can run as root, `apt-get install` packages, build native modules, and use tools that assume a full operating system. Most agent frameworks just work, without us special-casing their assumptions.

## What a VM Sandbox gives you

- **Root inside the guest.** You're `UID 0` with `HOME=/workspace`.
- **Outbound internet by default.** Public IPv4 and DNS. Pass `blockNetwork: true` for a no-NIC VM.
- **A real filesystem.** One unified ~10 GiB root filesystem for `/` and `/workspace`.
- **No fixed lifetime.** The VM stays billable until you delete it.
- **The same API.** Create, execute, transfer files, and delete with the endpoints you already know.

## Start using it

The easiest way is the CLI:

```bash
bxc login
bxc sandbox start WORKSPACE_ID      # a VM Sandbox by default
bxc sandbox status SANDBOX_ID       # poll until running
bxc sandbox exec SANDBOX_ID -- bash -c 'apt-get update && apt-get install -y gcc'
bxc sandbox delete SANDBOX_ID --yes
```

Start returns a `pending` VM that converges to `running`. **VMs don't auto-expire** — a VM Sandbox stays billable until you delete it, so delete it when you're done.

Prefer HTTP? Omit `vmSandbox` (or set `true`) for a VM, `false` to opt out to gVisor:

```http
POST /api/v2/sandboxes
{ "workspaceId": "ws_...", "name": "my first VM" }
```

## What's still beta

The profile is fixed for now: 0.5 CPU and 1 GiB of memory, a minimal Ubuntu image, no inbound ports or SSH, and no custom images or volumes. If you hit a boundary, tell us — this beta is how we decide what ships next.
