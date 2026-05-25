# Brio — Backlog
Core principle: Brio only introduces `data-*` attributes where no native HTML equivalent exists.
Native attributes (`required`, `min`, `max`, `pattern`, `action`, `method`) are used as-is.

---

## v0.1.0 — shipped (2026-05-25)

Core library, reactivity, data-fetch, brio.css baseline, init validation, BRIO.md, llms.txt, GitHub release + jsDelivr CDN.

See [CHANGELOG.md](../CHANGELOG.md) for full release notes.

---

## v0.2 backlog (next)

- **Forms:** dirty state, autosave, multi-step, optional client-side validation helper
- **Developer experience:** `BRIO_DEBUG`, troubleshooting guide, docs split (Guide vs Reference)
- **Distribution:** npm publish, bundle builder HTML, starter template
- **Performance:** `updateDynamicFields` dependency map
- **Dialogs:** animation states, dirty-leave on dialog close
- **UI patterns:** toast, copy-to-clipboard, sortable lists, dark mode toggle
- **Marketing:** homepage USP polish, logo/wordmark, TypeScript `.d.ts`

---

## Priority overview (historical — pre-v0.1)
- **P0 — Now (foundational)**
  - Distribution & configuration core (custom bundle builder, `BRIO_API`, debug, init-time HTML validation)
  - Forms — submission, validation, dirty state, autosave, basic multi-step
  - Dialogs — animation state + dirty-leave integration
  - Performance — `updateDynamicFields` dependency map, incremental `buildKeyIndex`
- **P1 — Next (product polish / reach)**
  - CDN + versioned releases + `npm` package + starter template
  - New UI patterns (copy, toast, character count, dark mode toggle, sortable lists, scroll-to, polling, countdown)
  - Accessibility & developer experience docs, tables, `{ success, messages }` contract
- **P2 — Later (nice-to-have / marketing)**
  - Keyboard chord safelist + shortcut overlay
  - Toggle animation hook beyond `<details>`
  - Pluggable auth hook for `getData` / `postData`
  - Logo, homepage USP & copy polish
  - TypeScript `.d.ts` autocomplete

---

## Distribution & configuration
- [x] Custom bundle builder — docs page with checkbox per module; download single .js containing only selected modules (`docs/builder.html`).
- [x] `window.BRIO_API` namespace for calling public methods (`setState`, `getState`, `refreshBindings`, `applyResponse`, `registerAfterFetch`).
- [ ] Debug mode — `window.BRIO_DEBUG = true` logs every dispatch, dialog transition, focus move, ARIA injection.
- [x] Init-time HTML validation on `DOMContentLoaded`:
  - [x] Every dialog action target resolves to an existing `<dialog id="...">`.
  - [x] Every `[data-message][data-for]` points to an existing input id.
  - [x] Every `data-click` action resolves to a known function.
  - [x] `form[data-fetch]` without `id` warns; invalid `data-fetch-append-target` warns.
- [x] Pluggable authentication for `getData` — `configureAuth(fn)` hook (legacy `jwtToken` fallback).
- [ ] Module list table in docs — each module and what it provides.
- [x] CDN-hosted canonical URL for `brio.js` (jsDelivr via GitHub tags).
- [x] Versioned releases with changelog.
- [ ] `npm publish` as `brio-js` for teams that prefer a package reference.
- [x] `BRIO.md` system prompt snippet ≤2000 tokens — attributes, function signature, server contract — for `.cursorrules` / `CLAUDE.md`.
- [x] `llms.txt` — markdown reference for LLM tooling integration.
- [ ] Canonical starter template — pre-wired scaffolding with native `<dialog>` examples.

---

## Reactivity v0.1
- **P0**
  - [x] Add `binding.js` as dedicated module for reactivity (`data-bind`, `data-bind-*`, state API).
  - [x] Add `BRIO_API.setState(partial)`, `BRIO_API.getState(path?)`, and `BRIO_API.refreshBindings()`.
  - [x] Re-evaluate bindings automatically on `change`, `input`, and `submit`.
  - [x] Intercept `form[data-fetch]` submit without page refresh and process `{ success, messages }`.
  - [x] Support optional `state`, `patches`, and `append` response extensions.
  - [x] Keep loading/accessibility contract (`data-state="loading"`, `aria-busy`, `aria-disabled`) intact in no-refresh flow.
- **P1**
  - [ ] Add richer list templating docs and keyed update guidance for larger collections.
  - [x] Add explicit security guidance for HTML patches (`patches` / `append`) in docs.
  - [ ] Add advanced examples combining dialogs + fetch + binding + list append.

---

