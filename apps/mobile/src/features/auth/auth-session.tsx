import { setUnauthorizedListener, UnauthorizedError } from "@/lib/api-client";
import {
  authenticateWithBiometrics,
} from "@/features/auth/biometric-gateway";
import { hydrateRealtime } from "@/features/auth/session-gateway";
import { useChatUnreadStore } from "@/features/chat/chat-unread-store";
import {
  clearBiometricSession,
  clearSession,
  loadBiometricsEnabled,
  loadSession,
  saveSession,
} from "@/lib/session-storage";
import type { AppChannelSession } from "@/types/app-channel";
import type { AppProfile } from "@/types/domain";
import * as React from "react";
import { Platform } from "react-native";

/** Evita setState/re-suscripciones cuando el payload no cambia de verdad. */
export const isSameAppSession = (
  left: AppChannelSession,
  right: AppChannelSession,
) =>
  left.token === right.token &&
  left.role === right.role &&
  left.organization.id === right.organization.id &&
  left.client?.id === right.client?.id &&
  left.technician?.id === right.technician?.id &&
  left.conversation?.id === right.conversation?.id &&
  left.conversation?.humanMode === right.conversation?.humanMode &&
  left.conversation?.status === right.conversation?.status &&
  left.realtime?.accessToken === right.realtime?.accessToken &&
  left.realtime?.expiresAt === right.realtime?.expiresAt &&
  left.realtime?.conversationId === right.realtime?.conversationId;

const profileFromSession = (session: AppChannelSession): AppProfile => {
  if (
    (session.role === "technician" || session.role === "supervisor") &&
    session.technician
  ) {
    return {
      userId: session.technician.id,
      role: session.role,
      displayName: session.technician.name || "Técnico",
      clientId: null,
      technicianId: session.technician.id,
      supervisorId:
        session.role === "supervisor" ? session.technician.id : null,
      loginCedula: session.technician.document ?? null,
    };
  }

  return {
    userId: String(session.client?.id ?? ""),
    role: "customer",
    displayName: session.client?.name || "Cliente",
    clientId: session.client?.id ?? null,
    technicianId: null,
    supervisorId: null,
    loginCedula: session.client?.cedula ?? null,
  };
};

type AuthSessionValue = {
  isReady: boolean;
  session: AppChannelSession | null;
  profile: AppProfile | null;
  signIn: (session: AppChannelSession) => Promise<void>;
  signOut: () => Promise<void>;
  applySession: (session: AppChannelSession) => Promise<void>;
};

const AuthSessionContext = React.createContext<AuthSessionValue | null>(null);

export const AuthSessionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isReady, setIsReady] = React.useState(false);
  const [session, setSession] = React.useState<AppChannelSession | null>(null);

  const signOut = React.useCallback(async () => {
    await clearSession();
    await clearBiometricSession();
    useChatUnreadStore.getState().clear();
    setSession(null);
  }, []);

  const applySession = React.useCallback(async (next: AppChannelSession) => {
    let changed = true;
    setSession((previous) => {
      if (previous && isSameAppSession(previous, next)) {
        changed = false;
        return previous;
      }
      return next;
    });
    if (changed) {
      await saveSession(next);
    }
  }, []);

  const signIn = React.useCallback(
    async (next: AppChannelSession) => {
      useChatUnreadStore.getState().clear();
      await applySession(next);
    },
    [applySession],
  );

  React.useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      try {
        const stored = await loadSession();
        if (!stored) {
          return;
        }

        const bioEnabled = await loadBiometricsEnabled();
        if (bioEnabled && Platform.OS !== "web") {
          const bio = await authenticateWithBiometrics();
          if (!bio.ok) {
            return;
          }
        }

        try {
          const hydrated = await hydrateRealtime(stored);
          if (!cancelled) {
            await saveSession(hydrated);
            setSession(hydrated);
          }
        } catch (error) {
          if (error instanceof UnauthorizedError) {
            await clearSession();
            await clearBiometricSession();
            return;
          }
          if (!cancelled) {
            setSession(stored);
          }
        }
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    };
    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    setUnauthorizedListener(() => {
      setSession(null);
    });
    return () => setUnauthorizedListener(null);
  }, []);

  const value = React.useMemo<AuthSessionValue>(
    () => ({
      isReady,
      session,
      profile: session ? profileFromSession(session) : null,
      signIn,
      signOut,
      applySession,
    }),
    [applySession, isReady, session, signIn, signOut],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
};

export const useAuthSession = () => {
  const context = React.useContext(AuthSessionContext);
  if (!context) {
    throw new Error("useAuthSession debe usarse dentro de AuthSessionProvider");
  }
  return context;
};
