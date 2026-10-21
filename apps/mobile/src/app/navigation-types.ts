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
  Caso: { casoId?: string } | undefined;
};

export type SupervisorTabParamList = {
  Equipo: undefined;
  Técnico: undefined;
  Chat: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  CustomerApp: NavigatorScreenParams<CustomerStackParamList> | undefined;
  TechnicianApp: NavigatorScreenParams<TechnicianTabParamList> | undefined;
  SupervisorApp: NavigatorScreenParams<SupervisorTabParamList> | undefined;
  UiKitPreview: undefined;
};
