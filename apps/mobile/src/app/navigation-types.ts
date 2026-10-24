import type { PaymentMethodId } from "@/types/domain";
import type { NavigatorScreenParams } from "@react-navigation/native";

export type BillingStackParamList = {
  Pagos: undefined;
  MetodoPago: undefined;
  ConfirmarBanco: { methodId: PaymentMethodId };
  DatosPago: { methodId: PaymentMethodId };
  AdjuntarComprobante: { methodId: PaymentMethodId };
  PagoRecibido: { methodId: PaymentMethodId };
};

export type CustomerTabParamList = {
  Inicio: undefined;
  Chat: { intent?: "report-outage" | "confirm-connection" } | undefined;
  "Mi ticket": undefined;
};

export type CustomerStackParamList = {
  CustomerTabs: NavigatorScreenParams<CustomerTabParamList> | undefined;
  Facturación: NavigatorScreenParams<BillingStackParamList> | undefined;
  Contrato: undefined;
  Ayuda: { faqId?: string } | undefined;
  Dispositivos: undefined;
};

export type TechnicianTabParamList = {
  Cola: undefined;
  Chat: undefined;
  Resueltos: undefined;
};

export type TechnicianStackParamList = {
  TechnicianTabs: NavigatorScreenParams<TechnicianTabParamList> | undefined;
  Caso: { casoId: string };
};

export type SupervisorTabParamList = {
  Equipo: undefined;
  Resueltos: undefined;
  Métricas: undefined;
};

export type SupervisorStackParamList = {
  SupervisorTabs: NavigatorScreenParams<SupervisorTabParamList> | undefined;
  TicketDetalle: { casoId: string };
};

export type RootStackParamList = {
  Login: undefined;
  CustomerApp: NavigatorScreenParams<CustomerStackParamList> | undefined;
  TechnicianApp: NavigatorScreenParams<TechnicianStackParamList> | undefined;
  SupervisorApp: NavigatorScreenParams<SupervisorStackParamList> | undefined;
  UiKitPreview: undefined;
};
