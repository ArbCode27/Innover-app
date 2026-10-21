import type { AccountQuote, AppProfile, ContractSnapshot } from "@/types/domain";

const delay = async () => {
  await new Promise((resolve) => setTimeout(resolve, 200));
};

/**
 * Cotización de saldo ya formateada por el servidor según reglas del negocio VE.
 * "esto no existe en el CRM; hay que crearlo" (ver docs/BACKEND_GAPS.md).
 */
export const fetchAccountQuote = async (): Promise<AccountQuote> => {
  await delay();
  return {
    accountStatus: "Con deuda",
    serviceSuspended: false,
    debtUsdFormatted: "$30,00",
    debtBsFormatted: "Bs. 26.141,07",
    bcvRateDisplay: "871,37 Bs/$",
    officeClosed: false,
    nextOpenLabel: null,
    planName: "Fibra 200 Mbps",
    zone: "Valencia · Urb. El Parral",
    periodLabel: "Octubre 2026",
    dueHint: "Paga antes de la fecha de corte y evita cargos",
  };
};

export const fetchContractSnapshot = async (
  profile: AppProfile | null,
): Promise<ContractSnapshot> => {
  const quote = await fetchAccountQuote();
  return {
    holderName: profile?.displayName && profile.displayName !== "Abonado" ? profile.displayName : "Carlos Silva",
    cedula: profile?.loginCedula ?? "18.765.432",
    planName: quote.planName,
    zone: quote.zone,
    contractState: "Activo (FTTH-2026-0842)",
    accountStatus: quote.accountStatus,
    ipAddress: "190.202.88.45 (IP Dinámica ONT)",
  };
};
