import type { CustomerStackParamList } from "@/app/navigation-types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { InnoverLogo } from "@/components/brand-logo";
import { SessionSideMenu } from "@/components/session-side-menu";
import { useAuthSession } from "@/features/auth/auth-session";
import {
  chromeForSeverity,
  highestSeverity,
} from "@/features/customer/service-notice-appearance";
import { ServiceNoticeRow } from "@/features/customer/service-notice-row";
import { useServiceNoticeStore } from "@/features/customer/service-notice-store";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Bell } from "lucide-react-native";
import * as React from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AppHeaderProps = {
  subtitle?: string;
};

export const AppHeader = ({
  subtitle = "COBERTURA NACIONAL",
}: AppHeaderProps) => {
  const { profile, signOut } = useAuthSession();
  const navigation =
    useNavigation<NativeStackNavigationProp<CustomerStackParamList>>();

  const [sessionOpen, setSessionOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const notices = useServiceNoticeStore((state) => state.notices);
  const topSeverity = highestSeverity(notices.map((item) => item.severity));
  const unreadDotClass = topSeverity
    ? chromeForSeverity(topSeverity).badge
    : null;

  const displayName =
    profile?.displayName &&
    profile.displayName !== "Abonado" &&
    profile.displayName !== "Cliente"
      ? profile.displayName
      : "Carlos Silva";

  const userCedula = profile?.loginCedula
    ? `V-${profile.loginCedula}`
    : "V-18.765.432";

  const initials =
    displayName
      .split(" ")
      .map((word) => word[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "CS";

  const roleLabel =
    profile?.role === "technician"
      ? "Técnico de Campo"
      : profile?.role === "supervisor"
        ? "Supervisor de Zona"
        : "Abonado Residencial FTTH";

  const showCustomerActions =
    profile?.role !== "technician" && profile?.role !== "supervisor";

  const handleSignOut = () => {
    setSessionOpen(false);
    void signOut();
  };

  const handleOpenBilling = () => {
    setSessionOpen(false);
    navigation.navigate("Facturación");
  };

  const handleOpenContract = () => {
    setSessionOpen(false);
    navigation.navigate("Contrato");
  };

  const handleOpenHelp = () => {
    setSessionOpen(false);
    navigation.navigate("Ayuda");
  };

  const handleOpenAdvisory = () => {
    setSessionOpen(false);
    navigation.navigate("CustomerTabs", { screen: "Chat" });
  };

  const handleOpenDevices = () => {
    setSessionOpen(false);
    navigation.navigate("Dispositivos");
  };

  return (
    <SafeAreaView edges={["top"]} className="border-b border-border/60 bg-background">
      <View className="h-16 flex-row items-center justify-between px-4">
        <InnoverLogo subtitle={subtitle} />

        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => setNotificationsOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Ver notificaciones del servicio"
            hitSlop={6}
            className="size-10 items-center justify-center rounded-full border border-border/80 bg-card shadow-sm active:bg-muted"
          >
            <Icon as={Bell} size={18} className="text-foreground" />
            {unreadDotClass ? (
              <View
                className={`absolute right-2.5 top-2.5 size-2 rounded-full border border-card ${unreadDotClass}`}
              />
            ) : null}
          </Pressable>

          <Pressable
            onPress={() => setSessionOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Sesión iniciada como ${displayName}. Toca para ver el menú.`}
            hitSlop={6}
            className="relative size-10 items-center justify-center rounded-full border border-primary/40 bg-card shadow-sm active:opacity-80"
          >
            <Avatar alt={displayName} className="size-full">
              <AvatarFallback className="bg-primary/15">
                <Text className="text-xs font-black tracking-tight text-primary">
                  {initials}
                </Text>
              </AvatarFallback>
            </Avatar>
            <View className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-background bg-primary" />
          </Pressable>
        </View>
      </View>

      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader>
            <View className="flex-row items-center justify-between pr-6">
              <View className="flex-row items-center gap-2">
                <Icon as={Bell} size={18} className="text-primary" />
                <DialogTitle className="text-base font-bold">
                  Notificaciones
                </DialogTitle>
              </View>
              {notices.length > 0 ? (
                <Badge variant="outline" className="border-primary/40 bg-primary/10">
                  <Text className="text-[10px] font-bold text-primary">
                    {notices.length === 1
                      ? "1 aviso"
                      : `${notices.length} avisos`}
                  </Text>
                </Badge>
              ) : null}
            </View>
            <DialogDescription className="text-xs text-muted-foreground">
              Avisos de red y comunicados del equipo técnico de Conexiones Innover
            </DialogDescription>
          </DialogHeader>

          <View className="gap-2.5 pt-1">
            {notices.length === 0 ? (
              <View className="rounded-xl border border-border/80 bg-muted/20 p-3">
                <Text className="text-xs font-semibold text-foreground">
                  No hay avisos del servicio
                </Text>
                <Text className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  Cuando haya un corte, una alerta de potencia o un trabajo en
                  tu zona, lo verás aquí.
                </Text>
              </View>
            ) : (
              notices.map((notice) => (
                <ServiceNoticeRow key={notice.id} notice={notice} />
              ))
            )}
          </View>

          <Button
            className="mt-2 h-11 min-h-11 w-full rounded-xl bg-primary"
            onPress={() => setNotificationsOpen(false)}
          >
            <Text className="text-xs font-bold uppercase tracking-wider text-primary-foreground">
              Entendido
            </Text>
          </Button>
        </DialogContent>
      </Dialog>

      <SessionSideMenu
        open={sessionOpen}
        onOpenChange={setSessionOpen}
        displayName={displayName}
        initials={initials}
        userCedula={userCedula}
        roleLabel={roleLabel}
        contractNumber="FTTH-2026-0842"
        zoneName="Valencia · Urb. El Parral"
        showCustomerActions={showCustomerActions}
        onOpenBilling={handleOpenBilling}
        onOpenContract={handleOpenContract}
        onOpenHelp={handleOpenHelp}
        onOpenAdvisory={handleOpenAdvisory}
        onOpenDevices={handleOpenDevices}
        onSignOut={handleSignOut}
      />
    </SafeAreaView>
  );
};
