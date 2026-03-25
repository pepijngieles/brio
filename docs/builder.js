/*
  Small helpers for the docs site.
  Behaviour is declared in HTML via data-click.
*/

function copyBundleScript(el, event, target) {
  var tag = '<script src="brio.js" defer></script>';
  navigator.clipboard.writeText(tag)
    .then(function() {
      setText(el, 'Copied');
      el.classList.add('copied');
      setTimeout(function() {
        setText(el, 'Copy');
        el.classList.remove('copied');
      }, 2000);
    })
    .catch(function() {
      setText(el, 'Copy');
    });
}

function copyBrio(el, event, target) {
  fetch('brio.md')
    .then(function(r) { return r.text(); })
    .then(function(text) {
      return navigator.clipboard.writeText(text).then(function() { return text; });
    })
    .then(function() {
      setText(el, 'Copied');
      el.classList.add('copied');
      setTimeout(function() {
        setText(el, 'Copy');
        el.classList.remove('copied');
      }, 2000);
    })
    .catch(function() {
      setText(el, 'Open & copy');
      setTimeout(function() { setText(el, 'Copy'); }, 2000);
    });
}
