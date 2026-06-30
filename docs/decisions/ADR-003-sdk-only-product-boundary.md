# ADR-003: Keep LBE SDK-Only

**Status:** Accepted — 2026-06-19

## Decision

LBE ships as one local SDK and CLI embedded in the user's existing application.
It will not expand into a daemon, agent runner, host platform, MCP server, HTTP
service, hosted dashboard, Docker deployment, or companion system.

## Why

The product must be fast to install, simple to understand, and realistic for a
solo developer to maintain. A direct SDK integration meets the local governance
requirement without creating a second platform to deploy, secure, operate, or
support.

## Product boundary

The user installs the SDK and calls its API from their existing application.
LBE validates the proposed action locally and returns its decision/result. No
external process or online dependency is required.

## Reintroduction rule

No additional system may be added as a roadmap item, example, or compatibility
surface without the user's explicit request and a new ADR that explains why the
SDK-only approach no longer meets the stated requirement.
