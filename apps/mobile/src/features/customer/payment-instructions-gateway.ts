import { fetchAccountQuote } from "@/features/customer/account-quote-gateway";
import { apiClient } from "@/lib/api-client";
import type { ApiPaymentInstructionMethod } from "@/types/app-channel";
import type {
  AccountQuote,
  PaymentInstructions,
  PaymentMethodId,
  PaymentMethodOption,
} from "@/types/domain";

const isPaymentMethodId = (value: string): value is PaymentMethodId =>
  value === "pago_movil" ||
  value === "transferencia" ||
  value === "deposito" ||
  value === "deposito_usd";

export const hasPendingDebt = (quote: AccountQuote) =>
  quote.hasDebt ||
  quote.accountStatus === "Con deuda" ||
  quote.accountStatus === "Suspendido";

export const paymentStatusLabel = (quote: AccountQuote) => {
  if (quote.accountStatus === "Suspendido") {
    return "Vencida";
  }
  if (quote.accountStatus === "Con deuda" || quote.hasDebt) {
    return "Por pagar";
  }
  return "Al día";
};

const amountLineFor = (quote: AccountQuote, methodId: PaymentMethodId) => {
  const usd = quote.debtUsdFormatted ?? "$0,00";
  if (methodId === "deposito_usd") {
    return usd;
  }
  if (quote.debtBsFormatted) {
    return `${quote.debtBsFormatted} / ${usd}`;
  }
  return usd;
};

const confirmAmountFor = (quote: AccountQuote, methodId: PaymentMethodId) => {
  if (methodId === "deposito_usd") {
    return quote.debtUsdFormatted ?? "$0,00";
  }
  return quote.debtBsFormatted ?? quote.debtUsdFormatted ?? "$0,00";
};

const formatUpdatedAtLabel = (iso: string | null) => {
  if (!iso) return "Actualizado por tu proveedor";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Actualizado por tu proveedor";
  return `Actualizado ${date.toLocaleString("es-VE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

const toMethodOption = (
  method: ApiPaymentInstructionMethod,
): PaymentMethodOption | null => {
  if (!isPaymentMethodId(method.id)) return null;
  return {
    id: method.id,
    title: method.title,
    description: method.description,
  };
};

export const fetchPaymentMethodOptions = async (): Promise<
  PaymentMethodOption[]
> => {
  const payload = await apiClient.getPaymentInstructions();
  return (payload.methods || [])
    .map(toMethodOption)
    .filter((item): item is PaymentMethodOption => Boolean(item));
};

export const fetchPaymentInstructions = async (
  methodId: PaymentMethodId,
): Promise<PaymentInstructions> => {
  const [quote, payload] = await Promise.all([
    fetchAccountQuote(),
    apiClient.getPaymentInstructions({ method: methodId }),
  ]);

  const method = (payload.methods || []).find((item) => item.id === methodId);
  if (!method || !isPaymentMethodId(method.id)) {
    throw new Error(
      "Este método de pago no está disponible. Solicita los datos por el chat.",
    );
  }

  const amountLine = amountLineFor(quote, methodId);
  const serverFields = (method.fields || [])
    .map((field) => ({
      label: String(field.label || "").trim(),
      value: String(field.value || "").trim(),
    }))
    .filter((field) => field.label && field.value);

  const fields = [
    { label: "Monto", value: amountLine },
    ...serverFields.filter(
      (field) => field.label.toLowerCase() !== "monto",
    ),
  ];

  return {
    methodId,
    methodTitle: method.title,
    bankName: method.bank_name?.trim() || "",
    confirmAmountLabel: confirmAmountFor(quote, methodId),
    amountLine,
    fields,
    updatedAtLabel: formatUpdatedAtLabel(method.updated_at),
  };
};
