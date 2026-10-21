import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { ScreenState } from "@/components/screen-state";
import { useAuthSession } from "@/features/auth/auth-session";
import {
  formatDeviceLastSeen,
  listSessionDevices,
  MAX_ACTIVE_DEVICES,
  revokeSessionDevice,
  seedForeignDevicesForCedula,
} from "@/features/devices/devices-gateway";
import type { AppDevice } from "@/types/domain";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Info, Smartphone, Trash2 } from "lucide-react-native";
import * as React from "react";
import { ScrollView, View } from "react-native";

export const CustomerDevicesScreen = () => {
  const { profile, signOut } = useAuthSession();
  const queryClient = useQueryClient();
  const queryKey = ["session-devices", profile?.loginCedula] as const;

  const devicesQuery = useQuery({
    queryKey,
    queryFn: () => listSessionDevices(profile?.loginCedula ?? null),
  });

  const revokeMutation = useMutation({
    mutationFn: (device: AppDevice) =>
      revokeSessionDevice(profile?.loginCedula ?? null, device.id),
    onSuccess: async (devices, device) => {
      queryClient.setQueryData(queryKey, devices);
      if (device.isCurrent) {
        await signOut();
      }
    },
  });

  const seedMutation = useMutation({
    mutationFn: () =>
      seedForeignDevicesForCedula(profile?.loginCedula ?? "", 1),
    onSuccess: (devices) => {
      queryClient.setQueryData(queryKey, devices);
    },
  });

  const devices = devicesQuery.data ?? [];

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-4 gap-4 pb-10"
    >
      <Card className="border-border/80 bg-card/95">
        <CardHeader className="gap-1.5">
          <View className="flex-row items-center justify-between">
            <CardTitle className="text-lg font-black">Dispositivos</CardTitle>
            <Badge variant="outline" className="border-primary/40 bg-primary/10">
              <Text className="text-[10px] font-bold text-primary">
                {devices.length}/{MAX_ACTIVE_DEVICES}
              </Text>
            </Badge>
          </View>
          <CardDescription className="text-xs">
            Tu cuenta de Conexiones Innover puede estar activa en máximo dos
            equipos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert icon={Info}>
            <AlertTitle>Tope de sesiones</AlertTitle>
            <AlertDescription>
              Si entras en un tercer teléfono, deberás cerrar sesión en uno de
              los dos que ya están registrados.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <ScreenState
        isLoading={devicesQuery.isPending}
        errorMessage={
          devicesQuery.isError ? "No se pudieron cargar los dispositivos." : null
        }
        onRetry={() => {
          void devicesQuery.refetch();
        }}
      >
        <View className="gap-2.5">
          {devices.map((device) => (
            <View
              key={device.id}
              className="flex-row items-center gap-3 rounded-2xl border border-border/80 bg-card px-3.5 py-3"
            >
              <View className="size-11 items-center justify-center rounded-full bg-primary/10">
                <Icon as={Smartphone} size={18} className="text-primary" />
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="text-sm font-semibold text-foreground">
                  {device.label}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Último acceso: {formatDeviceLastSeen(device.lastSeenAt)}
                </Text>
              </View>
              {device.isCurrent ? (
                <Badge variant="outline" className="border-emerald-500/40">
                  <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                    Este
                  </Text>
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  className="h-11 min-h-11 px-3"
                  disabled={revokeMutation.isPending}
                  onPress={() => revokeMutation.mutate(device)}
                  accessibilityLabel={`Cerrar sesión en ${device.label}`}
                >
                  <Icon as={Trash2} size={14} className="text-destructive" />
                </Button>
              )}
            </View>
          ))}
        </View>
      </ScreenState>

      {__DEV__ ? (
        <Button
          variant="outline"
          className="h-11 min-h-11"
          disabled={seedMutation.isPending || devices.length >= MAX_ACTIVE_DEVICES}
          onPress={() => seedMutation.mutate()}
          accessibilityLabel="Agregar equipo de prueba"
        >
          <Text>Agregar equipo de prueba</Text>
        </Button>
      ) : null}
    </ScrollView>
  );
};
