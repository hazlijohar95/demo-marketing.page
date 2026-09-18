# auth.md — BoxCompute agent authentication

This guide is for AI agents and the developers wiring them up. There is no
OAuth or browser login flow for agents: BoxCompute APIs authenticate with
scoped API keys sent as Bearer tokens.

## 1. Get access (humans, one time)

Hosted BoxCompute is invite-only. Request access with a 15-minute call:

- https://cal.com/muhammad-farhan-helmy-bin-roslan-d7spi3/15min

Then use the invitation link to create your account and sign in at
https://app.boxcompute.ai/

## 2. Create an API key

Manage keys at https://app.boxcompute.ai/api-keys — **New API key**, copy the
`bc_live_...` secret immediately. It is shown only once.

## 3. Use the key

Send the secret only in the HTTPS authorization header:

```http
Authorization: Bearer bc_live_REDACTED
```

Base URL: `https://api.boxcompute.ai` (public v2 routes under `/api/v2`).
Full reference: https://boxcompute.ai/docs/http-api/

Keys carry scopes (`workspace:create`, `sandbox:read`, `sandbox:create`,
`sandbox:execute`, `sandbox:delete`, `usage:read`). Use separate keys per
integration so each can be rotated independently. Never commit keys, put them
in URLs, or print them to logs.

## 4. Revoke a key

Use the revoke control on the API keys page, or let the key revoke itself:

```bash
curl -X DELETE 'https://api.boxcompute.ai/api/v2/auth' \
  -H 'Authorization: Bearer bc_live_REDACTED'
```

Revocation is immediate. It does not delete existing workspaces or Sandboxes.

## Coding agents (local)

If the agent runs on a machine with the BoxCompute CLI installed, prefer the
`boxcompute-sandbox` skill over raw HTTP: it keeps the credential in the
CLI's protected file instead of the agent's context. Install with
`bxc skill install`, usage: https://boxcompute.ai/docs/cli/agents/
