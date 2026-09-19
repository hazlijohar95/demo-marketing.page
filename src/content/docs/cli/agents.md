---
title: "Connect coding agents"
description: "Let Codex CLI, Claude Code, and other local coding agents run work in BoxCompute Sandboxes."
---

# Connect coding agents

The BoxCompute CLI includes an Agent Skills-compatible `boxcompute-sandbox` skill. The skill teaches a local coding agent to discover your BoxCompute workspaces, choose or create a Sandbox instance, execute commands with `bxc`, inspect failures, and preserve the runtime for later work.

The skill uses the CLI's default VM Sandbox flow. It does not manage the operator-selected
cooperative-SSH and selected-TCP service-access previews.

This integration does not give the agent your credential. The skill contains instructions only; every `bxc` process reads the protected credential file itself. The coding agent must run on the same machine or environment where `bxc` is installed and authenticated.

## Install once

```bash
npm install --global @boxcompute/cli
bxc login
bxc doctor
bxc skill detect
bxc skill install
```

`skill install` targets every detected compatible harness. To install only for specific agents, name them:

```bash
bxc skill install codex claude
```

After installation, start a new agent session. Run `bxc skill list` at any time to see detected and installed destinations.

## Codex CLI

Install the managed skill explicitly if Codex was not detected:

```bash
bxc skill install codex
```

The CLI installs `boxcompute-sandbox` under `$CODEX_HOME/skills`, which defaults to `~/.codex/skills`. Start a new Codex CLI session, then invoke it explicitly:

```text
$boxcompute-sandbox run this project's test suite in an isolated BoxCompute Sandbox and fix the failures
```

You can also open Codex's `/skills` picker or ask naturally for work that needs remote compute. Codex may select the skill automatically when the task matches its description. See the official [Codex skills documentation](https://developers.openai.com/codex/skills/) for current skill invocation behavior.

A useful first request is:

```text
$boxcompute-sandbox show me my BoxCompute workspaces and Sandboxes, ask me which one to use if the choice is ambiguous, then run `node --version` there
```

Codex's normal shell, network, and approval policies still apply when it invokes `bxc`. The skill does not bypass Codex sandboxing or approval prompts.

## Claude Code

Install the managed skill explicitly if Claude Code was not detected:

```bash
bxc skill install claude
```

The skill is installed at `~/.claude/skills/boxcompute-sandbox/SKILL.md`. Start a new Claude Code session and invoke it by its directory name:

```text
/boxcompute-sandbox run this project's test suite in an isolated BoxCompute Sandbox and fix the failures
```

