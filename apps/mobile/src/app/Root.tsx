import { AppProviders } from "@/app/providers";
import { RootNavigator } from "@/app/navigation";
import { navigationRef } from "@/app/navigation-ref";
import { NAV_THEME } from "@/lib/theme";
import { NavigationContainer } from "@react-navigation/native";
import { PortalHost } from "@rn-primitives/portal";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "nativewind";
import * as React from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export const Root = () => {
  const { colorScheme, setColorScheme } = useColorScheme();

  React.useEffect(() => {
    if (!colorScheme) {
      setColorScheme("dark");
    }
  }, [colorScheme, setColorScheme]);

  React.useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  const scheme = colorScheme === "light" ? "light" : "dark";

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <View className={`flex-1 ${scheme === "dark" ? "dark" : ""}`}>
          <AppProviders>
            <NavigationContainer ref={navigationRef} theme={NAV_THEME[scheme]}>
              <RootNavigator />
            </NavigationContainer>
            {/* Host a pantalla completa: si no, el drawer queda flotando con hueco abajo. */}
            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
              <PortalHost />
            </View>
          </AppProviders>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};
