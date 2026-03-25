const fs = require('fs');
const path = require('path');
const { build } = require('./build-brio.cjs');

const projectRoot = path.resolve(__dirname, '..');
const filesToWatch = [
  'src/utils.js',
  'src/actions.js',
  'src/binding.js',
  'src/dialogs.js',
  'src/feedback.js',
];

let timer = null;
function scheduleBuild() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    build();
  }, 150);
}

build();

for (const relPath of filesToWatch) {
  const absPath = path.join(projectRoot, relPath);
  fs.watch(absPath, { persistent: true }, (eventType) => {
    if (eventType === 'change' || eventType === 'rename') scheduleBuild();
  });
}

console.log('[brio] Watching src/*.js for changes...');

