# Brio

A lightweight, declarative JavaScript framework for multi-page websites and web apps. Behaviour is bound to HTML elements via data-attributes. One event listener on `document` handles everything. No build step, no dependencies.

## Mental model

HTML declares *what* happens. JavaScript defines *how*. When you scan the HTML, it is immediately clear which element does what — without hunting through JS files.

```html
<button data-click="openDialog(confirm)">Delete</button>
<button data-click="saveItem|closeDialog(confirm)">Confirm</button>
```

---

## Files and load order

Always load in this order:

```html
<script src="utils.js"    defer></script>
<script src="actions.js"  defer></script>
<script src="binding.js"  defer></script>
<script src="dialogs.js"  defer></script>
<script src="feedback.js" defer></script>
<script src="project.js"  defer></script>
```

All files require `defer` or placement before `</body>`.

`project.js` must come last because it calls functions defined in the other files. The order of the four core files is otherwise flexible — each one checks `typeof fn === 'function'` before calling across file boundaries.

| File | Responsibility |
|---|---|
| `utils.js` | DOM, string, number, URL, storage, date, network helpers + dynamic form fields |
| `actions.js` | Event delegation framework — the core dispatcher |
| `binding.js` | Reactive state store, `data-bind`/`data-bind-*`, no-refresh patch helpers |
| `dialogs.js` | Native `<dialog>` open/close, focus return, dismissal policy |
| `feedback.js` | Inline messages for client-side and server-side feedback |
| `project.js` | Project-specific action functions |

---

## What this replaces — do not use these patterns

| Don't use | Use instead |
|---|---|
| `el.addEventListener('click', fn)` | `data-click="fnName"` |
| `onclick="..."` inline handlers | `data-click="fnName"` |
| `alert()`, `confirm()`, `prompt()` | Modal dialog with `role="alertdialog"` |
| Toast libraries, snackbars | `showMessage()` |
| jQuery or other DOM libraries | Not needed |
| Custom event binding per component | `registerEvent()` for non-core types |
| Separate validation + feedback systems | `showMessage()` / `readServerMessages()` |

---

## HTML authoring principles for Brio

Brio is a behaviour layer on top of good HTML. When you add Brio to a page, start from clean, semantic markup and then layer `data-*` attributes on top.

### 1. Structure pages around real content, not components

- Exactly **one `<h1>` per page** describing what the page is about.
- Use **`<h2>` / `<h3>` for real sections and subsections**, not for styling. The heading outline should make sense as a table of contents.
- Group related content into logical blocks (for example: “Features”, “Examples”, “Feedback”), each with a clear heading and body.

### 2. Prefer semantic containers over generic `<div>`

- Use HTML5 landmarks when they fit:
  - `header`, `nav`, `main`, `footer`
  - `section` for major thematic blocks
  - `article` for standalone pieces (for example: a case study or blog post)
- Only fall back to `div` when there is no meaningful semantic element.

### 3. Model repeated content as lists

- Whenever you have a repeating pattern (cards, tiles, logos, features, steps, snippets), structure it as a list:
  - Wrap siblings in `<ul>` / `<ol>` and each item in `<li>`.
- Styling is handled by classes; the list structure is for semantics and accessibility.

### 4. Make CTAs predictable and context-aware

- Each major section should have **at most one primary call-to-action**, placed near the end of that section.
- CTA labels should **continue the section’s story** (“See more work”, “View all docs”, “Build your bundle”), not generic “Click here”.

### 5. Use classes to describe role and layout, not visual details

- Class names should describe **what the block is** or **how it is arranged**, not pixel values or ad-hoc colours.
  - Good: `section-spacing`, `three-columns`, `logo-banner`, `feature-list`, `reading-width`.
  - Avoid: names that encode exact values or one-off styling (for example: `mt-42`, `blue-box-3`).
- Use CSS to handle colours, spacing, borders, and typography; HTML carries structure and meaning.

### 6. Accessibility in the HTML, not as an afterthought

