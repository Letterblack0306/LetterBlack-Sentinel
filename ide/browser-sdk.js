const encoder = new TextEncoder();
const decoder = new TextDecoder();

export class LbeBrowserError extends Error {
  constructor(code, message, options = {}) {
    super(message, options);
    this.name = 'LbeBrowserError';
    this.code = code;
  }
}

async function sha256Hex(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function createLbeBrowserRuntime(options = {}) {
  const wasmUrl = options.wasmUrl ?? '../dist/lbe_engine.wasm';
  const lockUrl = options.lockUrl ?? '../dist/wasm.lock.json';

  const [wasmResponse, lockResponse] = await Promise.all([fetch(wasmUrl), fetch(lockUrl)]);
  if (!wasmResponse.ok) throw new LbeBrowserError('RUNTIME_MISSING', `Unable to load ${wasmUrl}`);
  if (!lockResponse.ok) throw new LbeBrowserError('RUNTIME_LOCK_MISSING', `Unable to load ${lockUrl}`);

  const wasmBytes = await wasmResponse.arrayBuffer();
  const lock = await lockResponse.json().catch(error => {
    throw new LbeBrowserError('RUNTIME_LOCK_INVALID', 'WASM integrity lock is invalid JSON', { cause: error });
  });

  if (typeof lock.wasm_sha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(lock.wasm_sha256)) {
    throw new LbeBrowserError('RUNTIME_LOCK_INVALID', 'WASM integrity lock has no valid wasm_sha256');
  }

  const actualHash = await sha256Hex(wasmBytes);
  if (actualHash.toLowerCase() !== lock.wasm_sha256.toLowerCase()) {
    throw new LbeBrowserError('RUNTIME_INTEGRITY_FAILED', 'WASM integrity check failed');
  }

  let instance;
  try {
    ({ instance } = await WebAssembly.instantiate(wasmBytes, {}));
  } catch (error) {
    throw new LbeBrowserError('RUNTIME_LOAD_FAILED', 'WASM runtime could not be loaded', { cause: error });
  }

  const exports = instance.exports;
  for (const name of ['memory', 'lbe_execute', 'lbe_in_ptr', 'lbe_out_ptr', 'lbe_buf_size']) {
    if (!(name in exports)) throw new LbeBrowserError('RUNTIME_EXPORT_MISSING', `WASM export missing: ${name}`);
  }

  function memory() {
    if (!(exports.memory instanceof WebAssembly.Memory)) {
      throw new LbeBrowserError('RUNTIME_MEMORY_MISSING', 'WASM memory export is invalid');
    }
    return new Uint8Array(exports.memory.buffer);
  }

  function execute(input) {
    if (typeof input !== 'string') throw new TypeError('execute input must be a string');
    if (!input.trim()) throw new LbeBrowserError('INPUT_EMPTY', 'execute input must not be empty');

    const bytes = encoder.encode(input);
    const ptr = exports.lbe_in_ptr();
    const max = exports.lbe_buf_size();
    const mem = memory();

    if (!Number.isInteger(ptr) || !Number.isInteger(max) || ptr < 0 || max <= 1 || ptr + max > mem.length) {
      throw new LbeBrowserError('RUNTIME_INPUT_BOUNDS_INVALID', 'WASM returned invalid input bounds');
    }
    if (bytes.length + 1 > max) throw new LbeBrowserError('INPUT_TOO_LARGE', 'Input exceeds WASM buffer');

    mem.fill(0, ptr, ptr + max);
    mem.set(bytes, ptr);
    exports.lbe_execute();

    const outPtr = exports.lbe_out_ptr();
    if (!Number.isInteger(outPtr) || outPtr < 0 || outPtr + max > mem.length) {
      throw new LbeBrowserError('RUNTIME_OUTPUT_BOUNDS_INVALID', 'WASM returned invalid output bounds');
    }

    let end = outPtr;
    while (end - outPtr < max && mem[end] !== 0) end += 1;
    if (end - outPtr === max) throw new LbeBrowserError('RUNTIME_OUTPUT_UNTERMINATED', 'WASM output was not terminated');
    return decoder.decode(mem.slice(outPtr, end));
  }

  return Object.freeze({
    execute,
    executeJson(proposal) {
      if (proposal === null || typeof proposal !== 'object' || Array.isArray(proposal)) {
        throw new TypeError('proposal must be an object');
      }
      const raw = execute(JSON.stringify(proposal));
      try {
        return JSON.parse(raw);
      } catch (error) {
        throw new LbeBrowserError('RUNTIME_OUTPUT_INVALID_JSON', 'Runtime returned invalid JSON', { cause: error });
      }
    },
    info: Object.freeze({ runtime: 'wasm', offline: true, wasm_sha256: actualHash })
  });
}
