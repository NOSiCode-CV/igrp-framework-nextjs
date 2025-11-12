// hooks/geography.ts (or better: hooks/domains.ts)
import { useQueries, useQuery } from "@tanstack/react-query";
import { getDomain } from "../functions/domains";

export const useGetDomain = (domain: string) => {
  return useQuery({
    queryKey: ["domain", domain],
    queryFn: () => getDomain(domain),
  });
};

export const useGetDomains = (domains: string[]) => {
  return useQueries({
    queries: domains.map((domain) => ({
      queryKey: ["domain", domain],
      queryFn: () => getDomain(domain),
      enabled: !!domain,
    })),
  });
};

export const useGetDomainAccord = () => {
  const results = useGetDomains([
    "D_TIPO_INSTR_JURID",
    "D_NAT_INSTR_JURID",
    "D_DOMINIO_INSTR_JURIC",
    "D_FASE_INSTR_JURID",
    "D_SIM_NAO",
    "D_ESTADO",
    "D_TIPO_DOCUMENTO",
  ]);

  const [tipo, nat, domain, phase, yesNo, status, documentType] = results ?? [];

  const isLoading = results?.some((r) => r?.isLoading) ?? true;
  const isError = results?.some((r) => r?.isError) ?? false;

  return {
    isLoading,
    isError,
    tipoOptions: Array.isArray(tipo?.data) ? tipo.data : [],
    natOptions: Array.isArray(nat?.data) ? nat.data : [],
    domainOptions: Array.isArray(domain?.data) ? domain.data : [],
    phaseOptions: Array.isArray(phase?.data) ? phase.data : [],
    yesNoOptions: Array.isArray(yesNo?.data) ? yesNo.data : [],
    statusOptions: Array.isArray(status?.data) ? status.data : [],
    documentTypeOptions: Array.isArray(documentType?.data)
      ? documentType.data
      : [],
  };
};