- Always set `lang` on `<html>` and include a responsive `viewport` meta tag.
- For content:
  - Provide `alt` text on informative images; use `alt=""` for purely decorative ones.
  - Mark the active nav link with `aria-current="page"`.
  - Use `<blockquote>` for quotes and keep attribution in separate elements.
- Brio may add ARIA or `inert` at runtime, but the static HTML should already reflect the correct relationships (for example: headings inside dialogs, labels for inputs).

### 7. Progressive enhancement and minimal scripting

- Pages should be **readable and navigable without JavaScript**. Brio enhances behaviour; it never replaces content.
- Prefer:
  - Native anchors for navigation.
  - Standard form semantics for forms.
  - Brio `data-*` attributes for behaviour only, not for layout.
- JavaScript should **bind to existing structure** instead of introducing extra wrapper elements purely for scripting.

### 8. Native first, `data-*` only when needed

- Use native HTML wherever possible:
  - `required`, `type="email"`, `min`, `max`, `pattern`, `<details>` / `<summary>`, and so on.
- Introduce Brio `data-*` attributes only:
  - To declare behaviour that has no native equivalent (conditions, actions, shortcuts).
  - To connect declarative behaviour to existing semantic structure.

### 9. Keep the `<head>` minimal but complete

- Include the essentials:
  - `charset`, `viewport`, `title`, and `meta description`.
  - Optional but recommended for public pages: Open Graph / Twitter metadata.
- Load CSS and fonts with `<link>` and JavaScript with `<script defer>`. Avoid inline scripts in `<head>` unless strictly necessary.

### 10. Write HTML as if it were long-form content

- Draft the **plain HTML structure first** (headings, sections, paragraphs, lists).
- Only then add:
  - Classes for layout and visual design.
  - Brio `data-*` attributes for behaviour.
- Aim for HTML that still makes sense, and is pleasant to read, when CSS and JS are stripped away.

These principles apply to both documentation pages and real Brio-powered applications. Brio’s job is to wire behaviour into already-good HTML, not to compensate for weak structure.

---


---

## Functional CSS (`brio.css`)

Brio is split into layers:

- `brio.js` — behavior (actions, dialogs, feedback, conditions)
- `brio.css` — minimal functional baseline so behavior is usable out of the box
- project/theme CSS — visual design and branding

Recommended include:

```html
<link rel="stylesheet" href="brio.css">
<script src="brio.js" defer></script>
```

### Feature matrix

| Feature | JS module | Minimal CSS needed |
|---|---|---|
| Dialogs (`<dialog>`) | `dialogs.js` | `dialog[open]` positioning, `dialog::backdrop`, default z-layer, modal scroll-lock |
| Feedback messages | `feedback.js` | `[data-message][hidden]` visibility and optional `[data-message][data-type]` baseline |
| Loading states | `actions.js` + form helpers | `button[data-state="loading"]` non-interactive baseline |
| Hidden toggles | `actions.js` / dynamic fields | `[hidden] { display: none !important; }` consistency fallback |

### Scope of `brio.css`

`brio.css` intentionally avoids design opinions (typography, color palette, spacing system, component look). It only provides behavior-supporting defaults. Use project CSS for brand/theme styling.

## actions.js

Single `document` event listener handles all interactions. Action functions are resolved dynamically from the global scope — any function you define is immediately available as a data-attribute value.

### Action function signature

Every project action function must follow this signature:

```js
function myAction(el, event, target) {
  // el     — the element that triggered the action (or null from URL)
  // event  — the native DOM event (or null from URL)
  // target — the string inside parentheses, or null
}
```

### Core event types

`click`, `change`, `input`, `submit` are always registered. Add others on demand:

```js
registerEvent('dragstart');
registerEvent('dragover');
```

### Syntax

