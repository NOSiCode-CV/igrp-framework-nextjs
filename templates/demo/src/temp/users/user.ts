import type {
  IGRPUserDTO,
  Status,
} from "@igrp/platform-access-management-client-ts";

export const IGRP_MOCK_USER: IGRPUserDTO = {
  id: 1,
  username: "igrp.user",
  name: "IGRP USER",
  email: "igrp.user@nosi.cv",
  status: "ACTIVE" as Status,
};
