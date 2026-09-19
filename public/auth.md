# auth.md — BoxCompute agent authentication

This guide is for AI agents and the developers wiring them up. There is no
OAuth or browser login flow for agents: BoxCompute APIs authenticate with
scoped API keys sent as Bearer tokens.

## Agent registration

Agent registration is human-mediated and invite-only. To register (provision
credentials for) an agent:

1. **Register for access.** The agent's human books a 15-minute call, which
   provisions an invitation:
   - Registration endpoint (human): https://cal.com/muhammad-farhan-helmy-bin-roslan-d7spi3/15min
2. **Create the account.** Use the invitation link to register an account and
   sign in at https://app.boxcompute.ai/
3. **Provision the credential.** Register the agent's key at
   https://app.boxcompute.ai/api-keys — **New API key**, copy the
   `bc_live_...` secret immediately. It is shown only once. This key is the
   agent's registered credential; one key per agent or integration so each
   can be rotated and revoked independently.

## Machine-readable registration

```json
{
  "agent_auth": {
    "skill": "https://boxcompute.ai/skills/boxcompute-sandbox/SKILL.md",
    "register_uri": "https://cal.com/muhammad-farhan-helmy-bin-roslan-d7spi3/15min",
    "provision_uri": "https://app.boxcompute.ai/api-keys",
    "identity_types_supported": ["api_key"],
    "credential_types_supported": ["bearer_token"],
    "bearer_methods_supported": ["header"],
    "revocation_uri": "https://api.boxcompute.ai/api/v2/auth",
    "notes": "Registration is human-mediated and invite-only: book a call, create an account, then mint a scoped bc_live key. Agents never use OAuth here."
  }
}
```

## Using the registered credential

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

## Revoking a registration

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