```html
<!-- Single action -->
<button data-click="myAction">...</button>

<!-- Action with target argument -->
<button data-click="myAction(someId)">...</button>

<!-- Multiple actions (pipe-separated) -->
<button data-click="firstAction|secondAction(target)">...</button>

<!-- On change (select, checkbox, radio) -->
<select data-change="myAction">...</select>

<!-- On input — fires on every keystroke, useful for live search or counters -->
<input data-input="myAction" type="text">

<!-- On submit -->
<form data-submit="myAction">...</form>

<!-- Keyboard shortcut (event.key string) -->
<button data-key="n">...</button>

<!-- URL trigger -->
https://example.com?action=myAction(someId)
```

### Built-in shorthands

```html
<!-- Navigate -->
<a data-click="url:https://example.com">...</a>

<!-- Reload page -->
<button data-click="refresh">...</button>
```

### Keyboard shortcut chords

Modifiers are always written in this order: `Ctrl`, `Alt`, `Shift`, `Meta`. This matches the order in which `buildChord` assembles the string internally, so what you write is what gets matched.

```html
<button data-key="n">New item</button>
<button data-key="Ctrl+s">Save</button>
<button data-key="Ctrl+Shift+z">Redo</button>
```

### Dynamic form fields

Declare conditional visibility/disabled state directly in HTML. Evaluated automatically on every `change` and `submit` event (not `input` — dynamic fields are typically controlled by selects and checkboxes, which fire `change`).

**Condition syntax:**
- `fieldId==value` — field equals value
- `fieldId!=value` — field does not equal value
- `cond1||cond2` — OR: applied if ANY condition is met
- `cond1&&cond2` — AND: applied if ALL conditions are met

```html
<!-- Hide when #status is not "active" -->
<div data-hide-when="status!=active">...</div>

<!-- Show when #plan is "pro" OR "enterprise" -->
<div data-show-when="plan==pro||plan==enterprise">...</div>

<!-- Show when #plan is "enterprise" AND #seats equals "10" -->
<div data-show-when="plan==enterprise&&seats==10">...</div>

<!-- Disable when #plan is "free" -->
<select data-disable-when="plan==free">...</select>

<!-- Enable when #plan is "pro" -->
<button data-enable-when="plan==pro">...</button>
```

### Dynamic binding

Bind visible text and attributes to state, DOM field values, or templates.

**Source syntax** — two types, freely mixable in templates:

| Syntax | Reads from |
|---|---|
| `#id` | DOM element — `.value` for inputs/selects/textareas, `.textContent` for others |
| `object.property` | Brio state first, then global `window` fallback |

**Declarative text binding**:

```html
<!-- Mirror a DOM element -->
<span data-bind="#field-id"></span>

<!-- Read from state/window object -->
<span data-bind="translations.saveButton"></span>

<!-- Template: mix both freely -->
<span data-bind="{{#qty}} × {{pricing.currency}}{{#price}}"></span>
<span data-bind="{{pricing.billingNote}} · {{#qty}} seats at {{pricing.currency}}{{#price}}"></span>
```

**Declarative attribute binding**:

```html
<a data-bind-href="links.profile" data-bind="ui.profileLabel"></a>
<button data-bind-disabled="ui.saving">Save</button>
<input data-bind-value="profile.name">
```

**Programmatic** — call from any action function after an async result or calculation:

```js
setText('status-label', 'Opgeslagen')     // by element id
setText(el, translations.saved)           // by element reference

// Typical async pattern
async function saveDocument(el) {
  setText('save-status', ui.statusSaving)
  await fetch('/api/save', { method: 'POST' })
  setText('save-status', ui.statusSaved)
  setText('save-timestamp', new Date().toLocaleTimeString())
}
```

After updating state, call `refreshBindings()` to re-evaluate bind expressions.

```js
BRIO_API.setState({ ui: { greeting: 'Welkom terug', saveButton: 'Opslaan' } })
refreshBindings()
```

---

## binding.js

Adds reactivity primitives on top of Brio actions.

