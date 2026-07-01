#!/usr/bin/env node
// @letterblack/lbe-core v1.3.36
import fs from 'node:fs';
import path from 'node:path';
import { execute } from './index.js';

const cmd = process.argv[2];
const cwd = process.cwd();
const policyFile = path.join(cwd, 'lbe.policy.json');
const lbeDir = path.join(cwd, '.lbe');
const scopeFile = path.join(lbeDir, 'scope.json');
const intentLog = path.join(lbeDir, 'intent.jsonl');
const proofFile = path.join(lbeDir, 'proof', 'latest.json');

function readPolicy() {
  if (!fs.existsSync(policyFile)) return null;
  return JSON.parse(fs.readFileSync(policyFile, 'utf8'));
}

function readJson(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .flatMap(line => {
      try { return [JSON.parse(line)]; } catch { return []; }
    });
}

function writePolicy(p) {
  fs.writeFileSync(policyFile, JSON.stringify(p, null, 2) + '\n', 'utf8');
}

function ensurePolicy() {
  if (fs.existsSync(policyFile)) return readPolicy();
  const p = { version: 1, mode: 'observe', workspace: cwd, rules: [] };
  writePolicy(p);
  return p;
}

// ── lbe init ──────────────────────────────────────────────────────────────
if (cmd === 'init') {
  fs.mkdirSync(lbeDir, { recursive: true });
  const policy = ensurePolicy();
  const isNew = policy.rules.length === 0 && policy.mode === 'observe';

  process.stdout.write('\n  LBE initialised.\n\n');
  process.stdout.write('  mode:      ' + policy.mode + '\n');
  process.stdout.write('  policy:    lbe.policy.json\n');
  process.stdout.write('  audit log: .lbe/audit.jsonl\n\n');
  if (isNew) {
    process.stdout.write('  Observer mode is on — LBE is watching but not blocking.\n');
    process.stdout.write('  Run \'npx lbe enforce\' when you are ready to block actions.\n\n');
  }
  process.exit(0);
}

// ── lbe observe ───────────────────────────────────────────────────────────
if (cmd === 'observe') {
  const policy = ensurePolicy();
  policy.mode = 'observe';
  writePolicy(policy);
  process.stdout.write('Observer mode on — LBE is watching silently. Nothing is blocked.\n');
  process.exit(0);
}

// ── lbe enforce ───────────────────────────────────────────────────────────
if (cmd === 'enforce') {
  const policy = ensurePolicy();
  policy.mode = 'enforce';
  writePolicy(policy);
  process.stdout.write('Enforcement on — LBE will now block actions that violate policy.\n');
  process.exit(0);
}

// ── lbe policy ────────────────────────────────────────────────────────────
if (cmd === 'policy') {
  const policy = readPolicy();
  if (!policy) {
    process.stdout.write('No policy yet. Run \'npx lbe init\' first.\n');
    process.exit(0);
  }
  process.stdout.write('\n  mode: ' + policy.mode + '\n');
  process.stdout.write('  rules (' + policy.rules.length + '):\n\n');
  if (policy.rules.length === 0) {
    process.stdout.write('  No rules yet. LBE learns from your conversation.\n');
  }
  for (const r of policy.rules) {
    const label = r.effect === 'deny' ? '  block' : '  allow';
    process.stdout.write(label + '  ' + r.pattern + '\n');
    process.stdout.write('         from: ' + r.from + '\n\n');
  }
  process.exit(0);
}

