import { Text } from "@/components/ui/text";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  TEAM_TICKET_FILTERS,
  teamFilterLabel,
} from "@/features/supervisor/ticket-scope";
import type { TeamTicketFilter } from "@/types/domain";

type TicketFilterGroupProps = {
  value: TeamTicketFilter;
  onChange: (next: TeamTicketFilter) => void;
  counts?: { pending: number; done: number; today: number };
};

const isTeamFilter = (value: string): value is TeamTicketFilter =>
  value === "pending" || value === "done" || value === "today";

export const TicketFilterGroup = ({
  value,
  onChange,
  counts,
}: TicketFilterGroupProps) => {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={value}
      onValueChange={(next) => {
        if (typeof next === "string" && isTeamFilter(next)) {
          onChange(next);
        }
      }}
      className="w-full justify-between"
      accessibilityLabel="Filtro de tickets"
    >
      {TEAM_TICKET_FILTERS.map((filter, index) => (
        <ToggleGroupItem
          key={filter}
          value={filter}
          isFirst={index === 0}
          isLast={index === TEAM_TICKET_FILTERS.length - 1}
          className="min-h-11 flex-1"
          accessibilityLabel={teamFilterLabel(filter)}
        >
          <Text>
            {teamFilterLabel(filter)}
            {counts ? ` · ${counts[filter]}` : ""}
          </Text>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};
