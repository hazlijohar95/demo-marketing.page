---
title: "Manage files"
description: "Read, write, inspect, list, create, edit, rename, and remove paths in an owned Sandbox workspace."
---

# Manage files

The official SDKs provide binary-safe file operations for an owned Sandbox. Every `path` must be `/workspace` or an absolute path below it, can contain at most 4,096 characters, and cannot contain `.` or `..` path segments.

Reading, listing, and inspecting require `sandbox:read`. Writing, editing, renaming, creating directories, and removing paths require `sandbox:execute`. Requests are limited to the authenticated account's Sandboxes; an unknown or cross-account Sandbox returns `404`.

## Use an official SDK

### TypeScript

```ts
await boxcompute.files.mkdir("sbx_REDACTED", "/workspace/src", { recursive: true });
await boxcompute.files.write(
  "sbx_REDACTED",
  "/workspace/src/main.js",
  new TextEncoder().encode("console.log('hello')\n"),
);

const page = await boxcompute.files.read("sbx_REDACTED", "/workspace/src/main.js");
console.log(new TextDecoder().decode(page.data));
console.log({ nextOffset: page.nextOffset, fileSize: page.fileSize, eof: page.eof });

const listing = await boxcompute.files.list("sbx_REDACTED", "/workspace/src");
console.log(listing.entries);
```
### Python

```python
boxcompute.files.mkdir("sbx_REDACTED", "/workspace/src", recursive=True)
boxcompute.files.write(
"sbx_REDACTED",
"/workspace/src/main.js",
b"console.log('hello')\n",
)

page = boxcompute.files.read("sbx_REDACTED", "/workspace/src/main.js")
print(page.data.decode())
print({"next_offset": page.next_offset, "file_size": page.file_size, "eof": page.eof})

listing = boxcompute.files.list("sbx_REDACTED", "/workspace/src")
print(listing.entries)
```

## Direct HTTP

## Write and read a file

Create parent directories first, then upload raw bytes:

```bash
curl -X POST \
  'https://api.boxcompute.ai/api/v2/sandboxes/sbx_REDACTED/files/directory?path=%2Fworkspace%2Fsrc' \
  -H 'Authorization: Bearer bc_live_REDACTED' \
  -H 'Content-Type: application/json' \
  -d '{"recursive":true}'

curl -X PUT \
  'https://api.boxcompute.ai/api/v2/sandboxes/sbx_REDACTED/files/content?path=%2Fworkspace%2Fsrc%2Fmain.js' \
  -H 'Authorization: Bearer bc_live_REDACTED' \
  -H 'Content-Type: application/octet-stream' \
  --data-binary @main.js
```

Both successful mutations return `204 No Content`. `recursive` defaults to `false`; when it is `true`, creating an existing directory succeeds.

Download the first bounded range and save its response headers:

```bash
curl --get \
  'https://api.boxcompute.ai/api/v2/sandboxes/sbx_REDACTED/files/content' \
  -H 'Authorization: Bearer bc_live_REDACTED' \
  --data-urlencode 'path=/workspace/src/main.js' \
  --data-urlencode 'offset=0' \
  --data-urlencode 'maxBytes=262144' \
  --dump-header range.headers \
  --output main.js.part
```

Each response contains at most `maxBytes`, which defaults to 8 MiB and can be 1 byte through 8 MiB. `X-BoxCompute-Offset`, `X-BoxCompute-Next-Offset`, `X-BoxCompute-File-Size`, and `X-BoxCompute-EOF` describe the returned range. When EOF is false, the response also includes `X-BoxCompute-Next-Cursor`. Request the next range with that cursor unchanged and `offset` set to `X-BoxCompute-Next-Offset`. Stop when `X-BoxCompute-EOF` is `true`.

The cursor keeps a multi-request read on one file version. If the file changes, continuation returns `409 CURSOR_STALE`; restart at offset 0 without a cursor. An invalid cursor returns `400 INVALID_CURSOR`, and an offset beyond EOF returns `400 INVALID_RANGE`. Writes remain limited to 8 MiB per complete file.

## Edit text atomically

Hash the complete bytes you read, then send that hash with a conditional text replacement:

