import type { ApiResponse, IGRPUserDTO } from '@igrp/platform-access-management-client-ts';

export const mapperUser = (user: ApiResponse<IGRPUserDTO>): IGRPUserDTO => {
  if (!user.data) throw new Error('[igrp-users]: O utilizador não foi encontrado.');
  return user.data;
};
