import type { IGRPUserArgs } from '@igrp/framework-next-types';
import type { ApiResponse, IGRPUserDTO } from '@igrp/platform-access-management-client-ts';

/**
 * Maps to the framework's `IGRPUserArgs`, like the application and menu
 * mappers do for their own shapes.
 *
 * This used to return `IGRPUserDTO` unchanged, which made `framework-next` the
 * one place that leaked an Access Management DTO straight into framework-facing
 * code — while `IGRPHeaderDataArgs.user` expected `IGRPUserArgs`. The seam
 * worked only because the DTO happens to be assignable; `next-types`' contract
 * gate now asserts that, and this mapper no longer relies on it.
 */
export const mapperUser = (user: ApiResponse<IGRPUserDTO>): IGRPUserArgs => {
  if (!user.data) throw new Error('[igrp-users]: O utilizador não foi encontrado.');

  const { id, name, username, email, status, picture, signature } = user.data;
  return { id, name, username, email, status, picture, signature };
};
