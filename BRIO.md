# Brio — condensed reference for AI assistants

Lightweight declarative JS for multi-page sites. HTML declares *what*; JS defines *how*. No build step, no dependencies.

## Load order

```html
<link rel="stylesheet" href="brio.css">
<script src="utils.js"    defer></script>
<script src="actions.js"  defer></script>
<script src="binding.js"  defer></script>
<script src="dialogs.js"  defer></script>
<script src="feedback.js" defer></script>
<script src="project.js"  defer></script>
```

Or bundled: `<script src="brio.js" defer></script>` + `brio.css`.

## Action function signature

Every project action in `project.js`:

```js
function myAction(el, event, target) {
  // el     — triggering element (or null from URL)
  // event  — native DOM event (or null from URL)
  // target — string inside parentheses, or null
}
```

## Core attributes

| Attribute | Fires on | Example |
|---|---|---|
| `data-click` | click | `data-click="saveItem\|closeDialog(confirm)"` |
| `data-change` | change | `data-change="onPlanChange"` |
| `data-input` | input | `data-input="liveSearch"` |
| `data-submit` | submit | `data-submit="submitForm"` |
| `data-key` | keydown | `data-key="Ctrl+s"` (modifiers: Ctrl, Alt, Shift, Meta) |
| `data-fetch` | submit (no reload) | on `<form>` — uses native `action` + `method` |
| `data-bind` | auto | `data-bind="user.name"` or `data-bind="{{#qty}} × {{price}}"` |
| `data-bind-*` | auto | `data-bind-disabled="ui.saving"` |
| `data-show-when` / `data-hide-when` | auto | `data-show-when="plan==pro"` |
| `data-enable-when` / `data-disable-when` | auto | `data-disable-when="plan==free"` |
| `data-message` | — | feedback region; `data-for="fieldId"` for field-level |

Built-in shorthands: `data-click="url:https://…"`, `data-click="refresh"`.

## Built-in functions (do not reimplement)

- **Dialogs:** `openDialog(el, event, id)`, `closeDialog(el, event, id)`, `closeAllDialogs()`
- **Toggle:** `toggle(el, event, targetId?)`
- **Feedback:** `showMessage(target, message, type?)`, `readServerMessages(el, data)`, `clearMessages(el)`
- **Forms:** `disableForm(formId)`, `enableForm(formId)` — auto on submit / failed response

## Dialog HTML contract

```html
<dialog id="confirm" aria-labelledby="confirm-title">
  <h2 id="confirm-title">Are you sure?</h2>
  <button data-el="close-button" data-click="closeDialog(confirm)">Cancel</button>
  <button data-click="deleteItem|closeDialog(confirm)">Delete</button>
</dialog>
```

Escape/backdrop dismiss only when an enabled `[data-el=close-button]` exists.

## data-fetch forms

```html
<form id="contact-form" action="/api/contact" method="post" data-fetch novalidate>
  <div data-message hidden></div>
  <input id="email" name="email" type="email">
  <span data-message data-for="email" hidden></span>
  <button type="submit">Send</button>
</form>
```

**Requirements:** form must have `id` (for re-enable after submit). Use `novalidate` when validating server-side.

Optional: `data-fetch-append-target="#list-id"` — server can append cloned rows.

## Server response contract

All endpoints return JSON:

```json
{
  "success": true,
  "messages": [
    { "field": "email", "message": "Invalid email", "type": "error" },
    { "field": null, "message": "Saved", "type": "success" }
  ],
  "state": { "ui": { "label": "Done" } },
  "append": [
    {
      "target": "#comment-list",
      "template": "tpl-comment-row",
      "items": [{ "body": "Hello", "time": "12:00" }]
    }
  ]
}
```

- `field: null` → form-level `[data-message]` without `[data-for]`
- `field: "id"` → `[data-message][data-for="id"]`
- Prefer **template append** (`template` + `items`) over raw HTML in `append`/`patches`
- Raw HTML in `patches`/`append` is trusted-server-only; use `configureSanitizeHtml(fn)` if needed

## BRIO_API (canonical public API)

```js
BRIO_API.setState({ ui: { saving: true } })
BRIO_API.getState('ui.saving')
BRIO_API.refreshBindings()
BRIO_API.applyResponse(data, form?)
BRIO_API.registerAfterFetch(fn)
configureAuth(fn)           // for getData Bearer token
configureTranslations(obj) // for getRelativeDate
configureSanitizeHtml(fn)  // for untrusted HTML in patches/append
```

Deprecated aliases (still work): `setBrioState`, `getBrioState`, `window.brioAfterFetch`.

## Do not use

- `addEventListener` per element → use `data-click` etc.
- `alert()` / `confirm()` → native `<dialog>` + `openDialog`
- Toast libraries → `showMessage()`
- jQuery → not needed

Full reference: [docs/brio.md](docs/brio.md)
