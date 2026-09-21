/**
 * Build-time conformance gate between this package's Access Management types
 * and the DTOs of `@igrp/platform-access-management-client-ts`.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `src/types/access-management.ts` mirrors the AM client's DTOs by hand, and
 * has to: the client models `status` / `type` as `declare enum`s, while
 * templates author menus and applications as object literals with plain
 * strings. A literal union is the only shape assignable from both directions.
 *
 * Mirroring by hand drifts. Before this gate existed the two contracts had
 * silently diverged in eight places — `ResourceDTO.permissions` was
 * `string[]` against `IGRPPermissionArgs[]`, `PermissionDTO.description` was
 * nullable, `RoleDTO.name` optional, `DepartmentDTO.status` optional,
 * `FileUrlDTO.expiration` a `Date`, and the framework's mappers papered over
 * the rest with `as` casts.
 *
 * WHAT IT ASSERTS
 * ---------------
 * Two directions, because the framework moves data both ways.
 *
 * INBOUND (AM response → framework shape), what the mappers in
 * `@igrp/framework-next` do: each DTO must be assignable to its framework
 * counterpart. Not an equality check — the framework unions are supersets in
 * two places and the application mapper normalises `slug: string | null`.
 *
 * OUTBOUND (framework → AM request), what the on-code menu / permission sync
 * does: structural assignability can never hold here, because the client types
 * `type` and `status` as `declare enum`s and a string literal is not
 * assignable to an enum member. So the outbound gate pins the *narrowed*
 * unions instead — `IGRPMenuTypeSyncable` and `IGRPApplicationTypeSyncable`
 * must be exactly the client's enums, member for member. The sync converts
 * through an exhaustive lookup keyed on those unions, so a new member on
 * either side breaks the build instead of reaching the wire.
 *
 * This is the gap that let `igrpSyncMenus` cast `type as MenuType` and push
 * `SYSTEM_PAGE` — a value AM does not define — for any template declaring one.
 *
 * HOW IT RUNS
 * -----------
 * `pnpm check:contract` (also wired into `pnpm build`) type-checks this file
 * with `tsconfig.contract.json`, which emits nothing. The AM client is a
 * devDependency and never reaches the published `dist/` or a consumer's
 * install — this file lives outside `src/`, so `tsc -b` never sees it.
 *
 * WHEN IT FAILS
 * -------------
 * The AM client changed. Update `src/types/access-management.ts` to match, or
 * — if the framework intends to diverge — narrow the assertion here and say
 * why in a comment. Never silence it with a cast.
 */

import type {
  ApplicationDTO,
  ApplicationType,
  DepartmentDTO,
  FileUrlDTO,
  GlobalConfigurationDTO,
  GlobalConfigurationType,
  IGRPUserDTO,
  MenuEntryDTO,
  MenuTargetType,
  MenuType,
  PermissionDTO,
  ResourceDTO,
  ResourceItemDTO,
  ResourceType,
  RoleDepartmentDTO,
  RoleDTO,
  RoleUserDTO,
  Status,
} from '@igrp/platform-access-management-client-ts';

import type {
  IGRPApplicationArgs,
  IGRPApplicationType,
  IGRPApplicationTypeSyncable,
  IGRPConfigurationType,
  IGRPDepartmentArgs,
  IGRPFileUrlArgs,
  IGRPGlobalConfigurationArgs,
  IGRPMenuItemArgs,
  IGRPMenuType,
  IGRPMenuTypeSyncable,
  IGRPPermissionArgs,
  IGRPResourceArgs,
  IGRPResourceItem,
  IGRPResourceType,
  IGRPRoleArgs,
  IGRPRoleDepartmentArgs,
  IGRPRoleUserArgs,
  IGRPStatus,
  IGRPTargetType,
  IGRPUserArgs,
} from '../src/index';

/** Compile error unless every member of `From` is assignable to `To`. */
type AssignableTo<From, To> = [From] extends [To]
  ? true
  : { error: 'not assignable'; from: From; to: To };

