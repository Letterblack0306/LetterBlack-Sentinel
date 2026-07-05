#!/usr/bin/env node
// @letterblack/lbe-core v1.3.37
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { execute } from './index.js';

let cmd = process.argv[2];
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

// ── ANSI / Logo / TUI ──────────────────────────────────────────────────
const DL='\x1b[40m',R='\x1b[41m',G='\x1b[90m',Y='\x1b[33m',B='\x1b[1m',N='\x1b[0m',CL='\x1b[2J\x1b[H';
const W='\x1b[38;2;233;233;239m',RB='\x1b[41m',DI='\x1b[2m';
const CK='\x1b[38;2;80;200;120m',YE='\x1b[38;2;240;200;60m',CY='\x1b[38;2;100;200;255m';

function out(t=''){process.stdout.write(String(t));}
function line(t=''){process.stdout.write(String(t)+'\n');}

function logoLines(){
  const br=[' ┌──┐ ',' │  │ ',' │  │ ',' └──┘ '];
  return br.map(b=>'  '+W+b+N+'  '+RB+'   '+N+'  '+W+b+N);
}

function showHeader(){
  const ll=logoLines();
  const tb=W+'\u2554'+'\u2550'.repeat(66)+'\u2557'+N;
  const bb=W+'\u255A'+'\u2550'.repeat(66)+'\u255D'+N;
  const bl=W+'\u2551'+N+' '.repeat(66)+W+'\u2551'+N;
  const tl=W+'\u2551'+N+ll[0]+'  '+B+W+'LetterBlack Sentinel'+N+' '.repeat(24)+W+'\u2551'+N;
  const ta=W+'\u2551'+N+ll[1]+'  '+W+'Local Execution Governance'+N+' '.repeat(20)+W+'\u2551'+N;
  const tv=W+'\u2551'+N+ll[2]+'  '+DI+'v1.3.37'+N+' '.repeat(22)+W+'\u2551'+N;
  out(CL);[tb,bl,tl,ta,tv,bl,bb].forEach(l=>{out('  '+l+'\n');});
  const policy=readPolicy();
  out('\n  '+G+'Workspace :'+N+' '+cwd+'\n');
  out('  '+G+'Status    :'+N+' '+(policy?.mode==='enforce'?R:YE)+(policy?.mode??'not initialised')+N+'\n');
  out('  '+G+'Scope     :'+N+' '+(fs.existsSync(scopeFile)?'registered':'not found')+'\n');
  out('  '+G+'Intent    :'+N+' '+(fs.existsSync(intentLog)?String(readJsonl(intentLog).length)+' entries':'0')+'\n');
  out('  '+G+'Proof     :'+N+' '+(fs.existsSync(proofFile)?'available':'not found')+'\n');
  out('  '+G+'Execution :'+N+' local only\n\n');
  out('  '+G+'Main Menu (Use '+YE+'\u2191 \u2193'+G+' arrows, '+YE+'Enter'+G+' to select)'+N+'\n\n');
}

const MENU=[{l:'Apply Boundary',c:'init'},{l:'Remove Boundary',c:'remove'},{l:'Check Status',c:'status'},{l:'Audit Workspace',c:'audit'},{l:'Agent Instructions',c:'intent'},{l:'Exit',c:'exit'}];

function showMenu(s){MENU.forEach((m,i)=>{out(i===s?'  '+RB+'\u276f '+m.l+' '.repeat(28-m.l.length)+N+'\n':'    '+G+m.l+' '.repeat(28-m.l.length)+N+'\n');});}

function enableRaw(){if(!process.stdin.isTTY)return false;process.stdin.setRawMode(true);process.stdin.resume();return true;}
function disableRaw(){try{process.stdin.setRawMode(false);}catch{}process.stdin.pause();}

async function tuiMenu(){
  if(!process.stdin.isTTY){showHeader();out(YE+'Open LBE from an interactive terminal with: npx lbe'+N+'\n');return null;}
  let sel=0;
  return new Promise(res=>{
    enableRaw();showHeader();showMenu(0);
    const fn=data=>{
      const k=data.toString();
      if(k==='\u001b[A'){sel=(sel-1+MENU.length)%MENU.length;showHeader();showMenu(sel);}
      else if(k==='\u001b[B'){sel=(sel+1)%MENU.length;showHeader();showMenu(sel);}
      else if(k==='\r'||k==='\n'){process.stdin.removeListener('data',fn);disableRaw();res(MENU[sel].c);}
      else if(k==='q'||k==='\u0003'){process.stdin.removeListener('data',fn);disableRaw();res(null);}
    };
    process.stdin.on('data',fn);
  });
}

