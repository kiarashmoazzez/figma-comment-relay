# Architecture

## Overview

Comment Relay is a local-first Figma plugin with two execution contexts:

```text
Figma document tree
       │
       ▼
plugin main thread ───────► Figma REST API
       │                   api.figma.com only
       │ postMessage
       ▼
plugin UI iframe
```

The main thread owns every privileged capability: the Figma document tree, `figma.clientStorage`, and authenticated REST requests. The iframe owns rendering and user interaction but never receives a stored token.

## Source layout

| Path | Responsibility |
|---|---|
| `src/plugin-main.js` | Storage, Figma Plugin API, comment REST requests, collection mutations, preview, import, and rollback |
| `src/matcher.js` | Pure anchor scoring and coordinate translation |
| `ui.html` | Dependency-free application UI and standalone demo data |
| `scripts/build.mjs` | Deterministic concatenation into `dist/code.js` |
| `tests/matcher.test.js` | Unit coverage for stable IDs, hierarchy, size, and coordinate mapping |

## Capture flow

1. The main thread reads comments using `GET /v1/files/:key/comments`.
2. Each root comment receives a portable anchor derived from its Figma node.
3. Optional stable IDs are written as private plugin data on commented nodes.
4. The collection is stored in `figma.clientStorage`.
5. Replies remain linked to the local root comment ID.

## Matching flow

Candidate scoring considers, in descending order of authority:

1. Stable plugin anchor ID.
2. Exact Figma node ID.
3. Ancestor hierarchy and page.
4. Layer name and type.
5. Dimensions and text content.

Ambiguous results receive a confidence penalty when the two best candidates are too close. Only the user can trigger a write, and the interface requires a placement preview first.

## Import flow

1. The user selects saved root comments.
2. The main thread recomputes matches against the destination file.
3. Manual overrides replace automatic targets where supplied.
4. Root comments are posted serially, then replies are posted against the returned root ID.
5. A local import batch records destination IDs to prevent duplicates and enable deletion.

## Storage model

- `comment-relay:token` — optional personal access token.
- `comment-relay:packages` — collections, anchors, threads, and import records.
- `comment-relay-anchor` — stable node metadata stored in a Figma document when enabled.

Figma limits each plugin to 5 MB of client storage. The implementation stops below that limit and directs users to export or remove older collections.

## Design decisions

- No application backend in the prototype.
- No third-party JavaScript dependencies.
- Network access restricted to `https://api.figma.com`.
- Generated bundle committed for direct Figma loading.
- Native comments are never posted without explicit user confirmation.
