import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import type { ReactNode } from "react";
import { View } from "react-native";

type ScreenStateProps = {
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  errorMessage?: string | null;
  onRetry?: () => void;
  children: ReactNode;
};

export const ScreenState = ({
  isLoading = false,
  isEmpty = false,
  emptyTitle = "No hay información",
  emptyDescription = "Cuando haya datos, aparecerán aquí.",
  errorMessage,
  onRetry,
  children,
}: ScreenStateProps) => {
  if (isLoading) {
    return (
      <View className="gap-3 p-4" accessibilityLabel="Cargando">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View className="flex-1 items-center justify-center gap-3 p-6">
        <Text variant="h4" className="text-center">
          No se pudo cargar
        </Text>
        <Text variant="muted" className="text-center">
          {errorMessage}
        </Text>
        {onRetry ? (
          <Button
            onPress={onRetry}
            accessibilityLabel="Reintentar"
            className="min-w-40"
          >
            <Text>Reintentar</Text>
          </Button>
        ) : null}
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View className="flex-1 items-center justify-center gap-2 p-6">
        <Text variant="h4" className="text-center">
          {emptyTitle}
        </Text>
        <Text variant="muted" className="text-center">
          {emptyDescription}
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};
