/* Binding (Reactivity v0.1)
  -----------------------------------------------------------------------------
  Requires: defer attribute or placement before </body>
  Designed to work alongside actions.js, utils.js, and feedback.js.

  Declarative bindings:
    <span data-bind="user.name"></span>
    <a data-bind-href="links.profile" data-bind="user.name"></a>
    <button data-bind-disabled="ui.saving">Save</button>
    <span data-bind="{{#qty}} × {{pricing.currency}}{{#price}}"></span>

  State API:
    BRIO_API.setState({ user: { name: 'Ada' } })
    BRIO_API.getState('user.name')
    BRIO_API.refreshBindings()

  No-refresh submit response extensions:
    {
      success: true|false,
      messages: [...],
      state:   {...},               // merged into BRIO state
      patches: [{ target, html }],  // replace target innerHTML
      append:  [{ target, html }]   // append HTML
    }
----------------------------------------------------------------------------- */

const BRIO_STATE = {};

const BOOLEAN_ATTRS = new Set([
  'disabled', 'checked', 'hidden', 'readonly', 'required', 'selected', 'open'
]);
const ALLOWED_BIND_ATTRS = new Set([
  'href', 'src', 'alt', 'title', 'value', 'placeholder',
  'disabled', 'checked', 'hidden', 'readonly', 'required', 'selected', 'open',
  'aria-label', 'aria-describedby', 'aria-controls', 'aria-expanded',
  'role', 'id', 'name', 'for'
]);
const ALLOWED_BIND_ATTR_PREFIXES = ['data-', 'aria-'];

function mergeState(target, source) {
  if (!source || typeof source !== 'object') return target;
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
        target[key] = {};
      }
      mergeState(target[key], value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

function getPathValue(path, source) {
  return path.split('.').reduce((obj, key) => obj?.[key], source);
}

function setPathValue(path, value, source) {
  const keys = path.split('.');
  let ref = source;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!ref[key] || typeof ref[key] !== 'object' || Array.isArray(ref[key])) ref[key] = {};
    ref = ref[key];
  }
  ref[keys[keys.length - 1]] = value;
}

function normalizeDatasetBindKey(datasetKey) {
  // dataset key examples: bindHref, bindAriaLabel, bindDataId
  const attrPart = datasetKey.slice(4);
  return attrPart.replace(/[A-Z]/g, (match) => '-' + match.toLowerCase()).replace(/^-/, '');
}

function coerceBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const lowered = value.toLowerCase().trim();
    return !(lowered === '' || lowered === 'false' || lowered === '0' || lowered === 'null' || lowered === 'undefined');
  }
  return !!value;
}

function resolveToken(token, context = null) {
  if (token.startsWith('#')) {
    const sourceEl = document.getElementById(token.slice(1));
    if (!sourceEl) return null;
    return (typeof getElementValue === 'function') ? getElementValue(sourceEl) : sourceEl.textContent;
  }

  if (context && typeof context === 'object') {
    const contextValue = getPathValue(token, context);
    if (contextValue !== undefined && contextValue !== null) return contextValue;
  }

  const stateValue = getPathValue(token, BRIO_STATE);
  if (stateValue !== undefined && stateValue !== null) return stateValue;

  return getPathValue(token, window);
}

function evaluateBindingExpression(expression, context = null) {
  if (!expression) return null;
  const trimmed = expression.trim();
  if (!trimmed) return null;

  if (trimmed.includes('{{')) {
    return trimmed.replace(/\{\{([^}]+)\}\}/g, (_, token) => {
      const value = resolveToken(token.trim(), context);
      return value == null ? '' : String(value);
    });
  }

  const value = resolveToken(trimmed, context);
  return value == null ? null : value;
}

function applyBoundAttribute(el, attrName, value) {
  if (BOOLEAN_ATTRS.has(attrName)) {
    const enabled = coerceBoolean(value);
    if (attrName === 'hidden') {
      if (enabled) el.setAttribute('hidden', '');
      else el.removeAttribute('hidden');
      return;
    }
    el[attrName] = enabled;
    if (enabled) el.setAttribute(attrName, '');
    else el.removeAttribute(attrName);
    return;
  }

  if (attrName === 'value' && 'value' in el) {
    if (document.activeElement !== el) el.value = value == null ? '' : String(value);
    if (value == null || value === '') el.removeAttribute('value');
    else el.setAttribute('value', String(value));
    return;
  }

  if (value == null || value === '') {
    el.removeAttribute(attrName);
    return;
  }

  el.setAttribute(attrName, String(value));
}

function isAllowedBindAttr(attrName) {
  if (ALLOWED_BIND_ATTRS.has(attrName)) return true;
  return ALLOWED_BIND_ATTR_PREFIXES.some((prefix) => attrName.startsWith(prefix));
}

function applyBindings(scope = document, context = null) {
  const root = scope || document;
  const bindNodes = [];

  if (root.nodeType === Node.ELEMENT_NODE && root.hasAttribute?.('data-bind')) {
    bindNodes.push(root);
  }
  if (root.querySelectorAll) bindNodes.push(...root.querySelectorAll('[data-bind]'));

  for (const el of bindNodes) {
    const value = evaluateBindingExpression(el.dataset.bind, context);
    el.textContent = value == null ? '' : String(value);
  }

  const allNodes = [];
  if (root.nodeType === Node.ELEMENT_NODE) allNodes.push(root);
  if (root.querySelectorAll) allNodes.push(...root.querySelectorAll('*'));

  for (const el of allNodes) {
    for (const [datasetKey, expression] of Object.entries(el.dataset || {})) {
      if (!datasetKey.startsWith('bind') || datasetKey === 'bind') continue;
      const attrName = normalizeDatasetBindKey(datasetKey);
      if (!isAllowedBindAttr(attrName)) {
        console.warn(`[binding] Skipping unsupported bind attribute "${attrName}" on`, el);
        continue;
      }
      const value = evaluateBindingExpression(expression, context);
      applyBoundAttribute(el, attrName, value);
    }
  }
}