```bash
expected_sha256=$(sha256sum main.js | cut -d ' ' -f1)

curl -X PATCH \
  'https://api.boxcompute.ai/api/v2/sandboxes/sbx_REDACTED/files/content?path=%2Fworkspace%2Fsrc%2Fmain.js' \
  -H 'Authorization: Bearer bc_live_REDACTED' \
  -H 'Content-Type: application/json' \
  -d "{\"expectedSha256\":\"$expected_sha256\",\"oldText\":\"development\",\"newText\":\"production\",\"replaceAll\":false}"
```

`expectedSha256` is the 64-character lowercase hexadecimal SHA-256 of the complete file bytes you read. The file must be valid UTF-8 and at most 8 MiB. `oldText` must contain 1–65,536 characters and `newText` at most 65,536. By default, `oldText` must occur exactly once; set `replaceAll` to `true` to replace every occurrence. Success returns the SHA-256 of the new complete file:

```json
{ "sha256": "3a7bd3e2360a3d29eea436fcfb7e44c735d117969b4d1f7a39c842f2e8e79a9c" }
```

A stale hash returns `412 PRECONDITION_FAILED` without changing the file. Missing or ambiguous `oldText` returns `409 EDIT_CONFLICT`, and binary content returns `400 BINARY_FILE`. If the connection fails before a response arrives, read the file again before deciding whether to retry.

## Inspect and list

```bash
curl \
  'https://api.boxcompute.ai/api/v2/sandboxes/sbx_REDACTED/files/stat?path=%2Fworkspace%2Fsrc%2Fmain.js' \
  -H 'Authorization: Bearer bc_live_REDACTED'

curl \
  --get 'https://api.boxcompute.ai/api/v2/sandboxes/sbx_REDACTED/files/list' \
  -H 'Authorization: Bearer bc_live_REDACTED' \
  --data-urlencode 'path=/workspace/src' \
  --data-urlencode 'pageSize=100'
```

Stat returns `{ "file": ... }` with `path`, `kind`, `isSymbolicLink`, `size`, and Unix-millisecond `mtimeMs`. Stat follows a symbolic link for its `kind`, size, and modification time while preserving `isSymbolicLink: true`.

List returns `{ "entries": [...], "nextCursor": string | null }` for one page of the directory's immediate children. Each entry contains `name`, `path`, `kind`, `size`, and `mtimeMs`; list entry `kind` is `file`, `dir`, `symlink`, or `other`. `pageSize` defaults to 1,000 and can be 1–1,000. Pass `nextCursor` unchanged as the `cursor` query parameter until it is `null`.

Pages preserve the filesystem's stable native directory order. A directory membership change during pagination returns `409 CURSOR_STALE`; restart from the first page. Metadata for existing children can reflect its value when each page is read. Invalid or path-mismatched cursors return `400 INVALID_CURSOR`.

## Rename or remove a path

Rename a path within the same Sandbox workspace:

```bash
curl -X POST \
  'https://api.boxcompute.ai/api/v2/sandboxes/sbx_REDACTED/files/rename?path=%2Fworkspace%2Fsrc%2Fmain.js' \
  -H 'Authorization: Bearer bc_live_REDACTED' \
  -H 'Content-Type: application/json' \
  -d '{"destination":"/workspace/src/app.js","overwrite":false}'
```

Both parent directories must exist. `overwrite` defaults to `false`, so an existing destination returns `409 DESTINATION_EXISTS`; setting it to `true` replaces the destination atomically. Success returns `204 No Content`. If the connection fails before a response arrives, inspect both paths before retrying.

Remove a file, symbolic link, or directory:

```bash
curl -X DELETE \
  'https://api.boxcompute.ai/api/v2/sandboxes/sbx_REDACTED/files?path=%2Fworkspace%2Fsrc&recursive=true&force=false' \
  -H 'Authorization: Bearer bc_live_REDACTED'
```

`recursive` and `force` each default to `false`. A successful removal returns `204 No Content`. Missing files return `404 FILE_NOT_FOUND` unless `force=true`.

Traversal and symbolic-link parent components are rejected. Reading rejects a final symbolic link. Writing replaces a final symbolic link instead of following it, and removing it unlinks the link rather than its target. Stat can follow a final symbolic link only when its target remains inside `/workspace`.

These routes are for paged, bounded file transfer and filesystem operations. They do not provide a
shared volume, checkpoints, forks, or an interactive shell.
