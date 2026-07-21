# LetterBlack Sentinel — Execution Governance for AI Agents

<p align="center"><img src="assets/banner.png" alt="LetterBlack Sentinel" width="800"></p>

<p align="center"><strong>AI agents can think. LBE governs their actions.</strong></p>

LBE is a local execution boundary between an AI agent and the tools that can change a real workspace.

<p align="center"><img src="assets/runtime-boundary.svg" alt="Agent to LBE to tools execution boundary" width="760"></p>

```text
Agent proposes
      ↓
LBE validates and decides
      ↓
ALLOW / DENY / INCOMPLETE
      ↓
Approved tool executes
      ↓
Local audit and proof
```

## Why it exists

AI agents can write files, run commands and alter real projects. The dangerous part is not only what the model says. It is what happens when that output reaches an execution tool.

LBE adds a controlled checkpoint before routed actions are accepted or executed.

## Three pillars

| Before execution | Deterministic decisions | Verifiable evidence |
|---|---|---|
| Check workspace, scope, policy and target before action | Return a structured allow, deny or incomplete result | Record local evidence for review and completion |

## One small example

```text
Agent requests: edit src/app.js

LBE checks:
✓ inside workspace
✓ inside approved task scope
✕ target is denied by policy

Result: DENY
No approved adapter execution.
Evidence recorded locally.
```

## Where LBE fits

LBE does not replace your agent.

- **Agent:** reasons and proposes.
- **LBE controller:** validates and decides.
- **Adapter or host:** executes only the approved request.
- **Audit:** records what was decided and what happened.

This makes LBE an execution-governance layer, not another agent framework.

## Quick start

### Install once on the computer

```bash
npm install -g @letterblack/lbe-core
```

### Use inside each workspace

```bash
cd your-project
lbe
```

For direct automation:

```bash
lbe init
lbe status
lbe proof
```

No-install test:

```bash
npx --package @letterblack/lbe-core lbe
```

Do not use bare `npx lbe`; it can resolve to an unrelated npm package.

## Main commands

| Command | Purpose |
|---|---|
| `lbe` | Open the guided terminal menu |
| `lbe init` | Initialize or refresh workspace governance state |
| `lbe status` | Check the current workspace state |
| `lbe proof` | Review the latest local proof result |

## Who it is for

- developers using coding agents;
- builders adding agents to IDEs or local tools;
- MCP and tool-runtime developers;
- teams that need a record of routed agent actions;
- automation systems that need a decision before execution.

## What LBE is not

LBE is not:

- an AI model;
- an agent planner;
- an IDE or chat interface;
- a Git replacement;
- a human-review replacement;
- a kernel-level operating-system sandbox;
- a hosted monitoring service.

## Honest boundary

LBE governs only actions routed through its execution boundary. If an agent or tool receives separate direct access to the filesystem, shell or another execution surface, that bypass is outside LBE’s control.

The strongest deployment is therefore:

```text
Agent has proposal access
→ LBE owns the execution path
→ adapters remain private
→ completion requires evidence
```

## Release

`@letterblack/lbe-core@1.3.42` · Node.js `>= 20.9.0` · local-first · no cloud account required

## In one sentence

**LetterBlack Sentinel is the public distribution of LBE Core: a local boundary that validates, governs and records AI-agent actions before routed tools execute them.**
