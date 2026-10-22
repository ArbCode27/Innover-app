import { fetchAccountQuote } from "@/features/customer/account-quote-gateway";
import type {
  AccountQuote,
  PaymentInstructions,
  PaymentMethodId,
  PaymentMethodOption,
} from "@/types/domain";

/**
 * Métodos de pago (UX). Los datos bancarios de destino aún no tienen
 * endpoint `/api/app/payment-instructions` — ver docs/BACKEND_GAPS.md §5b.
 * Los montos salen de la cotización real del servidor; no se inventan cuentas.
 */
export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  {
    id: "pago_movil",
    title: "Pago Móvil",
    description: null,
  },
  {
    id: "transferencia",
    title: "Transferencia",
    description: "Puede demorar más de 48 hrs",
  },
  {
    id: "deposito",
    title: "Depósito",
    description: null,
  },
  {
    id: "deposito_usd",
    title: "Depósito USD",
    description: null,
  },
];

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

export const fetchPaymentInstructions = async (
  methodId: PaymentMethodId,
): Promise<PaymentInstructions> => {
  const quote = await fetchAccountQuote();
  const option = PAYMENT_METHOD_OPTIONS.find((item) => item.id === methodId);

  return {
    methodId,
    methodTitle: option?.title ?? "Pago Móvil",
    bankName: "",
    confirmAmountLabel: confirmAmountFor(quote, methodId),
    amountLine: amountLineFor(quote, methodId),
    fields: [
      {
        label: "Monto",
        value: amountLineFor(quote, methodId),
      },
      {
        label: "Datos bancarios",
        value: "Solicítalos por el chat de la app",
      },
    ],
    updatedAtLabel: "Pendiente de configuración en el servidor",
  };
};
