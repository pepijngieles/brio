/* Utilities
  -----------------------------------------------------------------------------
  Requires: defer attribute or placement before </body>
  Dependencies (recommended config hooks):
  - getData uses `configureAuth(fn)` (fallback: legacy global `jwtToken`)
  - getRelativeDate uses `configureTranslations(obj)` (fallback: legacy global `translations`)
----------------------------------------------------------------------------- */

// ─── Configuration hooks ──────────────────────────────────────────────────────

let brioAuthProvider = null; // () => string | Promise<string>
let brioTranslations = null; // { today, yesterday }
let warnedMissingAuth = false;
let warnedMissingTranslations = false;

function configureAuth(provider) {
  if (provider == null) {
    brioAuthProvider = null;
    return;
  }
  brioAuthProvider = (typeof provider === 'function') ? provider : () => provider;
}

function configureTranslations(obj) {
  brioTranslations = (obj && typeof obj === 'object') ? obj : null;
}

window.configureAuth = configureAuth;
window.configureTranslations = configureTranslations;


/* 1. DOM helpers
----------------------------------------------------------------------------- */

function hasAncestor(element, selector) {
  while (element = element.parentNode) {
    if (element == document) return false;
    if (element.matches(selector)) return true;
  }
  return false;
}

function focus(elementId) {
  let focusElement = document.getElementById(elementId);
  if (focusElement) focusElement.focus();
}

function disable(el, event, querySelector) {
  let element = querySelector
    ? document.body.querySelector(querySelector)
    : el;
  if (element) element.disabled = true;
}

// Called automatically by actions.js on every submit event.
// Sets form fields to readOnly so they still submit with the form.
// Also handles elements outside the form using [form="formId"].
// Adds data-state="loading" to the submit button for CSS loading state.
// Also marks submit and form with ARIA loading metadata.
// Call enableForm(formId) to reverse — called automatically by readServerMessages
// when the server returns success: false.
function disableForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  // Disable fields inside the form
  for (const element of form.elements) {
    element.readOnly = true;
    element.dataset.wasDisabled = element.disabled ? 'true' : 'false';
  }

  // Disable fields outside the form linked via [form="formId"]
  for (const element of document.querySelectorAll(`[form="${formId}"]`)) {
    element.readOnly = true;
    element.dataset.wasDisabled = element.disabled ? 'true' : 'false';
  }

  form.setAttribute('aria-busy', 'true');

  // Add loading state to submit button
  const submitButton = form.querySelector('[type=submit]');
  if (submitButton) {
    submitButton.dataset.state = 'loading';
    submitButton.dataset.loading = 'true'; // back-compat for existing projects
    submitButton.setAttribute('aria-disabled', 'true');
    submitButton.disabled = true;
  }
}

// Reverses disableForm. Called automatically by readServerMessages when the
// server returns success: false. Call manually if you handle errors outside
// readServerMessages.
function enableForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  for (const element of [...form.elements, ...document.querySelectorAll(`[form="${formId}"]`)]) {
    element.readOnly = false;
    if (element.dataset.wasDisabled === 'true') element.disabled = true;
    delete element.dataset.wasDisabled;
  }

  form.removeAttribute('aria-busy');

  const submitButton = form.querySelector('[type=submit]');
  if (submitButton) {
    delete submitButton.dataset.state;
    delete submitButton.dataset.loading;
    submitButton.removeAttribute('aria-disabled');
  }
}

function setThemeColor(color) {
  let themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute('content', color);
  } else {
    themeMeta = document.createElement('meta');
    themeMeta.setAttribute('name', 'theme-color');
    themeMeta.setAttribute('content', color);
    document.head.appendChild(themeMeta);
  }
}


/* 2. String helpers
----------------------------------------------------------------------------- */

function ucFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function hasNumber(string) {
  return /\d/.test(string);
}


/* 3. Number helpers
----------------------------------------------------------------------------- */

function getRandomNumber(range = [1, 6], negative = false) {
  let number = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
  if (negative) number *= Math.round(Math.random()) ? 1 : -1;
  return number;
}


/* 4. URL helpers
----------------------------------------------------------------------------- */

function removeParams() {
  let url = new URL(window.location.href);
  history.replaceState({}, '', url.origin + url.pathname);
}


/* 5. Storage helpers
----------------------------------------------------------------------------- */

function getStorageItem(item, defaultValue) {
  try {
    const stored = localStorage.getItem(item);
    if (stored === null) {
      localStorage.setItem(item, defaultValue);
      return defaultValue;
    }
    return stored;
  } catch (e) {
    console.warn('[utils] localStorage unavailable:', e);
    return defaultValue;
  }
}


/* 6. Date helpers
----------------------------------------------------------------------------- */

