import { createLbeBrowserRuntime } from './browser-sdk.js';

const elements = {
  status: document.querySelector('#runtime-status'),
  integrity: document.querySelector('#integrity'),
  hash: document.querySelector('#hash'),
  proposal: document.querySelector('#proposal'),
  result: document.querySelector('#result'),
  run: document.querySelector('#run'),
  format: document.querySelector('#format'),
  export: document.querySelector('#export')
};

let runtime;
let latestResult = null;

function showError(error) {
  const payload = {
    ok: false,
    code: error?.code ?? 'IDE_ERROR',
    message: error instanceof Error ? error.message : String(error)
  };
  latestResult = payload;
  elements.result.textContent = JSON.stringify(payload, null, 2);
}

async function boot() {
  try {
    runtime = await createLbeBrowserRuntime();
    elements.status.textContent = 'Runtime ready · offline';
    elements.integrity.textContent = 'Verified';
    elements.hash.textContent = runtime.info.wasm_sha256;
    elements.run.disabled = false;
  } catch (error) {
    elements.status.textContent = 'Runtime unavailable';
    elements.integrity.textContent = 'Failed';
    elements.run.disabled = true;
    showError(error);
  }
}

elements.run.disabled = true;
elements.run.addEventListener('click', () => {
  try {
    const proposal = JSON.parse(elements.proposal.value);
    const startedAt = performance.now();
    const decision = runtime.executeJson(proposal);
    latestResult = {
      ok: true,
      duration_ms: Number((performance.now() - startedAt).toFixed(2)),
      decision
    };
    elements.result.textContent = JSON.stringify(latestResult, null, 2);
  } catch (error) {
    showError(error);
  }
});

elements.format.addEventListener('click', () => {
  try {
    elements.proposal.value = JSON.stringify(JSON.parse(elements.proposal.value), null, 2);
  } catch (error) {
    showError(error);
  }
});

elements.export.addEventListener('click', () => {
  if (!latestResult) return;
  const blob = new Blob([JSON.stringify(latestResult, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'lbe-builder-result.json';
  anchor.click();
  URL.revokeObjectURL(url);
});

boot();
