# LBE SDK and Builder IDE Readiness

## SDK

The npm SDK remains the offline Node.js and CLI distribution. Its public package allowlist excludes the browser IDE.

Current readiness controls include typed APIs, structured errors, WASM integrity verification, runtime bounds checks, SDK tests, CLI smoke validation, package-content validation, and a documented security boundary.

## Builder IDE

The browser IDE is stored in `ide/` and can be hosted independently or alongside repository documentation. It loads the packaged LBE WASM directly and validates its SHA-256 lock before execution.

Implemented builder features:

- proposal JSON editing and formatting;
- deterministic proposal simulation through the real LBE runtime;
- runtime integrity and hash inspection;
- structured error display;
- result export;
- restrictive Content Security Policy;
- no external scripts, styles, providers, telemetry, or embedded credentials;
- keyboard-visible focus and semantic form labels.

## Combo contract

The SDK and IDE share only the canonical WASM runtime and integrity lock. The IDE does not duplicate policy-decision logic. The SDK can be distributed through npm without IDE assets, while the IDE can be hosted as static files from the repository root.

## AI integration status

AI integration is intentionally pending rather than silently simulated. A release-grade provider adapter must meet all of these requirements:

1. AI output is treated only as an untrusted proposal or explanation.
2. LBE remains the final deterministic allow/deny authority.
3. Remote providers are optional and disabled by default.
4. Credentials are builder-owned and never committed or persisted in the static app.
5. Every network destination and transmitted field is visible before sending.
6. A local-model adapter can be added without changing the LBE runtime contract.

## Remaining full-IDE features

These are not blockers for releasing the current proposal simulator, but they are required before marketing it as a complete policy-authoring IDE:

- schema-driven policy editor;
- project save/load with format versioning and migrations;
- proof-file import and verification;
- matched-rule visualization when the runtime exposes structured rule metadata;
- recovery for corrupted projects and interrupted saves;
- accessibility testing with browser automation;
- optional provider adapter satisfying the AI boundary above.
