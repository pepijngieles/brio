/* Dialogs (native <dialog>)
  -----------------------------------------------------------------------------
  Requires: defer attribute or placement before </body>
  Designed to work alongside actions.js but fully standalone.

  Required HTML structure:
    <dialog id="..."> ... </dialog>

  Brio API remains unchanged:
    openDialog(el, event, "dialog-id")
    closeDialog(el, event, "dialog-id" | null)
    closeAllDialogs()

  Policy layer (on top of native behavior):
    - Escape/backdrop dismiss only when an enabled [data-el=close-button] exists
    - Focus returns to opener when dialog closes
    - Optional reopen stack via data-reopen="false"
----------------------------------------------------------------------------- */

let reopenDialog = null;
const openerStack = [];
let modelessZIndex = 0;

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(', ');

function getDialogById(id) {
  const dialog = document.getElementById(id);
  if (!dialog || dialog.tagName !== 'DIALOG') return null;
  return dialog;
}

function getOpenDialogs() {
  return [...document.querySelectorAll('dialog[open]')];
}

function getTopOpenDialog() {
  const open = getOpenDialogs();
  return open.length ? open[open.length - 1] : null;
}

function isClosable(dialog) {
  return !!dialog.querySelector('[data-el=close-button]:not([disabled])');
}

function updateModalPageLock() {
  const hasOpenModal = !!document.querySelector('dialog[open]:not([data-modeless])');
  document.documentElement.toggleAttribute('data-brio-modal-open', hasOpenModal);
}

function setModelessLayer(dialog) {
  if (!dialog?.hasAttribute('data-modeless')) return;
  modelessZIndex += 1;
  dialog.style.zIndex = String(1000 + modelessZIndex);
}

function autoFocus(dialog) {
  const explicit = dialog.querySelector('[data-autofocus]');
  if (explicit) { explicit.focus(); return; }
  if (dialog.hasAttribute('data-autofocus')) { dialog.focus(); return; }

  const focusable = [...dialog.querySelectorAll(FOCUSABLE)]
    .find((el) => el.offsetParent !== null && !el.matches('[data-el=close-button]'));
  if (focusable) focusable.focus();
}

function closeDialogInternal(dialog, internal = false) {
  if (!dialog?.open) return;
  dialog.close();
  updateModalPageLock();

  if (reopenDialog && !internal) {
    const reopenId = reopenDialog.id;
    reopenDialog = null;
    openDialog(null, null, reopenId);
    return;
  }

  if (!internal) openerStack.pop()?.focus();
}

// Called by framework as: openDialog(el, event, 'dialog-id')
function openDialog(el, event, dialogId) {
  const dialog = getDialogById(dialogId);
  if (!dialog) {
    console.warn(`[dialogs] openDialog: no <dialog> found with id "${dialogId}"`);
    return;
  }

  const currentlyOpen = getTopOpenDialog();
  if (el) openerStack.push(el);

  if (currentlyOpen && currentlyOpen !== dialog) {
    if (currentlyOpen.dataset.reopen !== 'false') reopenDialog = currentlyOpen;
    closeDialogInternal(currentlyOpen, true);
  }

  if (!dialog.open) {
    if (dialog.hasAttribute('data-modeless')) dialog.show();
    else dialog.showModal();
  }

  setModelessLayer(dialog);
  updateModalPageLock();
  autoFocus(dialog);
}

// Called by framework as: closeDialog(el, event, 'dialog-id') or closeDialog(el, event, null)
function closeDialog(el, event, dialogId, _internal = false) {
  let dialog = null;

  if (dialogId) dialog = getDialogById(dialogId);
  else {
    dialog = getTopOpenDialog();
    if (!dialog && el) dialog = el.closest('dialog[open]');
  }

  closeDialogInternal(dialog, _internal);
}

// Called by framework as: closeAllDialogs(el, event, null)
function closeAllDialogs() {
  getOpenDialogs().forEach((dialog) => dialog.close());
  updateModalPageLock();
  reopenDialog = null;
  const originalOpener = openerStack[0];
  openerStack.length = 0;
  originalOpener?.focus();
}

// Back-compat action name. With native <dialog> there is no dim layer element.
function clickDimLayer() {
  const dialog = getTopOpenDialog();
  if (dialog && isClosable(dialog)) closeDialogInternal(dialog);
}

function addDialogTitleIds() {
  document.querySelectorAll('dialog[id]').forEach((dialog) => {
    const heading = dialog.querySelector('h2');
    if (heading) {
      if (!heading.id) heading.id = dialog.id + '-title';
    } else if (!dialog.hasAttribute('aria-label') && !dialog.hasAttribute('aria-labelledby')) {
      console.warn(`[dialogs] #${dialog.id} has no accessible name — add aria-label or an <h2> inside the dialog.`);
    }
  });
}

// Escape policy: block native cancel unless closable
document.addEventListener('cancel', (event) => {
  const dialog = event.target;
  if (!(dialog instanceof HTMLDialogElement)) return;
  if (!isClosable(dialog)) event.preventDefault();
}, true);

// Backdrop policy: close only when user clicks outside dialog content and dialog is closable
document.addEventListener('click', (event) => {
  const dialog = event.target;
  if (!(dialog instanceof HTMLDialogElement)) return;
  if (!dialog.open) return;

  const rect = dialog.getBoundingClientRect();
  const isBackdropClick =
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom;

  if (isBackdropClick) {
    event.preventDefault();
    if (isClosable(dialog)) closeDialogInternal(dialog);
  }
}, true);

addDialogTitleIds();
updateModalPageLock();
