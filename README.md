# LBE Core — Local Execution Governance for AI Agents

<p align="center"><img src="assets/banner.png" alt="LBE Core Banner" width="800"></p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#important-package-name-vs-command-name">npx Fix</a> ·
  <a href="#what-lbe-does">What It Does</a> ·
  <a href="#how-it-works">How It Works</a> ·
  <a href="#commands">Commands</a> ·
  <a href="#terminal-menu-guide">Menu Guide</a> ·
  <a href="#what-lbe-is-not">Limits</a>
</p>

---

## Quick Start

LBE is a local safety boundary for AI agents. It checks agent-generated file and command actions before your host environment executes them.

The package name is **scoped**:

```bash
@letterblack/lbe-core
```

The command it installs is:

```bash
lbe
```

### Option A — Use once without installing

Use this when you are testing LBE in any folder:

```bash
cd your-project
npx --package @letterblack/lbe-core lbe
```

### Option B — Install in your project

Use this when you want the project to keep using LBE:

```bash
cd your-project
npm init -y
npm install -D @letterblack/lbe-core
npx lbe
```

You should see the **LetterBlack Sentinel** terminal menu.

Current release: `@letterblack/lbe-core@1.3.40` · Requires Node.js `>=20.9.0` · Zero external dependencies.

## Important: package name vs command name

Do **not** assume this command always runs LetterBlack Sentinel:

```bash
npx lbe
```

`npx lbe` means: "download and run the npm package named `lbe`." That package name is not this project.

This project is named:

```bash
@letterblack/lbe-core
```

So the reliable no-install command is:

```bash
npx --package @letterblack/lbe-core lbe
```

After you install `@letterblack/lbe-core` locally in a project, then this is correct:

```bash
npx lbe
```

### If you see the wrong menu

If `npx lbe` shows commands such as `configure` or `email`, you are running a different package.

Use:

```bash
npx --package @letterblack/lbe-core lbe
```

or install the correct package locally:

```bash
npm install -D @letterblack/lbe-core
npx lbe
```

## What LBE Does

AI agents can write files, run commands, edit configuration, and trigger workflows. LBE gives those actions a local boundary.

LBE helps you:

- **Apply a workspace boundary** before agent work begins.
- **Record agent intent** so the task has a clear scope.
- **Check status** before and after an agent session.
- **Audit workspace activity** so actions are visible.
- **Evaluate execution requests** and return allowed/denied results.
- **Keep everything local.** No cloud account is required.

LBE works per workspace. Each project gets its own local configuration and audit state.

<p align="center"><img src="assets/runtime-boundary.svg" alt="LBE Runtime Boundary"></p>

## Who It Is For

| You are... | LBE helps you... |
|---|---|
| A developer using AI coding assistants | Keep agent work inside a defined project boundary |
| A platform builder integrating agents | Add a local validation step before executing agent actions |
| A team lead reviewing AI-assisted work | See what was allowed, denied, or recorded |
| Anyone testing autonomous workflows | Avoid blind execution and keep an audit trail |

## How It Works

LBE does not replace the AI model. It sits between an agent and your local environment.

```text
Agent proposes an action
  ↓
LBE checks workspace policy and task scope
  ↓
LBE returns allowed or denied
  ↓
Your host executes only if allowed
  ↓
LBE keeps local evidence/audit state
```

LBE only protects paths and actions that are routed through it. If an agent bypasses LBE and directly edits your system, LBE cannot see that action.

<p align="center"><img src="assets/lbe-gates.png" alt="LBE Validation Gates" width="700"></p>

## First Use Workflow

### 1. Open the menu

```bash
cd your-project
npx --package @letterblack/lbe-core lbe
```

Choose **Apply Boundary**.

This creates local LBE workspace state and starts in observe mode.

### 2. Add agent instructions

Open the menu again and choose **Agent Instructions**, or run:

```bash
npx --package @letterblack/lbe-core lbe intent
```

You will be asked for:

- the task objective,
- allowed files/actions,
- forbidden files/actions,
- required validations.

### 3. Check status

```bash
npx --package @letterblack/lbe-core lbe status
```

### 4. Audit the workspace

