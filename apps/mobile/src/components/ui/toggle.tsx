import { TextClassContext } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import * as TogglePrimitive from "@rn-primitives/toggle";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { Platform } from "react-native";

const toggleVariants = cva(
  cn(
    "group flex flex-row items-center justify-center gap-2 rounded-md",
    Platform.select({
      web: "hover:bg-muted hover:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
    }),
  ),
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: cn(
          "border-input border bg-transparent shadow-sm shadow-black/5",
          Platform.select({
            web: "hover:bg-accent hover:text-accent-foreground",
          }),
        ),
      },
      size: {
        default: "min-h-11 h-11 px-3",
        sm: "min-h-11 h-11 px-2.5",
        lg: "min-h-11 h-11 px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Toggle = ({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) => {
  return (
    <TextClassContext.Provider
      value={cn(
        "text-sm font-medium",
        props.pressed
          ? "text-accent-foreground"
          : "text-foreground",
      )}
    >
      <TogglePrimitive.Root
        className={cn(
          toggleVariants({ variant, size }),
          props.pressed && "bg-accent",
          props.disabled && "opacity-50",
          className,
        )}
        {...props}
      />
    </TextClassContext.Provider>
  );
};

export { Toggle, toggleVariants };
