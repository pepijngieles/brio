/* Feedback
  -----------------------------------------------------------------------------
  Requires: defer attribute or placement before </body>
  Designed to work alongside actions.js but fully standalone.

  Usage — HTML:
  ─────────────
  Field-level message (linked to input via data-for="fieldId"):
    <input id="email" type="email">
    <span data-message data-for="email" hidden></span>

  Form-level message (scoped to nearest form or container):
    <form id="booking-form">
      <div data-message hidden></div>
      ...
    </form>

  Non-form action feedback (nearest sibling):
    <button data-click="addToCart">Add to cart</button>
    <span data-message hidden></span>

  Usage — JavaScript:
  ────────────────────
  Client-side:
    showMessage(el, 'You have reached the maximum.', 'info');
    showMessage('email', 'Please enter a valid email address.', 'error');

  Server-side (pass the parsed JSON response body):
    readServerMessages(el, responseData);

  Clear all messages in a container:
    clearMessages(el);

  Server response contract:
  ──────────────────────────
  {
    "success": true|false,
    "messages": [
      { "field": "email", "message": "Please enter a valid email address", "type": "error" },
      { "field": null,    "message": "Something went wrong",               "type": "error" }
    ]
  }
  field: null   → form-level message, shown in the nearest [data-message] without [data-for]
  field: "id"   → field-level message, shown in [data-message][data-for="id"]
  type:         → "error" | "success" | "info" | "warning"

  Form re-enabling:
  ──────────────────
  When success is false, readServerMessages automatically calls enableForm on
  the nearest ancestor form so the user can correct and resubmit. This pairs
  with the automatic disableForm call in actions.js on every submit event.

----------------------------------------------------------------------------- */


// ─── Show a single message ────────────────────────────────────────────────────

// target: a field id (string), a triggering element, or null
function showMessage(target, message, type = 'error') {
  const region = resolveMessageRegion(target);
  if (!region) {
    console.warn('[feedback] No [data-message] region found for target:', target);
    return;
  }

  // Ensure the region has an id so aria-describedby can reference it
  if (!region.id) region.id = 'msg-' + Math.random().toString(36).slice(2, 7);

  region.textContent  = message;
  region.dataset.type = type;
  region.removeAttribute('hidden');

  // Announce errors immediately; other types announce politely
  if (type === 'error') {
    region.setAttribute('role', 'alert');
    region.removeAttribute('aria-live');
  } else {
    region.setAttribute('aria-live', 'polite');
    region.removeAttribute('role');
  }

  // Wire aria-describedby on the associated input if target is a field id
  if (typeof target === 'string') {
    const input = document.getElementById(target);
    if (input) input.setAttribute('aria-describedby', region.id);
  }
}


// ─── Read a full server response ─────────────────────────────────────────────

// el: the triggering element (used to resolve form-level message region)
// data: parsed JSON response body matching the contract above
function readServerMessages(el, data) {
  if (!data.messages || !data.messages.length) return;

  for (const item of data.messages) {
    const target = item.field || el;
    showMessage(target, item.message, item.type || 'error');
  }

  // Re-enable the form when the server reports failure so the user can
  // correct and resubmit. Pairs with the automatic disableForm call in
  // actions.js. enableForm is a no-op if the form was never disabled.
  if (data.success === false && typeof enableForm === 'function') {
    const form = (el instanceof Element) ? el.closest('form') : null;
    if (form?.id) enableForm(form.id);
  }
}


// ─── Clear messages ───────────────────────────────────────────────────────────

// Clears all [data-message] regions inside a container, or the nearest one to el
function clearMessages(el) {
  const container = el?.closest('form, [data-feedback-scope]') || document;

  container.querySelectorAll('[data-message]').forEach(region => {
    // Remove aria-describedby from any input that references this region
    if (region.id) {
      const input = container.querySelector(`[aria-describedby="${region.id}"]`);
      if (input) input.removeAttribute('aria-describedby');
    }
    region.textContent = '';
    region.removeAttribute('data-type');
    region.removeAttribute('role');
    region.removeAttribute('aria-live');
    region.setAttribute('hidden', '');
  });
}


// ─── Resolve message region ───────────────────────────────────────────────────

// Priority:
// 1. target is a string id → find [data-message][data-for="id"]
// 2. target is an element  → find nearest [data-message] sibling
// 3. target is an element  → find nearest ancestor containing [data-message]
function resolveMessageRegion(target) {

  // 1. String id — look for a [data-message][data-for="id"]
  if (typeof target === 'string') {
    return document.querySelector(`[data-message][data-for="${target}"]`) || null;
  }

  // 2. Element — look for a [data-message] sibling
  if (target instanceof Element) {
    const parent  = target.parentElement;
    const sibling = parent?.querySelector('[data-message]');
    if (sibling) return sibling;

    // 3. Walk up to nearest ancestor containing a form-level [data-message]
    const ancestor = target.closest('form, [data-feedback-scope]');
    if (ancestor) return ancestor.querySelector('[data-message]:not([data-for])') || null;
  }

  return null;
}
