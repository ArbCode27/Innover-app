import { apiClient } from "@/lib/api-client";
import { mapApiBilling, mapApiContracts } from "@/lib/map-api-billing";
import type { AccountQuote, ContractSnapshot } from "@/types/domain";

export const fetchAccountQuote = async (options?: {
  refresh?: boolean;
}): Promise<AccountQuote> => {
  const payload = await apiClient.getBilling({ refresh: options?.refresh });
  return mapApiBilling(payload);
};

export const fetchContractSnapshot = async (): Promise<ContractSnapshot> => {
  const payload = await apiClient.getContracts();
  return mapApiContracts(payload);
};
