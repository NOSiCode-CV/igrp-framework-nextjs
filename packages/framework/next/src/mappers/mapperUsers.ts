import type { ApiResponse, IGRPUserDTO } from '@igrp/platform-access-management-client-ts';
import type { IGRPUserArgs } from '@igrp/framework-next-types';

const mapUser = (user: IGRPUserDTO): IGRPUserArgs => ({
  id: user.id as number,
  name: user.name,
  email: user.email,
  username: user.username,
  igrpUsername: user.username,
  status: 'ACTIVE',
});

export const mapperUser = (user: ApiResponse<IGRPUserDTO>): IGRPUserArgs => {
  if (!user.data) throw new Error('[igrp-users]: O utilizador não foi encontrado.');
  return mapUser(user.data);
};
