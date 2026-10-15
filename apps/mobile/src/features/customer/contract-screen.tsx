import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { ScreenState } from "@/components/screen-state";
import { useAuthSession } from "@/features/auth/auth-session";
import { AccountStatusBadge } from "@/features/customer/account-status-badge";
import { fetchContractSnapshot } from "@/features/customer/account-quote-gateway";
import { useQuery } from "@tanstack/react-query";
import { ScrollView, View } from "react-native";

const ContractRow = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <View className="gap-1">
    <Text variant="muted">{label}</Text>
    <Text>{value}</Text>
  </View>
);

export const CustomerContractScreen = () => {
  const { profile } = useAuthSession();
  const contractQuery = useQuery({
    queryKey: ["contract-snapshot", profile?.userId],
    queryFn: () => fetchContractSnapshot(profile),
  });

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4">
      <ScreenState
        isLoading={contractQuery.isPending}
        errorMessage={
          contractQuery.isError ? "No se pudo cargar el contrato." : null
        }
        onRetry={() => {
          void contractQuery.refetch();
        }}
      >
        {contractQuery.data ? (
          <Card>
            <CardHeader>
              <CardTitle>Contrato</CardTitle>
              <CardDescription>Solo lectura</CardDescription>
            </CardHeader>
            <CardContent className="gap-3">
              <AccountStatusBadge status={contractQuery.data.accountStatus} />
              <ContractRow
                label="Titular"
                value={contractQuery.data.holderName ?? "No disponible"}
              />
              <ContractRow
                label="Cédula"
                value={contractQuery.data.cedula ?? "No disponible"}
              />
              <ContractRow
                label="Plan"
                value={contractQuery.data.planName ?? "No disponible"}
              />
              <ContractRow
                label="Zona"
                value={contractQuery.data.zone ?? "No disponible"}
              />
              {contractQuery.data.ipAddress ? (
                <ContractRow label="IP" value={contractQuery.data.ipAddress} />
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </ScreenState>
    </ScrollView>
  );
};
