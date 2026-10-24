import { NativeOnlyAnimatedView } from "@/components/ui/native-only-animated-view";
import { TextClassContext } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@rn-primitives/dialog";
import * as React from "react";
import {
  Platform,
  Pressable,
  View,
  type GestureResponderEvent,
  type ViewProps,
} from "react-native";
import {
  FadeIn,
  FadeOut,
  ReduceMotion,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FullWindowOverlay as RNFullWindowOverlay } from "react-native-screens";

const Drawer = DialogPrimitive.Root;
const DrawerTrigger = DialogPrimitive.Trigger;
const DrawerPortal = DialogPrimitive.Portal;
const DrawerClose = DialogPrimitive.Close;

const FullWindowOverlay =
  Platform.OS === "ios" ? RNFullWindowOverlay : React.Fragment;

const DrawerOverlay = ({
  className,
  children,
  onPress,
  ...props
}: Omit<React.ComponentProps<typeof DialogPrimitive.Overlay>, "asChild"> & {
  children?: React.ReactNode;
}) => {
  const { onOpenChange } = DialogPrimitive.useRootContext();

  const handleOverlayPress = (event: GestureResponderEvent) => {
    onPress?.(event);
    if (event.target === event.currentTarget && !event.isDefaultPrevented()) {
      onOpenChange(false);
    }
  };

  return (
    <FullWindowOverlay>
      <DialogPrimitive.Overlay
        className={cn(
          "absolute bottom-0 left-0 right-0 top-0 z-50 justify-end bg-black/50",
          Platform.select({
            web: "animate-in fade-in-0 fixed cursor-default [&>*]:cursor-auto",
          }),
          className,
        )}
        {...props}
        onPress={Platform.select({ web: handleOverlayPress, native: onPress })}
        asChild={Platform.OS !== "web"}
      >
        <NativeOnlyAnimatedView
          entering={FadeIn.duration(200).reduceMotion(ReduceMotion.System)}
          exiting={FadeOut.duration(150).reduceMotion(ReduceMotion.System)}
          className="flex-1 justify-end"
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            className="absolute bottom-0 left-0 right-0 top-0"
            onPress={() => {
              onOpenChange(false);
            }}
          />
          {children}
        </NativeOnlyAnimatedView>
      </DialogPrimitive.Overlay>
    </FullWindowOverlay>
  );
};

const DrawerHandle = ({ className, ...props }: ViewProps) => {
  return (
    <View
      className={cn("w-full items-center justify-center py-2", className)}
      {...props}
    >
      <View className="bg-muted h-1 w-10 rounded-full" />
    </View>
  );
};

const DrawerContent = ({
  className,
  portalHost,
  children,
  style,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  portalHost?: string;
}) => {
  const insets = useSafeAreaInsets();

  return (
    <DrawerPortal hostName={portalHost}>
      <DrawerOverlay>
        <NativeOnlyAnimatedView
          // Reanimated: SlideInDown entra desde abajo (sube); SlideInUp entra desde arriba.
          entering={SlideInDown.duration(320).reduceMotion(ReduceMotion.System)}
          exiting={SlideOutDown.duration(220).reduceMotion(ReduceMotion.System)}
          className="w-full"
          style={{ marginTop: "auto" }}
        >
          <DialogPrimitive.Content
            className={cn(
              "border-border bg-background z-50 w-full overflow-hidden rounded-t-3xl border-t shadow-lg shadow-black/20",
              Platform.select({
                web: "animate-in slide-in-from-bottom duration-300",
              }),
              className,
            )}
            style={[
              { paddingBottom: Math.max(insets.bottom, 12), marginBottom: 0 },
              style,
            ]}
            {...props}
          >
            <DrawerHandle />
            {children}
          </DialogPrimitive.Content>
        </NativeOnlyAnimatedView>
      </DrawerOverlay>
    </DrawerPortal>
  );
};

const DrawerHeader = ({ className, ...props }: ViewProps) => {
  return (
    <TextClassContext.Provider value="text-center">
      <View
        className={cn("flex flex-col items-center gap-1.5 px-6 pt-5 pb-2", className)}
        {...props}
      />
    </TextClassContext.Provider>
  );
};

const DrawerFooter = ({ className, ...props }: ViewProps) => {
  return (
    <View
      className={cn("mt-auto flex flex-col gap-2 px-6 pt-2 pb-1", className)}
      {...props}
    />
  );
};

const DrawerTitle = ({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) => {
  return (
    <DialogPrimitive.Title
      className={cn(
        "text-foreground text-center text-lg font-semibold leading-none tracking-tight",
        className,
      )}
      {...props}
    />
  );
};

const DrawerDescription = ({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) => {
  return (
    <DialogPrimitive.Description
      className={cn(
        "text-muted-foreground text-center text-sm leading-5",
        className,
      )}
      {...props}
    />
  );
};

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
};
