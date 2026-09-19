---
title: "Hermes Agent with VM Sandboxes"
description: "Evaluate Hermes Agent integration with the VM beta, including bounded tool experiments and current hosting limitations."
---

# Hermes Agent with VM Sandboxes

Use this guide to assess a Hermes integration with [VM Sandboxes (Beta)](/docs/vm-sandbox-beta/).
Hermes is not preinstalled and no BoxCompute adapter is provided. The reviewed
installer now completes and `hermes --version` works, but Hermes setup, provider
authentication and a model-backed operation have not been verified — so this is
a verified-install assessment rather than a complete runnable example.

The current default VM profile (`size: small`): 0.5 CPU,
1,024 MiB RAM, a 10 GiB workspace, no automatic lifetime expiry, and outbound
Internet access to public IPv4 and DNS unless you request `blockNetwork: true`.
`size: large` raises the compute to 1.5 vCPU / 3,072 MiB RAM with the same
workspace. Start with the
[VM API walkthrough](/docs/vm-sandbox-beta/#run-your-first-integration-test) to verify
your access and learn how to create, execute, transfer files, and delete.

## What you can build today

Keep Hermes and its model-provider connection on your own networked development
host, and build an adapter that sends tool jobs to the VM through the BoxCompute
API. This is a design for you to implement, not a built-in Hermes
backend. Keep the BoxCompute key and sandbox lifecycle outside model-visible
tool inputs.

Hosting the full agent inside this VM is still unverified, but the installer no
longer stops on the toolchain: the guest now runs as root and can install system
packages. Chromium and other browser tooling remain skipped by the reviewed
recipe (`--skip-browser`), the workspace is deleted with the VM, and the beta
provides no inbound URL or supported always-on supervisor for a Hermes dashboard
or messaging gateway.

### Latest installer result

On September 16, 2026, a fresh production VM ran the reviewed recipe as a
durable operation and it completed with exit code 0. The guest now runs as root
(UID 0) on a unified root filesystem — `/` and `/workspace` are the same block
device — and root can install system packages with `apt-get`, which resolves the
earlier missing-compiler blocker. `hermes --version` printed
`Hermes Agent v0.21.3 (2026.9.14)`, install method git, Python 3.11.16, and
OpenAI SDK 2.24.0.

The install takes a few minutes as root, well within the public operations API's
900-second `timeoutSeconds` maximum. Hermes `setup --portal`, provider
authentication, and a model-backed operation were not run in this test, so they
remain unverified and are not claimed. The test VM was deleted afterwards and
confirmed absent.

## Requirements and current blockers

The official [installation guide](https://hermes-agent.nousresearch.com/docs/getting-started/installation),
[configuration reference](https://hermes-agent.nousresearch.com/docs/user-guide/configuration),
and [messaging gateway guide](https://hermes-agent.nousresearch.com/docs/user-guide/messaging)
describe Hermes' requirements. The assessment below was last checked on
September 16, 2026. Pin the Hermes version you investigate; upstream requirements
can change.

| Requirement | VM beta limitation |
| --- | --- |
| Installation | The reviewed recipe downloads the official installer over HTTPS, then adds managed uv, Python 3.11 and Node.js plus native Node modules such as `node-pty`. On September 16, 2026 it completed as root with exit code 0 and `hermes --version` reporting v0.21.3, so the earlier capacity and missing-compiler blockers are resolved. |
| Runtime and browser tools | Minimal Ubuntu is not a full Hermes runtime image. The reviewed recipe passes `--skip-browser` and `--skip-computer-use`, so Chromium and computer-use tooling are not installed by default and still need OS libraries plus `playwright install-deps`. Storage and the compiler are no longer the limit. |
| Models and external tools | Nous Portal uses OAuth; other providers use credentials and endpoints. Main and auxiliary model calls, web tools and remote MCP/cloud backends need outbound access to their own endpoints; the default networked mode allows public IPv4 and DNS only. No local model service or GPU is supplied. |
| Command backend | Hermes documents local, Docker, SSH and cloud/container backends, not a built-in BoxCompute backend. If you independently satisfy runtime dependencies, local execution runs as the guest's root user. Docker, SSH and cloud-backend assumptions do not transfer. |
| State | Hermes stores configuration, credentials, memory, skills, sessions, logs and SQLite `state.db` under `~/.hermes` or `HERMES_HOME`. A directory such as `/workspace/hermes-home` is deleted with the VM. Download synthetic test state before deleting it. |
| SQLite | The VM workspace uses virtiofs. Hermes defaults to SQLite WAL and warns that some virtiofs setups need `database.journal_mode: delete`. Hermes database behavior here is unverified. Test a fresh disposable database; changing configuration does not necessarily convert an existing database. |
| Gateway, cron and dashboard | These need long-running processes, persistent state and inbound serving. The beta provides no inbound URL and no supported supervisor for always-on processes, and the workspace is deleted with the VM, so always-on hosting is not supported. |

Do not upload real Hermes `.env`, `auth.json`, private keys or personal session
backups for these experiments. Use synthetic state and placeholder credentials.
Stop database writers before downloading files; copying a live WAL database
does not produce a consistent backup.

## Bounded integration experiments

1. **Build the API adapter contract.** Follow the VM walkthrough with one
   sandbox ID and one persisted creation key. Handle pending creation, capture
   stdout/stderr, verify downloaded bytes, and delete the sandbox. Same-key
   creation recovery does not make command execution idempotent.
2. **Run tool fixtures.** Upload a small script with synthetic inputs
   and use an available interpreter or a compatible standalone binary. Probe
   `id`, `uname -m`, required executables with `command -v`, and workspace free
   space with `df` before selecting your payload. Missing dependencies are
   blockers; user-space installation may succeed in the default networked mode,
   and root package installation is available (the guest runs as root).
3. **Investigate a small Hermes component.** Identify a pinned component and
   its transitive dependencies outside the VM. Only if a small offline payload
   fits, test configuration/state serialization or deterministic tool behavior.
   You can investigate a loopback mock with both client and mock inside the VM;
   you supply and stop both within the test budget. This tests protocol handling,
   not real inference or public serving.
4. **Handle a missing runtime without replacement.** Download results early,
   handle `SANDBOX_UNAVAILABLE`, and delete the original sandbox.
   Save the sandbox ID and failed stage rather than repeatedly allocating new
   VMs to hide a failure.

Persistent volumes, custom images or library profiles, browser dependencies and
inbound serving are not configurable through public create fields. See
[VM limits and lifecycle](/docs/vm-sandbox-beta/) before choosing an experiment.
