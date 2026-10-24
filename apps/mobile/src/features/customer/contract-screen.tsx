import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { AccountStatusBadge } from "@/features/customer/account-status-badge";
import {
  fetchAccountQuote,
  fetchContractSnapshot,
} from "@/features/customer/account-quote-gateway";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react-native";
import {
  FileText,
  IdCard,
  Info,
  MapPin,
  Network,
  UserRound,
  Wifi,
} from "lucide-react-native";
import { ScrollView, View } from "react-native";

const ContractField = ({
  icon: FieldIcon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) => (
  <View className="flex-row items-start gap-3 rounded-2xl border border-border/70 bg-background/60 px-3.5 py-3">
    <View className="size-10 items-center justify-center rounded-full bg-primary/10">
      <Icon as={FieldIcon} size={16} className="text-primary" />
    </View>
    <View className="min-w-0 flex-1 gap-0.5">
      <Text className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </Text>
      <Text className="text-sm font-semibold leading-snug text-foreground">
        {value}
      </Text>
    </View>
  </View>
);

export const CustomerContractScreen = () => {
  const contractQuery = useQuery({
    queryKey: ["contract-snapshot"],
    queryFn: fetchContractSnapshot,
  });
  const quoteQuery = useQuery({
    queryKey: ["account-quote"],
    queryFn: () => fetchAccountQuote(),
  });

  const contract = contractQuery.data;
  const planName =
    contract?.planName?.trim() ||
    quoteQuery.data?.planName?.trim() ||
    null;
  const contractBadge =
    planName ||
    contract?.contractStateLabel ||
    (contract?.wisproLinked === false ? "Sin vínculo" : null);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-4 gap-4 pb-10"
    >
      <View className="overflow-hidden rounded-3xl border border-border/80 bg-card/95 shadow-xl shadow-black/10">
        <View className="h-1.5 w-full flex-row">
          <View className="h-full flex-1 bg-destructive" />
          <View className="h-full flex-1 bg-primary" />
          <View className="h-full flex-1 bg-cyan-400" />
        </View>

        <View className="gap-3.5 p-4">
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-row items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5">
              <Icon as={FileText} size={13} className="text-primary" />
              <Text className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                Solo lectura
              </Text>
            </View>
            {contract ? (
              <AccountStatusBadge status={contract.accountStatus} />
            ) : null}
          </View>

          <View className="gap-1">
            <Text className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              Conexiones Innover
            </Text>
            <Text className="text-2xl font-black tracking-tight text-foreground">
              Tu contrato
            </Text>
            <Text className="text-sm text-muted-foreground">
              Datos del servicio asociados a tu cuenta. No se pueden editar
              desde la app.
            </Text>
          </View>

          <View className="flex-row flex-wrap items-center gap-2">
            {contractBadge ? (
              <Badge
                variant="outline"
                className="border-border/70 bg-muted/30 px-2.5 py-1"
              >
                <Text className="text-[10px] font-bold text-muted-foreground">
                  {contractBadge}
                </Text>
              </Badge>
            ) : null}
            {contract?.contractStateLabel ? (
              <Badge
                variant="outline"
                className="border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1"
              >
                <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  {contract.contractStateLabel}
                </Text>
              </Badge>
            ) : null}
          </View>
        </View>
      </View>

      <ScreenState
        isLoading={contractQuery.isPending}
        errorMessage={
          contractQuery.isError ? "No se pudo cargar el contrato." : null
        }
        onRetry={() => {
          void contractQuery.refetch();
        }}
      >
        {contract ? (
          <View className="gap-4">
            {!contract.wisproLinked ? (
              <Alert icon={Info}>
                <AlertTitle>Cuenta no vinculada</AlertTitle>
                <AlertDescription>
                  Aún no hay un contrato de servicio asociado. Contacta a
                  soporte por el chat para vincular tu cuenta.
                </AlertDescription>
              </Alert>
            ) : null}

            <Card className="border-border/80 bg-card/95">
              <CardHeader className="gap-1 pb-2">
                <CardTitle className="text-base font-black">Titular</CardTitle>
                <CardDescription className="text-xs">
                  Persona natural registrada en el contrato
                </CardDescription>
              </CardHeader>
              <CardContent className="gap-2.5">
                <ContractField
                  icon={UserRound}
                  label="Nombre"
                  value={contract.holderName ?? "No disponible"}
                />
                <ContractField
                  icon={IdCard}
                  label="Cédula"
                  value={
                    contract.cedulaDisplay ||
                    contract.cedula ||
                    "No disponible"
                  }
                />
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/95">
              <CardHeader className="gap-1 pb-2">
                <CardTitle className="text-base font-black">Servicio</CardTitle>
                <CardDescription className="text-xs">
                  Plan contratado y zona de cobertura
                </CardDescription>
              </CardHeader>
              <CardContent className="gap-2.5">
                <ContractField
                  icon={Wifi}
                  label="Plan"
                  value={planName ?? "No disponible"}
                />
                <ContractField
                  icon={MapPin}
                  label="Zona"
                  value={contract.zone ?? "No disponible"}
                />
                {contract.pppoeUsername ? (
                  <ContractField
                    icon={Network}
                    label="Usuario PPPoE"
                    value={contract.pppoeUsername}
                  />
                ) : null}
                {contract.ipAddress ? (
                  <ContractField
                    icon={Network}
                    label="IP de acceso"
                    value={contract.ipAddress}
                  />
                ) : null}
              </CardContent>
            </Card>

            <Alert icon={Info}>
              <AlertTitle>Consulta informativa</AlertTitle>
              <AlertDescription>
                Si necesitas un cambio de plan, titular o dirección, escríbenos
                por el chat de la app o acércate a una oficina de Conexiones
                Innover.
              </AlertDescription>
            </Alert>
          </View>
        ) : null}
      </ScreenState>
    </ScrollView>
  );
};