```bash
npx --package @letterblack/lbe-core lbe audit-workspace
```

### 5. Switch enforcement mode when ready

```bash
npx --package @letterblack/lbe-core lbe enforce
```

Use observe mode again with:

```bash
npx --package @letterblack/lbe-core lbe observe
```

## Commands

The CLI supports both the interactive menu and direct commands.

| Command | What it does |
|---|---|
| `lbe` | Opens the interactive terminal menu |
| `lbe init` | Applies/initialises the boundary for the current workspace |
| `lbe remove` | Removes LBE boundary files from the current workspace |
| `lbe status` | Shows current workspace status |
| `lbe observe` | Sets mode to observe/log-only |
| `lbe enforce` | Sets mode to enforcement/blocking mode |
| `lbe policy` | Prints current policy mode and rules |
| `lbe scope` | Prints registered task scope if one exists |
| `lbe intent` | Opens or prints agent instruction/intent state |
| `lbe audit-workspace` | Runs a workspace audit |
| `lbe proof` | Prints latest proof status if available |
| `lbe execute` | Evaluates JSON input through the execution decision core |
| `lbe help` | Shows CLI help |

When using without a local install, prefix commands like this:

```bash
npx --package @letterblack/lbe-core lbe status
npx --package @letterblack/lbe-core lbe audit-workspace
npx --package @letterblack/lbe-core lbe enforce
```

When installed locally, this is enough:

```bash
npx lbe status
npx lbe audit-workspace
npx lbe enforce
```

## Terminal Menu Guide

Running the correct LBE command with no arguments opens the branded terminal menu:

```bash
npx --package @letterblack/lbe-core lbe
```

If installed locally:

```bash
npx lbe
```

Navigate with the **up/down arrow keys** and press **Enter** to select. Press **q** or `Ctrl+C` to exit.

```text
LetterBlack Sentinel
Local Execution Governance

Workspace : your-project
Status    : observe / enforce / not initialised
Scope     : registered / not found
Intent    : number of entries
Proof     : available / not found
Execution : local only

Main Menu

❯ Apply Boundary
  Remove Boundary
  Check Status
  Audit Workspace
  Agent Instructions
  Exit
```

### Apply Boundary

Initialises LBE in the current workspace.

Creates local files such as:

```text
lbe.policy.json
.lbe/
```

New workspaces start in observe mode so you can inspect behavior before enforcing blocks.

### Remove Boundary

Removes LBE boundary state from the current workspace.

Use this when cleaning a test project or removing LBE from a workspace.

### Check Status

Shows mode, rule count, scope state, intent state, proof state, and audit state.

### Audit Workspace

Runs a local audit and reports whether expected LBE configuration exists.

### Agent Instructions

Saves the current task objective and boundaries. This is how you tell LBE what the agent is supposed to do.

Example inputs:

```text
Objective: Fix the login form validation bug
Allowed: src/login, tests/login.test.js
Forbidden: .env, secrets, node_modules, package-lock.json
Validations: npm test
```

## What LBE Is Not

LBE is not:

- an AI model,
- an agent brain,
- a cloud service,
- a full operating-system sandbox,
- a replacement for code review,
- a guarantee against actions that bypass LBE entirely.

It is a local execution governance layer. It validates, audits, and records agent actions before they reach your host environment.

## Troubleshooting

### `npx lbe` shows `configure` and `email`

You are running the wrong npm package. Use:

```bash
npx --package @letterblack/lbe-core lbe
```

### `npx lbe` says command not found

Install the package locally first:

```bash
npm install -D @letterblack/lbe-core
npx lbe
```

### The workspace says `not initialised`

Run:

```bash
npx --package @letterblack/lbe-core lbe init
```

or open the menu and choose **Apply Boundary**.

### I want to use this in CI or automation

Use direct commands instead of the interactive menu:

```bash
npx --package @letterblack/lbe-core lbe status
npx --package @letterblack/lbe-core lbe audit-workspace
npx --package @letterblack/lbe-core lbe proof
```

---

LBE Core provides a local execution governance layer that validates, audits, and records AI agent actions before they reach your host environment. It does not replace your AI — it helps you trust what it executes.
