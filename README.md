# Comment Relay

Comment Relay is a local-first Figma plugin for carrying native comment threads from one file into a similar file. It captures comments through Figma's REST API, stores portable copies in `figma.clientStorage`, matches their anchors against the destination document, and posts only the comments the user confirms.

No Comment Relay backend is used. The only network connection allowed by the plugin manifest is `https://api.figma.com`.

> **Prototype status:** The transfer workflow, matching engine, and UI are implemented and unit-tested. The personal-access-token onboarding is appropriate for internal evaluation, not general distribution. Before production, choose an OAuth broker or session-only credential model as described in [Security](docs/SECURITY.md).

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Security model](docs/SECURITY.md)
- [Roadmap and production checklist](docs/ROADMAP.md)
- [Contributing guide](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## Current feature set

- Capture open comments or a complete open-and-resolved archive from the current Figma file.
- Save multiple named collections locally across Figma files.
- Search and filter comments, inspect replies, edit the saved text, add local notes, duplicate comments, and remove comments from a collection.
- Export and import collections as JSON for backup or another device.
- Match comment anchors using stable plugin metadata, node IDs, hierarchy, layer names, page names, dimensions, and text.
- Preview high-confidence, review, and manual placements before writing anything.
- Attach ambiguous comments to the currently selected destination layer.
- Copy native root comments and their replies with optional source attribution and mention protection.
- Prevent accidental duplicate imports and delete a previously copied native comment from the current destination file.

## Build

The plugin intentionally has no runtime or build dependencies beyond Node.js.

```sh
npm run check
```

This builds `dist/code.js`, runs the matcher tests, and syntax-checks the generated plugin code.

## Install in Figma Desktop

1. Run `npm run build` in this folder.
2. In Figma Desktop, open **Plugins → Development → Import plugin from manifest…**.
3. Select `manifest.json` in this folder.
4. Open any design file and run **Plugins → Development → Comment Relay**.

The manifest enables Figma's private plugin API so the plugin can identify the current file automatically. It is intended as a local or private organization plugin.

The numeric ID currently in `manifest.json` is a development placeholder. Before publishing or distributing the plugin, register it with Figma and replace this value with the plugin ID assigned by Figma.

## Create the Figma token

1. Open Figma account **Settings → Security → Personal access tokens**.
2. Generate a token with these scopes:
   - `file_comments:read`
   - `file_comments:write`
3. Paste it into Comment Relay's setup screen.

Figma currently limits personal access tokens to a maximum lifetime of 90 days. The token is saved in Figma's local plugin storage and can be removed from Comment Relay settings. Figma client storage isolates plugins but is not a hardened secret vault; read [Security](docs/SECURITY.md) before using a real token.

## Suggested test flow

1. Open a source file that has several native comments, including at least one reply and one resolved comment.
2. Run Comment Relay and choose **Capture current file**.
3. Open a duplicate or structurally similar destination file.
4. Run Comment Relay again, choose the collection, and select **Preview placement**.
5. Review amber matches. For red/manual matches, select the intended destination layer on the canvas and choose **Use selected layer**.
6. Select **Copy** and confirm the native pins appear in Figma's comment mode.

## Important behavior

- Imported native comments are authored by the token owner at the time of import. Figma does not allow the original author, timestamp, or resolved state to be recreated.
- Removing a saved comment changes only the local collection. The source file is never modified by that action.
- Deleting a copied native comment changes the current destination file and is clearly confirmed in the UI.
- `figma.clientStorage` is device-local, limited to 5 MB, and may be cleared with browser or application data. Export JSON for durable backups or transfer to another device.
- Stable anchors improve matching when the destination file is duplicated after capture. For files that already diverged, the structural matcher and manual selection provide the fallback.

## Project structure

```text
.
├── .github/                 Issue and pull-request templates
├── docs/                    Architecture, security, and roadmap
├── scripts/build.mjs        Deterministic dependency-free build
├── src/matcher.js           Portable matching and coordinate mapping
├── src/plugin-main.js       Figma runtime, API, storage, and operations
├── tests/matcher.test.js    Matcher unit tests
├── dist/code.js             Generated Figma main-thread bundle
├── manifest.json            Figma plugin manifest
└── ui.html                  Plugin UI and browser preview
```

## License

No open-source license has been selected. Treat the repository as proprietary until the owner adds one.
