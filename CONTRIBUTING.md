# Contributing

Thank you for improving Comment Relay. This repository is intentionally small and dependency-free so the security boundary stays easy to review.

## Getting started

1. Install Node.js 18 or newer.
2. Run `npm install` to create a local lockfile-compatible environment. There are currently no third-party runtime dependencies.
3. Run `npm run check` before making changes.
4. Import `manifest.json` through **Figma → Plugins → Development → Import plugin from manifest…**.

## Development workflow

- Edit `src/matcher.js` for portable matching logic.
- Edit `src/plugin-main.js` for Figma API, REST API, and storage behavior.
- Edit `ui.html` for the plugin interface.
- Run `npm run build` after changing either file in `src/`.
- Open `ui.html?preview=1` in a browser for a populated UI preview.
- Open `ui.html?setup=1` for the onboarding preview.

`dist/code.js` is generated and committed because Figma loads it directly. Never edit it by hand.

## Pull requests

- Keep changes narrowly scoped.
- Add or update tests for matcher behavior.
- Document any new network domain, storage key, REST scope, or credential flow.
- Include screenshots for UI changes.
- Confirm that exported collection JSON never contains credentials.
- Run `npm run check` and include the result in the pull request.

## Coding conventions

- Prefer plain JavaScript and browser-native APIs.
- Keep pure logic outside the Figma runtime when practical.
- Avoid adding dependencies unless they materially improve correctness or security.
- Escape all user-controlled strings before inserting them into HTML.
- Treat Figma comments, author information, and access tokens as sensitive data.

## Releases

Update `CHANGELOG.md`, bump `package.json`, run the complete test flow, and replace the development plugin ID with the ID assigned by Figma before publishing.
