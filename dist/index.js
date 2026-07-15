// @letterblack/lbe-core v1.4.0
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const wasmPath = path.join(here, 'lbe_engine.wasm');
const lockPath = path.join(here, 'wasm.lock.json');
let instance;

export class LbeError extends Error {
  constructor(code, message, options = {}) {
    super(message, options);
    this.name = 'LbeError';
    this.code = code;
  }
}

function hashFile(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

export function verifyRuntimeIntegrity() {
  if (!fs.existsSync(wasmPath)) {
    throw new LbeError('RUNTIME_MISSING', 'LBE WASM runtime is missing');
  }
  if (!fs.existsSync(lockPath)) {
    throw new LbeError('RUNTIME_LOCK_MISSING', 'LBE WASM integrity lock is missing');
  }

  let lock;
  try {
    lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  } catch (error) {
    throw new LbeError('RUNTIME_LOCK_INVALID', 'LBE WASM integrity lock is invalid JSON', { cause: error });
  }

  if (typeof lock.wasm_sha256 !== 'string' || lock.wasm_sha256.length !== 64) {
    throw new LbeError('RUNTIME_LOCK_INVALID', 'LBE WASM integrity lock has no valid wasm_sha256');
  }

  const actual = hashFile(wasmPath);
  if (!crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(lock.wasm_sha256, 'hex'))) {
    throw new LbeError('RUNTIME_INTEGRITY_FAILED', 'LBE WASM integrity check failed');
  }

  return Object.freeze({ ok: true, wasm_sha256: actual });
}

export function getRuntimeInfo() {
  const integrity = verifyRuntimeIntegrity();
  return Object.freeze({
    package: '@letterblack/lbe-core',
    version: '1.4.0',
    runtime: 'wasm',
    offline: true,
    integrity
  });
}

function load() {
  if (instance) return instance;
  verifyRuntimeIntegrity();

  let wasm;
  try {
    wasm = new WebAssembly.Instance(new WebAssembly.Module(fs.readFileSync(wasmPath)), {});
  } catch (error) {
    throw new LbeError('RUNTIME_LOAD_FAILED', 'LBE WASM runtime could not be loaded', { cause: error });
  }

  if (typeof wasm.exports.lbe_execute !== 'function') {
    throw new LbeError('RUNTIME_ENTRYPOINT_MISSING', 'LBE WASM missing execute entrypoint');
  }

  instance = wasm;
  return instance;
}

function memory(wasm) {
  if (!(wasm.exports.memory instanceof WebAssembly.Memory)) {
    throw new LbeError('RUNTIME_MEMORY_MISSING', 'LBE WASM missing memory export');
  }
  return new Uint8Array(wasm.exports.memory.buffer);
}

function readOut(wasm) {
  const mem = memory(wasm);
  const ptr = wasm.exports.lbe_out_ptr();
  const max = wasm.exports.lbe_buf_size();

  if (!Number.isInteger(ptr) || !Number.isInteger(max) || ptr < 0 || max <= 0 || ptr + max > mem.length) {
    throw new LbeError('RUNTIME_OUTPUT_BOUNDS_INVALID', 'LBE WASM returned invalid output bounds');
  }

  let end = ptr;
  while (end - ptr < max && mem[end] !== 0) end += 1;
  if (end - ptr === max) {
    throw new LbeError('RUNTIME_OUTPUT_UNTERMINATED', 'LBE WASM output was not null terminated');
  }

  return new TextDecoder().decode(mem.slice(ptr, end));
}

export function execute(input) {
  if (typeof input !== 'string') {
    throw new TypeError('execute input must be a string');
  }
  if (input.trim().length === 0) {
    throw new LbeError('INPUT_EMPTY', 'execute input must not be empty');
  }

  const wasm = load();
  const bytes = new TextEncoder().encode(input);
  const max = wasm.exports.lbe_buf_size();
  const ptr = wasm.exports.lbe_in_ptr();
  const mem = memory(wasm);

  if (!Number.isInteger(max) || !Number.isInteger(ptr) || max <= 1 || ptr < 0 || ptr + max > mem.length) {
    throw new LbeError('RUNTIME_INPUT_BOUNDS_INVALID', 'LBE WASM returned invalid input bounds');
  }
  if (bytes.length + 1 > max) {
    throw new LbeError('INPUT_TOO_LARGE', 'execute input exceeds WASM buffer');
  }

  mem.fill(0, ptr, ptr + max);
  mem.set(bytes, ptr);
  mem[ptr + bytes.length] = 0;
  wasm.exports.lbe_execute();
  return readOut(wasm);
}

export function executeJson(proposal) {
  if (proposal === null || typeof proposal !== 'object' || Array.isArray(proposal)) {
    throw new TypeError('executeJson proposal must be an object');
  }

  const output = execute(JSON.stringify(proposal));
  try {
    return JSON.parse(output);
  } catch (error) {
    throw new LbeError('RUNTIME_OUTPUT_INVALID_JSON', 'LBE runtime returned invalid JSON', { cause: error });
  }
}
