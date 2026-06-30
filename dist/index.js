// @letterblack/lbe-core v1.3.35
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const wasmPath = path.join(here, 'lbe_engine.wasm');
const lockPath = path.join(here, 'wasm.lock.json');
let instance;

function hashFile(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function load() {
  if (instance) return instance;
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  const actual = hashFile(wasmPath);
  if (actual !== lock.wasm_sha256) throw new Error('LBE WASM integrity check failed');
  const wasm = new WebAssembly.Instance(new WebAssembly.Module(fs.readFileSync(wasmPath)), {});
  if (typeof wasm.exports.lbe_execute !== 'function') throw new Error('LBE WASM missing execute entrypoint');
  instance = wasm;
  return instance;
}

function memory(wasm) {
  return new Uint8Array(wasm.exports.memory.buffer);
}

function readOut(wasm) {
  const mem = memory(wasm);
  const ptr = wasm.exports.lbe_out_ptr();
  const max = wasm.exports.lbe_buf_size();
  let end = ptr;
  while (mem[end] !== 0 && end - ptr < max) end++;
  return new TextDecoder().decode(mem.slice(ptr, end));
}

export function execute(input) {
  if (typeof input !== 'string') throw new TypeError('execute input must be a string');
  const wasm = load();
  const bytes = new TextEncoder().encode(input);
  const max = wasm.exports.lbe_buf_size();
  if (bytes.length + 1 > max) throw new Error('execute input exceeds WASM buffer');
  const mem = memory(wasm);
  const ptr = wasm.exports.lbe_in_ptr();
  mem.set(bytes, ptr);
  mem[ptr + bytes.length] = 0;
  wasm.exports.lbe_execute();
  return readOut(wasm);
}
