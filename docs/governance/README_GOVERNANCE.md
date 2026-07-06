# README Governance

**Status:** Mandatory  
**Applies to:** Public repository, private repository, CI, local validation, release pipeline

---

## Purpose

The README is the canonical landing page for the project.

It is the first document users see and represents the product identity, capabilities, installation path, and visual presentation.

The README is not a documentation index. Technical documentation expands the README but never replaces it.

---

## Rule 1 — Canonical README

There is only one canonical README.

Requirements:

- Public and private repositories must contain the same README content.
- README updates must be applied to both repositories in the same change.
- No repository may contain additional marketing or architectural content not present in the other.
- Line ending differences are ignored.
- Markdown formatting differences that do not affect rendering should be normalized.
- Content drift is prohibited.

Validation fails if:

- README content differs.
- Sections differ.
- Installation differs.
- Commands differ.
- Examples differ.
- Architecture description differs.

---

## Rule 2 — Landing Page First

The README is the landing page.

It must allow a new visitor to understand the project without opening additional documentation.

The README must include:

- Product introduction
- Problem statement
- Product purpose
- Installation
- Quick start
- Common commands
- API example, if applicable
- Visual explanation
- Technical overview
- Project limitations
- License

The README must not become only a collection of documentation links.

---

## Rule 3 — Image Policy

Images are part of the landing page.

Images must render directly inside the README.

Requirements:

- Every local image reference must exist.
- Every local image path must be valid.
- Relative paths are preferred.
- Images must remain visible on GitHub.
- Primary visuals must be rendered directly in the README.

Broken image links are prohibited.

Image placeholders are prohibited.

---

## Rule 4 — Documentation Links

Documentation exists to provide deeper information.

Documentation must never replace visible landing-page content.

Allowed pattern:

```text
README
  -> visible image
  -> short explanation
  -> optional "read more" link
```

Blocked pattern:

```text
README
  -> only hyperlink
  -> separate document
```

Users should not need to open another page simply to view diagrams already referenced by the README.

---

## Rule 5 — Visual Requirements

The README should contain the primary visuals directly.

Examples include:

- Banner
- Runtime boundary
- Execution flow
- Architecture overview
- Story diagrams
- Product screenshots

Large technical diagrams may have dedicated documentation pages. However, the README must still contain a rendered preview or primary visual.

---

## Rule 6 — Product Identity

The README must consistently describe the product using the approved architecture.

Approved framing:

- Host-controlled execution
- Local-first execution
- Runtime-provided validation
- Runtime-provided policy checks
- Evidence-based execution
- Scope-aware proof
- Policy-centric safety

The README must never describe the project as:

- Workflow platform
- Workflow automation platform
- Agent marketplace
- Multi-agent controller
- Orchestration engine
- Deterministic workflow engine
- Bot framework
- Bot farm
- External planner
- Fixed pipeline

Architecture wording must remain consistent across repositories.

---

## Rule 7 — Installation Accuracy

Every installation command must be valid for the released package.

Requirements:

- Package names must match `package.json`.
- Node.js version requirements must match `package.json`.
- CLI examples must match the released package.
- One-off `npx` usage must use the scoped package explicitly.

Validation must fail if installation instructions become stale.

---

## Rule 8 — Command Accuracy

Every command shown inside the README must be validated against the public CLI surface.

Examples:

- `npx lbe`
- `npx lbe init`
- `npx lbe status`
- `npx lbe scope`
- `npx lbe intent`
- `npx lbe audit-workspace`
- `npx lbe proof`
- `npx lbe execute`
- `npx lbe observe`
- `npx lbe enforce`

Commands that no longer exist must not remain documented.

---

## Rule 9 — Documentation Consistency

The following must remain synchronized:

- README
- Technical visuals
- Installation guide
- Command reference
- API examples
- Public release documentation

Documentation drift is prohibited.

---

## Rule 10 — Repository Synchronization

Public and private repositories represent the same product.

The landing page must remain identical.

Differences are allowed only for:

- Internal engineering documentation
- Internal governance
- Internal roadmap
- Internal implementation notes
- Security documentation
- Private developer guides

The public landing page must never diverge from the private landing page.

---

## Rule 11 — Governance Validation

Validation must fail when:

- README differs between repositories when a private README comparison target is supplied.
- Images are missing.
- Broken image paths exist.
- Product identity wording changes.
- Required sections are missing.
- Installation commands become invalid.
- Command examples become invalid.
- Documentation drift is detected.

---

## Rule 12 — Required README Sections

The README must contain:

1. Banner
2. Product summary
3. Problem statement
4. Product purpose
5. Installation
6. Quick start
7. Terminal workflow
8. Core concepts
9. Story flow
10. Commands
11. API example
12. Package contents
13. Technical visuals
14. Limitations
15. License

Removing any required section without replacement is prohibited.

---

## Required Governance Blockers

Governance must expose the following validation blockers.

```text
BLOCK_README_DRIFT
BLOCK_PUBLIC_PRIVATE_README_MISMATCH
BLOCK_MISSING_README_IMAGES
BLOCK_BROKEN_IMAGE_PATHS
BLOCK_IMAGE_NOT_RENDERED
BLOCK_README_IDENTITY_DRIFT
BLOCK_REQUIRED_SECTION_MISSING
BLOCK_INVALID_INSTALL_COMMAND
BLOCK_INVALID_COMMAND_REFERENCE
BLOCK_DOCUMENTATION_DRIFT
BLOCK_TECHNICAL_VISUAL_DRIFT
BLOCK_README_LINK_REDIRECT
BLOCK_STALE_API_EXAMPLE
BLOCK_RELEASE_DOCUMENTATION_DRIFT
```

These blockers are mandatory.

A failing blocker must stop validation until corrected.

---

## Workflow Requirement

Every governance or release workflow that validates documentation must execute these checks before reporting success.

If validation fails:

- Fix only the failing issue.
- Re-run validation.
- Continue within the approved scope.

If validation passes:

- Continue automatically to the next scoped task.

Validation success must never terminate execution prematurely unless the current scope is complete.

---

## Scope

This governance applies to:

- Local development
- CI validation
- Pull requests
- Release preparation
- Public releases
- Private repository synchronization
- Documentation generation
- README updates
- Asset updates
- Release automation

Compliance with this document is mandatory.