// Requires a `translations` object in scope: { today: '...', yesterday: '...' }
function getRelativeDate(timestamp) {
  const t = brioTranslations || (typeof translations !== 'undefined' ? translations : null);
  if (!t || !t.today || !t.yesterday) {
    if (!warnedMissingTranslations) {
      warnedMissingTranslations = true;
      console.warn('[utils] getRelativeDate requires configureTranslations({ today, yesterday }) (or legacy global `translations`).');
    }
    return new Date(timestamp).toLocaleDateString(document.documentElement.lang);
  }

  let today    = new Date(),
      date     = new Date(timestamp),
      lang     = document.documentElement.lang,
      day      = date.toLocaleString(lang, { weekday: 'long' }),
      month    = date.toLocaleString(lang, { month: 'long' }),
      msInDay  = 24 * 60 * 60 * 1000,
      msInWeek = msInDay * 7;

  let difference = today - date;

  if (difference < msInDay)      return t['today'];
  if (difference < msInDay * 2)  return t['yesterday'];
  if (difference < msInWeek)     return ucFirst(day);
  else                           return date.getDate() + ' ' + month;
}


/* 7. Network helpers
----------------------------------------------------------------------------- */

// Requires a `jwtToken` variable in scope
async function getData(url, parse) {
  const token = brioAuthProvider
    ? await brioAuthProvider()
    : (typeof jwtToken !== 'undefined' ? jwtToken : null);

  if (!token) {
    if (!warnedMissingAuth) {
      warnedMissingAuth = true;
      console.warn('[utils] getData requires configureAuth(fn) (or legacy global `jwtToken`).');
    }
    throw new Error('[utils] Missing auth token. Call configureAuth(fn) first.');
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type':  'application/json'
    }
  });
  if (!response.ok) throw new Error(`[utils] getData failed: ${response.status} ${response.statusText}`);
  return parse ? response.json() : response.text();
}


/* 8. Timing helpers
----------------------------------------------------------------------------- */

// Debounce — delays execution until after `wait` ms of inactivity.
// Use for search inputs, resize handlers, anything that fires rapidly
// but should only act after the user stops.
//
// Usage:
//   const onSearch = debounce((event) => fetchResults(event.target.value), 300);
//   input.addEventListener('input', onSearch);

function debounce(fn, wait = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

// Throttle — limits execution to at most once per `wait` ms.
// Use for scroll handlers, mousemove, anything that should fire
// continuously but at a controlled rate.
//
// Usage:
//   const onScroll = throttle(() => updateHeader(), 100);
//   window.addEventListener('scroll', onScroll);

function throttle(fn, wait = 100) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= wait) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}


/* 9. Disclosure toggle
----------------------------------------------------------------------------- */

// Toggle visibility of a target element. Manages hidden + aria-expanded/controls.
//
// Usage:
//   Explicit target:   data-click="toggle(target-id)" aria-expanded="false"
//   Implicit sibling:  data-click="toggle"            aria-expanded="false"
//
// Add aria-expanded="false" to the trigger to declare the correct initial ARIA
// state before any interaction — toggle keeps it in sync from that point on.
// If no target is given, the next sibling element is used. An id is generated
// on the sibling if none exists.
//
// Examples:
//   <button data-click="toggle(faq-1)" aria-expanded="false">Question</button>
//   <div id="faq-1" hidden>Answer</div>
//
//   <button data-click="toggle" aria-expanded="false">Show more</button>
//   <div hidden>More content</div>

function toggle(el, event, target) {
  if (!el) return;

  let region;

  if (target) {
    region = document.getElementById(target);
    if (!region) {
      console.warn(`[toggle] No element found with id "${target}"`);
      return;
    }
  } else {
    // Fall back to next sibling
    region = el.nextElementSibling;
    if (!region) {
      console.warn('[toggle] No target given and no next sibling found');
      return;
    }
    // Auto-generate an id if absent so aria-controls can reference it
    if (!region.id) region.id = 'toggle-' + Math.random().toString(36).slice(2, 7);
  }

  // Wire aria-controls (idempotent)
  if (!el.hasAttribute('aria-controls')) el.setAttribute('aria-controls', region.id);

  const isHidden = region.hasAttribute('hidden');
  if (isHidden) {
    region.removeAttribute('hidden');
    el.setAttribute('aria-expanded', 'true');
  } else {
    region.setAttribute('hidden', '');
    el.setAttribute('aria-expanded', 'false');
  }
}


/* 10. Dynamic form fields
----------------------------------------------------------------------------- */

// Supported syntax on any element:
//   data-show-when    data-hide-when    data-enable-when    data-disable-when
//
// Condition syntax:
//   fieldId==value          field equals value
//   fieldId!=value          field does not equal value
//
// Multiple conditions:
//   cond1||cond2            OR  — attribute applied if ANY condition is met
//   cond1&&cond2            AND — attribute applied if ALL conditions are met
//
// Note: || and && cannot be mixed in one expression.
//
// Examples:
//   data-show-when="plan==pro||plan==enterprise"
//   data-show-when="plan==pro&&seats==10"
//   data-hide-when="status!=active"