- `data-bind` updates `textContent`
- `data-bind-*` updates attributes/properties (`href`, `src`, `value`, `disabled`, `hidden`, etc.)
- `BRIO_API` exposes `setState`, `getState`, and `refreshBindings`
- `BRIO_API.applyResponse(data, form?)` applies `state`/`patches`/`append` payloads programmatically
- `data-fetch` submit responses may return `state`, `patches`, and `append` for no-refresh UI updates

Security baseline for bind attributes:

- `data-bind-*` only applies a safe allowlist (standard attrs + `aria-*` + `data-*`).
- Unsupported bind targets are ignored with a console warning.

## dialogs.js

Manages native `<dialog>` elements. Brio keeps declarative action wiring, focus return, and dismissal policy.

```html
<dialog id="confirm" aria-labelledby="confirm-title">
  <h2 id="confirm-title">Are you sure?</h2>
  <button data-el="close-button" data-click="closeDialog(confirm)">Cancel</button>
  <button data-click="deleteItem|closeDialog(confirm)">Delete</button>
</dialog>
```

### Dialog types

| Type | Attribute | Behaviour |
|---|---|---|
| Modal | default | Opened with native `showModal()` |
| Modeless | `data-modeless` | Opened with native `show()` |

### Available actions (called via data-click)

```html
<button data-click="openDialog(confirm)">Open</button>
<button data-click="closeDialog(confirm)">Close specific</button>
<button data-click="closeDialog">Close current open dialog</button>
<button data-click="closeAllDialogs">Close all</button>
```

### Auto-focus

When a dialog opens, focus moves automatically to the first visible focusable element that is not the close button — including links, inputs, selects, textareas, and buttons. To override and focus a specific element, add `data-autofocus`:

```html
<!-- Default: focuses first interactive element (skipping the close button) -->
<dialog ...>
  <button data-el="close-button" ...>✕</button>
  <input type="text">  <!-- receives focus automatically -->
</dialog>

<!-- Override: focus a specific element -->
<dialog ...>
  <button data-el="close-button" ...>✕</button>
  <input type="text">
  <textarea data-autofocus></textarea>  <!-- receives focus instead -->
</dialog>
```

### Accessible names

`addDialogTitleIds()` runs at init and assigns `id="dialogId-title"` to the first `<h2>` found inside each `<dialog>`, so that `aria-labelledby` can reference it. If the h2 already has an id it is left unchanged. If a dialog has no h2 and no `aria-label` or `aria-labelledby`, a console warning is logged.

### Dismissal policy

- Escape/backdrop dismiss is blocked unless the dialog contains an enabled `[data-el=close-button]`.
- This allows required-answer dialogs without accidental dismiss.

### Prevent reopen

By default, if a modal is open and another opens, the first is remembered and reopened when the second closes. Opt out per dialog:

```html
<dialog id="alert" data-reopen="false">
```

---

## feedback.js

Inline message system for client-side and server-side feedback. This is also how **form validation** is handled — both client-side and server-side validation results flow through `[data-message]` regions and the same `showMessage` / `readServerMessages` API.

### HTML patterns

```html
<!-- Field-level: linked to input via data-for="fieldId" -->
<!-- The framework automatically wires aria-describedby on the input -->
<input id="email" type="email">
<span data-message data-for="email" hidden></span>

<!-- Form-level: scoped to form container -->
<form id="booking-form">
  <div data-message hidden></div>
  ...fields...
</form>

<!-- Non-form action feedback: nearest sibling -->
<button data-click="addToCart">Add to cart</button>
<span data-message hidden></span>

<!-- Custom scope for non-form containers -->
<div data-feedback-scope>
  <div data-message hidden></div>
  <button data-click="myAction">Go</button>
</div>
```

### Form validation pattern

For validation (client-side or server-side), use `novalidate` on the form to disable native browser validation, then handle it yourself in your submit action:

```html
<form id="contact-form" data-submit="submitContact" novalidate>
  <div data-message hidden></div>

  <label for="email">Email</label>
  <input id="email" type="email" name="email">
  <span data-message data-for="email" hidden></span>

  <button type="submit">Send</button>
</form>
```

