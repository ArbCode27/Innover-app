import { Text, TextClassContext } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import { View } from "react-native";

const Card = ({
  className,
  ...props
}: ComponentProps<typeof View>) => {
  return (
    <TextClassContext.Provider value="text-card-foreground">
      <View
        className={cn(
          "bg-card border-border flex flex-col gap-6 rounded-xl border py-6 shadow-sm shadow-black/5",
          className,
        )}
        {...props}
      />
    </TextClassContext.Provider>
  );
};

const CardHeader = ({
  className,
  ...props
}: ComponentProps<typeof View>) => {
  return (
    <View className={cn("flex flex-col gap-1.5 px-6", className)} {...props} />
  );
};

const CardTitle = ({
  className,
  ...props
}: ComponentProps<typeof Text>) => {
  return (
    <Text
      role="heading"
      aria-level={3}
      className={cn("font-semibold leading-none", className)}
      {...props}
    />
  );
};

const CardDescription = ({
  className,
  ...props
}: ComponentProps<typeof Text>) => {
  return (
    <Text
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
};

const CardContent = ({
  className,
  ...props
}: ComponentProps<typeof View>) => {
  return <View className={cn("px-6", className)} {...props} />;
};

const CardFooter = ({
  className,
  ...props
}: ComponentProps<typeof View>) => {
  return (
    <View
      className={cn("flex flex-row items-center px-6", className)}
      {...props}
    />
  );
};

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