## `brio.css` v0.1 (functional baseline)
- **P0**
  - [x] Add `dist/brio.css` baseline selectors for `dialog`, `dialog[open]`, `dialog::backdrop`, `dialog[data-modeless][open]`.
  - [x] Add `[hidden] { display: none !important; }` fallback.
  - [x] Add feedback baseline for `[data-message][hidden]` and a lightweight `[data-message][data-type]` state hook.
  - [x] Add loading baseline for `button[data-state="loading"]` and submit-input equivalent.
  - [x] Include optional CSS vars with working defaults (no overrides required).
- **P1**
  - [ ] Align `docs/reference.html` with `brio.css` baseline (keep only demo visual overrides).
  - [x] Add a `Functional CSS (brio.css)` contract section + feature matrix to `docs/brio.md`.
  - [x] Update `README.md` install snippet with `<link rel="stylesheet" href="brio.css">` and brief rationale.
  - [ ] Run v0.1 QA checklist: modal open/close/center/backdrop, modeless no scroll-jump, hidden consistency, feedback visibility, loading non-interactive state.

---

## Forms — submission
- [x] `data-fetch` boolean attribute on `<form>` opts into fetch interception; absent = native page reload.
- [x] Brio reads native `action` and `method` — no new attributes needed.
- [x] On submit with `data-fetch`: disable form, POST via fetch, re-enable on completion.
- [x] Submit button gets `data-state="loading"` during request — CSS handles spinner.
- [x] Response routed through `{ success, messages }` feedback system.
- [x] `{ success, messages }` server contract documented as a copy-paste block (HTML + server example).
- [ ] If pending autosave debounce exists when manual submit fires — cancel the pending autosave.
- [ ] `postData` helper — POST companion to `getData`; handles `FormData`; sets correct headers; returns normalised `{ success, messages }`.

---

## Forms — validation
- [ ] Brio adds `novalidate` to any form it manages — suppresses native browser tooltip UI.
- [ ] On submit: call `form.checkValidity()`, collect `field.validationMessage` for each invalid field.
- [ ] Route validation messages through existing `data-message-for` feedback system — no new attributes.
- [ ] Default validation timing: on `blur` per field.
- [ ] `data-validate="change"` on a field overrides to validate on every `input` event.
- [ ] Automatic error mode: if a field currently carries an error, switch it to `input` validation automatically; clear error the moment value becomes valid; revert to `blur` once clean.
- [ ] On submit with invalid fields: scroll to and focus first invalid field automatically.
- [ ] Native attributes used as-is: `required`, `min`, `max`, `minlength`, `maxlength`, `pattern`, `type`.
- [ ] Validation behaviour table — default, `data-validate="change"`, automatic error mode.

---

## Forms — dirty state
- [ ] Snapshot all field values at page load (or after successful save).
- [ ] Compare snapshot on every `input`/`change` event.
- [ ] Set `data-state="dirty"` on `<form>` when changed; remove when clean.
- [ ] Extend condition syntax so `data-enable-when="form-id:dirty"` works against `data-state`.
- [ ] `data-dirty-leave="handlerFn"` on form — fires in all three leave scenarios; `target` carries context (`"beforeunload"`, `"dialog-close"`, `"step-back"`).
- [ ] If no `data-dirty-leave` set and form is dirty: trigger native browser `beforeunload` confirm as fallback.
- [ ] If `data-dirty-leave` is set: Brio calls the function and suppresses `beforeunload` — function owns the response.
- [ ] `BRIO_API.resetDirty(formEl)` — resets snapshot to current values; called automatically after successful save or autosave.
- [ ] Dirty leave applies to three scenarios: browser tab close, dialog containing a dirty form being closed, navigating back in a multi-step form.
- [ ] Dirty leave scenario table — trigger, `target` value, fallback behaviour.

---

## Forms — autosave
- [ ] `data-autosave="ms"` on `<form>` — value is debounce delay in milliseconds.
- [ ] Autosave only fires when form is dirty.
- [ ] Uses same `action` and `method` as manual submission.
- [ ] On successful autosave: call `resetDirty` automatically.
- [ ] Expose `lastSaved` timestamp as a JS object property accessible via `data-bind`.
- [ ] Autosave respects form disable/enable state — does not fire if form is mid-submission.

---

## Forms — multi-step
- [ ] `data-step` attribute on form sections to define steps.
- [ ] `nextStep` / `prevStep` as built-in actions.
- [ ] Step navigation triggers dirty leave check before going back.
- [ ] Progress state accessible via `data-bind` template (e.g. `{{steps.current}} of {{steps.total}}`).
- [ ] Validation runs on current step fields before allowing `nextStep`.