Claude Code can also load it automatically from a matching natural-language request. The official [Claude Code skills documentation](https://code.claude.com/docs/en/slash-commands) explains personal skill discovery and slash-command invocation.

If the top-level `~/.claude/skills` directory did not exist when an existing Claude Code session started, restart that session after installation. Claude Code's shell permissions still govern each local `bxc` invocation.

## Codex and Claude Code together

Use the `both` shortcut to install both managed copies:

```bash
bxc skill install both
```

The copies contain the same cross-agent instructions. They share the single BoxCompute connection stored outside either agent's configuration, so logging in or out applies to both.

## Other supported coding agents

The installer supports these targets and destinations. Paths use the current user's home and XDG configuration roots.

| Target | Harness | Managed skill destination |
| --- | --- | --- |
| `claude` | Claude Code | `~/.claude/skills/boxcompute-sandbox` |
| `codex` | Codex | `$CODEX_HOME/skills/boxcompute-sandbox`, default `~/.codex/skills/boxcompute-sandbox` |
| `amp` | Amp | `~/.claude/skills/boxcompute-sandbox` |
| `opencode` | OpenCode | `$XDG_CONFIG_HOME/opencode/skills/boxcompute-sandbox`, default `~/.config/opencode/skills/boxcompute-sandbox` |
| `cursor` | Cursor | `~/.cursor/skills/boxcompute-sandbox` |
| `gemini` | Gemini CLI | `~/.gemini/skills/boxcompute-sandbox` |
| `copilot` | GitHub Copilot | `~/.copilot/skills/boxcompute-sandbox` |
| `cline` | Cline | `~/.cline/skills/boxcompute-sandbox` |
| `roo` | Roo Code | `~/.roo/skills/boxcompute-sandbox` |
| `goose` | goose | `~/.agents/skills/boxcompute-sandbox` |
| `pi` | Pi | `~/.pi/agent/skills/boxcompute-sandbox` |
| `windsurf` | Windsurf | `~/.agents/skills/boxcompute-sandbox` |
| `agents` | Other Agent Skills-compatible harnesses | `~/.agents/skills/boxcompute-sandbox` |

Some harnesses share a destination. The installer deduplicates those writes and reports every harness represented by the managed copy.

Use `all` when automatic detection misses a harness or when you want to prepare every location:

```bash
bxc skill install all
```

Use the portable `agents` target for another harness that reads the shared Agent Skills directory:

```bash
bxc skill install agents
```

## What the agent is instructed to do

When the skill activates, the agent follows these boundaries:

1. Run `bxc --json workspaces` and `bxc --json sandboxes` instead of assuming that the first Sandbox is correct.
2. Start a Sandbox with a workspace ID only when another isolated instance is needed, then use the returned Sandbox ID for later calls.
3. Execute programs as structured arguments and use `bash -lc` only for intentional shell syntax.
4. Keep paths at `/workspace` or below it and pass `--cwd` or `--env` again on each execution when needed.
5. Treat a non-zero remote exit as evidence to diagnose, not a reason to retry blindly.
6. Inspect uncertain state before retrying a start or delete after a dropped connection.
7. Leave a Sandbox running unless you explicitly ask to destroy it or clearly designate it as disposable.
8. Never read, print, request, or transmit the saved BoxCompute credential.

The agent should finish by telling you which workspace it used, the meaningful command results, and whether the Sandbox was left running.

## Prompt patterns

Use explicit skill invocation when you know the work belongs remotely:

```text
Use $boxcompute-sandbox to build this project and run all tests in an isolated Sandbox. Keep the Sandbox for follow-up work.
```

For Claude Code, replace `$boxcompute-sandbox` with `/boxcompute-sandbox`.

Other useful requests include:

```text
Use BoxCompute to reproduce this Linux-only failure without changing my local machine.

Run the data-processing script remotely with MODE=staging, but do not send any local secrets.

Inspect the retained execute logs for my Sandbox without waking its compute.

Create a disposable Sandbox under workspace WORKSPACE_ID, run the benchmark, report the result, and delete only that Sandbox when finished.
```

For an ambiguous workspace or Sandbox choice, expect the agent to show the available IDs and ask which one to use.

## Local and cloud sessions

The packaged skill is intended for local coding agents. A remote or cloud agent session does not automatically inherit your local `bxc` installation, home-directory skill, or credential file. Install and authenticate the CLI inside that remote environment only when its secret-handling policy permits it; otherwise use an [official SDK](/quickstart/) from controlled application infrastructure.

## Troubleshooting

### The agent cannot find the skill

```bash
bxc skill detect
bxc skill list
```

Confirm the reported path, then start a new agent session. If you intentionally edited the installed copy, the updater preserves it. Replace it only when desired:

```bash
bxc skill install AGENT_TARGET --force
```

### The agent can see the skill but cannot run `bxc`

Start the agent from a terminal where `bxc version` and `bxc doctor` work. A GUI-launched agent may have a different `PATH`; restart it after installing the global npm package.

### Authentication is missing or expired

Authentication belongs to you, not the agent. Run this yourself:

```bash
bxc login
bxc doctor
```

Do not paste a credential into the chat. The skill explicitly tells the agent not to request or inspect it.

### Remove the integration

```bash
bxc skill remove codex claude --yes
```

Locally modified copies are protected. Add `--force` only if you intend to discard those modifications. Removing a skill does not revoke the BoxCompute credential; run `bxc logout` separately when access should be revoked.
