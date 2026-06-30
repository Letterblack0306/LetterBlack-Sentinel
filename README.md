# @letterblack/lbe-core

<p align="center">
  <img src="assets/banner.png" alt="LBE Banner" width="100%" />
</p>

**LBE is a local execution-control layer for AI agents. It validates every proposed action against a local policy before your code executes it.**

---

## The problem

AI agents write files, run shell commands, call APIs, and modify state. Most of the time they do the right thing. But they have no built-in execution boundary. When a model hallucinates a path, over-reaches its scope, or gets manipulated by injected instructions, there is nothing between the agent's decision and your filesystem.

You can prompt the agent to be careful. You can review outputs manually. But neither of those is enforcement.

LBE is enforcement. Every action the agent proposes is validated against a local policy before it runs. If the policy says no, the action does not execute — regardless of what the model decided.

---

## Who this is for

- **Developers building AI coding assistants** that write, move, or delete files on behalf of users
- **Developers building automation tools** where an AI generates shell commands or file operations
- **Teams integrating LLMs into existing applications** that need an audit trail and a hard execution boundary
- **Anyone who wants to know exactly what an AI agent did** and be able to prove it, not just trust it

You do not need to be building a safety product. If your application lets an AI agent touch the filesystem or run commands, you need an execution boundary. LBE is that boundary.

---

## Why local-first

No cloud service. No daemon. No API key. The runtime is a verified WASM binary that runs in your process. Policy is a local JSON file. Evidence stays on your machine.

This matters because:
- It works offline and in airgapped environments
- No external service can go down and break your enforcement
- Sensitive file paths and workspace context never leave the machine
- Latency is microseconds, not network round-trips
- You own the policy — no vendor decides what is allowed

---

## What it does

```
Agent proposes an action
        ↓
LBE validates it against your policy
        ↓
allow / deny — structured result returned to your host
        ↓
Host executes only if LBE approved
        ↓
Audit entry written to a local hash-linked log
```

Your code stays in control. LBE makes the allow/deny decision and hands it back. It does not execute on your behalf.

If LBE denies an action, it records why. You can review the audit log, rollback to a known-good state, and adjust policy — no silent failures, no guesswork.

---

## Use cases

**AI coding assistant**
The agent wants to write `output.js`. LBE checks: is this path inside the allowed workspace? Is the operation type permitted? Does the policy allow file writes for this actor? Only if all checks pass does your host write the file.

**Shell command gating**
The agent proposes `rm -rf ./build`. Your policy allows `rm` inside `./build` but denies recursive deletes outside it. LBE returns deny before the command reaches the shell.

**Scope enforcement**
You want the agent to only touch files in `./generated/`. Write one policy rule. LBE denies every write outside that path, automatically, on every request, without you reviewing each one.

**Audit and proof**
Every allowed and denied action is written to a local hash-linked audit log. The chain is tamper-evident — removing or modifying an entry breaks the chain and is detectable. You can prove what the agent did, in order, with cryptographic evidence.

**Observer mode for new projects**
Not sure what your agent is doing? Start in observer mode. Every request is validated and logged exactly as it would be in enforcement — but nothing is blocked. Watch the patterns. Write policy rules. Switch to enforce when you are confident.

---

## Install

```bash
npm install @letterblack/lbe-core
```

Requires Node.js >= 20.9.0.

---

## Quick start

```bash
npx lbe init      # create lbe.policy.json in observer mode
npx lbe status    # show current policy and workspace state
npx lbe enforce   # switch to blocking mode when ready
```

---

## How validation works

Every request LBE receives is checked for authenticity, timing, rate limits, replay protection, and policy rules. If any check fails, the request is denied and your execution layer never sees it.

A denied request returns a structured result with the stage that rejected it and the reason. Your host code decides what to do — log it, surface it to the user, or recover.

---

## CLI reference

| Command | What it does |
|---|---|
| `npx lbe init` | Create `lbe.policy.json` in observer mode |
| `npx lbe status` | Show policy mode, rules, and workspace state |
| `npx lbe policy` | Print the current policy file |
| `npx lbe observe` | Switch to advisory mode — logs but does not block |
| `npx lbe enforce` | Switch to blocking mode — denies policy violations |
| `npx lbe execute` | Validate a JSON proposal from stdin |
| `npx lbe execute --input <file>` | Validate a JSON proposal from a file |

---

## Programmatic API

```js
import { execute } from '@letterblack/lbe-core';

const proposal = {
  version: '1.0',
  request_id: 'req-001',
  timestamp: Math.floor(Date.now() / 1000),
  actor: { id: 'agent:local', role: 'agent' },
  intent: {
    type: 'command',
    name: 'write_file',
    payload: { target: 'output.js' }
  },
  context: { workspace: process.cwd() },
  auth: { signature: '<host-signed>', token: '<unique-per-request>' }
};

const result = JSON.parse(execute(JSON.stringify(proposal)));

if (result.decision === 'allow') {
  // LBE approved — safe to execute
} else {
  // LBE denied — result.error has the stage and reason
  console.error(result.error.stage, result.error.message);
}
```

`execute(input: string): string` — synchronous, accepts JSON, returns JSON. The WASM runtime owns all validation decisions.

### Decision responses

Allowed:
```json
{
  "ok": true,
  "decision": "allow",
  "request_id": "req-001",
  "result": { "type": "allowed" }
}
```

Denied:
```json
{
  "ok": false,
  "decision": "deny",
  "request_id": "req-001",
  "error": { "stage": "policy", "message": "rule:deny_outside_workspace" }
}
```

---

## Validating from the CLI

```bash
# from a file
npx lbe execute --input proposal.json

# from stdin
cat proposal.json | npx lbe execute
```

Exit code `0` = allowed. Exit code `1` = denied. Exit code `2` = bad input.

---

## Observer mode

Not ready to block? Start here.

`npx lbe init` creates the policy in observer mode. Every request is fully validated and logged — exactly as it would be in enforcement — but nothing is blocked. You see exactly what the agent is doing before you write your first deny rule.

```bash
npx lbe init       # observer mode on by default
npx lbe status     # confirm mode: observe
npx lbe enforce    # block when ready
npx lbe observe    # back to advisory any time
```

---

## What ships in this package

```
dist/index.js               WebAssembly runtime loader — exports execute()
dist/cli.js                 CLI (npx lbe)
dist/lbe_engine.wasm        Verified runtime binary
dist/wasm.lock.json         Runtime integrity lock (SHA-256 of wasm binary)
assets/lbe-gates.jpg        Gate sequence diagram
assets/story-allow.jpg      Approved-request flow
assets/story-deny.jpg       Blocked-request flow
assets/runtime-boundary.svg Runtime boundary diagram
types.d.ts                  TypeScript declarations
LICENSE
```

At load time the runtime verifies `lbe_engine.wasm` against `wasm.lock.json`. A missing, modified, or swapped binary fails before any request is processed.

Source code, tests, keys, execution connectors, and workspace state are not included.

---

## What LBE does not do

LBE is not a sandbox, container, or OS-level isolation layer. It controls only the actions that your host routes through it.

- Does not provide kernel-level process isolation
- Does not control network egress
- Does not prevent the agent from calling external APIs directly
- Does not provide multi-tenant separation
- Does not run a hosted control plane

If the agent calls the filesystem directly without going through your host code, LBE does not see it. LBE governs actions that are explicitly routed through the `execute()` boundary.

---

## Limits

- Central writes are best-effort
- Local logs remain local
- Non-inspectable targets may produce a limited proof
- Per-process state resets on restart unless you configure a persistent path