---

## Dialogs
- [ ] Dialog animation — `data-state="opening|open|closing"` set by framework; CSS handles transitions. Dialogs appear/disappear smoothly using CSS transitions keyed off this attribute.
- [ ] Dirty leave check when closing a dialog that contains a dirty `data-fetch` form.
- [ ] `data-dirty-leave` handler fires with `target="dialog-close"` in this scenario.
- [ ] Troubleshooting docs for common dialog integration mistakes (wrong element type, missing ids, missing labels).

---

## Tabs
*(tabs.js already written)*
- [ ] Include tabs in bundle builder when tabs.js is merged into `src/`.
- [ ] Document required HTML structure and progressive ID generation behaviour.
- [ ] Document multiple tablists per page behaviour.
- [ ] Accessibility: `aria-controls`, `aria-labelledby`, and roving `tabindex` all generated at init and documented.

---

## `<details>` / `<summary>` enhancement
- [ ] Native element — no new structure needed.
- [ ] Brio adds `data-state="open|closing"` for CSS animation on toggle.
- [ ] Enhancement is automatic when `details` element is present.
- [ ] Explore a generalised `toggle` animation hook (`data-toggle-animation` or `data-state` pattern) for non-`<details>` reveals, aligned with this approach.

---

## New UI patterns
- [ ] **Copy to clipboard** — `data-copy="field-id"` or `data-copy-text="value"`; Clipboard API; shows feedback; no native equivalent.
- [ ] **Toast notifications** — floating feedback for non-error outcomes (saved, copied, sent).
- [ ] **Character count** — `data-count-for="field-id"` on display element; updates live on `input`.
- [ ] **Scroll-to as action** — `data-scroll-to="id"` only as `data-click` target on non-link elements; native `<a href="#id">` preferred otherwise.
- [ ] **Sortable lists** — native `draggable` attribute; Brio wires events and fires callback with new order.
- [ ] **Dark mode toggle** — `data-toggle-theme` sets `data-theme` on `<html>`; persists to `localStorage`.
- [ ] **Polling** — `data-poll="ms"` on any element; calls a named function on interval.
- [ ] **Countdown** — `data-countdown-to="ISO-date"` updates a display element live.
- [ ] `data-key` shortcut registry / help overlay — expose all registered shortcuts at runtime via a `showKeyboardShortcuts` action that opens a generated dialog.

---

## Accessibility
- [ ] `aria-controls` auto-wired for `data-show-when` / `data-hide-when` at init so controlling fields declare relationships to controlled regions.
- [ ] Revisit `aria-expanded` for form-field-driven disclosure (checkboxes, selects that control visibility). Decide whether `aria-controls` alone is sufficient or if `aria-expanded` should be applied to the controlling element.
- [ ] Tabs: `aria-controls`, `aria-labelledby`, roving `tabindex` all generated at init.
- [ ] `<details>` enhancement preserves native accessibility — no ARIA needed.
- [ ] All init-injected ARIA attributes logged in debug mode so developers can inspect what Brio added.

---

## Keyboard
- [ ] Chord conflicts with browser defaults — avoid capturing critical browser shortcuts (e.g. `Ctrl+w`). Either ship a safelist of chords that are never intercepted or document the risk and recommended patterns clearly.
- [ ] `buildKeyIndex` incremental updates — current implementation rebuilds the entire map on any mutation. Replace with per-node insert/delete on additions/removals/attribute changes so dialog open/close and other bulk changes are cheaper.
- [ ] Optionally expose a `BRIO_API.listShortcuts()` for inspection or tooling.

---

## Developer experience
- [ ] Debug mode — `window.BRIO_DEBUG = true` logs every action dispatch, message shown, dialog transition, focus movement, and ARIA injection.
- [ ] Init-time HTML validation (see Distribution & configuration) with clear console warnings.
- [ ] Troubleshooting section in docs — cover:
  - [ ] Script loaded without `defer` (variables are null).
  - [ ] `data-for` pointing to a non-existent id.
  - [ ] Action function not in global scope.
  - [ ] `data-key` chord not matching due to case sensitivity or wrong modifier order.
  - [ ] `&&` and `||` mixed in a single condition expression.
- [ ] Docs split into **Guide** (concepts, mental model, how things connect) and **Reference** (every attribute, every built-in, every config key).
- [ ] Module list table — each module and what it provides.
- [ ] Validation behaviour table.
- [ ] Dirty leave scenario table.
- [ ] Both HTML and JS sides shown in every example.

---

