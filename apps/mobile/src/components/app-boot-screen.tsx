import { Text } from "@/components/ui/text";
import * as React from "react";
import { ActivityIndicator, Dimensions, Image, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

const LOGO = require("../../assets/splash-logo.png");
const SCREEN_W = Dimensions.get("window").width;
const LOGO_W = Math.min(SCREEN_W * 0.86, 380);
const LOGO_H = LOGO_W * (774 / 1440);

/**
 * Pantalla de carga in-app (sesión). Logo grande con brillo animado.
 * El splash nativo usa assets/splash.png (mismo asset, más grande).
 */
export const AppBootScreen = () => {
  const shineX = useSharedValue(-LOGO_W * 0.55);
  const pulse = useSharedValue(1);

  React.useEffect(() => {
    shineX.value = withRepeat(
      withSequence(
        withTiming(LOGO_W * 1.15, {
          duration: 1600,
          easing: Easing.inOut(Easing.cubic),
        }),
        withDelay(900, withTiming(-LOGO_W * 0.55, { duration: 0 })),
      ),
      -1,
      false,
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.03, {
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(1, {
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
        }),
      ),
      -1,
      false,
    );
  }, [pulse, shineX]);

  const logoPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shineX.value }, { skewX: "-18deg" }],
  }));

  return (
    <View
      className="flex-1 items-center justify-center bg-white"
      accessibilityLabel="Cargando Star Conectados"
    >
      <View className="absolute inset-0">
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <Defs>
            <RadialGradient id="bootBlue" cx="28%" cy="38%" rx="55%" ry="40%">
              <Stop
                offset="0%"
                stopColor="hsl(226 96% 60%)"
                stopOpacity={0.22}
              />
              <Stop
                offset="100%"
                stopColor="hsl(226 96% 60%)"
                stopOpacity={0}
              />
            </RadialGradient>
            <RadialGradient id="bootRed" cx="72%" cy="58%" rx="50%" ry="38%">
              <Stop
                offset="0%"
                stopColor="hsl(350 86% 56%)"
                stopOpacity={0.18}
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

      <View className="z-10 items-center gap-8 px-4">
        <Animated.View
          style={[
            logoPulseStyle,
            {
              width: LOGO_W,
              height: LOGO_H,
              shadowColor: "hsl(226 96% 60%)",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.28,
              shadowRadius: 28,
              elevation: 10,
            },
          ]}
        >
          <View
            className="overflow-hidden rounded-2xl"
            style={{ width: LOGO_W, height: LOGO_H }}
          >
            <Image
              source={LOGO}
              accessibilityLabel="Star Conectados"
              resizeMode="contain"
              style={{ width: LOGO_W, height: LOGO_H }}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: "absolute",
                  top: -LOGO_H * 0.2,
                  bottom: -LOGO_H * 0.2,
                  width: LOGO_W * 0.38,
                  opacity: 0.85,
                },
                shineStyle,
              ]}
            >
              <Svg width="100%" height="100%">
                <Defs>
                  <SvgLinearGradient id="shineSweep" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0} />
                    <Stop offset="45%" stopColor="#FFFFFF" stopOpacity={0.55} />
                    <Stop offset="50%" stopColor="#FFFFFF" stopOpacity={0.85} />
                    <Stop offset="55%" stopColor="#FFFFFF" stopOpacity={0.55} />
                    <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
                  </SvgLinearGradient>
                </Defs>
                <Rect
                  x="0"
                  y="0"
                  width="100%"
                  height="100%"
                  fill="url(#shineSweep)"
                />
              </Svg>
            </Animated.View>
          </View>
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
