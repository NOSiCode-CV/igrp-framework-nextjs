---
name: "autentika-provider"
description: "Implements the Autentika NextAuth provider and dynamic provider registry. Invoke when adding WSO2IS/Autentika auth or replacing Keycloak-only NextAuth logic."
---

# Autentika Provider

Use this skill when working on authentication in `igrp-framework-nextjs`, especially when:

- adding the Autentika provider for NextAuth
- exporting provider id constants
- replacing Keycloak-only auth logic with a dynamic provider registry
- updating templates to support `keycloak` and `autentika`

## Reference

- `references/autentika-provider-reference.md`

## Implementation Rules

- Keep provider selection registry-based
- Do not branch provider choice with `if/else`
- Export `autentika` as a reusable provider id constant
- Keep consumer apps dependent on framework exports for provider ids and provider creation
- Use WSO2IS-style discovery URL for Autentika
