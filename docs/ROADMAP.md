# Roadmap

## Prototype complete

- Native comment capture and posting through the Figma REST API.
- Local multi-collection workspace.
- Automatic and manual placement workflows.
- Thread reconstruction, attribution, duplicate prevention, and rollback.
- Export/import and first-run onboarding.

## Before production

- Decide between OAuth and session-only credentials.
- Register the plugin and replace the development manifest ID.
- Complete real-file tests across Figma Desktop and browser.
- Add fixtures for duplicate files, renamed pages, reordered frames, and large documents.
- Test API rate limits and implement `Retry-After` handling.
- Add structured error telemetry only after a privacy review and explicit disclosure.
- Complete accessibility testing, including keyboard-only use and contrast.
- Establish a support contact, privacy policy, and data-use disclosure for Figma review.

## Candidate enhancements

- Diff collections after recapture.
- Batch mapping editor for ambiguous comments.
- Optional encrypted collection export.
- Team-shared transfer packages through an approved storage provider.
- Configurable matching weights and organization-specific layer conventions.
- Import report with links to every created native comment.

## Explicit non-goals

- Recreating original authorship or timestamps; Figma does not permit this.
- Restoring resolved state or reactions as their original users.
- Running in the background.
- Scraping Figma UI or relying on undocumented private APIs.
