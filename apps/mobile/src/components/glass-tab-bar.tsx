import { Text } from "@/components/ui/text";
import { THEME } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { useColorScheme } from "nativewind";
import * as React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PILL_HEIGHT = 64;
const ITEM_SIZE = 56;
const BUBBLE_SIZE = 46;
const ITEM_GAP = 12;
const PILL_PAD = 12;
const FLOAT_GAP = 14;
const SIDE_GAP = 28;
/** Aire extra entre el último contenido y la pastilla del menú. */
const CONTENT_GAP = 16;

/** Altura visual del menú (sin safe-area inferior). */
export const GLASS_TAB_BAR_HEIGHT = PILL_HEIGHT + FLOAT_GAP + CONTENT_GAP;

/** Espacio inferior para que el tab bar flotante no tape el contenido. */
export const getGlassTabBarClearance = (bottomInset: number) =>
  GLASS_TAB_BAR_HEIGHT + Math.max(bottomInset, 0);

export const useGlassTabBarClearance = () => {
  const insets = useSafeAreaInsets();
  return getGlassTabBarClearance(insets.bottom);
};

/** Padding inferior para ScrollView/FlatList bajo el menú flotante (sin fondo sólido). */
export const useGlassTabBarContentPadding = () => {
  const paddingBottom = useGlassTabBarClearance();
  return React.useMemo(() => ({ paddingBottom }), [paddingBottom]);
};

const isHiddenTabBarStyle = (style: unknown) => {
  if (!style || typeof style !== "object" || Array.isArray(style)) {
    return false;
  }
  return "display" in style && style.display === "none";
};

const isChatRoute = (name: string) => name === "Chat";

export const GlassTabBar = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? THEME.dark : THEME.light;

  const focusedOptions =
    descriptors[state.routes[state.index]?.key ?? ""]?.options;
  if (isHiddenTabBarStyle(focusedOptions?.tabBarStyle)) {
    return null;
  }

  const visibleRoutes = state.routes;
  const pillWidth =
    visibleRoutes.length * ITEM_SIZE +
    Math.max(visibleRoutes.length - 1, 0) * ITEM_GAP +
    PILL_PAD * 2;
  const webGlassStyle: ViewStyle =
    Platform.OS === "web"
      ? ({
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
        } as ViewStyle)
      : {};

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
        paddingBottom: insets.bottom + FLOAT_GAP,
        paddingHorizontal: SIDE_GAP,
        backgroundColor: "transparent",
      }}>
      <View
        style={{
          width: pillWidth,
          height: PILL_HEIGHT,
          borderRadius: PILL_HEIGHT / 2,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: isDark
            ? "hsla(210, 40%, 98%, 0.12)"
            : "hsla(0, 0%, 100%, 0.55)",
          shadowColor: theme.foreground,
          shadowOpacity: 0.12,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 12 },
          elevation: 16,
        }}>
        {Platform.OS !== "web" ? (
          <BlurView
            intensity={isDark ? 42 : 64}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark
                ? "hsla(226, 42%, 14%, 0.38)"
                : "hsla(0, 0%, 100%, 0.36)",
            },
            webGlassStyle,
          ]}
        />
        <View
          className="flex-row items-center"
          style={{
            flex: 1,
            paddingHorizontal: PILL_PAD,
            gap: ITEM_GAP,
          }}>
          {visibleRoutes.map((route, index) => {
            const options = descriptors[route.key]?.options;
            if (!options) {
              return null;
            }

            const isFocused = state.index === index;
            const isFeatured = isChatRoute(route.name);
            const label =
              typeof options.tabBarLabel === "string"
                ? options.tabBarLabel
                : typeof options.title === "string"
                  ? options.title
                  : route.name;

            const iconColor = isFeatured
              ? theme.primaryForeground
              : isFocused
                ? theme.primary
                : theme.mutedForeground;

            const icon = options.tabBarIcon ? (
              options.tabBarIcon({
                focused: isFocused,
                color: iconColor,
                size: 22,
              })
            ) : (
              <Text className="text-[10px] font-bold">{label}</Text>
            );

            const handlePress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const handleLongPress = () => {
              navigation.emit({ type: "tabLongPress", target: route.key });
            };

            return (
              <Pressable
                key={route.key}
                onPress={handlePress}
                onLongPress={handleLongPress}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={label}
                hitSlop={6}
                className="items-center justify-center"
                style={{ width: ITEM_SIZE, height: ITEM_SIZE }}>
                <View
                  className={cn(
                    "items-center justify-center rounded-full",
                    isFeatured && "bg-primary",
                  )}
                  style={{ width: BUBBLE_SIZE, height: BUBBLE_SIZE }}>
                  {icon}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};
