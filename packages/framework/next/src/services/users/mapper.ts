import type { IGRPUserArgs } from "../../types";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";

const mapUser = (user: IGRPUserDTO): IGRPUserArgs => ({
  id: user.id as number,
  name: user.name,
  email: user.email,
  username: user.username,
  igrpUsername: user.username,
  status: "ACTIVE",
});

export const mapperUser = (user: IGRPUserDTO): IGRPUserArgs => {
  if (!user) throw new Error("User not found");
  return mapUser(user);
}