/** Both directions — for aliases that must stay exactly in step. */
type Equivalent<A, B> = [A] extends [B]
  ? [B] extends [A]
    ? true
    : { error: 'B not assignable to A'; a: A; b: B }
  : { error: 'A not assignable to B'; a: A; b: B };

/* -- Enum → literal union ------------------------------------------------- */
// These are what the mappers used to cast away with `as`. TypeScript accepts a
// string enum where its literal union is expected, so the casts were never
// load-bearing; these assertions are what make deleting them safe to keep.

export type _Status = AssignableTo<Status, IGRPStatus>;
export type _MenuType = AssignableTo<MenuType, IGRPMenuType>;
export type _ApplicationType = AssignableTo<ApplicationType, IGRPApplicationType>;
export type _ResourceType = AssignableTo<ResourceType, IGRPResourceType>;
export type _ConfigurationType = AssignableTo<GlobalConfigurationType, IGRPConfigurationType>;
export type _TargetType = Equivalent<MenuTargetType, IGRPTargetType>;

/* -- Outbound: narrowed unions must equal the client enums ---------------- */
// `${Enum}` is the enum's literal union. Equivalence (not one-way
// assignability) is the point: if AM adds a MenuType the framework cannot
// produce, or the framework adds one AM will reject, this fails here rather
// than at the wire. The sync's exhaustive `satisfies Record<...>` lookup then
// fails too, naming the missing member.

export type _MenuTypeSyncable = Equivalent<`${MenuType}`, IGRPMenuTypeSyncable>;
export type _ApplicationTypeSyncable = Equivalent<
  `${ApplicationType}`,
  IGRPApplicationTypeSyncable
>;
export type _StatusSyncable = Equivalent<`${Status}`, IGRPStatus>;

/* -- Whole-object shapes -------------------------------------------------- */

export type _RoleDepartment = AssignableTo<RoleDepartmentDTO, IGRPRoleDepartmentArgs>;
export type _MenuEntry = AssignableTo<MenuEntryDTO, IGRPMenuItemArgs>;
export type _Permission = AssignableTo<PermissionDTO, IGRPPermissionArgs>;
export type _Role = AssignableTo<RoleDTO, IGRPRoleArgs>;
export type _Department = AssignableTo<DepartmentDTO, IGRPDepartmentArgs>;
export type _User = AssignableTo<IGRPUserDTO, IGRPUserArgs>;
export type _RoleUser = AssignableTo<RoleUserDTO, IGRPRoleUserArgs>;
export type _GlobalConfiguration = AssignableTo<
  GlobalConfigurationDTO,
  IGRPGlobalConfigurationArgs
>;
export type _FileUrl = AssignableTo<FileUrlDTO, IGRPFileUrlArgs>;
export type _ResourceItem = AssignableTo<ResourceItemDTO, IGRPResourceItem>;
export type _Resource = AssignableTo<ResourceDTO, IGRPResourceArgs>;

/*
 * `ApplicationDTO` is asserted field-by-field rather than whole-object: the
 * applications mapper normalises `slug: string | null` to `string | undefined`,
 * so the whole-object form would fail on a difference that is intentional.
 */
type ApplicationPassThrough = Omit<ApplicationDTO, 'slug'>;
export type _Application = AssignableTo<ApplicationPassThrough, Omit<IGRPApplicationArgs, 'slug'>>;
export type _ApplicationSlug = AssignableTo<NonNullable<ApplicationDTO['slug']>, string | null>;

/* -- Force evaluation ----------------------------------------------------- */
// Type aliases alone are lazy; assigning them pins every check to `true` and
// surfaces the `{ error, From, To }` object in the compiler message when one
// fails.

const assertions: [
  _Status,
  _MenuType,
  _ApplicationType,
  _ResourceType,
  _ConfigurationType,
  _TargetType,
  _MenuTypeSyncable,
  _ApplicationTypeSyncable,
  _StatusSyncable,
  _RoleDepartment,
  _MenuEntry,
  _Permission,
  _Role,
  _Department,
  _User,
  _RoleUser,
  _GlobalConfiguration,
  _FileUrl,
  _ResourceItem,
  _Resource,
  _Application,
  _ApplicationSlug,
] = [
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
];

export { assertions };