## Performance
- [ ] `updateDynamicFields` dependency map — replace four full DOM scans (four `querySelectorAll` passes across `document`) with a field→targets map built at init. On change events, only re-evaluate targets that depend on the changed field.
- [ ] `buildKeyIndex` incremental updates — insert/delete per node instead of full rebuild on mutation (see Keyboard).
- [ ] Avoid repeated DOM queries for ARIA wiring, dialogs, and tabs by caching and updating via observers.

---

## Documentation & types
- [ ] Docs split into Guide and Reference (see Developer experience).
- [ ] Each attribute gets its own anchor-deep URL.
- [ ] `{ success, messages }` server contract as a copy-paste block with examples.
- [ ] Both HTML and JS sides shown in every example.
- [ ] TypeScript `.d.ts` declaration file for action signature autocomplete — standalone declarations describing the public API, without rewriting the implementation.

---

## Logo & marketing
- [ ] Finalise `[brio]` wordmark direction.
- [ ] Explore `[ = ]` standalone symbol variant.
- [ ] Homepage USP section — 5 cards + intro (`HOMEPAGE-USP.html` in progress).
- [ ] LLM/AI tooling callout banner below USP grid.
- [ ] Homepage copy fine-tune — descriptions shorter and easier to read.

---

## Completed (historical)
- ~~`input` event never registered~~ — added to core listener set in `actions.js`.
- ~~Focus trap queried DOM on every Tab~~ — replaced with `MutationObserver` cache in `dialogs.js`.
- ~~`handleKeys` queried DOM on every keydown~~ — replaced with `Map` index + `MutationObserver`.
- ~~Focus trap cache stale when `data-show-when` fields toggled~~ — observer watches `hidden`/`disabled`/`tabindex` and rebuilds automatically.
- ~~`dialogs.js` entire function block duplicated~~ — duplicate tail removed; focus trap code restored.
- ~~`getRandomNumber` range formula~~ — fixed to `Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0]`.
- ~~`hidden="true"` in dialogs.js~~ — all `setAttribute('hidden', 'true')` calls corrected to `setAttribute('hidden', '')`.
- ~~`autoFocus` defined twice~~ — dead definition removed from `utils.js`.
- ~~`input` missing from core events documentation~~ — added to `actions.js` header and FRAMEWORK.md.
- ~~`setInert` using `setAttribute('inert', 'true')`~~ — corrected to `setAttribute('inert', '')`.
- ~~`openDialog` crashes on invalid dialog id~~ — null guard added with console warning.
- ~~`addDialogTitleIds` overwrites existing h2 ids~~ — guard added; now skips headings that already have an id.
- ~~`addDialogTitleIds` silent on nameless dialogs~~ — now logs a warning when a dialog has no h2, aria-label, or aria-labelledby.
- ~~`evaluateSingleCondition` duplicates checkbox logic~~ — now delegates to `getElementValue`.
- ~~`determineAction` splits on `|` before checking `url:`~~ — `url:` is now checked first.
- ~~`autoFocus` step 3 excludes `a[href]`~~ — fallback now uses `FOCUSABLE` constant minus close button.
- ~~`aria-hidden` missing from modal background~~ — `setInert`/`removeInert` now also set/remove `aria-hidden="true"` on `[data-el=page-content]`.
- ~~`getStorageItem` reads localStorage twice~~ — now reads once, returns the stored value directly.
- ~~`readServerMessages` never re-enables the form~~ — now calls `enableForm` automatically when `success` is false.
- ~~`disableForm`/`enableForm` comments inconsistent across files~~ — both functions now consistently describe the automatic pairing.
- ~~`data-input` binding undocumented~~ — added to Syntax section in FRAMEWORK.md.
- ~~Modifier order wrong in `actions.js` header~~ — corrected to Ctrl, Alt, Shift, Meta (matches `buildChord`).
- ~~Load order section didn't explain the constraint~~ — now explains that only `project.js` has a hard dependency on load order.
- ~~`addDialogTitleIds` undocumented~~ — added to the Dialogs section in FRAMEWORK.md.
- ~~`confirm()` missing from "What this replaces"~~ — added alongside `alert()` and `prompt()`.
- ~~`aria-live` for `data-show-when` reveals undocumented~~ — added to Dynamic fields accessibility section.
- ~~`toggle` comment described `aria-expanded` as "opt-in signal"~~ — corrected to describe it as declaring initial ARIA state.
- ~~`closeDialog` assignment-in-condition~~ — refactored to explicit `if/else` with separate assignment and condition.
- ~~Native dialog hard cut migration~~ — dialogs now use native `<dialog>` with Brio policy for dismiss and focus return.
