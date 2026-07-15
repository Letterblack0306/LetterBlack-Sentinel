# Security Policy

## Supported versions

Security fixes are provided for the latest published minor release of `@letterblack/lbe-core`.

## Reporting a vulnerability

Do not open a public issue for suspected vulnerabilities. Use GitHub private vulnerability reporting for this repository.

Include:

- affected package version
- operating system and Node.js version
- minimal reproduction
- expected and observed behavior
- whether integrity verification, policy evaluation, or proof output is affected

## Security boundary

LBE is an offline decision and proof SDK. It governs only actions explicitly routed through its API by the host application.

LBE is not:

- an operating-system sandbox
- a container runtime
- a network firewall
- a replacement for process isolation
- protection against actions that bypass the host integration

Hosts remain responsible for executing only allowed actions, applying least privilege, validating paths after canonicalization, controlling subprocess and network access, and protecting signing material.

## Runtime integrity

The SDK verifies the packaged WebAssembly runtime against `dist/wasm.lock.json` before loading it. An integrity failure must be treated as fatal; applications must not bypass or suppress it.