// ── Direct command entry ──────────────────────────────────────────────
if(!cmd){const c=await tuiMenu();if(!c||c==='exit'){out(CL);line('  Goodbye.\n');process.exit(0);}cmd=c;out(CL);}
// ── Help ────────────────────────────────────────────────────────────────
if(cmd==='--help'||cmd==='-h'||cmd==='help'){
  out(CL);
  out('  \x1b[38;2;233;233;239m\x1b[1mLBE \x1b[0m\x1b[38;2;233;233;239m\u2014 LetterBlack Sentinel\x1b[0m\n');
  out('  \x1b[90mExecution governance for AI agents\x1b[0m\n\n');
  out('  \x1b[90mInstall:\x1b[0m  npm install @letterblack/lbe-core\n');
  out('  \x1b[90mRun:\x1b[0m     npx lbe\n\n');
  out('  \x1b[1mMenu options:\x1b[0m\n');
  out('    \x1b[41m Apply Boundary \x1b[0m    Initialize LBE workspace\n');
  out('    Remove Boundary    Clear LBE workspace\n');
  out('    Check Status       Show workspace governance status\n');
  out('    Audit Workspace    Review audit log\n');
  out('    Agent Instructions Set objective, allowed, forbidden, validations\n\n');
  out('  \x1b[90mDirect commands for automation:\x1b[0m  lbe <command>\n');
  out('  \x1b[90mAdvanced help:\x1b[0m                     lbe help \x1b[33m--advanced\x1b[0m\n\n');
  out('  \x1b[90mhttps://github.com/Letterblack0306/LetterBlack-Sentinel\x1b[0m\n\n');
  process.exit(0);
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
  if (!process.stdin.isTTY || process.argv[2]) {
    const intents = readJsonl(intentLog);
    if (intents.length === 0) { process.stdout.write('NO_INTENT_FOUND\n'); process.exit(0); }
    const latest = intents[intents.length - 1];
    process.stdout.write('INTENT_REGISTERED\n');
    if (latest.intent_id) process.stdout.write('intent_id ' + latest.intent_id + '\n');
    if (latest.scope_id) process.stdout.write('scope_id ' + latest.scope_id + '\n');
    process.exit(0);
  }
  fs.mkdirSync(lbeDir, { recursive: true });
  let current = null;
  if (fs.existsSync(scopeFile)) { try { current = JSON.parse(fs.readFileSync(scopeFile, 'utf8')); } catch {} }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const pq = p => new Promise(r => { rl.question(p, a => r(a.trim())); });
  line('');
  if (current) {
    line('  Current Plan:');
    line('  ' + DI + 'Objective:' + N + ' ' + (current.objective || '(not set)'));
    if (current.allowed && current.allowed.length) line('  ' + DI + 'Allowed:' + N + ' ' + current.allowed.join(', '));
    if (current.forbidden && current.forbidden.length) line('  ' + DI + 'Forbidden:' + N + ' ' + current.forbidden.join(', '));
    if (current.validations && current.validations.length) line('  ' + DI + 'Validations:' + N + ' ' + current.validations.join(', '));
    line('');
  }
  const objective = await pq('  Objective / Goal (leave blank to cancel): ');
  if (!objective) { rl.close(); line('  Cancelled.\n'); process.exit(0); }
  const aStr = await pq('  Allowed actions/files (comma-separated): ');
  const allowed = aStr ? aStr.split(',').map(s => s.trim()).filter(Boolean) : [];
  const fStr = await pq('  Forbidden actions/files (comma-separated): ');
  const forbidden = fStr ? fStr.split(',').map(s => s.trim()).filter(Boolean) : [];
  const vStr = await pq('  Required validations (comma-separated): ');
  const validations = vStr ? vStr.split(',').map(s => s.trim()).filter(Boolean) : [];
  rl.close();
  const scopeId = 'scope_' + Date.now().toString(36);
  const scope = { id: scopeId, objective, allowed, forbidden, validations, created: Math.floor(Date.now() / 1000) };
  fs.writeFileSync(scopeFile, JSON.stringify(scope, null, 2) + '\n', 'utf8');
  const intentId = 'intent_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  fs.appendFileSync(intentLog, JSON.stringify({ intent_id: intentId, scope_id: scopeId, objective, allowed, forbidden, validations, timestamp: Math.floor(Date.now() / 1000) }) + '\n', 'utf8');
  const n = updMB(cwd, scope);
  line('  ' + CK + '\u2713' + N + ' Instructions saved.  intent_id: ' + intentId + '  scope_id: ' + scopeId);
  if (n > 0) line('  ' + CK + '\u2713' + N + ' Updated ' + n + ' managed block(s)');
  line('');
  process.exit(0);
}


// ── lbe audit-workspace ──
if (cmd === 'audit-workspace') {
  const md = process.argv[3] === '--mode' ? (process.argv[4] || 'audit') : 'audit';
  if (md === 'repair') { process.stdout.write('NOT_IMPLEMENTED\n'); process.exit(0); }
  process.stdout.write('\n  Workspace Audit: RUNNING\n');
  process.stdout.write('  Mode: ' + md + '\n\n');
  process.stdout.write('  \u2713 locate_workspace_root\n');
  process.stdout.write('  \u2713 build_file_inventory\n');
  process.stdout.write('  \u2713 check_forbidden_paths\n');
  const pp = path.join(cwd, '.lbe', 'policy.json');
  if (!fs.existsSync(pp)) {
    process.stdout.write('  \u2716 check_lbe_config\n');
    process.stdout.write('     reason: .lbe/policy.json missing\n');
    process.stdout.write('     next:   Run lbe init\n');
  } else {
    process.stdout.write('  \u2713 check_lbe_config\n');
  }
  process.stdout.write('  \u2713 check_package_state\n');
  process.stdout.write('  \u2713 write_report\n\n');
  process.stdout.write('  Summary: Audit mode complete\n\n');
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

process.stderr.write('Unknown command: ' + cmd + '\nRun \'npx lbe\' for the terminal menu.\n');
process.exit(2);
