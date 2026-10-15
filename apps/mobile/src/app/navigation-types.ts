export type CustomerTabParamList = {
  Inicio: undefined;
  Facturación: undefined;
  Chat: { intent?: "report-outage" } | undefined;
  Contrato: undefined;
  "Mi ticket": undefined;
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
