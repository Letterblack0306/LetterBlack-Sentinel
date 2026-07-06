# LBE Core — Local Execution Governance for AI Agents

<p align="center"><img src="assets/banner.png" alt="LBE Core Banner" width="800"></p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#install-once-use-per-workspace">Install Once</a> ·
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

### 1. Install LBE once globally

```bash
npm install -g @letterblack/lbe-core
```

This installs the `lbe` command on your system.

### 2. Open any project workspace

```bash
cd your-project
lbe
```

You should see the **LetterBlack Sentinel** terminal menu.

### 3. Apply LBE to that workspace

Choose **Apply Boundary**.

This creates LBE state for the current project only:

```text
lbe.policy.json
.lbe/
```

Then choose **Agent Instructions** to define what the AI agent is allowed to do in that workspace.

Current release: `@letterblack/lbe-core@1.3.40` · Requires Node.js `>=20.9.0` · Zero external dependencies.

## Install Once, Use Per Workspace

LBE has two separate concepts:

| Concept | What it means |
|---|---|
| **Installation** | Install the `lbe` command once on your computer |
| **Workspace boundary** | Apply LBE separately inside each project folder |

You do **not** install LBE again for every project.

Correct daily use:

```bash
# one time only
npm install -g @letterblack/lbe-core

# project A
cd path/to/project-a
lbe

# project B
cd path/to/project-b
lbe
```

Each project gets its own local boundary, policy, task instructions, and audit state. The global `lbe` command is only the tool used to manage those workspaces.

Use a local project install only when you specifically need a pinned per-project version for CI or a reproducible test fixture.

## Important: package name vs command name

The package name is:

```bash
@letterblack/lbe-core
```

The command it installs is:

```bash
lbe
```

Do **not** use this as the main install path:

```bash
npx lbe
```

`npx lbe` means: "download and run the npm package named `lbe`." That package name is not this project.

If you want to test LBE without installing it globally, use the scoped package explicitly:

```bash
npx --package @letterblack/lbe-core lbe
```

But the recommended normal workflow is still:

```bash
npm install -g @letterblack/lbe-core
cd your-project
lbe
```

### If you see the wrong menu

If `npx lbe` shows commands such as `configure` or `email`, you are running a different package.

Fix it by installing the correct package globally:

```bash
npm install -g @letterblack/lbe-core
lbe
```

or run the scoped no-install command:

```bash
npx --package @letterblack/lbe-core lbe
```

## What LBE Does

AI agents can write files, run commands, edit configuration, and trigger workflows. LBE gives those actions a local boundary.

LBE helps you:

- **Apply a workspace boundary** before agent work begins.
- **Save agent instructions** so the task has a clear scope.
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
lbe
```

Choose **Apply Boundary**.

This creates local LBE workspace state and starts in observe mode. The menu stays open after the action so you can continue setup.

### 2. Add agent instructions

From the menu, choose **Agent Instructions**, or run the direct command:

```bash
lbe instructions
```

You will be asked for:

- the task objective,
- allowed files/actions,
- forbidden files/actions,
- required validations.

### 3. Check status

```bash
lbe status
```

### 4. Audit the workspace

```bash
lbe audit-workspace
```

### 5. Switch enforcement mode when ready

```bash
lbe enforce
```

Use observe mode again with:

```bash
lbe observe
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
| `lbe instructions` | Opens or prints saved agent instructions |
| `lbe audit-workspace` | Runs a workspace audit |
| `lbe proof` | Prints latest proof status if available |
| `lbe execute` | Evaluates JSON input through the execution decision core |
| `lbe help` | Shows CLI help |

After global install, commands are used directly:

```bash
lbe status
lbe audit-workspace
lbe enforce
```

For one-off testing without global install, prefix with the scoped package:

```bash
npx --package @letterblack/lbe-core lbe status
npx --package @letterblack/lbe-core lbe audit-workspace
npx --package @letterblack/lbe-core lbe enforce
```

## Terminal Menu Guide

Running `lbe` inside a project opens the branded terminal menu:

```bash
cd your-project
lbe
```

Navigate with the **up/down arrow keys** and press **Enter** to select. Press **q** or `Ctrl+C` to exit.

```text
LetterBlack Sentinel
Local Execution Governance

Workspace : your-project
Status    : observe / enforce / not initialised
Task      : registered / not found
Activity  : saved task count / none
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

New workspaces start in observe mode so you can inspect behavior before enforcing blocks. In the interactive menu, LBE returns to the menu after setup instead of closing.

### Remove Boundary

Removes LBE boundary state from the current workspace.

Use this when cleaning a test project or removing LBE from a workspace.

### Check Status

Shows mode, rule count, task state, proof state, and audit state.

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

### `lbe` is not recognized

Install LBE globally once:

```bash
npm install -g @letterblack/lbe-core
```

Then open a project and run:

```bash
cd your-project
lbe
```

### `npx lbe` shows `configure` and `email`

You are running the wrong npm package. Use the global install:

```bash
npm install -g @letterblack/lbe-core
lbe
```

or the scoped no-install command:

```bash
npx --package @letterblack/lbe-core lbe
```

### The workspace says `not initialised`

Run:

```bash
lbe init
```

or open the menu and choose **Apply Boundary**.

### I want to use this in CI or automation

For CI, either install globally in the job or use the scoped no-install command:

```bash
npm install -g @letterblack/lbe-core
lbe status
lbe audit-workspace
lbe proof
```

or:

```bash
npx --package @letterblack/lbe-core lbe status
npx --package @letterblack/lbe-core lbe audit-workspace
npx --package @letterblack/lbe-core lbe proof
```

---

LBE Core provides a local execution governance layer that validates, audits, and records AI agent actions before they reach your host environment. It does not replace your AI — it helps you trust what it executes.
