import type { AppProfile, AppRole } from "@/types/domain";

export type LoginInput = {
  cedula: string;
  phone: string;
};

export type LoginResult =
  | { ok: true; profile: AppProfile }
  | { ok: false; message: string };

const digitsOnly = (value: string) => value.replace(/\D/g, "");

const resolveMockRole = (cedulaDigits: string): AppRole => {
  if (cedulaDigits === "87654321") {
    return "technician";
  }
  if (cedulaDigits === "11223344") {
    return "supervisor";
  }
  return "customer";
};

const displayNameForRole = (role: AppRole): string => {
  if (role === "technician") {
    return "Técnico de campo";
  }
  if (role === "supervisor") {
    return "Supervisor";
  }
  return "Abonado";
};

export const loginWithCedulaAndPhone = async (
  input: LoginInput,
): Promise<LoginResult> => {
  await new Promise((resolve) => setTimeout(resolve, 350));

  const cedula = digitsOnly(input.cedula);
  const phone = digitsOnly(input.phone);

  if (cedula.length < 6 || cedula.length > 10) {
    return {
      ok: false,
      message: "Revisa la cédula. Usa solo números, entre 6 y 10 dígitos.",
    };
  }

  if (phone.length < 10 || phone.length > 11) {
    return {
      ok: false,
      message: "Revisa el teléfono. Incluye el código de área, sin letras.",
    };
  }

  const role = resolveMockRole(cedula);

  return {
    ok: true,
    profile: {
      userId: `mock-${role}-${cedula}`,
      role,
      displayName: displayNameForRole(role),
      clientId: role === "customer" ? 1001 : null,
      technicianId: role === "technician" ? "mock-technician" : null,
      supervisorId: role === "supervisor" ? "mock-supervisor" : null,
      loginCedula: role === "customer" ? cedula : null,
    },
  };
};
