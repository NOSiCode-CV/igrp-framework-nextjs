import type { IGRPUserArgs } from '@igrp/framework-next-types';
import type { IGRPUserDTO } from '@igrp/platform-access-management-client-ts';

/**
 * Narrows an Access Management user DTO to the framework's `IGRPUserArgs`.
 *
 * **This is a privacy boundary, not a formality.** `IGRPUserArgs` is reached
 * through `IGRPHeaderDataArgs.user` and `IGRPSidebarDataArgs.user`, both of
 * which are handed to `'use client'` components — so whatever this function
 * returns is serialized into the RSC payload and delivered to the browser.
 *
 * `IGRPUserDTO` is wider than `IGRPUserArgs`: it also carries `metadata` (a
 * free-form `Record<string, unknown>` the authorization server owns and
 * enriches into issued JWTs), `nic` and `phoneNumber` (personal data no
 * framework component renders) and `emailVerified`. Assigning the DTO
 * straight through type-checks
 * — that is precisely what `next-types`' `AssignableTo<IGRPUserDTO,
 * IGRPUserArgs>` contract assertion proves, and a variable (unlike a fresh
 * object literal) gets no excess-property check — so nothing in the compiler
 * stands between the DTO and the client. This function is that thing.
 *
 * Every field is listed explicitly for that reason: a new DTO field reaches the
 * browser only if someone adds it here on purpose. `next-types`' key-coverage
 * gate fails the build when a DTO field is not mirrored, so the decision cannot
 * be skipped silently either.
 */
export const mapUserDTO = (user: IGRPUserDTO): IGRPUserArgs => ({
  id: user.id,
  name: user.name,
  username: user.username,
  email: user.email,
  status: user.status,
  picture: user.picture,
  signature: user.signature,
  // `metadata`, `nic`, `phoneNumber` and `emailVerified` are deliberately
  // withheld — see above, and the named exclusions in `next-types`'
  // `contract/am-contract.ts`.
});
