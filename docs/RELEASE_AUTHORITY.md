# Release Authority

Package:
@letterblack/lbe-core

Release artifacts are generated from an internal source repository and validated before they reach the public package surface.

Public repo:
Letterblack0306/LetterBlack-Sentinel

Rules:
1. Only the internal source repository may publish @letterblack/lbe-core to npm.
2. Only the internal source repository may create official package GitHub Releases.
3. LetterBlack-Sentinel is public-facing and may validate package contents only.
4. LetterBlack-Sentinel must not contain workflows that publish npm, create releases, upload release artifacts, or create tags.
5. Agents must not infer release authority from repository visibility.
6. Agents must read this file before changing package.json, release.yml, tags, npm scripts, or release docs.