function updateDynamicFields() {
  const fieldTypes = {
    'hide':    { attribute: 'hidden',   defaultState: false },
    'show':    { attribute: 'hidden',   defaultState: true  },
    'disable': { attribute: 'disabled', defaultState: false },
    'enable':  { attribute: 'disabled', defaultState: true  }
  };

  for (const type in fieldTypes) {
    const config = fieldTypes[type];
    const fields = document.querySelectorAll(`[data-${type}-when]`);

    for (const field of fields) {
      const expression   = field.dataset[`${type}When`];
      const conditionMet = evaluateConditions(expression);
      const shouldHaveAttribute = config.defaultState !== conditionMet;

      if (shouldHaveAttribute) field.setAttribute(config.attribute, '');
      else field.removeAttribute(config.attribute);
    }
  }
}

function evaluateConditions(expression) {
  // AND — all conditions must be met
  if (expression.includes('&&')) {
    return expression.split('&&').every(c => evaluateSingleCondition(c.trim()));
  }
  // OR — at least one condition must be met
  if (expression.includes('||')) {
    return expression.split('||').some(c => evaluateSingleCondition(c.trim()));
  }
  return evaluateSingleCondition(expression.trim());
}

function evaluateSingleCondition(condition) {
  const isNotEqual = condition.includes('!=');
  const [elementId, targetValue] = condition.split(isNotEqual ? '!=' : '==').map(s => s.trim());
  const element = document.getElementById(elementId);
  if (!element) return false;

  // Delegate to getElementValue so checkbox, select, textarea, and display
  // elements are all handled consistently in one place.
  const currentValue = getElementValue(element);
  return isNotEqual ? currentValue !== targetValue : currentValue === targetValue;
}

updateDynamicFields();


/* 11. Text helper
----------------------------------------------------------------------------- */

// Direct text helper kept as a small utility.
// For declarative reactivity, use data-bind/data-bind-* from binding.js.

function setText(target, value) {
  const el = typeof target === 'string'
    ? document.getElementById(target)
    : target;
  if (!el) {
    console.warn(`[setText] No element found for target: "${target}"`);
    return;
  }
  el.textContent = value;
}

// Returns the current value of an element.
// Form fields → .value  |  Checkboxes → 'true'/'false'  |  Other → .textContent
// Shared by bind evaluation and dynamic field conditions.
function getElementValue(el) {
  if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
    return el.type === 'checkbox' ? el.checked.toString() : el.value;
  }
  return el.textContent;
}

// Toggle a CSS class on an element.
//
// JS usage:
//   toggleClassName('panel-1', 'is-open')
//   toggleClassName(panelEl, 'is-open')
//
// data-click usage:
//   data-click="toggleClassName(panel-1,is-open)"
//   data-click="toggleClassName(this,is-open)"            // use the trigger element
function toggleClassName(el, className, target) {
  // Called via actions.js as: (triggerEl, event, "target,className")
  if (el instanceof Element && className && typeof className === 'object' && typeof target === 'string') {
    const triggerEl = el;
    const raw = target.trim();
    const comma = raw.indexOf(',');
    if (comma === -1) {
      console.warn('[toggleClassName] Expected "target,className" e.g. toggleClassName(test,open)');
      return;
    }
    const actionElTarget = raw.slice(0, comma).trim();
    const actionClassName = raw.slice(comma + 1).trim();
    if (!actionElTarget || !actionClassName) {
      console.warn('[toggleClassName] Expected "target,className" e.g. toggleClassName(test,open)');
      return;
    }
    const targetEl = actionElTarget === 'this' ? triggerEl : resolveToggleTarget(actionElTarget);
    if (!targetEl) {
      console.warn(`[toggleClassName] No element found for target: "${actionElTarget}"`);
      return;
    }
    targetEl.classList.toggle(actionClassName);
    return;
  }

  // Direct helper call: (targetElOrId, className)
  const resolved = resolveToggleTarget(el);
  if (!resolved) {
    console.warn(`[toggleClassName] No element found for target: "${el}"`);
    return;
  }
  if (!className) return;
  resolved.classList.toggle(className);
}

function resolveToggleTarget(target) {
  if (!target) return null;
  if (target instanceof Element) return target;
  if (typeof target !== 'string') return null;

  const s = target.trim();
  if (!s) return null;
  if (s === 'this') return null; // only valid in action mode
  // Strictly treat strings as element ids (not selectors).
  return document.getElementById(s);
}

window.setText = setText;
window.toggleClassName = toggleClassName;
