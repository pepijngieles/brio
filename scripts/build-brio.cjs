const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

// Concatenate core files in dependency/load order.
const SRC_FILES = [
  'src/utils.js',
  'src/actions.js',
  'src/binding.js',
  'src/dialogs.js',
  'src/feedback.js',
];

function build() {
  const parts = [];

  for (const relPath of SRC_FILES) {
    const absPath = path.join(projectRoot, relPath);
    const code = fs.readFileSync(absPath, 'utf8');
    parts.push(code);
  }

  const outPath = path.join(projectRoot, 'brio.js');
  fs.writeFileSync(outPath, parts.join('\n') + '\n', 'utf8');
  console.log(`[brio] Wrote ${path.relative(process.cwd(), outPath)}`);
}

if (require.main === module) {
  try {
    build();
  } catch (err) {
    console.error('[brio] build failed:', err);
    process.exit(1);
  }
}

module.exports = { build };
