# LBE Builder IDE

The Builder IDE is a static browser application for inspecting and testing LBE proposals. It is separate from the npm SDK package but uses the same packaged `dist/lbe_engine.wasm` and `dist/wasm.lock.json` files.

## Run locally

Serve the repository root over HTTP, then open `/ide/`.

```bash
python -m http.server 8080
```

Open `http://localhost:8080/ide/`.

Opening `ide/index.html` directly with `file://` is unsupported because browsers block module and WASM fetches from local files.

## Current release surface

- Browser-side WASM integrity verification using Web Crypto.
- Proposal JSON editor and formatter.
- Real runtime evaluation through `lbe_execute`.
- Runtime hash and execution-mode inspector.
- Result export as JSON.
- Content Security Policy with no external script, style, or network origin.
- Keyboard focus states and semantic labels.

## AI integration boundary

The IDE intentionally contains no embedded model provider or API key storage.

A future AI adapter may draft policies, explain decisions, or create proposals, but it must remain optional and separate. AI output is always treated as an untrusted proposal. The LBE runtime remains the deterministic decision authority.

Provider adapters must use builder-owned credentials, disclose every network endpoint, support disabling all remote calls, and never send workspace content without explicit builder action.

## Product separation

- `dist/`, `types.d.ts`, and the `lbe` CLI are the SDK distribution.
- `ide/` is the browser builder application.
- The npm `files` allowlist excludes `ide/`, so SDK consumers do not receive IDE assets.
- The two products can be distributed independently or hosted together from the same repository.

## Remaining maturity work

The current IDE is the minimum truthful builder surface. Before calling it a full policy-authoring IDE, add schema-driven policy forms, project persistence and migrations, proof-file import and verification, accessible validation summaries, and an explicitly scoped optional AI adapter.
