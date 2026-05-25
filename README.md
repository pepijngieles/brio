# Brio

A lightweight, declarative JavaScript framework for multi-page websites and web apps. Behaviour is bound to HTML elements via `data-*` attributes. One event listener on `document` handles everything.

**No build step. No dependencies. ~5 KB total.**

## Why Brio

HTML declares *what* happens. JavaScript defines *how*. When you scan the HTML, it is immediately clear which element does what — without hunting through JS files.

```html
<button data-click="openDialog(confirm)">Delete</button>
<button data-click="saveItem|closeDialog(confirm)">Confirm</button>
```

## What's included

| File | What it does |
|---|---|
| `brio.js` | **Bundled core** — all modules below, built via `npm run build` |
| `utils.js` | DOM, string, number, URL, storage, date, network helpers + dynamic field conditions |
| `actions.js` | Event delegation — the core dispatcher |
| `binding.js` | Reactive state, `data-bind` / `data-bind-*`, no-refresh form patching |
| `dialogs.js` | Native `<dialog>` open/close, focus return, dismissal policy |
| `feedback.js` | Inline messages for client-side and server-side feedback |
| `brio.css` | Functional baseline for dialog, hidden, feedback, and loading states |
| `project.js` | Your action functions (not part of the library) |

## Getting started

### Option A — bundled (default)

```html
<link rel="stylesheet" href="brio.css">
<script src="brio.js" defer></script>
<script src="project.js" defer></script>
```

Download `brio.js` from the repo root, or use the CDN:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/pepijngieles/brio@v0.1.0/dist/brio.css">
<script src="https://cdn.jsdelivr.net/gh/pepijngieles/brio@v0.1.0/brio.js" defer></script>
<script src="project.js" defer></script>
```

### Option B — modular files (vendoring)

Copy `src/*.js` into your project (same order as inside `brio.js`):

```html
<link rel="stylesheet" href="brio.css">
<script src="utils.js"    defer></script>
<script src="actions.js"  defer></script>
<script src="binding.js"  defer></script>
<script src="dialogs.js"  defer></script>
<script src="feedback.js" defer></script>
<script src="project.js"  defer></script>
```

`brio.css` keeps behavior-driven UI states (dialogs, hidden elements, feedback messages, loading buttons) functional by default, while your project CSS remains in control of visual design.

Define action functions in `project.js` — they're automatically available as `data-*` values:

```js
function saveItem(el, event, target) {
  // el     — the element that triggered the action
  // event  — the native DOM event
  // target — the string inside parentheses, or null
}
```

```html
<button data-click="saveItem(item-123)">Save</button>
```

## Quick examples

**Dialogs** — native `<dialog>` with declarative Brio actions:

```html
<button data-click="openDialog(confirm)">Delete item</button>

<dialog id="confirm" aria-labelledby="confirm-title">
  <h2 id="confirm-title">Are you sure?</h2>
  <button data-el="close-button" data-click="closeDialog(confirm)">Cancel</button>
  <button data-click="deleteItem|closeDialog(confirm)">Delete</button>
</dialog>
```

**Dynamic fields** — show/hide/enable/disable based on other field values:

```html
<select id="plan">
  <option value="free">Free</option>
  <option value="pro">Pro</option>
</select>

<div data-show-when="plan==pro" hidden>
  <label for="seats">Number of seats</label>
  <input type="text" id="seats">
</div>
```

**Inline feedback** — field-level and form-level messages:

```html
<input id="email" type="email">
<span data-message data-for="email" hidden></span>
```

```js
showMessage('email', 'Please enter a valid email.', 'error');
```

**Keyboard shortcuts** — single keys and modifier chords:

```html
<button data-key="n" data-click="newItem">New item</button>
<button data-key="Ctrl+s" data-click="save">Save</button>
```

**No-refresh forms** — submit without page reload:

```html
<form id="contact-form" action="/api/contact" method="post" data-fetch novalidate>
  <div data-message hidden></div>
  <input id="email" name="email" type="email">
  <span data-message data-for="email" hidden></span>
  <button type="submit">Send</button>
</form>
```

The form must have an `id`. Server returns `{ "success": true, "messages": [...] }`.

## Documentation

- **[BRIO.md](BRIO.md)** — condensed reference for AI assistants (copy into `.cursorrules` / `CLAUDE.md`)
- **[Full API reference (Markdown)](docs/brio.md)** — complete documentation of every attribute, function, and convention
- **[Interactive reference](docs/reference.html)** — browsable site with sidebar and live demos
- **[llms.txt](llms.txt)** — LLM tooling index

## License

[MIT](LICENSE)
