import { apiClient } from "@/lib/api-client";
import { mapApiPayment } from "@/lib/map-api-billing";
import type { AppPaymentRecord, PaymentStatus } from "@/types/domain";

export const fetchCustomerPayments = async (): Promise<AppPaymentRecord[]> => {
  const payload = await apiClient.getPayments();
  return (payload.payments || []).map(mapApiPayment);
};

export const paymentRecordStatusLabel = (status: string): string => {
  const normalized = status.trim().toUpperCase() as PaymentStatus | string;
  switch (normalized) {
    case "RECIBIDO":
      return "Recibido";
    case "EN_PROCESO":
      return "En revisión";
    case "APROBADO":
      return "Aprobado";
    case "RECHAZADO":
      return "Rechazado";
    case "DUPLICADO":
      return "Duplicado";
    case "ERROR":
      return "Error";
    default:
      return status;
  }
};
