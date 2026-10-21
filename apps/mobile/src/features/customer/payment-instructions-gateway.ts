import { fetchAccountQuote } from "@/features/customer/account-quote-gateway";
import type {
  AccountQuote,
  PaymentInstructions,
  PaymentMethodId,
  PaymentMethodOption,
} from "@/types/domain";

/**
 * Datos bancarios de destino para que el abonado pague.
 * "esto no existe en el CRM; hay que crearlo" (ver docs/BACKEND_GAPS.md).
 * Los montos salen de la cotización del servidor; no se recalculan aquí.
 */
const MOCK_BANK_NAME = "Banco Nacional de Crédito";
const MOCK_RIF = "J-503164379";
const MOCK_PHONE = "0412-530-1637";
const MOCK_UPDATED_AT = "17 de octubre a las 18:08";

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
  quote.accountStatus === "Con deuda" || quote.accountStatus === "Suspendido";

export const paymentStatusLabel = (quote: AccountQuote) => {
  if (quote.accountStatus === "Suspendido") {
    return "Vencida";
  }
  if (quote.accountStatus === "Con deuda") {
    return "Por pagar";
  }
  return "Al día";
};

const amountLineFor = (quote: AccountQuote, methodId: PaymentMethodId) => {
  if (methodId === "deposito_usd") {
    return quote.debtUsdFormatted;
  }
  if (quote.debtBsFormatted) {
    return `${quote.debtBsFormatted} / ${quote.debtUsdFormatted}`;
  }
  return quote.debtUsdFormatted;
};

const confirmAmountFor = (quote: AccountQuote, methodId: PaymentMethodId) => {
  if (methodId === "deposito_usd") {
    return quote.debtUsdFormatted;
  }
  return quote.debtBsFormatted ?? quote.debtUsdFormatted;
};

export const fetchPaymentInstructions = async (
  methodId: PaymentMethodId,
): Promise<PaymentInstructions> => {
  const quote = await fetchAccountQuote();
  const option = PAYMENT_METHOD_OPTIONS.find((item) => item.id === methodId);

  const sharedFields = [
    { label: "Destino", value: MOCK_BANK_NAME },
    { label: "RIF", value: MOCK_RIF },
  ];

  const fields =
    methodId === "pago_movil"
      ? [
          ...sharedFields,
          { label: "Teléfono", value: MOCK_PHONE },
          { label: "Monto", value: amountLineFor(quote, methodId) },
        ]
      : [
          ...sharedFields,
          { label: "Monto", value: amountLineFor(quote, methodId) },
        ];

  return {
    methodId,
    methodTitle: option?.title ?? "Pago Móvil",
    bankName: MOCK_BANK_NAME,
    confirmAmountLabel: confirmAmountFor(quote, methodId),
    amountLine: amountLineFor(quote, methodId),
    fields,
    updatedAtLabel: MOCK_UPDATED_AT,
  };
};