```js
async function submitContact(el, event, target) {
  event.preventDefault();
  clearMessages(el);

  // Client-side check
  const email = document.getElementById('email');
  if (!email.value) {
    showMessage('email', 'Email is required.', 'error');
    enableForm('contact-form'); // re-enable if returning early before server call
    return;
  }

  // Server-side — response shape handles field + form-level messages.
  // readServerMessages automatically calls enableForm when success is false.
  const data = await getData('/api/contact', true);
  readServerMessages(el, data);
}
```

### JavaScript API

```js
// Show a message — target is a field id (string) or triggering element
showMessage('email', 'Please enter a valid email address.', 'error');
showMessage(el, 'You have reached the maximum.', 'info');

// Read and distribute a server response.
// Also calls enableForm automatically when success is false.
readServerMessages(el, responseData);

// Clear all messages in the nearest form or [data-feedback-scope]
clearMessages(el);
```

Message types: `error` (default) | `success` | `info` | `warning`

Style via CSS using `[data-message][data-type="error"]` etc.

### Server response contract

All server endpoints must return this shape:

```json
{
  "success": true,
  "messages": [
    { "field": "email", "message": "Please enter a valid email address", "type": "error" },
    { "field": null,    "message": "Something went wrong on our end",    "type": "error" }
  ]
}
```

- `field: "id"` → routes to `[data-message][data-for="id"]`
- `field: null` → routes to the nearest form-level `[data-message]`
- HTTP status codes should also be set correctly (`200`, `400`, `409`, etc.)

### Kirby CMS — normalizing Uniform errors

Kirby Uniform returns errors in a different shape. Use this PHP helper to normalize:

```php
function formResponse($form) {
  $messages = [];
  foreach ($form->errors() as $field => $errors) {
    foreach ($errors as $message) {
      $messages[] = ['field' => $field, 'message' => $message, 'type' => 'error'];
    }
  }
  return Response::json([
    'success'  => $form->success(),
    'messages' => $messages
  ], $form->success() ? 200 : 400);
}
```

Then every route ends with: `return formResponse($form);`

---

## Disclosure

| Function | Description |
|---|---|
| `toggle(el, event, target)` | Toggle `hidden` on target element. Manages `aria-expanded` and `aria-controls` automatically. If no target is given, uses `nextElementSibling` and auto-generates an id if needed. |

Add `aria-expanded="false"` to the trigger to declare the correct initial ARIA state before any interaction — `toggle` keeps it in sync from that point on.

```html
<!-- Explicit target id -->
<button data-click="toggle(faq-1)" aria-expanded="false">Question</button>
<div id="faq-1" hidden>Answer</div>

<!-- Implicit next sibling — no target needed, id auto-generated -->
<button data-click="toggle" aria-expanded="false">Show more</button>
<div hidden>More content</div>
```

---

## Accessibility conventions

### Dialogs
- Focus moves into the dialog on open (`[data-autofocus]` or first focusable element, skipping the close button)
- Focus returns to the opener when the dialog closes (stack-based, handles stacking correctly)
- Escape closes modal dialogs automatically — blocked if no enabled `[data-el=close-button]` exists
- Required-answer dialogs: omit or disable `[data-el=close-button]` to prevent Escape dismissal
- Use `role="alertdialog"` for dialogs that require a decision
- Native modal dialogs use the browser's top-layer behavior (`showModal()`), including background interaction blocking and focus containment.

### Keyboard shortcuts
- `data-key` uses `event.key` strings: `"n"`, `"Escape"`, `"Enter"`, `"ArrowDown"` etc.
- Letter keys are case-sensitive — use lowercase: `"n"` not `"N"`
- Multi-key chords must be written in Ctrl–Alt–Shift–Meta order: `"Ctrl+Alt+s"` not `"Alt+Ctrl+s"`

### Feedback messages
- `[data-message]` regions are announced automatically — errors via `role="alert"`, others via `aria-live="polite"`
- Field-level messages are wired to their input via `aria-describedby` automatically when `showMessage` is called
- No manual `aria-describedby` needed in HTML

