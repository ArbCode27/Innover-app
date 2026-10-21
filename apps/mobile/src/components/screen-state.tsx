import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import type { UserNotice } from "@/lib/user-notice";
import type { ReactNode } from "react";
import { View } from "react-native";

type ScreenStateProps = {
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  errorNotice?: UserNotice | null;
  errorMessage?: string | null;
  onRetry?: () => void;
  children: ReactNode;
};

export const ScreenState = ({
  isLoading = false,
  isEmpty = false,
  emptyTitle = "No hay información",
  emptyDescription = "Cuando haya datos, aparecerán aquí.",
  errorNotice,
  errorMessage,
  onRetry,
  children,
}: ScreenStateProps) => {
  const resolvedError =
    errorNotice ??
    (errorMessage
      ? { title: "No se pudo cargar", description: errorMessage }
      : null);

  if (isLoading) {
    return (
      <View className="gap-3 p-4" accessibilityLabel="Cargando">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </View>
    );
  }

  if (resolvedError) {
    return (
      <View className="flex-1 items-center justify-center gap-3 p-6">
        <Text variant="h4" className="text-center">
          {resolvedError.title}
        </Text>
        <Text variant="muted" className="text-center">
          {resolvedError.description}
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
