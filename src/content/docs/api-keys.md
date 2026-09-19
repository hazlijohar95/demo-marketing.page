---
title: "API keys"
description: "Create, store, scope, use, and revoke BoxCompute API keys safely."
---

# API keys

Manage customer API keys at [https://app.boxcompute.ai/api-keys](https://app.boxcompute.ai/api-keys).

> **Register before creating a key**
>
> Hosted BoxCompute is currently invite-only. [Book a 15-minute call with Farhan](https://cal.com/muhammad-farhan-helmy-bin-roslan-d7spi3/15min) to request access, then use the invitation link to create your account and sign in.

## Create a key

1. Click **New API key**.
2. Keep the default name **Development** or enter a descriptive name for the integration or environment.
3. Click **Create key**.
4. Copy the `bc_live_...` secret using the copy control and store it immediately.

The plaintext secret is shown only once. After you close the dialog, BoxCompute shows only the key's name, final-character hint, scopes, creation and last-use information, and revocation status. If you lose the secret, create a replacement and revoke the old key.

## Store and use keys

- Put production keys in a secret manager and limit who and what can read them.
- Use separate, clearly named keys for development, CI, and production so each can be rotated independently.
- Do not commit keys, paste them into source code, include them in URLs, or write them to logs.
- Do not use a realistic-looking secret in examples. Use `bc_live_REDACTED` in static documentation.
- Send the secret only in the HTTPS authorization header:

```http
Authorization: Bearer bc_live_REDACTED
```

## Scopes

Keys can have these scopes:

| Scope | Permitted public v2 operations |
| --- | --- |
| `workspace:create` | Create a persistent workspace owned by the account |
| `sandbox:read` | List workspaces and Sandboxes, inspect a Sandbox, read Sandbox analytics, read file metadata and content, list directories, and revoke the current key with `DELETE /api/v2/auth` |
| `sandbox:create` | Create a Sandbox in an owned workspace or start an existing owned slot |
| `sandbox:execute` | Execute commands and manage observable operations; write, edit, rename, create, and remove paths; activate, reconnect, and revoke an operator-selected cooperative connection; create, look up, and revoke operator-selected TCP service access |
| `sandbox:delete` | Delete an owned Sandbox |
| `usage:read` | Read account usage summaries |

Existing keys do not gain `workspace:create` automatically. Explicitly include that scope when creating a key for an integration that can bootstrap a workspace. A key that only uses an existing workspace does not need it. Use separate keys for separate integrations so you can rotate or revoke their access independently.

## Revoke a key

Use the revoke control on the API keys page. Revocation takes effect immediately, and the secret cannot authenticate another request. Revoking a key does **not** delete workspaces or Sandboxes that already exist.

A key can also revoke itself:

### TypeScript

```ts
await boxcompute.auth.revoke();
```
### Python

```python
boxcompute.auth.revoke()
```

With direct HTTP:

```bash
curl -X DELETE 'https://api.boxcompute.ai/api/v2/auth' \
  -H 'Authorization: Bearer bc_live_REDACTED' \
  -H 'Content-Type: application/json'
```

The response is `204 No Content`; the key is invalid immediately afterward.