### Loading state
- `disableForm(formId)` sets `aria-busy="true"` on the form while submission is in progress
- The submit control gets `data-state="loading"` for functional styling, plus `aria-disabled="true"` and `disabled`
- `enableForm(formId)` removes these loading/accessibility attributes when the form is released

### Dynamic fields
- `data-show-when` / `data-hide-when` handle visual state only
- For button-triggered disclosure, use `toggle()` — it manages `aria-expanded` and `aria-controls`
- For form-field-driven disclosure (e.g. a checkbox revealing an extra field), add `aria-controls="target-id"` to the controlling element manually so screen readers understand the relationship
- If the revealed content contains important information (not just an extra input the user is about to fill in), also add `aria-live="polite"` to the revealed region so its appearance is announced

---

## utils.js — reference

### DOM
| Function | Description |
|---|---|
| `hasAncestor(el, selector)` | Returns true if el has a matching ancestor |
| `focus(id)` | Focus element by id |
| `disable(el, event, selector)` | Disable element by selector, or the triggering el |
| `disableForm(formId)` | Set fields to readOnly after submit, mark form as `aria-busy`, and set submit to `data-state="loading"` + `aria-disabled`. Called automatically by actions.js on every submit. |
| `enableForm(formId)` | Reverse `disableForm`. Called automatically by `readServerMessages` when `success` is false. Call manually if handling errors outside `readServerMessages`. |
| `setThemeColor(color)` | Set or create `<meta name="theme-color">` |

### String
| Function | Description |
|---|---|
| `ucFirst(string)` | Capitalise first character |
| `hasNumber(string)` | Returns true if string contains a digit |

### Number
| Function | Description |
|---|---|
| `getRandomNumber(range, negative)` | Random int within range, optionally negative |

### URL
| Function | Description |
|---|---|
| `removeParams()` | Strip all query parameters from the current URL |

### Storage
| Function | Description |
|---|---|
| `getStorageItem(key, default)` | Get localStorage item, create with default if absent. Safe in private mode. |

### Date
| Function | Description |
|---|---|
| `getRelativeDate(timestamp)` | Returns localised relative date string. Requires `translations.today` and `translations.yesterday` in scope. |

### Network
| Function | Description |
|---|---|
| `getData(url, parse)` | Async fetch with Bearer auth. Requires `jwtToken` in scope. Pass `true` to parse as JSON. |

### Timing
| Function | Description |
|---|---|
| `debounce(fn, wait)` | Returns a debounced version of fn. Fires after `wait` ms of inactivity. Default 300ms. Use for search inputs, resize. |
| `throttle(fn, wait)` | Returns a throttled version of fn. Fires at most once per `wait` ms. Default 100ms. Use for scroll, mousemove. |

### Binding helpers
| Function | Description |
|---|---|
| `setText(target, value)` | Set `textContent` of an element by id (string) or reference. |
| `refreshBindings(scope?)` | Re-evaluate all declarative bindings (`data-bind`, `data-bind-*`) on document or an optional scope element. |
| `getElementValue(el)` | Returns `.value` for form fields, `'true'`/`'false'` for checkboxes, `.textContent` for other elements. Shared by dynamic fields, binding, and condition evaluation. |

---

## Writing project action functions

Action functions live in `project.js` (or equivalent). They are called automatically by `actions.js` when a matching `data-*` attribute is found.

```js
// Simple action
function saveItem(el, event, target) {
  // ...
}

// Async action with server feedback
async function bookSlot(el, event, target) {
  clearMessages(el);
  try {
    const data = await getData('/api/book/' + target, true);
    readServerMessages(el, data); // also calls enableForm if success is false
    if (data.success) closeDialog(null, null, 'booking');
  } catch (e) {
    showMessage(el, 'Something went wrong. Please try again.', 'error');
    enableForm(el.closest('form')?.id);
  }
}
```

### Registering non-core event types

```js
// Call before injecting elements that use this event type
registerEvent('dragstart');
```
