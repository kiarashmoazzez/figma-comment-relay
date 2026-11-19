# Security

## Current credential model

The prototype accepts a Figma personal access token and saves it under `comment-relay:token` in `figma.clientStorage`. The stored token is retrieved only by the plugin main thread and is sent only to `https://api.figma.com` in the `X-Figma-Token` header.

The UI iframe receives an `authenticated` boolean, never the stored token. Exported collection JSON contains the selected package only and does not contain credentials.

## Important limitation

Figma documents that client storage is private for plugin isolation, not a hardened secret vault. A user with sufficient access to local application data may be able to inspect it. It is not equivalent to macOS Keychain or another operating-system credential store.

For internal evaluation:

- Create the shortest practical token lifetime.
- Grant only `file_comments:read` and `file_comments:write`.
- Revoke the token immediately if unexpected activity appears.
- Use **Remove local access token** when testing ends.

## Recommended production change

Do not publish the personal-token onboarding flow to general users. Choose one of these approaches before production:

1. **OAuth with a minimal HTTPS broker** — best user experience; the broker exchanges/refreshes credentials and never stores comment content.
2. **Session-only personal token** — backend-free; keep the token in memory and require it again after the plugin closes.
3. **Remember-on-device opt-in** — retain the current client-storage model only after explicit informed consent.

Figma requires a public HTTPS server for plugin OAuth. Never embed an OAuth client secret in the plugin bundle.

## Network boundary

`manifest.json` permits only `https://api.figma.com`. Any additional domain requires a security review, a documented purpose, and an update to the user-facing disclosure.

## Comment data

Comment text and author metadata can be sensitive. Collections remain local unless the user explicitly exports JSON. Exported files must be handled according to the organization's data-retention and access policies.

## Reporting vulnerabilities

Report suspected vulnerabilities privately to the repository owner. Do not open a public issue containing access tokens, file keys, comment content, or reproduction data from confidential Figma files.
