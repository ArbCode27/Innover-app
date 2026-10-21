import { setUnauthorizedListener, UnauthorizedError } from "@/lib/api-client";
import {
  authenticateWithBiometrics,
} from "@/features/auth/biometric-gateway";
import { hydrateRealtime } from "@/features/auth/session-gateway";
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

const profileFromSession = (session: AppChannelSession): AppProfile => ({
  userId: String(session.client.id),
  role: "customer",
  displayName: session.client.name || "Cliente",
  clientId: session.client.id,
  technicianId: null,
  supervisorId: null,
  loginCedula: session.client.cedula ?? null,
});

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
    setSession(null);
  }, []);

  const applySession = React.useCallback(async (next: AppChannelSession) => {
    await saveSession(next);
    setSession(next);
  }, []);

  const signIn = React.useCallback(
    async (next: AppChannelSession) => {
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
