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
document.addEventListener('DOMContentLoaded', validateBrioHtmlOnInit, false);


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

// Index of data-key elements.
// Incrementally maintained on DOM changes instead of full map rebuilds.
let keyIndex = new Map(); // chord string -> Set<HTMLElement>
const chordByEl = new WeakMap(); // el -> chord string

function indexKeyElement(el) {
  if (!(el instanceof Element)) return;
  const chord = el.dataset.key;
  if (!chord) return;

  let set = keyIndex.get(chord);
  if (!set) {
    set = new Set();
    keyIndex.set(chord, set);
  }
  set.add(el);
  chordByEl.set(el, chord);
}

function unindexKeyElement(el) {
  if (!(el instanceof Element)) return;
  const chord = chordByEl.get(el);
  if (!chord) return;

  const set = keyIndex.get(chord);
  if (set) {
    set.delete(el);
    if (set.size === 0) keyIndex.delete(chord);
  }
  chordByEl.delete(el);
}

function indexKeyTree(root) {
  if (!root) return;
  if (root instanceof Element && root.hasAttribute?.('data-key')) indexKeyElement(root);
  if (root.querySelectorAll) for (const el of root.querySelectorAll('[data-key]')) indexKeyElement(el);
}

function unindexKeyTree(root) {
  if (!root) return;
  if (root instanceof Element && root.hasAttribute?.('data-key')) unindexKeyElement(root);
  if (root.querySelectorAll) for (const el of root.querySelectorAll('[data-key]')) unindexKeyElement(el);
}

const keyIndexObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === 'childList') {
      for (const node of mutation.addedNodes) indexKeyTree(node);
      for (const node of mutation.removedNodes) unindexKeyTree(node);
      continue;
    }

    if (mutation.type === 'attributes' && mutation.attributeName === 'data-key') {
      const el = mutation.target;
      unindexKeyElement(el);
      if (el instanceof Element && el.dataset?.key) indexKeyElement(el);
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  indexKeyTree(document.body);
  keyIndexObserver.observe(document.body, {
    childList: true,
    subtree: true,
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


// ─── 8. Init-time HTML validation ─────────────────────────────────────────────

function validateBrioHtmlOnInit() {
  // Validate [data-message][data-for] targets.
  for (const region of document.querySelectorAll('[data-message][data-for]')) {
    const id = region.dataset.for;
    if (!id) continue;
    if (!document.getElementById(id)) {
      console.warn(`[feedback] [data-message][data-for="${id}"] points to missing #${id}.`, region);
    }
  }

  // Validate actions referenced by data-* attributes.
  for (const attr of ['click', 'change', 'input', 'submit']) {
    for (const el of document.querySelectorAll(`[data-${attr}]`)) {
      validateActionString(el.dataset[attr], el);
    }
  }
}

function validateActionString(action, elForContext = null) {
  action = (action || '').trim();
  if (!action) return;

  // Built-in: url redirect — checked before pipe split so URLs containing
  // a pipe character are not incorrectly split into multiple actions.
  if (action.startsWith('url:')) return;

  if (action.includes('|')) {
    for (const single of action.split('|')) validateActionString(single.trim(), elForContext);
    return;
  }

  if (action === 'refresh') return;

  const match = action.match(ACTION_REGEX);
  if (!match) {
    console.warn('[actions] Could not parse action:', action, elForContext);
    return;
  }

  const actionName = match[1];
  const target = match[2] ?? null;

  // Validate dialog targets (common mistake).
  if ((actionName === 'openDialog' || actionName === 'closeDialog') && target) {
    const dialog = document.getElementById(target);
    if (!(dialog instanceof HTMLDialogElement)) {
      console.warn(`[actions] ${actionName}(${target}) but no <dialog id="${target}"> found.`, elForContext);
    }
  }

  // Validate that the action function exists in global scope.
  if (typeof window[actionName] !== 'function') {
    console.warn(`[actions] Unknown action: "${actionName}". Define window.${actionName} to handle it.`, elForContext);
  }
}
