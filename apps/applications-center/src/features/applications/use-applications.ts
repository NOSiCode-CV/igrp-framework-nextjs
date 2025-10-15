import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateApplicationRequest } from "@igrp/platform-access-management-client-ts";
import { IGRPApplicationArgs } from "@igrp/framework-next-types";

import {
  createApplication,
  getApplicationByCode,
  getApplications,
  updateApplication,
} from "@/actions/applications";
import { ApplicationArgs } from "./app-schemas";

export const useApplications = () => {
  return useQuery<ApplicationArgs[]>({
    queryKey: ["applications"],
    queryFn: () => getApplications(),
  });
};

export const useApplicationByCode = (code: string) => {
  return useQuery<ApplicationArgs>({
    queryKey: ["applications", code],
    queryFn: () => getApplicationByCode(code),
  });
};

export const useCreateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
};

export const useUpdateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      code,
      data,
    }: {
      code: string;
      data: UpdateApplicationRequest;
    }) => updateApplication(code, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
};
