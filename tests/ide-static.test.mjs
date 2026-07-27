import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');

test('builder IDE ships required static files', () => {
  for (const path of ['ide/index.html', 'ide/app.js', 'ide/browser-sdk.js', 'ide/styles.css', 'ide/README.md']) {
    assert.equal(fs.existsSync(path), true, `missing ${path}`);
  }
});

test('builder IDE has no embedded external origins or secrets', () => {
  const source = ['ide/index.html', 'ide/app.js', 'ide/browser-sdk.js'].map(read).join('\n');
  assert.doesNotMatch(source, /https?:\/\//i);
  assert.doesNotMatch(source, /(api[_-]?key|sk-[a-z0-9]{10,}|bearer\s+[a-z0-9._-]+)/i);
});

test('builder IDE uses packaged runtime and integrity lock', () => {
  const adapter = read('ide/browser-sdk.js');
  assert.match(adapter, /\.\.\/dist\/lbe_engine\.wasm/);
  assert.match(adapter, /\.\.\/dist\/wasm\.lock\.json/);
  assert.match(adapter, /crypto\.subtle\.digest/);
  assert.match(adapter, /lbe_execute/);
});

test('npm SDK distribution excludes builder IDE', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.ok(Array.isArray(pkg.files));
  assert.equal(pkg.files.some(entry => entry.startsWith('ide')), false);
});
