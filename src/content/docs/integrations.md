---
title: "Integration guides"
description: "Connect supported agent frameworks to BoxCompute Sandboxes."
---

# Integration guides

The canonical [`boxcompute/integrations`](https://github.com/boxcompute/integrations) examples
connect popular agent frameworks with the official `boxcompute` Python SDK or `@boxcompute/sdk`
TypeScript package. Each example keeps the BoxCompute API key and lifecycle-owned Sandbox ID outside
the model-visible tool schema. Microsoft 365 Copilot is the exception: its declarative plugin
consumes the public OpenAPI contract directly.

For local coding agents, the [BoxCompute CLI agent skill](/docs/cli/agents/) is the shorter path. It supports Codex CLI, Claude Code, Amp, OpenCode, Cursor, Gemini CLI, GitHub Copilot, Cline, Roo Code, goose, Pi, Windsurf, and other Agent Skills-compatible harnesses without requiring you to write an integration.

Choose a native sandbox or executor adapter when the framework has a suitable contract. Choose a structured command tool when its native sandbox interface is broader, unstable, or would require claiming capabilities the public BoxCompute API does not provide.

The reviewed integrations targeted the non-VM Sandbox path and did not activate
operator-selected cooperative-SSH or selected-TCP service access. Those default-off
public HTTP previews are not exposed by the current SDKs or these adapters.

## Current status

The integration guides are being re-evaluated against the current public API and VM Sandboxes (Beta); they are temporarily unpublished and will be restored here as each is verified. See the [canonical `boxcompute/integrations` repository](https://github.com/boxcompute/integrations) for the source examples meanwhile.

## VM beta integration assessments

[Hermes Agent with VM Sandboxes](/docs/integrations/hermes/) remains an assessment: the reviewed installer completes and `hermes --version` works, but a complete model-backed run has not been verified.
