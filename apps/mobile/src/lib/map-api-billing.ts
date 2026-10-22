import type {
  ApiAppClient,
  ApiBillingResponse,
  ApiContractsResponse,
  ApiPayment,
  ApiPendingInvoice,
  AppChannelClient,
} from "@/types/app-channel";
import type {
  AccountQuote,
  AppPaymentRecord,
  AppPendingInvoice,
  ClientAccountStatus,
  ContractSnapshot,
} from "@/types/domain";

const ACCOUNT_STATUSES = new Set<ClientAccountStatus>([
  "Al día",
  "Con deuda",
  "Suspendido",
  "Prospecto",
]);

export const mapAccountStatus = (
  value: string | null | undefined,
): ClientAccountStatus => {
  if (value && ACCOUNT_STATUSES.has(value as ClientAccountStatus)) {
    return value as ClientAccountStatus;
  }
  return "Prospecto";
};

export const mapApiAppClient = (client: ApiAppClient): AppChannelClient => ({
  id: client.id,
  name: client.name,
  phone: client.phone,
  cedula: client.cedula ?? undefined,
  appEnabled: client.app_enabled,
  zone: client.zone,
  wisproLinked: client.wispro_linked,
  wisproId: client.wispro_id,
  account: client.account,
  plan: client.plan,
  debt: client.debt,
  hasDebt: client.has_debt,
  serviceSuspended: client.service_suspended,
  contractState: client.contract_state,
  contractStateLabel: client.contract_state_label,
  contractId: client.contract_id,
  planName: client.plan_name,
  pppProfile: client.ppp_profile,
  calculatedAt: client.calculated_at,
});

export const mapApiPendingInvoice = (
  invoice: ApiPendingInvoice,
): AppPendingInvoice => ({
  id: invoice.id,
  invoiceNumber: invoice.invoice_number,
  state: invoice.state,
  balanceUsdFormatted: invoice.balance_usd_formatted,
  amountUsdFormatted: invoice.amount_usd_formatted,
  firstDueDate: invoice.first_due_date,
  periodTo: invoice.period_to,
  concept: invoice.concept,
});

export const mapApiBilling = (payload: ApiBillingResponse): AccountQuote => ({
  accountStatus: mapAccountStatus(payload.account_status),
  serviceSuspended: Boolean(payload.service_suspended),
  hasDebt: Boolean(payload.has_debt),
  debtUsdFormatted: payload.debt_usd_formatted,
  debtBsFormatted: payload.debt_bs_formatted,
  bcvRateDisplay: payload.bcv_rate_display,
  officeClosed: Boolean(payload.office_closed),
  nextOpenLabel: payload.next_open_label,
  planName: payload.plan_name,
  zone: payload.zone,
  periodLabel: payload.period_label,
  dueHint: payload.due_hint,
  wisproLinked: Boolean(payload.wispro_linked),
  billingStale: Boolean(payload.billing_stale),
  contractState: payload.contract_state,
  contractStateLabel: payload.contract_state_label,
  contractId: payload.contract_id,
  pendingInvoices: (payload.pending_invoices || []).map(mapApiPendingInvoice),
});

export const mapApiContracts = (
  payload: ApiContractsResponse,
): ContractSnapshot => {
  const primary = payload.primary;
  return {
    holderName: payload.holder_name,
    cedula: payload.cedula,
    cedulaDisplay: payload.cedula_display,
    planName: primary?.plan_label || primary?.plan_name || null,
    zone: payload.zone,
    contractState: primary?.state ?? null,
    contractStateLabel: primary?.state_label ?? null,
    contractId: primary?.id ?? null,
    accountStatus: mapAccountStatus(payload.account_status),
    wisproLinked: Boolean(payload.wispro_linked),
    pppoeUsername: primary?.pppoe_username ?? null,
    ipAddress: null,
  };
};

export const mapApiPayment = (payment: ApiPayment): AppPaymentRecord => ({
  id: payment.id,
  status: payment.status,
  amountFormatted: payment.amount_formatted,
  bank: payment.bank,
  paymentDate: payment.payment_date,
  transactionCode: payment.transaction_code,
  createdAt: payment.created_at,
  receiptMediaUrl: payment.receipt_media_url,
});
