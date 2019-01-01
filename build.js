const fs = require('fs-extra');
const concat = require('concat');

(async function build() {
  const files = [
    './dist/walkthrough/runtime.js',
    './dist/walkthrough/polyfills.js',
    './dist/walkthrough/scripts.js',
    './dist/walkthrough/main.js'
  ];

  await fs.ensureDir('walkthrough');
  await concat(files, 'public/shared-ui-plugin-walkthrough.js');
})();