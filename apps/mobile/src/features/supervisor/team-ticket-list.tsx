import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { TicketStatusBadge } from "@/features/customer/ticket-status-badge";
import { groupTicketsByTechnician } from "@/features/supervisor/ticket-scope";
import type { AppCaso } from "@/types/domain";
import { View } from "react-native";

export const TeamTicketList = ({ tickets }: { tickets: AppCaso[] }) => {
  const groups = groupTicketsByTechnician(tickets);

  return (
    <View className="gap-4">
      {groups.map((group) => (
        <View key={group.technicianName} className="gap-2">
          <Text variant="muted">
            {group.technicianName} · {group.tickets.length}
          </Text>
          {group.tickets.map((caso) => (
            <Card key={caso.id}>
              <CardHeader>
                <CardTitle>{caso.clientName ?? "Cliente"}</CardTitle>
                <CardDescription>{caso.title}</CardDescription>
              </CardHeader>
              <CardContent className="gap-2">
                <TicketStatusBadge status={caso.status} />
                <Text variant="muted">
                  Zona: {caso.addressText?.trim() || "Sin zona"}
                </Text>
              </CardContent>
            </Card>
          ))}
        </View>
      ))}
    </View>
  );
};
