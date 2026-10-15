import { AuthSessionProvider } from "@/features/auth/auth-session";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useColorScheme } from "nativewind";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";

const queryClient = new QueryClient();

export const AppProviders = ({ children }: { children: ReactNode }) => {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionProvider>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        {children}
      </AuthSessionProvider>
    </QueryClientProvider>
  );
};
