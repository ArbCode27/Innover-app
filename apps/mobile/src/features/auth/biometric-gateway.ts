import {
  clearBiometricSession,
  loadBiometricCedula,
  loadBiometricSession,
  loadBiometricsEnabled,
  loadSession,
  saveBiometricSession,
} from "@/lib/session-storage";
import type { AppChannelSession } from "@/types/app-channel";
import * as LocalAuthentication from "expo-local-authentication";

export type BiometricStatus = {
  isHardwareAvailable: boolean;
  isEnrolled: boolean;
  savedCedula: string | null;
  hasSavedSession: boolean;
};

export type BiometricAuthResult =
  | { ok: true; session: AppChannelSession }
  | { ok: false; message: string; requiresPassword?: boolean; isCancelled?: boolean };

export const checkBiometricStatus = async (): Promise<BiometricStatus> => {
  try {
    const isHardwareAvailable = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = isHardwareAvailable
      ? await LocalAuthentication.isEnrolledAsync()
      : false;
    const savedCedula = await loadBiometricCedula();
    const savedSession = await loadBiometricSession();
    const bioEnabled = await loadBiometricsEnabled();

    return {
      isHardwareAvailable,
      isEnrolled,
      savedCedula,
      hasSavedSession: bioEnabled && Boolean(savedSession),
    };
  } catch {
    return {
      isHardwareAvailable: false,
      isEnrolled: false,
      savedCedula: null,
      hasSavedSession: false,
    };
  }
};

export const authenticateWithBiometrics = async (
  promptMessage = "Escanea tu huella dactilar para acceder a Innover",
): Promise<BiometricAuthResult> => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      return {
        ok: false,
        message:
          "Este dispositivo no cuenta con sensor de huella dactilar o biometría disponible.",
      };
    }

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      return {
        ok: false,
        message:
          "No tienes huellas dactilares registradas en los ajustes de seguridad de tu teléfono.",
      };
    }

    const savedSession =
      (await loadSession()) ?? (await loadBiometricSession());
    if (!savedSession) {
      return {
        ok: false,
        requiresPassword: true,
        message:
          "Para activar el acceso con huella dactilar, primero inicia sesión con tu cédula y clave una vez.",
      };
    }

    const authResult = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: "Cancelar",
      fallbackLabel: "Usar cédula y clave",
      disableDeviceFallback: false,
    });

    if (!authResult.success) {
      if (
        authResult.error === "user_cancel" ||
        authResult.error === "system_cancel" ||
        authResult.error === "app_cancel"
      ) {
        return {
          ok: false,
          isCancelled: true,
          message: "Autenticación biométrica cancelada.",
        };
      }
      return {
        ok: false,
        message:
          "No se reconoció la huella dactilar. Intenta de nuevo o ingresa con tu clave.",
      };
    }

    return {
      ok: true,
      session: savedSession,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Ocurrió un error durante la autenticación con huella dactilar.",
    };
  }
};

export const unlinkBiometricAccount = async (): Promise<void> => {
  await clearBiometricSession();
};

export const enrollBiometricsWithPrompt = async (
  session: AppChannelSession,
  promptMessage = "Confirma tu huella dactilar para activar el acceso rápido",
): Promise<boolean> => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !isEnrolled) {
      return false;
    }

    const authResult = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: "Cancelar",
      disableDeviceFallback: false,
    });

    if (authResult.success) {
      await saveBiometricSession(session);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

export { saveBiometricSession, loadBiometricCedula, loadBiometricSession };
