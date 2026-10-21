import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  CreditCard,
  FileText,
  Headphones,
  HelpCircle,
  LogOut,
  Smartphone,
} from "lucide-react-native";
import * as React from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const OPEN_MS = 320;
const CLOSE_MS = 240;
const easeOut = Easing.out(Easing.cubic);

type SessionSideMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  displayName: string;
  initials: string;
  userCedula: string;
  roleLabel: string;
  contractNumber: string;
  zoneName: string;
  showCustomerActions: boolean;
  onOpenBilling: () => void;
  onOpenContract: () => void;
  onOpenHelp: () => void;
  onOpenAdvisory: () => void;
  onOpenDevices: () => void;
  onSignOut: () => void;
};

export const SessionSideMenu = ({
  open,
  onOpenChange,
  displayName,
  initials,
  userCedula,
  roleLabel,
  contractNumber,
  zoneName,
  showCustomerActions,
  onOpenBilling,
  onOpenContract,
  onOpenHelp,
  onOpenAdvisory,
  onOpenDevices,
  onSignOut,
}: SessionSideMenuProps) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(Math.round(width * 0.86), 400);
  const [mounted, setMounted] = React.useState(false);
  const overlayProgress = useSharedValue(0);
  const panelProgress = useSharedValue(0);

  if (open && !mounted) {
    setMounted(true);
  }

  const handleClose = () => {
    onOpenChange(false);
  };

  React.useEffect(() => {
    if (!mounted) {
      return;
    }
    if (open) {
      overlayProgress.value = 0;
      panelProgress.value = 0;
      overlayProgress.value = withTiming(1, {
        duration: OPEN_MS,
        easing: easeOut,
      });
      panelProgress.value = withTiming(1, {
        duration: OPEN_MS,
        easing: easeOut,
      });
      return;
    }

    overlayProgress.value = withTiming(0, {
      duration: CLOSE_MS,
      easing: easeOut,
    });
    panelProgress.value = withTiming(
      0,
      { duration: CLOSE_MS, easing: easeOut },
      (finished) => {
        if (finished) {
          runOnJS(setMounted)(false);
        }
      },
    );
  }, [open, mounted, overlayProgress, panelProgress]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayProgress.value,
  }));

  const panelStyle = useAnimatedStyle(() => ({
    opacity: 0.65 + panelProgress.value * 0.35,
    transform: [{ translateX: (1 - panelProgress.value) * panelWidth }],
  }));

  if (!mounted) {
    return null;
  }

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent>
      <View className="flex-1">
        <Pressable
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar menú de sesión"
          className="absolute bottom-0 left-0 right-0 top-0">
          <Animated.View
            pointerEvents="none"
            className="absolute bottom-0 left-0 right-0 top-0 bg-black/50"
            style={overlayStyle}
          />
        </Pressable>

        <Animated.View
          className="absolute bottom-0 right-0 top-0 z-50 border-l border-border bg-card"
          style={[{ width: panelWidth }, panelStyle]}>
          <View
            className="flex-1"
            style={{
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: Math.max(insets.bottom, 16),
            }}>
            <ScrollView
              className="flex-1"
              contentContainerClassName="gap-4 px-5 pb-4">
              <View className="gap-3 rounded-2xl border border-border/80 bg-muted/30 p-4">
                <View className="flex-row items-center gap-3">
                  <View className="relative">
                    <Avatar
                      alt={displayName}
                      className="size-14 border-2 border-primary/40">
                      <AvatarFallback className="bg-primary/20">
                        <Text className="text-lg font-black text-primary">
                          {initials}
                        </Text>
                      </AvatarFallback>
                    </Avatar>
                    <View className="absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-card bg-primary" />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="text-base font-black text-foreground">
                      {displayName}
                    </Text>
                    <Text className="text-xs font-bold text-primary">
                      {userCedula}
                    </Text>
                    <View className="flex-row items-center gap-1.5 pt-0.5">
                      <View className="size-1.5 rounded-full bg-primary" />
                      <Text className="text-[10px] font-semibold text-primary">
                        Sesión activa
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="gap-2 border-t border-border/60 pt-3">
                  <SessionMetaRow label="Rol" value={roleLabel} />
                  <SessionMetaRow label="Contrato" value={contractNumber} />
                  <SessionMetaRow label="Nodo" value={zoneName} />
                </View>
              </View>

              {showCustomerActions ? (
                <View className="gap-2.5">
                  <MenuActionRow
                    icon={CreditCard}
                    title="Facturación"
                    description="Saldo, métodos de pago y comprobante"
                    onPress={onOpenBilling}
                  />
                  <MenuActionRow
                    icon={FileText}
                    title="Contrato"
                    description="Datos del plan y del servicio"
                    onPress={onOpenContract}
                  />
                  <MenuActionRow
                    icon={HelpCircle}
                    title="Preguntas frecuentes"
                    description="Pagos, tickets y tasa BCV"
                    onPress={onOpenHelp}
                  />
                  <MenuActionRow
                    icon={Headphones}
                    title="Asesoría 24/7"
                    description="Nova te atiende a cualquier hora"
                    onPress={onOpenAdvisory}
                  />
                  <MenuActionRow
                    icon={Smartphone}
                    title="Dispositivos"
                    description="Hasta 2 equipos por cuenta"
                    onPress={onOpenDevices}
                  />
                </View>
              ) : null}
            </ScrollView>

            <View className="gap-2.5 border-t border-border/70 px-5 pt-3">
              <Button
                className="h-12 min-h-12 w-full flex-row items-center justify-center gap-2 rounded-xl bg-destructive shadow-md shadow-destructive/20"
                onPress={onSignOut}
                accessibilityLabel="Cerrar sesión de la cuenta">
                <Icon
                  as={LogOut}
                  size={16}
                  className="text-destructive-foreground"
                />
                <Text className="text-xs font-bold uppercase tracking-wider text-destructive-foreground">
                  Cerrar sesión
                </Text>
              </Button>
              <Button
                variant="outline"
                className="h-12 min-h-12 w-full rounded-xl"
                onPress={handleClose}
                accessibilityLabel="Cancelar">
                <Text className="text-xs font-semibold">Cancelar</Text>
              </Button>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const SessionMetaRow = ({ label, value }: { label: string; value: string }) => (
  <View className="flex-row items-center justify-between gap-3">
    <Text className="text-[11px] text-muted-foreground">{label}</Text>
    <Badge
      variant="outline"
      className="border-border/70 bg-background/60 py-0.5">
      <Text className="text-[10px] font-bold text-foreground">{value}</Text>
    </Badge>
  </View>
);

const MenuActionRow = ({
  icon,
  title,
  description,
  onPress,
}: {
  icon: typeof CreditCard;
  title: string;
  description: string;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={title}
    className={cn(
      "min-h-16 w-full flex-row items-center gap-3 rounded-2xl border border-border/80 bg-background px-3.5 py-3 active:bg-muted/50",
      Platform.select({ web: "cursor-pointer" }),
    )}>
    <View className="size-11 items-center justify-center rounded-full bg-primary/10">
      <Icon as={icon} size={18} className="text-primary" />
    </View>
    <View className="flex-1 gap-0.5">
      <Text className="text-sm font-semibold text-foreground">{title}</Text>
      <Text className="text-xs text-muted-foreground">{description}</Text>
    </View>
    <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
  </Pressable>
);
