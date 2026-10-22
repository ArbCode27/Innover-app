import { InnoverIcon } from "@/components/brand-logo";
import { Text } from "@/components/ui/text";
import * as React from "react";
import { ActivityIndicator, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

/**
 * Pantalla de carga in-app (sesión). Fondo blanco con brillos tenues
 * azul (primary) y rojo (marca). El splash nativo usa assets/splash.png.
 */
export const AppBootScreen = () => {
  return (
    <View
      className="flex-1 items-center justify-center bg-white"
      accessibilityLabel="Cargando Star Conectados"
    >
      <View className="absolute inset-0">
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Defs>
            <RadialGradient id="bootBlue" cx="28%" cy="38%" rx="55%" ry="40%">
              <Stop offset="0%" stopColor="hsl(226 96% 60%)" stopOpacity={0.18} />
              <Stop offset="100%" stopColor="hsl(226 96% 60%)" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="bootRed" cx="72%" cy="58%" rx="50%" ry="38%">
              <Stop offset="0%" stopColor="hsl(350 86% 56%)" stopOpacity={0.14} />
              <Stop offset="100%" stopColor="hsl(350 86% 56%)" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100" height="100" fill="url(#bootBlue)" />
          <Rect x="0" y="0" width="100" height="100" fill="url(#bootRed)" />
        </Svg>
      </View>

      <View className="z-10 items-center gap-5 px-8">
        <View
          className="items-center justify-center rounded-full bg-white px-5 py-5"
          style={{
            shadowColor: "hsl(226 96% 60%)",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.22,
            shadowRadius: 20,
            elevation: 8,
          }}
        >
          <View
            style={{
              shadowColor: "hsl(350 86% 56%)",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
            }}
          >
            <InnoverIcon size={56} />
          </View>
        </View>

        <View className="items-center gap-1">
          <Text className="text-xl font-black tracking-tight text-foreground">
            STAR CONECTADOS
          </Text>
          <Text className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Cobertura nacional
          </Text>
        </View>

        <ActivityIndicator
          accessibilityLabel="Cargando sesión"
          color="hsl(226 96% 60%)"
        />
      </View>
    </View>
  );
};
