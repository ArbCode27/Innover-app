import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Platform, Pressable, View, type ViewProps } from "react-native";
import Animated, {
  type AnimatedProps,
} from "react-native-reanimated";

type NativeOnlyAnimatedViewProps = ViewProps & {
  as?: "View" | "Pressable";
  className?: string;
  children?: ReactNode;
  entering?: AnimatedProps<ViewProps>["entering"];
  exiting?: AnimatedProps<ViewProps>["exiting"];
};

const NativeOnlyAnimatedView = ({
  as = "View",
  className,
  children,
  entering,
  exiting,
  ...props
}: NativeOnlyAnimatedViewProps) => {
  if (Platform.OS === "web") {
    const Comp = as === "Pressable" ? Pressable : View;
    return (
      <Comp className={className} {...props}>
        {children}
      </Comp>
    );
  }

  return (
    <Animated.View
      entering={entering}
      exiting={exiting}
      className={cn(className)}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

export { NativeOnlyAnimatedView };
