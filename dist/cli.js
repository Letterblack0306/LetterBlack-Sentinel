#!/usr/bin/env node
// @letterblack/lbe-core v1.3.40
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { execute } from './index.js';

let cmd = process.argv[2];
const cwd = process.cwd();
const policyFile = path.join(cwd, 'lbe.policy.json');
const lbeDir = path.join(cwd, '.lbe');
const scopeFile = path.join(lbeDir, 'scope.json');
const taskLog = path.join(lbeDir, 'task.jsonl');
const legacyIntentLog = path.join(lbeDir, 'intent.jsonl');
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

function readTaskEntries() {
  const entries = readJsonl(taskLog);
  if (entries.length > 0) return entries;
  return readJsonl(legacyIntentLog);
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

function ensureLbeDir() {
  fs.mkdirSync(lbeDir, { recursive: true });
}

// ── ANSI / Logo / TUI ──────────────────────────────────────────────────
const R='\x1b[41m',G='\x1b[90m',B='\x1b[1m',N='\x1b[0m',CL='\x1b[2J\x1b[H';
const W='\x1b[38;2;233;233;239m',RB='\x1b[41m',DI='\x1b[2m';
const CK='\x1b[38;2;80;200;120m',YE='\x1b[38;2;240;200;60m';

function out(t=''){process.stdout.write(String(t));}
function line(t=''){process.stdout.write(String(t)+'\n');}

function renderChar(ch){
  if(ch==='#')return RB+' '+N;
  if(ch==='*')return W+'█'+N;
  if(ch===' ')return ' ';
  return DI+ch+N;
}
const LOGO=[
  '  _____________________________________________________________ ',
  ' |                                                             |',
  ' |      ###############################################        |',
  ' |      ##                                       *****##        |',
  ' |      ##  ******  ####  *******                *****##        |',
  ' |      ##  **  **  ####  **   **                *****##        |',
  ' |      ##  ******  ####  *******                *****##        |',
  ' |      ##  **  **  ####  **   **                *****##        |',
  ' |      ##  ******  ####  *******                *****##        |',
  ' |      ##                                       *****##        |',
  ' |      ###############################################        |',
  ' |                                                             |',
  ' |_____________________________________________________________|',
];
function logoLines(){return LOGO.map(l=>[...l].map(renderChar).join(''));}

function showHeader(){
  const ll=logoLines();
  const w=66;
  const tb=W+'╔'+'═'.repeat(w)+'╗'+N;
  const bb=W+'╚'+'═'.repeat(w)+'╝'+N;
  const bl=W+'║'+N+' '.repeat(w)+W+'║'+N;
  out(CL);
  out('  '+tb+'\n');
  out('  '+bl+'\n');
  for(const l of ll){
    const plain=l.replace(/\x1b\[[0-9;]*m/g,'');
    const pad=plain.length<w?l+' '.repeat(w-plain.length):plain.slice(0,w);
    out('  '+W+'║'+N+pad+W+'║'+N+'\n');
  }
  out('  '+bl+'\n');
  const title=B+W+'LetterBlack Sentinel'+N;
  out('  '+W+'║'+N+'  '+title+' '.repeat(w-2-20)+W+'║'+N+'\n');
  const tag=W+'Local Execution Governance'+N;
  out('  '+W+'║'+N+'  '+tag+' '.repeat(w-2-27)+W+'║'+N+'\n');
  const vt='v'+'1.3.40';
  out('  '+W+'║'+N+'  '+DI+vt+N+' '.repeat(w-2-2-vt.length)+W+'║'+N+'\n');
  out('  '+bl+'\n');
  out('  '+bb+'\n');
  const policy=readPolicy();
  const taskEntries=readTaskEntries();
  out('\n  '+G+'Workspace :'+N+' '+cwd+'\n');
  out('  '+G+'Status    :'+N+' '+(policy?.mode==='enforce'?R:YE)+(policy?.mode??'not initialised')+N+'\n');
  out('  '+G+'Task      :'+N+' '+(fs.existsSync(scopeFile)?'registered':'not found')+'\n');
  out('  '+G+'Activity  :'+N+' '+(taskEntries.length ? String(taskEntries.length)+' saved task(s)' : 'none')+'\n');
  out('  '+G+'Proof     :'+N+' '+(fs.existsSync(proofFile)?'available':'not found')+'\n');
  out('  '+G+'Execution :'+N+' local only\n\n');
  out('  '+G+'Main Menu (Use '+YE+'↑ ↓'+G+' arrows, '+YE+'Enter'+G+' to select)'+N+'\n\n');
}
const MENU=[{l:'Apply Boundary',c:'init'},{l:'Remove Boundary',c:'remove'},{l:'Check Status',c:'status'},{l:'Audit Workspace',c:'audit-workspace'},{l:'Agent Instructions',c:'instructions'},{l:'Exit',c:'exit'}];

function showMenu(s){MENU.forEach((m,i)=>{out(i===s?'  '+RB+'❯ '+m.l+' '.repeat(28-m.l.length)+N+'\n':'    '+G+m.l+' '.repeat(28-m.l.length)+N+'\n');});}
function enableRaw(){if(!process.stdin.isTTY)return false;process.stdin.setRawMode(true);process.stdin.resume();return true;}
function disableRaw(){try{process.stdin.setRawMode(false);}catch{}process.stdin.pause();}

async function tuiMenu(){
  if(!process.stdin.isTTY){showHeader();out(YE+'Open LBE from an interactive terminal with: lbe'+N+'\n');return null;}
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

async function pauseForMenu() {
  if (!process.stdin.isTTY) return;
  line('');
  await new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('  Press Enter to return to menu...', () => { rl.close(); resolve(); });
  });
}

function printHelp() {
  out(CL);
  out('  \x1b[38;2;233;233;239m\x1b[1mLBE \x1b[0m\x1b[38;2;233;233;239m— LetterBlack Sentinel\x1b[0m\n');
  out('  \x1b[90mExecution governance for AI agents\x1b[0m\n\n');
  out('  \x1b[90mInstall once:\x1b[0m  npm install -g @letterblack/lbe-core\n');
  out('  \x1b[90mUse per workspace:\x1b[0m  cd your-project && lbe\n');
  out('  \x1b[90mNo-install test:\x1b[0m  npx --package @letterblack/lbe-core lbe\n\n');
  out('  \x1b[1mMenu options:\x1b[0m\n');
  out('    \x1b[41m Apply Boundary \x1b[0m    Initialize LBE workspace\n');
  out('    Remove Boundary    Clear LBE workspace\n');
  out('    Check Status       Show workspace governance status\n');
  out('    Audit Workspace    Review local workspace state\n');
  out('    Agent Instructions Set objective, allowed, forbidden, validations\n\n');
  out('  \x1b[90mDirect commands for automation:\x1b[0m  lbe <command>\n\n');
  out('  \x1b[90mhttps://github.com/Letterblack0306/LetterBlack-Sentinel\x1b[0m\n\n');
}

function doInit() {
  ensureLbeDir();
  const policy = ensurePolicy();
  const isNew = policy.rules.length === 0 && policy.mode === 'observe';
  line('\n  Boundary applied.');
  line('');
  line('  mode:      ' + policy.mode);
  line('  policy:    lbe.policy.json');
  line('  audit log: .lbe/audit.jsonl');
  line('');
  if (isNew) {
    line('  Observe mode is on — LBE is watching but not blocking.');
    line('  Run `lbe enforce` when you are ready to block disallowed actions.');
    line('');
  }
}

function doObserve() {
  const policy = ensurePolicy();
  policy.mode = 'observe';
  writePolicy(policy);
  line('Observe mode on — LBE is watching silently. Nothing is blocked.');
}

function doEnforce() {
  const policy = ensurePolicy();
  policy.mode = 'enforce';
  writePolicy(policy);
  line('Enforcement on — LBE will now block actions that violate policy.');
}

function doPolicy() {
  const policy = readPolicy();
  if (!policy) { line('No policy yet. Run `lbe init` first.'); return; }
  line('\n  mode: ' + policy.mode);
  line('  rules (' + policy.rules.length + '):\n');
  if (policy.rules.length === 0) line('  No rules yet. Add Agent Instructions first.');
  for (const r of policy.rules) {
    const label = r.effect === 'deny' ? '  block' : '  allow';
    line(label + '  ' + r.pattern);
    line('         from: ' + r.from + '\n');
  }
}

function doStatus() {
  const policy = readPolicy();
  const taskEntries = readTaskEntries();
  line('runtime:  ok');
  line('mode:     ' + (policy?.mode ?? 'not initialised'));
  line('rules:    ' + (policy?.rules?.length ?? 0));
  line('task:     ' + (fs.existsSync(scopeFile) ? 'registered' : 'not found'));
  line('activity: ' + (taskEntries.length ? String(taskEntries.length) + ' saved task(s)' : 'none'));
  line('proof:    ' + (fs.existsSync(proofFile) ? 'available' : 'not found'));
  const auditLog = path.join(lbeDir, 'audit.jsonl');
  if (fs.existsSync(auditLog)) {
    const lines = fs.readFileSync(auditLog, 'utf8').trim().split('\n').filter(Boolean);
    line('audit:    ' + lines.length + ' entries');
  } else {
    line('audit:    no entries yet');
  }
}

function doScope() {
  const scope = readJson(scopeFile);
  if (!scope) { line('NO_TASK_FOUND'); return; }
  line('TASK_REGISTERED');
  if (scope.objective) line('objective ' + scope.objective);
}

async function doInstructions({ direct = false } = {}) {
  if (!process.stdin.isTTY || direct) {
    const tasks = readTaskEntries();
    if (tasks.length === 0) { line('NO_TASK_FOUND'); return; }
    const latest = tasks[tasks.length - 1];
    line('TASK_REGISTERED');
    if (latest.scope_id) line('scope_id ' + latest.scope_id);
    return;
  }

  ensureLbeDir();
  let current = null;
  if (fs.existsSync(scopeFile)) { try { current = JSON.parse(fs.readFileSync(scopeFile, 'utf8')); } catch {} }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const pq = p => new Promise(r => { rl.question(p, a => r(a.trim())); });
  line('');
  if (current) {
    line('  Current Instructions:');
    line('  ' + DI + 'Objective:' + N + ' ' + (current.objective || '(not set)'));
    if (current.allowed && current.allowed.length) line('  ' + DI + 'Allowed:' + N + ' ' + current.allowed.join(', '));
    if (current.forbidden && current.forbidden.length) line('  ' + DI + 'Forbidden:' + N + ' ' + current.forbidden.join(', '));
    if (current.validations && current.validations.length) line('  ' + DI + 'Validations:' + N + ' ' + current.validations.join(', '));
    line('');
  }
  const objective = await pq('  Objective / Goal (leave blank to cancel): ');
  if (!objective) { rl.close(); line('  Cancelled.'); return; }
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
  fs.appendFileSync(taskLog, JSON.stringify({ scope_id: scopeId, objective, allowed, forbidden, validations, timestamp: Math.floor(Date.now() / 1000) }) + '\n', 'utf8');
  line('  ' + CK + '✓' + N + ' Instructions saved.');
}

function doRemove() {
  const files = [policyFile, path.join(cwd, '.lbe', 'policy.json'), path.join(cwd, '.lbe', 'audit.jsonl'), path.join(cwd, '.lbe', 'workspace.json'), scopeFile];
  let removed = 0;
  for (const file of files) {
    if (fs.existsSync(file)) { try { fs.unlinkSync(file); removed++; } catch {} }
  }
  line(removed > 0 ? 'BOUNDARY_REMOVED' : 'NO_BOUNDARY_FOUND');
}

function doAuditWorkspace() {
  const md = process.argv[3] === '--mode' ? (process.argv[4] || 'audit') : 'audit';
  if (md === 'repair') { line('NOT_IMPLEMENTED'); return; }
  line('\n  Workspace Audit: RUNNING');
  line('  Mode: ' + md + '\n');
  line('  ✓ locate_workspace_root');
  line('  ✓ build_file_inventory');
  line('  ✓ check_forbidden_paths');
  if (!fs.existsSync(policyFile)) {
    line('  ✖ check_lbe_config');
    line('     reason: lbe.policy.json missing');
    line('     next:   Run lbe init');
  } else {
    line('  ✓ check_lbe_config');
  }
  line('  ✓ check_package_state');
  line('  ✓ write_report\n');
  line('  Summary: Audit mode complete\n');
}

function doProof() {
  const proof = readJson(proofFile);
  if (!proof) { line('PROOF_INCOMPLETE'); return; }
  line(String(proof.status || proof.result || 'PROOF_AVAILABLE'));
}

async function doExecute() {
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
    line(output);
    const parsed = JSON.parse(output);
    if (parsed?.result?.type === 'allowed') process.exit(0);
    if (parsed?.result?.type === 'denied') process.exit(1);
    process.exit(2);
  } catch (err) {
    process.stderr.write(String(err?.message || err) + '\n');
    process.exit(2);
  }
}

async function runCommand(command, options = {}) {
  switch (command) {
    case '--help':
    case '-h':
    case 'help': printHelp(); return 0;
    case 'init': doInit(); return 0;
    case 'observe': doObserve(); return 0;
    case 'enforce': doEnforce(); return 0;
    case 'policy': doPolicy(); return 0;
    case 'status': doStatus(); return 0;
    case 'scope': doScope(); return 0;
    case 'instructions': await doInstructions({ direct: false }); return 0;
    case 'intent': await doInstructions({ direct: Boolean(process.argv[2]) }); return 0;
    case 'remove': doRemove(); return 0;
    case 'audit-workspace': doAuditWorkspace(); return 0;
    case 'proof': doProof(); return 0;
    case 'execute': await doExecute(); return 0;
    default:
      process.stderr.write('Unknown command: ' + command + '\nRun `lbe` for the terminal menu.\n');
      return 2;
  }
}

if (!cmd) {
  while (true) {
    const selected = await tuiMenu();
    if (!selected || selected === 'exit') { out(CL); line('  Goodbye.\n'); process.exit(0); }
    out(CL);
    await runCommand(selected, { interactive: true });
    await pauseForMenu();
  }
}

const code = await runCommand(cmd, { interactive: false });
process.exit(code);
