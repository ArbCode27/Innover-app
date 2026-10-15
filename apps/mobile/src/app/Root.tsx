import { AppProviders } from "@/app/providers";
import { RootNavigator } from "@/app/navigation";
import { NAV_THEME } from "@/lib/theme";
import { NavigationContainer } from "@react-navigation/native";
import { PortalHost } from "@rn-primitives/portal";
import { useColorScheme } from "nativewind";
import * as React from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export const Root = () => {
  const { colorScheme, setColorScheme } = useColorScheme();

  React.useEffect(() => {
    // Si no hay preferencia explícita guardada, usar el modo oscuro cósmico por defecto
    if (!colorScheme) {
      setColorScheme("dark");
    }
  }, [colorScheme, setColorScheme]);

  const scheme = colorScheme === "light" ? "light" : "dark";

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <View className={`flex-1 ${scheme === "dark" ? "dark" : ""}`}>
          <AppProviders>
            <NavigationContainer theme={NAV_THEME[scheme]}>
              <RootNavigator />
            </NavigationContainer>
            <PortalHost />
          </AppProviders>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};
