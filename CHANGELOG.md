# Changelog

All notable changes to this project are documented here.

## [0.1.0] — 2026-05-25

### Added

- Core modules: `utils.js`, `actions.js`, `binding.js`, `dialogs.js`, `feedback.js`
- `brio.css` functional baseline (dialogs, hidden, feedback, loading states)
- `brio.js` bundled build via `npm run build`
- Event delegation: `data-click`, `data-change`, `data-input`, `data-submit`, `data-key`
- Dynamic fields: `data-show-when`, `data-hide-when`, `data-enable-when`, `data-disable-when`
- Native `<dialog>` management with focus return and dismissal policy
- Inline feedback: `showMessage`, `readServerMessages`, `{ success, messages }` server contract
- Reactivity: `data-bind`, `data-bind-*`, `BRIO_API.setState/getState/refreshBindings`
- No-refresh forms: `data-fetch` with `state`, `patches`, `append` response extensions
- Template-based list append (`{ template, items }`) for safe DOM updates
- Init-time HTML validation with console warnings
- Configuration hooks: `configureAuth`, `configureTranslations`, `configureSanitizeHtml`
- DocumentFragment-safe binding indexing (Safari compatibility)
- `BRIO.md` condensed reference and `llms.txt` for LLM tooling

### Fixed

- Clicks on text nodes inside buttons now trigger actions correctly
- `data-fetch` checks `response.ok` before parsing JSON
