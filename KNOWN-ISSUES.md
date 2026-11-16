# Known issues — repository

## Leaked credentials still readable in git history

Two sets of credentials were committed and later removed from the tree, but every clone can still read them from history:

- **Sonatype `igrp3.0` password**, in the root `.npmrc` (for example `git show 7b17fd2d^:.npmrc`). It is in about 14 commits reachable from `development`, `production`, `version/0.2.0-beta` and `support/0.1.0-beta`. The account probably has publish rights on `sonatype.nosi.cv`, so whoever holds it can publish a malicious `@igrp/*` version under `latest`.
- **Keycloak client secret for `access-management`** on `accounts-stage.inss.gw/realms/igrp`, plus a **`NEXTAUTH_SECRET`**, in `apps/applications-center/docker-compose.yml` (removed in `3d088d18`; first committed as `templates/application-center/docker/docker-compose.yml` in `0d71984c`). They allow impersonating that OIDC client and forging NextAuth session cookies on any deployment that still uses the secret.

Not fixed because rotation happens in the Sonatype and Keycloak consoles, not in code, and the history rewrite needs a force-push the whole team has to coordinate. Removing the values from history does not help on its own: they have already leaked.

To close it, in this order:

1. **Sonatype:** change the `igrp3.0` password. Put the new value in user `.npmrc` files and CI variables before disabling the old one, then check the registry audit log for publishes made with it. Prefer per-user publish tokens, separate from install credentials.
2. **Keycloak:** regenerate the `access-management` client secret, then change `NEXTAUTH_SECRET` on every deployment that used the old value. Everyone signed in there is logged out once.
3. **History:** after both rotations, run `git filter-repo --replace-text` over all refs with both values, force-push, and have everyone re-clone. Keep a backup mirror first. The deleted runbook at `6ee413e1:docs/npmrc-credential-scrub-runbook.md` has the steps.

Delete this entry once steps 1 and 2 are done; step 3 is cleanup.

## Login throttling is unverified

Login runs on the Spring Authorization Server, outside this repo, so nothing here limits failed sign-in attempts. Confirm on the authorization server, or the gateway in front of it, that repeated failed logins are locked out or slowed down. Delete this entry once confirmed.
