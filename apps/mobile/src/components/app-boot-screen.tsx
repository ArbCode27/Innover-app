import { Text } from "@/components/ui/text";
import * as React from "react";
import { ActivityIndicator, Dimensions, Image, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

/** Logo transparente (sin glow ni fondo). Glow azul/rojo solo en el fondo. */
const LOGO = require("../../assets/brand-logo.png");

const SCREEN_W = Dimensions.get("window").width;
/** ~58% del ancho: logo completo con aire, sin rozar bordes. */
const LOGO_W = Math.min(SCREEN_W * 0.58, 280);
/** brand-logo.png 1502×1100 (transparente, sin glow). */
const LOGO_ASPECT = 1100 / 1502;
const LOGO_H = LOGO_W * LOGO_ASPECT;

/**
 * Pantalla de carga in-app (sesión).
 * - Fondo blanco + sombras azul/rojo en SVG (no en el PNG).
 * - `brand-logo.png` con alpha y margen; splash nativo usa `assets/splash.png`.
 */
export const AppBootScreen = () => {
  const pulse = useSharedValue(1);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.01, {
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(1, {
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
        }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const logoPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View
      className="flex-1 items-center justify-center bg-white"
      accessibilityLabel="Cargando Star Conectados"
    >
      {/* Atmósfera de marca: solo en el background, no en la imagen */}
      <View className="absolute inset-0" pointerEvents="none">
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <Defs>
            <RadialGradient id="bootBlue" cx="32%" cy="42%" rx="48%" ry="36%">
              <Stop
                offset="0%"
                stopColor="hsl(226 96% 60%)"
                stopOpacity={0.2}
              />
              <Stop
                offset="100%"
                stopColor="hsl(226 96% 60%)"
                stopOpacity={0}
              />
            </RadialGradient>
            <RadialGradient id="bootRed" cx="68%" cy="52%" rx="46%" ry="34%">
              <Stop
                offset="0%"
                stopColor="hsl(350 86% 56%)"
                stopOpacity={0.16}
              />
              <Stop
                offset="100%"
                stopColor="hsl(350 86% 56%)"
                stopOpacity={0}
              />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100" height="100" fill="url(#bootBlue)" />
          <Rect x="0" y="0" width="100" height="100" fill="url(#bootRed)" />
        </Svg>
      </View>

      <View className="z-10 items-center gap-8 px-8">
        <Animated.View style={[{ overflow: "visible" }, logoPulseStyle]}>
          <Image
            source={LOGO}
            accessibilityLabel="Star Conectados"
            resizeMode="contain"
            style={{ width: LOGO_W, height: LOGO_H, overflow: "visible" }}
          />
        </Animated.View>

        <Text className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Cobertura nacional
        </Text>

        <ActivityIndicator
          accessibilityLabel="Cargando sesión"
          color="hsl(226 96% 60%)"
        />
      </View>
    </View>
  );
};
