import { setUnauthorizedListener } from "@/lib/api-client";
import { clearSession, loadSession, saveSession } from "@/lib/session-storage";
import type { AppChannelSession } from "@/types/app-channel";
import type { AppProfile } from "@/types/domain";
import * as React from "react";

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
    setSession(null);
  }, []);

  const signIn = React.useCallback(async (next: AppChannelSession) => {
    await saveSession(next);
    setSession(next);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      const stored = await loadSession();
      if (!cancelled) {
        setSession(stored);
        setIsReady(true);
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
    }),
    [isReady, session, signIn, signOut],
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
