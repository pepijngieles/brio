/*

  Action Framework
  ─────────────────
  Bind behaviour to HTML elements declaratively using data-attributes.

    <button data-click="openDialog(settings)">Open</button>
    <button data-click="openDialog(settings)|openTab(general)">Open</button>

  Supported event types: click, change, input, submit (always registered)
  Additional event types can be registered on demand via registerEvent().

  Keyboard shortcut (single key):   data-key="n"
  Keyboard shortcut (chord):        data-key="Ctrl+s"  data-key="Ctrl+Shift+z"
  Supported modifiers (in order):   Ctrl  Alt  Shift  Meta
  URL trigger:                      ?action=openDialog(settings)

  Built-in action shorthand:
    url:<href>   — navigate to a URL  (e.g. data-click="url:https://example.com")
    refresh      — reload the page

  All other action names are resolved dynamically from the global scope,
  so any function you define is immediately available as a data-action value.
  The function signature is: myAction(targetElement, event, target)

  Registering additional event types:
  ─────────────────────────────────────
  Call registerEvent() before injecting elements that use non-core event types.

    registerEvent('dragstart');
    registerEvent('dragover');

*/


// ─── 1. Event listeners ───────────────────────────────────────────────────────

const registeredEvents = new Set(['click', 'change', 'input', 'submit']);

document.addEventListener('click',            handleEvents,      false);
document.addEventListener('change',           handleEvents,      false);
document.addEventListener('input',            handleEvents,      false);
document.addEventListener('submit',           handleEvents,      false);
document.addEventListener('keydown',          handleKeys,        false);
document.addEventListener('DOMContentLoaded', checkParameters,   false);


// ─── 2. Dynamic event registration ───────────────────────────────────────────

function registerEvent(eventType) {
  if (!registeredEvents.has(eventType)) {
    document.addEventListener(eventType, handleEvents, false);
    registeredEvents.add(eventType);
  }
}


// ─── 3. Event handler ─────────────────────────────────────────────────────────

function handleEvents(event) {

  // Calls disableForm (defined in utils.js) after every submit to lock the
  // form during the request. Reversed automatically by readServerMessages
  // when the server returns success: false.
  if (event.type === 'submit' && typeof disableForm === 'function') {
    disableForm(event.target.id);
  }

  // Fire data-action if present on the target or any ancestor
  const targetElement = event.target.closest(`[data-${event.type}]:not([disabled])`);
  if (targetElement) {
    determineAction(targetElement, event, targetElement.dataset[event.type]);
  }

  // Refresh conditional field visibility on change and submit.
  // Not run on input — dynamic fields are controlled by selects and checkboxes
  // (which fire change), not by freeform text input.
  if (['change', 'submit'].includes(event.type) && typeof updateDynamicFields === 'function') {
    updateDynamicFields();
  }

  // Refresh declarative bindings on change, input, and submit.
  if (['change', 'input', 'submit'].includes(event.type) && typeof refreshBindings === 'function') {
    refreshBindings();
  }

  // Intercept no-refresh form submits after action dispatch.
  // Action handlers can opt out by calling event.preventDefault().
  if (
    event.type === 'submit' &&
    event.target instanceof HTMLFormElement &&
    event.target.hasAttribute('data-fetch') &&
    !event.defaultPrevented &&
    typeof brioSubmitFetch === 'function'
  ) {
    brioSubmitFetch(event.target, event);
  }

}


// ─── 4. Keyboard handler ──────────────────────────────────────────────────────

// Index of data-key elements, built at init and kept current via MutationObserver.
// Maps chord string → array of elements, avoiding a querySelectorAll on every keydown.
let keyIndex = new Map();

function buildKeyIndex() {
  keyIndex = new Map();
  for (const el of document.body.querySelectorAll('[data-key]')) {
    const chord = el.dataset.key;
    if (!keyIndex.has(chord)) keyIndex.set(chord, []);
    keyIndex.get(chord).push(el);
  }
}

// Rebuild the index when elements are added or removed, or when data-key changes.
const keyIndexObserver = new MutationObserver(buildKeyIndex);

document.addEventListener('DOMContentLoaded', () => {
  buildKeyIndex();
  keyIndexObserver.observe(document.body, {
    childList:  true,
    subtree:    true,
    attributes: true,
    attributeFilter: ['data-key']
  });
});

function handleKeys(event) {
  // Ignore shortcuts while the user is typing in a field
  if (event.target.matches('input, textarea, select, [contenteditable]')) return;

  const chord = buildChord(event);
  const targets = keyIndex.get(chord);
  if (!targets) return;

  for (const el of targets) {
    if (el.offsetParent !== null) {
      event.preventDefault(); // prevent browser defaults (e.g. Ctrl+S save dialog)
      el.click();
    }
  }
}

// Builds a normalised chord string from a keyboard event.
// Modifiers are always in this order: Ctrl, Alt, Shift, Meta.
// The key is lowercased for single printable characters.
// Examples: "n", "Escape", "Ctrl+s", "Ctrl+Shift+z", "Alt+ArrowDown"
function buildChord(event) {
  const modifiers = [];
  if (event.ctrlKey)  modifiers.push('Ctrl');
  if (event.altKey)   modifiers.push('Alt');
  if (event.shiftKey) modifiers.push('Shift');
  if (event.metaKey)  modifiers.push('Meta');

  // Lowercase single printable characters; keep special keys as-is (Escape, Enter, ArrowDown…)
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

  return modifiers.length ? modifiers.join('+') + '+' + key : key;
}


// ─── 5. URL parameter actions ─────────────────────────────────────────────────

function checkParameters() {
  const action = new URL(window.location.href).searchParams.get('action');
  if (action) determineAction(null, null, action);
}


// ─── 6. Action parser ─────────────────────────────────────────────────────────

const ACTION_REGEX = /^(\w+)(?:\((.+)\))?$/;

function determineAction(targetElement, event, action) {
  action = action.trim();

  // Built-in: url redirect — checked before pipe split so URLs containing
  // a pipe character are not incorrectly split into multiple actions.
  if (action.startsWith('url:')) {
    window.location.href = action.slice(4);
    return;
  }

  // Multiple actions separated by pipe
  if (action.includes('|')) {
    for (const single of action.split('|')) {
      determineAction(targetElement, event, single.trim());
    }
    return;
  }

  // Built-in: page refresh
  if (action === 'refresh') {
    window.location.reload();
    return;
  }

  // Extract action name and optional target argument: actionName(target)
  const match = action.match(ACTION_REGEX);
  if (!match) {
    console.warn(`[actions] Could not parse action: "${action}"`);
    return;
  }

  const actionName = match[1];
  const target     = match[2] ?? null;

  initiateAction(targetElement, event, actionName, target);
}


// ─── 7. Dynamic action dispatcher ────────────────────────────────────────────

function initiateAction(targetElement, event, action, target) {
  if (typeof window[action] === 'function') {
    window[action](targetElement, event, target);
  } else {
    console.warn(`[actions] Unknown action: "${action}". Define window.${action} to handle it.`);
  }
}
