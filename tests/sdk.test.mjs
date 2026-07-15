import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LbeError,
  execute,
  executeJson,
  getRuntimeInfo,
  verifyRuntimeIntegrity
} from '../dist/index.js';

test('runtime integrity lock matches packaged WASM', () => {
  const result = verifyRuntimeIntegrity();
  assert.equal(result.ok, true);
  assert.match(result.wasm_sha256, /^[a-f0-9]{64}$/);
});

test('runtime metadata is offline and immutable', () => {
  const info = getRuntimeInfo();
  assert.equal(info.package, '@letterblack/lbe-core');
  assert.equal(info.runtime, 'wasm');
  assert.equal(info.offline, true);
  assert.equal(Object.isFrozen(info), true);
});

test('execute rejects non-string and empty input', () => {
  assert.throws(() => execute({}), TypeError);
  assert.throws(
    () => execute('   '),
    error => error instanceof LbeError && error.code === 'INPUT_EMPTY'
  );
});

test('executeJson rejects non-object proposals', () => {
  assert.throws(() => executeJson(null), TypeError);
  assert.throws(() => executeJson([]), TypeError);
  assert.throws(() => executeJson('proposal'), TypeError);
});