// ── lbe status ────────────────────────────────────────────────────────────
if (cmd === 'status') {
  const policy = readPolicy();
  process.stdout.write('runtime:  ok\n');
  process.stdout.write('mode:     ' + (policy?.mode ?? 'not initialised') + '\n');
  process.stdout.write('rules:    ' + (policy?.rules?.length ?? 0) + '\n');
  process.stdout.write('scope:    ' + (fs.existsSync(scopeFile) ? 'registered' : 'not found') + '\n');
  process.stdout.write('intent:   ' + (fs.existsSync(intentLog) ? String(readJsonl(intentLog).length) + ' entries' : 'not found') + '\n');
  process.stdout.write('proof:    ' + (fs.existsSync(proofFile) ? 'available' : 'not found') + '\n');
  const auditLog = path.join(lbeDir, 'audit.jsonl');
  if (fs.existsSync(auditLog)) {
    const lines = fs.readFileSync(auditLog, 'utf8').trim().split('\n').filter(Boolean);
    process.stdout.write('audit:    ' + lines.length + ' entries\n');
  } else {
    process.stdout.write('audit:    no entries yet\n');
  }
  process.exit(0);
}

// ── lbe scope ─────────────────────────────────────────────────────────────
if (cmd === 'scope') {
  const scope = readJson(scopeFile);
  if (!scope) {
    process.stdout.write('NO_SCOPE_FOUND\n');
    process.exit(0);
  }
  process.stdout.write('SCOPE_REGISTERED\n');
  if (scope.id) process.stdout.write('scope_id ' + scope.id + '\n');
  if (scope.objective) process.stdout.write('objective ' + scope.objective + '\n');
  process.exit(0);
}

// ── lbe intent ────────────────────────────────────────────────────────────
if (cmd === 'intent') {
  const intents = readJsonl(intentLog);
  if (intents.length === 0) {
    process.stdout.write('NO_INTENT_FOUND\n');
    process.exit(0);
  }
  const latest = intents[intents.length - 1];
  process.stdout.write('INTENT_REGISTERED\n');
  if (latest.intent_id) process.stdout.write('intent_id ' + latest.intent_id + '\n');
  if (latest.scope_id) process.stdout.write('scope_id ' + latest.scope_id + '\n');
  process.exit(0);
}

// ── lbe proof ─────────────────────────────────────────────────────────────
if (cmd === 'proof') {
  const proof = readJson(proofFile);
  if (!proof) {
    process.stdout.write('PROOF_INCOMPLETE\n');
    process.exit(0);
  }
  process.stdout.write(String(proof.status || proof.result || 'PROOF_AVAILABLE') + '\n');
  process.exit(0);
}

// ── lbe execute ───────────────────────────────────────────────────────────
if (cmd === 'execute') {
  async function readStdin() {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return Buffer.concat(chunks).toString('utf8');
  }
  let input = '';
  const inputFlag = process.argv.indexOf('--input');
  if (inputFlag >= 0) {
    const file = process.argv[inputFlag + 1];
    if (!file) { process.stderr.write('--input requires a file path\n'); process.exit(2); }
    input = fs.readFileSync(file, 'utf8');
  } else {
    input = await readStdin();
  }
  try {
    const output = execute(input);
    process.stdout.write(output + '\n');
    const parsed = JSON.parse(output);
    if (parsed?.result?.type === 'allowed') process.exit(0);
    if (parsed?.result?.type === 'denied') process.exit(1);
    process.exit(2);
  } catch (err) {
    process.stderr.write(String(err?.message || err) + '\n');
    process.exit(2);
  }
}

// ── usage ─────────────────────────────────────────────────────────────────
if (!cmd) {
  process.stdout.write('\nUsage:\n');
  process.stdout.write('  npx lbe init       Set up LBE in this project\n');
  process.stdout.write('  npx lbe status     Show current mode and rule count\n');
  process.stdout.write('  npx lbe scope      Show scope contract status\n');
  process.stdout.write('  npx lbe intent     Show latest intent status\n');
  process.stdout.write('  npx lbe proof      Show latest proof status\n');
  process.stdout.write('  npx lbe policy     List all rules\n');
  process.stdout.write('  npx lbe observe    Switch to observer mode (watch, never block)\n');
  process.stdout.write('  npx lbe enforce    Switch to enforcement mode (block violations)\n');
  process.stdout.write('  npx lbe execute    Run a raw JSON request (advanced)\n\n');
  process.exit(0);
}

process.stderr.write('Unknown command: ' + cmd + '\nRun \'npx lbe\' for usage.\n');
process.exit(2);
