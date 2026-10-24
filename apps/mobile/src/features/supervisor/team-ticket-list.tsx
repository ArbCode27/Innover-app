import type {
  SupervisorStackParamList,
  SupervisorTabParamList,
} from "@/app/navigation-types";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { TeamTicketCard } from "@/features/supervisor/team-ticket-card";
import {
  groupTicketsByTechnician,
  sortTeamTickets,
} from "@/features/supervisor/ticket-scope";
import type { AppCaso } from "@/types/domain";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { UserRound } from "lucide-react-native";
import { View } from "react-native";

type TeamListNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<SupervisorTabParamList>,
  NativeStackNavigationProp<SupervisorStackParamList>
>;

type TeamTicketListProps = {
  tickets: AppCaso[];
  /**
   * Agrupa por técnico (vista Equipo). Con un técnico filtrado o cola personal,
   * conviene lista plana.
   */
  groupByTechnician?: boolean;
};

export const TeamTicketList = ({
  tickets,
  groupByTechnician = true,
}: TeamTicketListProps) => {
  const navigation = useNavigation<TeamListNavigation>();

  const handleOpenTicket = (casoId: string) => {
    navigation.navigate("TicketDetalle", { casoId });
  };

  if (!groupByTechnician) {
    const sorted = sortTeamTickets(tickets);
    return (
      <View className="gap-2">
        {sorted.map((caso) => (
          <TeamTicketCard
            key={caso.id}
            caso={caso}
            showTechnician
            onOpen={() => handleOpenTicket(caso.id)}
          />
        ))}
      </View>
    );
  }

  const groups = groupTicketsByTechnician(tickets);

  return (
    <View className="gap-5">
      {groups.map((group, groupIndex) => (
        <View key={group.technicianName} className="gap-2.5">
          {groupIndex > 0 ? (
            <View className="mb-1 flex-row items-center gap-3 py-1">
              <Separator className="flex-1 bg-border" />
              <Separator className="flex-1 bg-border" />
            </View>
          ) : null}

          <View className="flex-row items-center gap-2.5 rounded-xl border border-border/80 bg-secondary/60 px-3 py-2.5">
            <View className="size-8 items-center justify-center rounded-full bg-card">
              <Icon
                as={UserRound}
                size={16}
                className="text-secondary-foreground"
              />
            </View>
            <View className="min-w-0 flex-1">
              <Text
                className="text-sm font-semibold text-foreground"
                numberOfLines={1}>
                {group.technicianName}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {group.tickets.length === 1
                  ? "1 ticket en cola"
                  : `${group.tickets.length} tickets en cola`}
              </Text>
            </View>
            <View className="min-w-8 items-center rounded-full bg-primary/10 px-2.5 py-1">
              <Text className="text-xs font-bold text-primary">
                {group.tickets.length}
              </Text>
            </View>
          </View>

          <View className="gap-2 border-l-2 border-border/70 pl-3 ml-3">
            {group.tickets.map((caso) => (
              <TeamTicketCard
                key={caso.id}
                caso={caso}
                onOpen={() => handleOpenTicket(caso.id)}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};
