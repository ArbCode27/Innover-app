import { cn } from "@/lib/utils";
import * as LabelPrimitive from "@rn-primitives/label";
import * as React from "react";
import { Platform } from "react-native";

const Label = ({
  className,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  disabled,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Text> & {
  onPress?: React.ComponentProps<typeof LabelPrimitive.Root>["onPress"];
  onLongPress?: React.ComponentProps<typeof LabelPrimitive.Root>["onLongPress"];
  onPressIn?: React.ComponentProps<typeof LabelPrimitive.Root>["onPressIn"];
  onPressOut?: React.ComponentProps<typeof LabelPrimitive.Root>["onPressOut"];
  disabled?: boolean;
}) => {
  return (
    <LabelPrimitive.Root
      className={cn(
        "flex select-none flex-row items-center gap-2",
        Platform.select({
          web: "cursor-default leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
        }),
        disabled && "opacity-50",
      )}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
    >
      <LabelPrimitive.Text
        className={cn(
          "text-foreground text-sm font-medium",
          Platform.select({ web: "leading-none" }),
          className,
        )}
        {...props}
      />
    </LabelPrimitive.Root>
  );
};

export { Label };
