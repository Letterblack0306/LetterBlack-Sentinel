// @letterblack/lbe-core v1.4.0

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export interface RuntimeIntegrity {
  readonly ok: true;
  readonly wasm_sha256: string;
}

export interface RuntimeInfo {
  readonly package: '@letterblack/lbe-core';
  readonly version: string;
  readonly runtime: 'wasm';
  readonly offline: true;
  readonly integrity: RuntimeIntegrity;
}

export class LbeError extends Error {
  readonly code: string;
  constructor(code: string, message: string, options?: ErrorOptions);
}

export function execute(input: string): string;
export function executeJson<TResponse extends JsonValue = JsonValue>(proposal: JsonObject): TResponse;
export function verifyRuntimeIntegrity(): RuntimeIntegrity;
export function getRuntimeInfo(): RuntimeInfo;