function renderTemplateItems(target, templateId, items) {
  const template = document.getElementById(templateId);
  if (!(template instanceof HTMLTemplateElement)) {
    console.warn(`[binding] No <template> found with id "${templateId}"`);
    return;
  }

  for (const item of items) {
    const fragment = template.content.cloneNode(true);
    applyBindings(fragment, item);
    target.appendChild(fragment);
  }
}

function applyPatches(patches = []) {
  for (const patch of patches) {
    const target = document.querySelector(patch.target);
    if (!target) continue;
    if (patch.html != null) target.innerHTML = patch.html;
    applyBindings(target);
  }
}

const brioAfterFetchListeners = [];

function registerAfterFetch(fn) {
  if (typeof fn === 'function') brioAfterFetchListeners.push(fn);
}

function resolveAppendTarget(op, form) {
  if (op.target === '__form__' && form instanceof HTMLFormElement) {
    const innerSel = form.getAttribute('data-fetch-append-target');
    if (innerSel) return form.querySelector(innerSel);
    return form.querySelector('[data-comments-list]');
  }
  if (op.target) return document.querySelector(op.target);
  return null;
}

function applyAppend(append = [], form = null) {
  for (const op of append) {
    const target = resolveAppendTarget(op, form);
    if (!target) continue;

    if (op.template && Array.isArray(op.items)) {
      renderTemplateItems(target, op.template, op.items);
      continue;
    }

    if (op.html != null) {
      target.insertAdjacentHTML('beforeend', op.html);
      applyBindings(target);
    }
  }
}

async function brioSubmitFetch(form, event) {
  if (!(form instanceof HTMLFormElement) || !form.hasAttribute('data-fetch')) return;
  if (event?.defaultPrevented) return;

  event?.preventDefault();
  if (typeof clearMessages === 'function') clearMessages(form);

  try {
    const method = (form.getAttribute('method') || 'GET').toUpperCase();
    const action = form.getAttribute('action') || window.location.href;
    const formData = new FormData(form);
    const request = { method };

    if (method === 'GET') {
      const url = new URL(action, window.location.href);
      for (const [key, value] of formData.entries()) url.searchParams.set(key, value);
      request.credentials = 'same-origin';
      const response = await fetch(url.toString(), request);
      const data = await response.json();
      handleFetchResponse(form, data);
      return;
    }

    request.body = formData;
    request.credentials = 'same-origin';

    const response = await fetch(action, request);
    const data = await response.json();
    handleFetchResponse(form, data);
  } catch (error) {
    if (typeof showMessage === 'function') {
      showMessage(form, 'Request failed. Please try again.', 'error');
    }
    if (typeof enableForm === 'function' && form.id) enableForm(form.id);
    console.warn('[binding] data-fetch submit failed:', error);
  }
}

function handleFetchResponse(form, data) {
  applyResponse(data, form);
  if (typeof enableForm === 'function' && form?.id) enableForm(form.id);
  if (typeof window.brioAfterFetch === 'function') {
    try {
      window.brioAfterFetch(form, data);
    } catch (e) {
      console.warn('[binding] brioAfterFetch:', e);
    }
  }
  for (const fn of brioAfterFetchListeners) {
    try {
      fn(form, data);
    } catch (e) {
      console.warn('[binding] registerAfterFetch listener:', e);
    }
  }
}

function applyResponse(data, form = null) {
  if (typeof readServerMessages === 'function') {
    readServerMessages(form || document.body, data || {});
  }
  if (data?.state && typeof data.state === 'object') mergeState(BRIO_STATE, data.state);
  if (Array.isArray(data?.patches)) applyPatches(data.patches);
  if (Array.isArray(data?.append)) applyAppend(data.append, form);
  applyBindings(document);
  if (typeof updateDynamicFields === 'function') updateDynamicFields();
}

function setState(partial) {
  mergeState(BRIO_STATE, partial || {});
  applyBindings(document);
  if (typeof updateDynamicFields === 'function') updateDynamicFields();
}

function getState(path = null) {
  if (!path) return BRIO_STATE;
  return getPathValue(path, BRIO_STATE);
}

function refreshBindings(scope = document) {
  applyBindings(scope);
  if (scope === document && typeof updateDynamicFields === 'function') updateDynamicFields();
}

window.BRIO_API = window.BRIO_API || {};
window.BRIO_API.setState = setState;
window.BRIO_API.getState = getState;
window.BRIO_API.refreshBindings = refreshBindings;
window.BRIO_API.applyResponse = applyResponse;
window.BRIO_API.registerAfterFetch = registerAfterFetch;

window.setBrioState = setState;
window.getBrioState = getState;
window.refreshBindings = refreshBindings;
window.brioSubmitFetch = brioSubmitFetch;

document.addEventListener('DOMContentLoaded', () => {
  applyBindings(document);
});
